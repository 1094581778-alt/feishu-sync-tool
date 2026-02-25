#!/usr/bin/env node

/**
 * 测试上传API响应格式
 * 验证定时任务代码是否能正确处理上传API的各种响应情况
 */

const BASE_URL = 'http://localhost:3000';

async function testUploadResponse() {
  console.log('========================================');
  console.log('测试上传API响应格式');
  console.log('========================================\n');

  console.log('🔍 分析上传API的响应格式问题:');
  console.log('');
  
  console.log('1. 成功响应格式 (upload/route.ts 第976-991行):');
  console.log('   {');
  console.log('     success: true,');
  console.log('     fileKey: "...",');
  console.log('     fileName: "...",');
  console.log('     syncResult: { msg: "...", syncCount: 0, ... },');
  console.log('     syncError: null 或 "错误信息"');
  console.log('   }');
  console.log('');
  
  console.log('2. 错误响应格式 (upload/route.ts 第1003-1010行):');
  console.log('   HTTP 500 状态码');
  console.log('   {');
  console.log('     error: "文件上传失败",');
  console.log('     details: "具体错误信息",');
  console.log('     timestamp: "..."');
  console.log('   }');
  console.log('');
  
  console.log('3. 定时任务代码逻辑问题 (useScheduledTasks.ts 第361-363行):');
  console.log('   if (!syncData.success) {');
  console.log('     throw new Error("文件上传失败");');
  console.log('   }');
  console.log('');
  console.log('   🔍 问题: 如果上传API返回HTTP 500错误，response.json()可能抛出异常');
  console.log('   或者syncData可能没有success字段');
  console.log('');
  
  console.log('4. 创建测试验证问题:');
  console.log('   测试不同情况下的响应处理');
  console.log('');

  // 测试方案
  console.log('🧪 建议的修复方案:');
  console.log('');
  console.log('   a) 修改定时任务代码，正确处理HTTP错误响应');
  console.log('   b) 检查response.ok状态码');
  console.log('   c) 提供更详细的错误信息');
  console.log('   d) 确保所有响应情况都被正确处理');
  console.log('');
  
  console.log('📋 具体修改建议:');
  console.log('');
  console.log('   // 修改 useScheduledTasks.ts 第353-363行');
  console.log('   const syncResponse = await fetch(\'/api/upload\', {');
  console.log('     method: \'POST\',');
  console.log('     body: formData,');
  console.log('   });');
  console.log('');
  console.log('   if (!syncResponse.ok) {');
  console.log('     const errorText = await syncResponse.text();');
  console.log('     console.error(\'❌ [定时任务] 上传API HTTP错误:\', syncResponse.status, errorText);');
  console.log('     throw new Error(`文件上传失败 (HTTP ${syncResponse.status}): ${errorText.substring(0, 200)}`);');
  console.log('   }');
  console.log('');
  console.log('   const syncData = await syncResponse.json();');
  console.log('');
  console.log('   // 检查响应数据结构');
  console.log('   if (!syncData || typeof syncData !== \'object\') {');
  console.log('     throw new Error(\'上传API返回无效响应\');');
  console.log('   }');
  console.log('');
  console.log('   if (syncData.error) {');
  console.log('     throw new Error(`上传API错误: ${syncData.details || syncData.error}`);');
  console.log('   }');
  console.log('');
  console.log('   if (!syncData.success) {');
  console.log('     throw new Error(\'文件上传失败\');');
  console.log('   }');
  console.log('');
  
  console.log('5. 运行诊断:');
  console.log('');
  console.log('   建议在浏览器控制台中测试上传API:');
  console.log('');
  console.log('   async function testUpload() {');
  console.log('     const formData = new FormData();');
  console.log('     const csvContent = "测试,数据\\n1,2";');
  console.log('     const blob = new Blob([csvContent], { type: "text/csv" });');
  console.log('     formData.append("file", blob, "test.csv");');
  console.log('     ');
  console.log('     const response = await fetch("/api/upload", {');
  console.log('       method: "POST",');
  console.log('       body: formData');
  console.log('     });');
  console.log('     ');
  console.log('     console.log("响应状态:", response.status, response.ok);');
  console.log('     console.log("响应头:", response.headers);');
  console.log('     const result = await response.json();');
  console.log('     console.log("响应数据:", result);');
  console.log('   }');
  console.log('');
  
  console.log('6. 常见问题排查:');
  console.log('');
  console.log('   a) 如果响应是HTML而不是JSON，可能是路由错误');
  console.log('   b) 如果HTTP状态码不是200，检查网络或服务器错误');
  console.log('   c) 如果success为true但syncError有值，飞书同步失败');
  console.log('   d) 如果没有响应，检查请求是否被发送');
  console.log('');
  
  console.log('========================================');
  console.log('结论');
  console.log('========================================');
  console.log('');
  console.log('💡 核心问题:');
  console.log('   定时任务代码假设上传API总是返回JSON且包含success字段');
  console.log('   但实际上API可能返回HTTP错误或不同的响应格式');
  console.log('');
  console.log('🔧 解决方案:');
  console.log('   1. 增强错误处理，检查HTTP状态码');
  console.log('   2. 验证响应数据结构');
  console.log('   3. 提供更详细的错误信息');
  console.log('   4. 确保所有异常情况都被捕获');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   修改 useScheduledTasks.ts 中的 executeTask 函数');
  console.log('   添加更健壮的错误处理逻辑');
}

testUploadResponse().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});