#!/bin/bash
# ============================================
# TencentOS Server 3.3 (TX4) — Next.js 部署脚本
# 适用系统: TencentOS Server 3.3 (TX4) [CentOS-like]
# 目标域名: workerbuddypay.top
# 服务器:  118.195.159.189 (公) / 10.206.16.13 (内)
# ============================================
set -e  # 任一步失败立即退出

echo "============================================"
echo "🚀 WorkBuddy Console 部署脚本开始"
echo "   系统: TencentOS Server 3.3 (TX4)"
echo "   时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# ---- 步骤 1: 系统初始化 ----
echo ""
echo "📦 步骤 1/8: 系统更新 + 基础工具"
dnf update -y
dnf install -y epel-release git curl wget vim tar unzip \
    gcc gcc-c++ make openssl-devel bzip2-devel \
    libffi-devel zlib-devel readline-devel \
    sqlite-devel xz-devel ncurses-devel \
    firewalld nginx certbot python3-certbot-nginx

# ---- 步骤 2: 安装 Node.js 20 LTS (NodeSource) ----
echo ""
echo "📦 步骤 2/8: 安装 Node.js 20 LTS"
# TencentOS 是 dnf-based，NodeSource 官方提供 dnf 仓库
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
node -v
npm -v

# ---- 步骤 3: 安装 PM2 进程管理器 ----
echo ""
echo "📦 步骤 3/8: 安装 PM2"
npm i -g pm2
pm2 -v

# ---- 步骤 4: 防火墙放行端口 ----
echo ""
echo "🔥 步骤 4/8: 配置防火墙（firewalld）"
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
firewall-cmd --list-all

# ---- 步骤 5: 创建部署目录 + 克隆代码 ----
echo ""
echo "📂 步骤 5/8: 创建部署目录 + 克隆代码"
mkdir -p /opt/wb-console
mkdir -p /var/log/wb-console
mkdir -p /var/www/certbot

# 配置 SSH 部署密钥（如果不存在，从服务器读取）
# 方案: 你本地已配 SSH key 到 GitHub → 服务器上需要也配
# 我们改用 https + token 更简单（一次性）
echo "📥 克隆仓库..."
# 方式 1: SSH（推荐，配置过一次一劳永逸）
# 服务器上生成 SSH key 并把公钥加到 GitHub Deploy keys
# 这里用 https 占位（你也可以改成 git@github.com:anniett258-bit/wb-console.git）
GIT_REPO="https://github.com/anniett258-bit/wb-console.git"
# 问是否要继续
read -p "确认从 $GIT_REPO 克隆到 /opt/wb-console？(y/n) " yn
if [ "$yn" != "y" ]; then
  echo "⏭️  跳过 clone，你可以手动执行："
  echo "   cd /opt && git clone $GIT_REPO wb-console"
else
  cd /opt
  if [ -d wb-console/.git ]; then
    echo "⚠️  目录已存在，跳过 clone"
    cd wb-console && git pull origin main
  else
    rm -rf wb-console
    git clone "$GIT_REPO" wb-console
  fi
fi

# ---- 步骤 6: 安装依赖 + 构建 ----
echo ""
echo "🔨 步骤 6/8: 安装依赖 + 构建"
if [ -d /opt/wb-console/.git ]; then
  cd /opt/wb-console

  echo "📦 npm install..."
  npm ci --no-audit --no-fund

  echo "🔧 npm run build..."
  npm run build

  # 复制 PM2 配置
  if [ ! -f ecosystem.config.cjs ]; then
    echo "📝 创建 PM2 配置文件"
    # 占位: PM2 配置通常由部署脚本生成
  fi

  echo "✅ 构建完成"
else
  echo "⚠️  /opt/wb-console 不存在，跳过构建"
  echo "   请先执行步骤 5 克隆代码"
fi

# ---- 步骤 7: 配置 Nginx 反代 ----
echo ""
echo "🌐 步骤 7/8: 配置 Nginx 反向代理 + HTTPS"
cat > /etc/nginx/conf.d/wb-console.conf <<'NGINX_EOF'
# 临时 HTTP 配置（等证书签发后 certbot 会自动改）
server {
    listen 80;
    server_name workerbuddypay.top www.workerbuddypay.top;

    # 用于 certbot 验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 临时反代到 Node.js
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

        # Next.js 优化
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX_EOF

nginx -t
systemctl enable --now nginx
systemctl reload nginx

# ---- 步骤 8: 启动 PM2 + 设置开机自启 ----
echo ""
echo "🚀 步骤 8/8: 启动 PM2 + 开机自启"
if [ -d /opt/wb-console/.next ]; then
  cd /opt/wb-console

  # 创建 PM2 配置
  cat > ecosystem.config.cjs <<'EOF'
module.exports = {
  apps: [{
    name: 'wb-console',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000 -H 127.0.0.1',
    cwd: '/opt/wb-console',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '127.0.0.1'
    },
    error_file: '/var/log/wb-console/error.log',
    out_file: '/var/log/wb-console/out.log',
    merge_logs: true,
    time: true
  }]
};
EOF

  # 启动
  pm2 delete wb-console 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save

  # 设置开机自启
  STARTUP_CMD=$(pm2 startup | tail -1)
  echo "📌 开机自启命令: $STARTUP_CMD"
  eval "$STARTUP_CMD" 2>/dev/null || true

  echo "✅ 启动完成"
  echo ""
  echo "📊 PM2 状态:"
  pm2 status
  echo ""
  echo "🌐 端口监听:"
  ss -tlnp 2>/dev/null | grep -E ":3000|:80|:443" || netstat -tlnp 2>/dev/null | grep -E ":3000|:80|:443"
else
  echo "⚠️  构建目录不存在，跳过启动"
  echo "   请先上传代码并执行 npm run build"
fi

echo ""
echo "============================================"
echo "✅ 系统环境准备完成！"
echo "============================================"
echo "📋 后续动作清单："
echo "   1. 上传代码到 /opt/wb-console（git clone 或 scp）"
echo "   2. cd /opt/wb-console && npm ci && npm run build"
echo "   3. pm2 start ecosystem.config.cjs && pm2 save"
echo "   4. certbot --nginx -d workerbuddypay.top -d www.workerbuddypay.top"
echo "   5. 腾讯云安全组放行 80/443/22 端口"
echo "   6. DNSPod 解析 A 记录到 118.195.159.189"
echo "============================================"
