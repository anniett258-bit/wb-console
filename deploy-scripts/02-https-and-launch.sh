#!/bin/bash
# ============================================
# DNS 解析 + HTTPS 证书签发 + 上线后脚本
# 运行时机：01 脚本跑完 + 代码已上传 + 启动后
# ============================================

set -e

echo "============================================"
echo "🔒 HTTPS 证书签发 + 启动验证"
echo "============================================"

# ---- 步骤 1: 申请 Let's Encrypt 证书 ----
echo ""
echo "🔐 步骤 1/4: 申请 SSL 证书（Let's Encrypt）"
echo "   ⚠️  前置条件：DNSPod 已配置 workerbuddypay.top -> 118.195.159.189"
echo "   等待解析生效（约 1-5 分钟）..."

# 强制等解析生效
for i in {1..30}; do
  if dig +short workerbuddypay.top @8.8.8.8 | grep -q "118.195.159.189"; then
    echo "   ✅ DNS 解析已生效"
    break
  fi
  echo "   ⏳ 等待 DNS 解析生效 (${i}/30)..."
  sleep 10
done

# 用 certbot 申请证书（webroot 模式，不影响服务）
certbot certonly --webroot -w /var/www/certbot \
    -d workerbuddypay.top -d www.workerbuddypay.top \
    --email admin@workerbuddypay.top \
    --agree-tos --no-eff-email --force-renewal

# ---- 步骤 2: 配置 Nginx HTTPS ----
echo ""
echo "🌐 步骤 2/4: 升级 Nginx 配置（启用 HTTPS）"
cat > /etc/nginx/conf.d/wb-console.conf <<'NGINX_EOF'
# HTTP → HTTPS 跳转
server {
    listen 80;
    server_name workerbuddypay.top www.workerbuddypay.top;
    return 301 https://$host$request_uri;
}

# HTTPS 站点
server {
    listen 443 ssl http2;
    server_name workerbuddypay.top www.workerbuddypay.top;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/workerbuddypay.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workerbuddypay.top/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/workerbuddypay.top/chain.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 上传体积（兑换码、文件上传场景）
    client_max_body_size 10M;

    # Next.js 反代
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

nginx -t
systemctl reload nginx

# ---- 步骤 3: 自动续期 ----
echo ""
echo "♻️  步骤 3/4: 配置证书自动续期"
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --reload-nginx") | crontab -
crontab -l

# ---- 步骤 4: 启动验证 ----
echo ""
echo "🧪 步骤 4/4: 启动验证"
echo "   PM2 状态:"
pm2 status
echo ""
echo "   检查端口:"
ss -tlnp | grep -E ":80|:443|:3000" || netstat -tlnp | grep -E ":80|:443|:3000"
echo ""
echo "   测试访问（应跳转到 HTTPS）:"
curl -I -s http://workerbuddypay.top | head -5
echo ""
echo "   测试 HTTPS 访问:"
curl -I -s https://workerbuddypay.top | head -5

echo ""
echo "============================================"
echo "✅ HTTPS 部署完成！"
echo "============================================"
echo "🌐 访问地址: https://workerbuddypay.top"
echo "📋 后续运维:"
echo "   pm2 logs wb-console    # 查看日志"
echo "   pm2 restart wb-console # 重启"
echo "   pm2 monit              # 监控"
echo "============================================"
