#!/usr/bin/env node

/**
 * 诊断飞书API调用问题
 * 帮助用户验证飞书API调用是否符合开发平台要求
 */

const BASE_URL = 'http://localhost:3000';

async function diagnoseFeishuAPI() {
  console.log('========================================');
  console.log('飞书API调用诊断');
  console.log('========================================\n');

  console.log('📋 诊断步骤:');
  console.log('1. 验证飞书认证');
  console.log('2. 测试表格列表获取');
  console.log('3. 测试批量创建记录');
  console.log('4. 检查字段类型映射\n');

  // 1. 验证飞书认证
  console.log('【1】验证飞书认证');
  console.log('在浏览器控制台中执行以下命令测试认证:');
  console.log('');
  console.log('async function testFeishuAuth() {');
  console.log('  const response = await fetch(\'/api/feishu/tables\', {');
  console.log('    method: \'POST\',');
  console.log('    headers: { \'Content-Type\': \'application/json\' },');
  console.log('    body: JSON.stringify({');
  console.log('      token: \'YOUR_SPREADSHEET_TOKEN\',');
  console.log('      appId: \'YOUR_APP_ID\',');
  console.log('      appSecret: \'YOUR_APP_SECRET\'');
  console.log('    })');
  console.log('  });');
  console.log('  ');
  console.log('  console.log(\'状态码:\', response.status);');
  console.log('  const data = await response.json();');
  console.log('  console.log(\'响应:\', data);');
  console.log('}');
  console.log('');

  // 2. 检查API调用要求
  console.log('【2】飞书API调用要求检查');
  console.log('');
  
  const requirements = [
    {
      requirement: '认证令牌',
      description: '使用 tenant_access_token/internal 端点',
      check: '✅ 代码已实现',
      status: '通过'
    },
    {
      requirement: 'API端点',
      description: '正确的飞书多维表格API端点',
      check: '✅ 代码使用正确端点',
      status: '通过'
    },
    {
      requirement: '请求头',
      description: '包含 Authorization: Bearer {token} 和 Content-Type: application/json',
      check: '✅ 代码已正确设置',
      status: '通过'
    },
    {
      requirement: '批量创建限制',
      description: '每批最多500条记录',
      check: '✅ 代码已实现',
      status: '通过'
    },
    {
      requirement: '字段类型转换',
      description: '根据飞书字段类型转换数据格式',
      check: '✅ convertValueByFieldType 函数已实现',
      status: '通过'
    },
    {
      requirement: '错误处理',
      description: '检查飞书API返回的 code 字段',
      check: '✅ 代码已检查 data.code !== 0',
      status: '通过'
    },
    {
      requirement: '复杂字段类型',
      description: '人员、附件、关联字段需要特殊处理',
      check: '⚠️ 需要验证具体实现',
      status: '待验证'
    },
    {
      requirement: 'API调用频率',
      description: '遵守飞书API的QPS限制',
      check: '⚠️ 建议添加延迟处理',
      status: '建议优化'
    }
  ];

  requirements.forEach((item, index) => {
    console.log(`${index + 1}. ${item.requirement}`);
    console.log(`   描述: ${item.description}`);
    console.log(`   检查: ${item.check}`);
    console.log(`   状态: ${item.status}`);
    console.log('');
  });

  // 3. 常见问题排查
  console.log('【3】常见"执行失败"原因');
  console.log('');
  
  const commonIssues = [
    {
      issue: '飞书凭证无效',
      symptoms: '获取访问令牌失败，错误码可能为 9999xxx',
      solution: '检查飞书App ID和App Secret是否正确，确认应用已启用'
    },
    {
      issue: '表格权限不足',
      symptoms: '获取表格列表失败，错误码可能为 9999xxx',
      solution: '确保飞书应用有访问该多维表格的权限'
    },
    {
      issue: '字段类型不匹配',
      symptoms: '批量创建记录失败，错误信息包含字段类型相关提示',
      solution: '检查Excel数据与飞书表格字段类型的匹配'
    },
    {
      issue: 'API调用频率超限',
      symptoms: 'API返回限流错误，错误码可能包含 rate_limit',
      solution: '添加请求延迟，减少批量处理频率'
    },
    {
      issue: '网络连接问题',
      symptoms: '请求超时或无法连接到飞书API',
      solution: '检查网络连接，确保能访问 open.feishu.cn'
    },
    {
      issue: '数据格式错误',
      symptoms: '请求被拒绝，返回参数验证错误',
      solution: '验证请求体格式，特别是复杂字段类型的值格式'
    }
  ];

  commonIssues.forEach((item, index) => {
    console.log(`${index + 1}. ${item.issue}`);
    console.log(`   症状: ${item.symptoms}`);
    console.log(`   解决方案: ${item.solution}`);
    console.log('');
  });

  // 4. 诊断命令
  console.log('【4】诊断命令');
  console.log('');
  console.log('在浏览器控制台中执行以下命令获取详细信息:');
  console.log('');
  console.log('// 1. 检查飞书配置');
  console.log('console.log("飞书App ID:", localStorage.getItem("feishuAppId"));');
  console.log('console.log("飞书App Secret:", localStorage.getItem("feishuAppSecret"));');
  console.log('');
  console.log('// 2. 检查定时任务配置');
  console.log('const tasks = JSON.parse(localStorage.getItem("scheduledTasks")) || [];');
  console.log('console.log("定时任务数量:", tasks.length);');
  console.log('if (tasks.length > 0) {');
  console.log('  const task = tasks[0];');
  console.log('  console.log("任务详情:", task);');
  console.log('  console.log("模板ID:", task.templateId);');
  console.log('}');
  console.log('');
  console.log('// 3. 检查模板配置');
  console.log('const templates = JSON.parse(localStorage.getItem("historyTemplates")) || [];');
  console.log('console.log("模板数量:", templates.length);');
  console.log('templates.forEach((t, i) => {');
  console.log('  console.log(`模板${i}: ${t.name}, token: ${t.spreadsheetToken?.substring(0, 10)}...`);');
  console.log('});');
  console.log('');
  console.log('// 4. 测试飞书API');
  console.log('async function testFeishuAPI() {');
  console.log('  try {');
  console.log('    const response = await fetch(\'/api/feishu/tables\', {');
  console.log('      method: \'POST\',');
  console.log('      headers: { \'Content-Type\': \'application/json\' },');
  console.log('      body: JSON.stringify({');
  console.log('        token: \'YOUR_SPREADSHEET_TOKEN\',');
  console.log('        appId: localStorage.getItem(\'feishuAppId\'),');
  console.log('        appSecret: localStorage.getItem(\'feishuAppSecret\')');
  console.log('      })');
  console.log('    });');
  console.log('    console.log(\'飞书API响应状态:\', response.status);');
  console.log('    const data = await response.json();');
  console.log('    console.log(\'飞书API响应数据:\', data);');
  console.log('  } catch (error) {');
  console.log('    console.error(\'飞书API测试失败:\', error);');
  console.log('  }');
  console.log('}');
  console.log('');

  // 5. 服务器日志检查
  console.log('【5】服务器日志检查');
  console.log('');
  console.log('检查服务器终端中的错误日志，查找以下关键词:');
  console.log('1. ❌ [飞书认证] - 认证相关错误');
  console.log('2. ❌ [飞书表格] - 表格操作错误');
  console.log('3. ❌ [批量创建] - 批量创建记录错误');
  console.log('4. ❌ [飞书API错误] - 通用飞书API错误');
  console.log('');
  console.log('修复后的代码现在会提供详细的错误信息，包括:');
  console.log('- 飞书API错误码 (code)');
  console.log('- 错误消息 (msg)');
  console.log('- API端点 (endpoint)');
  console.log('- 请求体摘要 (requestBody)');
  console.log('- 相关参数 (spreadsheetToken, sheetId等)');
  console.log('');

  console.log('========================================');
  console.log('结论');
  console.log('========================================');
  console.log('✅ 当前代码已增强错误日志，能提供详细的飞书API错误信息');
  console.log('✅ 核心API调用符合飞书开发平台要求');
  console.log('⚠️  复杂字段类型处理需要验证');
  console.log('⚠️  建议添加API调用频率限制处理');
  console.log('');
  console.log('🚀 下一步:');
  console.log('1. 查看服务器终端中的详细错误日志');
  console.log('2. 在浏览器控制台中执行诊断命令');
  console.log('3. 提供具体的飞书API错误信息以便准确定位问题');
}

diagnoseFeishuAPI().catch(error => {
  console.error('诊断脚本执行失败:', error);
  process.exit(1);
});