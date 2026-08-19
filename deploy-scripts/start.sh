#!/bin/bash
# wb-console 启动脚本
# 用法：pm2 start deploy-scripts/start.sh --name wb-console
# 原因：PM2 fork 模式 + script 为 next bin 时不会 fork 出 next-server，
#       用 shell 包装确保 next 真正成为子进程。
cd /opt/wb-console
exec node ./node_modules/next/dist/bin/next start -p 3000 -H 127.0.0.1
