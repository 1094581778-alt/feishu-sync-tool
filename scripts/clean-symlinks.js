const fs = require('fs');
const path = require('path');

// 清理符号链接的函数
function cleanSymlinks(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        // 递归处理子目录
        cleanSymlinks(fullPath);
      } else if (file.isSymbolicLink()) {
        // 删除符号链接
        console.log(`删除符号链接: ${fullPath}`);
        fs.unlinkSync(fullPath);
      }
    });
  } catch (error) {
    console.error(`清理目录 ${dir} 时出错:`, error.message);
  }
}

// 检查 .next 目录是否存在
const nextDir = path.join(__dirname, '..', '.next');

if (fs.existsSync(nextDir)) {
  console.log('开始清理 .next 目录中的符号链接...');
  cleanSymlinks(nextDir);
  console.log('符号链接清理完成!');
} else {
  console.log('.next 目录不存在，跳过清理');
}

// 检查是否存在 pg 相关的符号链接（常见问题）
const pgDirs = [
  path.join(nextDir, 'node_modules', 'pg-*'),
  path.join(nextDir, 'standalone', 'node_modules', 'pg-*')
];

pgDirs.forEach(pattern => {
  try {
    const files = fs.readdirSync(path.dirname(pattern));
    files.forEach(file => {
      const fullPath = path.join(path.dirname(pattern), file);
      if (file.startsWith('pg-') && fs.lstatSync(fullPath).isSymbolicLink()) {
        console.log(`删除 pg 符号链接: ${fullPath}`);
        fs.unlinkSync(fullPath);
      }
    });
  } catch (error) {
    // 目录不存在，忽略错误
  }
});

console.log('所有符号链接清理操作已完成!');
