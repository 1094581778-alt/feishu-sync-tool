#!/usr/bin/env node

/**
 * 测试文件上传API
 * 模拟定时任务中的文件上传逻辑
 */

const BASE_URL = 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

async function testFileUpload() {
  console.log('========================================');
  console.log('测试文件上传API');
  console.log('========================================\n');

  try {
    // 1. 测试服务器连接
    console.log('1. 测试服务器连接...');
    const healthResponse = await fetch(BASE_URL);
    if (!healthResponse.ok) {
      console.log(`❌ 服务器连接失败: ${healthResponse.status}`);
      return;
    }
    console.log(`✅ 服务器连接成功 (${BASE_URL})\n`);

    // 2. 测试飞书API连接
    console.log('2. 测试飞书API连接...');
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
    if (feishuData.code === 0) {
      console.log('✅ 飞书API连接成功');
    } else {
      console.log(`⚠️ 飞书API连接问题: ${feishuData.msg || '未知错误'}`);
    }
    console.log('');

    // 3. 测试文件上传API（模拟定时任务场景）
    console.log('3. 测试文件上传API（模拟定时任务）...');
    
    // 创建模拟的CSV文件内容
    const csvContent = `商品名称,销量,销售额,日期
商品A,100,1000,2026-02-25
商品B,200,2000,2026-02-25
商品C,150,1500,2026-02-25`;
    
    // 创建FormData（模拟浏览器环境）
    const FormData = require('form-data');
    const formData = new FormData();
    
    // 添加文件
    const blob = Buffer.from(csvContent, 'utf-8');
    formData.append('file', blob, {
      filename: '测试文件-20260225.csv',
      contentType: 'text/csv',
    });
    
    // 添加其他参数（模拟定时任务）
    formData.append('spreadsheetToken', 'YOUR_SPREADSHEET_TOKEN');
    formData.append('appId', 'YOUR_APP_ID');
    formData.append('appSecret', 'YOUR_APP_SECRET');
    
    // 添加excelData参数（我们修复的新功能）
    const excelData = {
      columns: ['商品名称', '销量', '销售额', '日期'],
      data: [
        { '商品名称': '商品A', '销量': '100', '销售额': '1000', '日期': '2026-02-25' },
        { '商品名称': '商品B', '销量': '200', '销售额': '2000', '日期': '2026-02-25' },
        { '商品名称': '商品C', '销量': '150', '销售额': '1500', '日期': '2026-02-25' },
      ]
    };
    formData.append('excelData', JSON.stringify(excelData));
    
    console.log('📤 发送文件上传请求...');
    console.log('   文件: 测试文件-20260225.csv');
    console.log('   表格Token: YOUR_SPREADSHEET_TOKEN');
    console.log('   包含excelData: 是');
    
    const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      // FormData会自动设置正确的Content-Type
    });
    
    console.log(`📥 响应状态: ${uploadResponse.status}`);
    
    if (!uploadResponse.ok) {
      console.log(`❌ 文件上传失败: HTTP ${uploadResponse.status}`);
      const errorText = await uploadResponse.text();
      console.log(`   错误响应: ${errorText.substring(0, 500)}...`);
    } else {
      const uploadData = await uploadResponse.json();
      console.log('✅ 文件上传API调用成功');
      console.log('   响应数据:', JSON.stringify(uploadData, null, 2).substring(0, 500) + '...');
      
      if (uploadData.success) {
        console.log(`✅ 文件上传成功: ${uploadData.fileName}`);
        if (uploadData.syncResult) {
          console.log(`✅ 飞书同步结果: ${uploadData.syncResult.msg}`);
          console.log(`   同步记录数: ${uploadData.syncResult.syncCount || 0}`);
        } else if (uploadData.syncError) {
          console.log(`⚠️ 飞书同步失败: ${uploadData.syncError}`);
        }
      } else {
        console.log(`❌ 文件上传失败: ${uploadData.error || '未知错误'}`);
      }
    }
    console.log('');

    // 4. 测试简单的文件上传（无飞书配置）
    console.log('4. 测试简单的文件上传（无飞书配置）...');
    
    const simpleFormData = new FormData();
    const simpleContent = '这是一个测试文件内容';
    const simpleBlob = Buffer.from(simpleContent, 'utf-8');
    simpleFormData.append('file', simpleBlob, {
      filename: 'simple-test.txt',
      contentType: 'text/plain',
    });
    
    const simpleResponse = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: simpleFormData,
    });
    
    console.log(`📥 响应状态: ${simpleResponse.status}`);
    
    if (!simpleResponse.ok) {
      console.log(`❌ 简单文件上传失败: HTTP ${simpleResponse.status}`);
      const errorText = await simpleResponse.text();
      console.log(`   错误响应: ${errorText.substring(0, 300)}...`);
    } else {
      const simpleData = await simpleResponse.json();
      console.log('✅ 简单文件上传成功');
      console.log(`   文件名: ${simpleData.fileName}`);
      console.log(`   文件大小: ${simpleData.fileSize} 字节`);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:');
    console.error(`   类型: ${error.constructor.name}`);
    console.error(`   消息: ${error.message}`);
    console.error(`   堆栈: ${error.stack}`);
    
    // 检查是否为网络错误
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示: 无法连接到服务器，请确保服务器正在运行:');
      console.error('   npm run dev');
    }
  }
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
  console.log('\n故障排除建议:');
  console.log('1. 确保服务器正在运行: npm run dev');
  console.log('2. 检查upload/route.ts文件是否有语法错误');
  console.log('3. 检查S3存储配置（如果使用对象存储）');
  console.log('4. 检查飞书配置是否正确');
  console.log('5. 查看服务器终端中的详细错误日志');
}

// 运行测试
testFileUpload().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});