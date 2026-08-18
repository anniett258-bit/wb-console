// PM2 进程管理配置
// 启动: pm2 start ecosystem.config.cjs
// 重启: pm2 restart wb-console
// 停止: pm2 stop wb-console
// 日志: pm2 logs wb-console

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
