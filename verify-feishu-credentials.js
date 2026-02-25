#!/usr/bin/env node

/**
 * 验证飞书凭证有效性和权限配置
 */

const BASE_URL = 'http://localhost:3000';

async function verifyFeishuCredentials() {
  console.log('========================================');
  console.log('验证飞书凭证有效性和权限配置');
  console.log('========================================\n');

  // 1. 检查当前配置
  console.log('1. 检查当前飞书配置');
  console.log('   从.env.local文件读取:');
  console.log('   FEISHU_APP_ID=YOUR_APP_ID');
  console.log('   FEISHU_APP_SECRET=YOUR_APP_SECRET');
  console.log('');

  // 2. 测试飞书API连接
  console.log('2. 测试飞书API连接');
  
  try {
    const response = await fetch(`${BASE_URL}/api/feishu/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'YOUR_SPREADSHEET_TOKEN',
        appId: 'YOUR_APP_ID',
        appSecret: 'YOUR_APP_SECRET'
      }),
    });

    const data = await response.json();
    console.log(`   API响应状态: ${response.status}`);
    console.log(`   API响应数据: ${JSON.stringify(data).substring(0, 300)}...`);
    
    if (data.code === 0 || data.success) {
      console.log('   ✅ 飞书API连接成功');
      if (data.tables && data.tables.length > 0) {
        console.log(`   ✅ 检测到 ${data.tables.length} 个飞书表格`);
        data.tables.slice(0, 3).forEach((table, idx) => {
          console.log(`      ${idx + 1}. ${table.name} (ID: ${table.id})`);
        });
        if (data.tables.length > 3) {
          console.log(`      ... 还有 ${data.tables.length - 3} 个表格`);
        }
      }
    } else {
      console.log(`   ❌ 飞书API连接失败: ${data.msg || '未知错误'}`);
      console.log('');
      console.log('💡 可能的原因:');
      console.log('   1. App ID 或 App Secret 错误');
      console.log('   2. 飞书应用未启用');
      console.log('   3. 应用权限配置不完整');
      console.log('   4. 网络连接问题');
    }
  } catch (error) {
    console.log(`   ❌ 飞书API测试异常: ${error.message}`);
  }
  console.log('');

  // 3. 测试获取访问令牌（直接调用飞书API）
  console.log('3. 测试飞书访问令牌获取');
  console.log('   直接调用飞书开放平台API...');
  
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: 'YOUR_APP_ID',
        app_secret: 'YOUR_APP_SECRET'
      }),
    });

    const data = await response.json();
    console.log(`   飞书API响应状态: ${response.status}`);
    console.log(`   飞书API响应数据: ${JSON.stringify(data)}`);
    
    if (data.code === 0) {
      console.log('   ✅ 飞书访问令牌获取成功');
      console.log(`     访问令牌: ${data.tenant_access_token.substring(0, 20)}...`);
      console.log(`     过期时间: ${data.expire} 秒`);
    } else {
      console.log(`   ❌ 飞书访问令牌获取失败: ${data.msg}`);
      console.log('');
      console.log('🔍 错误代码分析:');
      console.log(`   code: ${data.code}`);
      console.log(`   msg: ${data.msg}`);
      console.log('');
      console.log('📋 解决方案:');
      console.log('   1. 检查飞书开放平台应用状态');
      console.log('   2. 确认App ID和App Secret正确');
      console.log('   3. 确保应用已启用并配置了正确权限');
      console.log('   4. 检查网络连接是否正常');
    }
  } catch (error) {
    console.log(`   ❌ 飞书API调用异常: ${error.message}`);
  }
  console.log('');

  // 4. 检查权限配置
  console.log('4. 检查飞书应用权限配置');
  console.log('   需要的最低权限:');
  console.log('   1. 获取访问令牌权限 (auth:tenant_access_token:internal)');
  console.log('   2. 读取多维表格权限 (bitable:app:readonly)');
  console.log('   3. 写入多维表格权限 (bitable:app)');
  console.log('');
  console.log('💡 检查步骤:');
  console.log('   1. 访问飞书开放平台: https://open.feishu.cn/');
  console.log('   2. 进入应用管理');
  console.log('   3. 选择对应的应用');
  console.log('   4. 检查"权限管理"页面');
  console.log('   5. 确保上述权限已开启');
  console.log('');

  // 5. 提供解决方案
  console.log('5. 解决方案建议');
  console.log('');
  console.log('🔄 如果凭证无效:');
  console.log('   1. 登录飞书开放平台');
  console.log('   2. 创建新的应用或使用现有应用');
  console.log('   3. 获取新的App ID和App Secret');
  console.log('   4. 更新.env.local文件:');
  console.log('      FEISHU_APP_ID=新的App_ID');
  console.log('      FEISHU_APP_SECRET=新的App_Secret');
  console.log('   5. 重启服务器: npm run dev');
  console.log('');
  console.log('📱 快速测试新凭证:');
  console.log('   curl -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -d \'{"app_id":"YOUR_APP_ID","app_secret":"YOUR_APP_SECRET"}\'');
  console.log('');
  console.log('✅ 预期响应:');
  console.log('   {"code":0,"msg":"ok","tenant_access_token":"t-xxx","expire":7200}');
  console.log('');

  console.log('========================================');
  console.log('验证完成');
  console.log('========================================');
  console.log('');
  console.log('📊 总结:');
  console.log('   1. 检查当前凭证的有效性');
  console.log('   2. 验证飞书API连接状态');
  console.log('   3. 确认应用权限配置完整');
  console.log('   4. 提供凭证更新方案');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   根据验证结果更新飞书凭证配置');
}

verifyFeishuCredentials().catch(error => {
  console.error('验证脚本执行失败:', error);
  process.exit(1);
});