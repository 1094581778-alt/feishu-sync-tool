const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 Next.js 服务器...');

const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, '.next', 'standalone'),
  stdio: 'inherit',
  env: { ...process.env, PORT: '5000' }
});

server.on('error', (err) => {
  console.error('❌ 服务器启动失败:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`服务器已退出，代码：${code}`);
});

console.log('✅ Next.js 服务器已启动在 http://localhost:5000');
