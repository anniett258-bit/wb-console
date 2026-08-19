module.exports = {
  apps: [{
    name: 'wb-console',
    script: 'node_modules/next/dist/bin/next',
    args: ['start', '-p', '3000', '-H', '127.0.0.1'],
    cwd: '/opt/wb-console',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: '3000', HOSTNAME: '127.0.0.1' },
    max_memory_restart: '512M',
    out_file: '/var/log/wb-console/out.log',
    error_file: '/var/log/wb-console/error.log',
    time: true
  }]
};
