# 部署检查清单（Deploy Checklist）

> 适用项目: `wb-console` (Next.js 15 + TypeScript + Tailwind)
> 目标服务器: TencentOS Server 3.3 (TX4) @ `118.195.159.189`
> 目标域名: `workerbuddypay.top`（已 ICP 备案）

---

## 📋 第一阶段：服务器初始化（30-60 分钟）

### 1.1 SSH 登录

```bash
ssh root@118.195.159.189
# 首次登录确认指纹: yes
```

### 1.2 操作系统确认

```bash
cat /etc/os-release
# 预期: TencentOS Server 3.3 (TX4)

uname -a
# 预期: Linux ... x86_64
```

### 1.3 腾讯云安全组（控制台操作）

腾讯云控制台 → 云服务器 → 安全组 → 入站规则 → 添加：

| 端口 | 协议 | 来源 | 用途 |
|---|---|---|---|
| 22 | TCP | 0.0.0.0/0 | SSH（建议改为你家 IP） |
| 80 | TCP | 0.0.0.0/0 | HTTP（跳转用） |
| 443 | TCP | 0.0.0.0/0 | HTTPS（主服务） |

### 1.4 运行初始化脚本

```bash
# 方式 A：先下载脚本到本地再上传
# （在本地 Mac 上）
scp 01-server-init.sh root@118.195.159.189:/root/

# SSH 到服务器后
chmod +x /root/01-server-init.sh
/root/01-server-init.sh
```

**预计耗时**：5-10 分钟（dnf update + Node.js 20 编译较慢）

---

## 📋 第二阶段：上传代码（10-20 分钟）

### 方案 A：scp 上传（适合本地开发）

```bash
# 在本地 Mac 上
cd /Users/wengtong/WorkBuddy/wb模型自助
tar --exclude='wb-console/node_modules' \
    --exclude='wb-console/.next' \
    --exclude='wb-console/.git' \
    -czf wb-console.tar.gz wb-console/

scp wb-console.tar.gz root@118.195.159.189:/opt/

# SSH 到服务器
ssh root@118.195.159.189
cd /opt
tar -xzf wb-console.tar.gz
ls /opt/wb-console
```

### 方案 B：git clone（适合已推 GitHub/GitLab）

```bash
# 服务器上
cd /opt
git clone <你的仓库地址> wb-console
```

### ⚠️ 构建前的关键检查

上传/clone 后**不要立刻 build**，先做以下检查：

```bash
cd /opt/wb-console

# 1. 检查 package.json 里的 scripts
cat package.json | grep -A 5 scripts

# 2. 检查 next.config（不能有 skipTrailingSlashRedirect 等影响生产构建的配置）
cat next.config.mjs 2>/dev/null || cat next.config.js 2>/dev/null

# 3. 检查依赖完整性
ls node_modules/ 2>/dev/null | wc -l  # 应该是 0
# 还没装依赖，预期 0
```

### 安装依赖 + 构建

```bash
cd /opt/wb-console
npm ci --omit=dev --no-audit --no-fund
# 或开发依赖要的话（很多 next.js 项目需要）
npm ci --no-audit --no-fund

npm run build
```

**注意**：
- `--omit=dev` 会跳过 devDependencies，但 Next.js build 阶段会用 next 工具 → 失败
- 推荐**完整装** `npm ci`（不带 `--omit=dev`）
- build 输出在 `.next/` 目录，PM2 会自动用

---

## 📋 第三阶段：启动服务（10 分钟）

### 3.1 上传 PM2 配置

```bash
# 本地
scp ecosystem.config.cjs root@118.195.159.189:/opt/wb-console/
```

### 3.2 启动

```bash
# 服务器
cd /opt/wb-console
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # 会输出一个 sudo 命令，复制粘贴执行
pm2 status
```

### 3.3 验证

```bash
# 直接 curl
curl -I http://127.0.0.1:3000/login
# 预期: HTTP/1.1 200 OK

# 查看进程
pm2 logs wb-console --lines 50
```

---

## 📋 第四阶段：DNS 解析 + HTTPS（30 分钟）

### 4.1 DNSPod 配置

1. 登录 DNSPod（用腾讯云账号）
2. 添加域名 `workerbuddypay.top`
3. 添加记录：

| 主机记录 | 记录类型 | 记录值 | TTL |
|---|---|---|---|
| @ | A | 118.195.159.189 | 600 |
| www | A | 118.195.159.189 | 600 |
| api（备用） | A | 118.195.159.189 | 600 |

**等待 1-5 分钟**，执行：
```bash
dig +short workerbuddypay.top @8.8.8.8
# 预期: 118.195.159.189
```

### 4.2 申请 HTTPS 证书

```bash
# 服务器上
scp 02-https-and-launch.sh root@118.195.159.189:/root/

chmod +x /root/02-https-and-launch.sh
/root/02-https-and-launch.sh
```

**certbot 会问**：
- 邮箱：填你的（用于过期提醒）
- 同意条款：Y
- 推送广告：N

---

## 📋 第五阶段：上线验证（10 分钟）

### 5.1 检查清单

```bash
# 服务器上
echo "=== 端口监听 ==="
ss -tlnp | grep -E ":80|:443|:3000"

echo "=== PM2 状态 ==="
pm2 status

echo "=== HTTP 跳转 ==="
curl -I http://workerbuddypay.top
# 预期: 301 → https://

echo "=== HTTPS 访问 ==="
curl -I https://workerbuddypay.top/login
# 预期: 200 OK

echo "=== SSL 证书 ==="
certbot certificates
```

### 5.2 浏览器测试

打开 `https://workerbuddypay.top`，预期：
- 🔒 浏览器地址栏显示绿色锁
- 自动跳到 HTTPS
- 控制台首页正常渲染
- 登录页可访问

---

## 🔧 常见问题排查

### 问题 1：build 失败
```bash
# 内存不够（Node.js build 吃内存）
# 解决：服务器至少 2GB 内存
free -h  # 检查内存

# 权限问题
chown -R root:root /opt/wb-console
```

### 问题 2：PM2 启动后立即退出
```bash
pm2 logs wb-console --err --lines 100
# 99% 是依赖没装好
cd /opt/wb-console && npm ci
```

### 问题 3：HTTPS 证书签发失败
```bash
# 检查 80 端口是否可访问
curl -I http://workerbuddypay.top/.well-known/acme-challenge/test

# 检查防火墙
firewall-cmd --list-all

# 强制 webroot 模式重新签
certbot certonly --webroot -w /var/www/certbot -d workerbuddypay.top --dry-run
```

### 问题 4：备案白名单
- 微信支付回调 → 必须用已备案域名
- 公众号菜单跳转 → 必须配「业务域名」
- 浏览器显示「未备案」警告 → 重新检查 DNSPod 解析

---

## 📞 紧急回滚

如果上线后出问题需要回滚：

```bash
# 停 PM2
pm2 stop wb-console

# 回滚到旧版本（如果有 git tag）
cd /opt/wb-console
git checkout v0.1.0
npm run build
pm2 restart wb-console

# 临时回退到本地（最快）
# 把 DNS A 记录删了就行，10 分钟后旧 IP 自然失效
```
