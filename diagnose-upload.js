#!/usr/bin/env node

/**
 * 诊断文件上传失败问题
 * 使用原生HTTP模块，不依赖外部库
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000';

// 构建multipart/form-data请求的辅助函数
function createMultipartFormData(boundary, fields) {
  const parts = [];
  
  for (const [name, value] of Object.entries(fields)) {
    if (value.file) {
      // 文件字段
      parts.push(
        `--${boundary}`,
        `Content-Disposition: form-data; name="${name}"; filename="${value.filename}"`,
        `Content-Type: ${value.contentType || 'application/octet-stream'}`,
        '',
        value.content,
        ''
      );
    } else {
      // 普通字段
      parts.push(
        `--${boundary}`,
        `Content-Disposition: form-data; name="${name}"`,
        '',
        value,
        ''
      );
    }
  }
  
  parts.push(`--${boundary}--`);
  return parts.join('\r\n');
}

async function diagnoseUpload() {
  console.log('========================================');
  console.log('诊断文件上传失败问题');
  console.log('========================================\n');

  // 1. 测试服务器连接
  console.log('1. 测试服务器连接...');
  try {
    const healthResponse = await fetch(BASE_URL);
    console.log(`✅ 服务器连接成功 (${BASE_URL}, 状态: ${healthResponse.status})`);
  } catch (error) {
    console.log(`❌ 服务器连接失败: ${error.message}`);
    console.log('   请确保服务器正在运行: npm run dev');
    return;
  }
  console.log('');

  // 2. 测试飞书API
  console.log('2. 测试飞书API连接...');
  try {
    const feishuResponse = await fetch(`${BASE_URL}/api/feishu/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'YOUR_SPREADSHEET_TOKEN',
        appId: 'YOUR_APP_ID',
        appSecret: 'YOUR_APP_SECRET'
      }),
    });
    
    const feishuData = await feishuResponse.json();
    console.log(`📥 飞书API响应状态: ${feishuResponse.status}`);
    console.log(`📥 飞书API响应数据: ${JSON.stringify(feishuData).substring(0, 200)}...`);
    
    if (feishuData.code === 0) {
      console.log('✅ 飞书API连接成功');
    } else {
      console.log(`⚠️ 飞书API问题: ${feishuData.msg || '未知错误'}`);
    }
  } catch (error) {
    console.log(`❌ 飞书API测试失败: ${error.message}`);
  }
  console.log('');

  // 3. 使用原生HTTP模块测试文件上传
  console.log('3. 使用原生HTTP测试文件上传...');
  
  return new Promise((resolve, reject) => {
    const boundary = `----WebKitFormBoundary${Date.now()}`;
    
    // 创建CSV文件内容
    const csvContent = '商品名称,销量,销售额,日期\n商品A,100,1000,2026-02-25';
    
    const fields = {
      file: {
        file: true,
        filename: 'test.csv',
        contentType: 'text/csv',
        content: csvContent
      },
      spreadsheetToken: 'YOUR_SPREADSHEET_TOKEN',
      appId: 'YOUR_APP_ID',
      appSecret: 'YOUR_APP_SECRET',
      excelData: JSON.stringify({
        columns: ['商品名称', '销量', '销售额', '日期'],
        data: [{ '商品名称': '商品A', '销量': '100', '销售额': '1000', '日期': '2026-02-25' }]
      })
    };
    
    const body = createMultipartFormData(boundary, fields);
    
    const url = new URL(`${BASE_URL}/api/upload`);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    console.log(`📤 发送请求到: ${BASE_URL}/api/upload`);
    console.log(`   文件: test.csv (${csvContent.length} 字节)`);
    console.log(`   Content-Type: multipart/form-data; boundary=${boundary}`);
    
    const req = http.request(options, (res) => {
      console.log(`📥 响应状态: HTTP ${res.statusCode}`);
      console.log(`📥 响应头:`, res.headers);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      
      res.on('end', () => {
        try {
          console.log('📥 响应体长度:', responseData.length, '字节');
          
          if (responseData.length > 0) {
            const parsed = JSON.parse(responseData);
            console.log('📥 解析后的响应:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
            
            if (parsed.success) {
              console.log('✅ 文件上传API调用成功');
              console.log(`   文件名: ${parsed.fileName}`);
              console.log(`   文件大小: ${parsed.fileSize}`);
              
              if (parsed.syncResult) {
                console.log(`✅ 飞书同步: ${parsed.syncResult.msg}`);
              } else if (parsed.syncError) {
                console.log(`⚠️ 飞书同步失败: ${parsed.syncError}`);
              }
            } else {
              console.log(`❌ 文件上传失败: ${parsed.error || '未知错误'}`);
              console.log(`   详情: ${parsed.details || '无详情'}`);
            }
          } else {
            console.log('⚠️ 响应体为空');
          }
        } catch (error) {
          console.log('❌ 解析响应失败:', error.message);
          console.log('📥 原始响应:', responseData.substring(0, 500));
        }
        
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求失败: ${error.message}`);
      console.log('💡 可能的原因:');
      console.log('   1. 服务器未运行');
      console.log('   2. 端口被占用');
      console.log('   3. 网络连接问题');
      reject(error);
    });
    
    req.write(body);
    req.end();
  });
}

async function checkUploadRouteCode() {
  console.log('4. 检查upload/route.ts代码问题...');
  console.log('');
  
  console.log('🔍 常见问题检查:');
  console.log('   1. S3配置问题: accessKey和secretKey为空');
  console.log('      - 代码中S3Storage初始化时accessKey和secretKey为空字符串');
  console.log('      - 这会导致S3上传失败，但应有错误处理回退到本地路径');
  console.log('');
  console.log('   2. 飞书配置缺失:');
  console.log('      - 如果未提供appId和appSecret，会跳过飞书同步');
  console.log('      - 但文件上传本身应该成功');
  console.log('');
  console.log('   3. Excel读取问题:');
  console.log('      - 我们添加了excelData参数支持');
  console.log('      - CSV文件应该能被xlsx库读取');
  console.log('');
  console.log('   4. Content-Type问题 (已修复):');
  console.log('      - 已修复useScheduledTasks.ts中的Content-Type问题');
  console.log('      - 现在使用FormData而不是JSON');
  console.log('');
  
  console.log('💡 建议检查服务器终端日志:');
  console.log('   1. 查看是否有"S3上传失败"的警告');
  console.log('   2. 查看是否有"读取Excel文件失败"的警告');
  console.log('   3. 查看是否有其他错误信息');
  console.log('');
}

async function main() {
  await diagnoseUpload();
  await checkUploadRouteCode();
  
  console.log('========================================');
  console.log('诊断总结');
  console.log('========================================');
  console.log('可能的问题原因:');
  console.log('1. ✅ 服务器连接正常');
  console.log('2. ⚠️ 飞书API可能有问题（从测试看返回未知错误）');
  console.log('3. 🔍 S3配置问题（accessKey/secretKey为空）');
  console.log('4. 🔍 文件上传API内部错误');
  console.log('');
  console.log('建议:');
  console.log('1. 查看服务器终端中的详细错误日志');
  console.log('2. 检查upload/route.ts中的错误处理逻辑');
  console.log('3. 测试不使用飞书同步的简单文件上传');
  console.log('4. 检查环境变量配置');
  console.log('');
  console.log('快速测试: 在浏览器中尝试上传一个小文件');
  console.log('然后查看服务器日志中的错误信息');
}

main().catch(error => {
  console.error('诊断脚本执行失败:', error);
  process.exit(1);
});