#!/usr/bin/env node

/**
 * 测试飞书工作表列表功能
 * 验证从解析链接到获取工作表列表的完整流程
 */

const SPREADSHEET_TOKEN = 'CqKfbURrcaldFBslTFlcWPzrnXb';
const BASE_URL = 'http://localhost:5000';

async function testFeishuTables() {
  console.log('========================================');
  console.log('开始测试飞书工作表列表功能');
  console.log('========================================\n');

  // 测试 1: 获取工作表列表
  console.log('【测试 1】获取工作表列表');
  console.log(`URL: ${BASE_URL}/api/feishu/tables?token=${SPREADSHEET_TOKEN}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/feishu/tables?token=${SPREADSHEET_TOKEN}`);
    const data = await response.json();
    
    console.log(`✅ 请求成功`);
    console.log(`   success: ${data.success}`);
    console.log(`   工作表数量: ${data.tables?.length || 0}`);
    
    if (data.success && data.tables && data.tables.length > 0) {
      console.log('\n📋 工作表列表（前 5 个）:');
      data.tables.slice(0, 5).forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name} (${table.id})`);
      });
      
      // 查找包含"概览"的工作表
      const overviewTables = data.tables.filter(t => t.name.includes('概览'));
      console.log(`\n🎯 包含"概览"的工作表（${overviewTables.length} 个）:`);
      overviewTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name} (${table.id})`);
      });
      
      if (overviewTables.length > 0) {
        console.log(`\n✅ 自动选中: ${overviewTables[0].name} (${overviewTables[0].id})`);
      }
    } else {
      console.log('❌ 未获取到工作表数据');
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testFeishuTables();
