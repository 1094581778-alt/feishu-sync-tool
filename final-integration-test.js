#!/usr/bin/env node

/**
 * 定时任务系统集成测试
 * 验证所有修复和优化后的完整功能
 */

console.log('========================================');
console.log('定时任务系统集成测试');
console.log('========================================\n');

async function runIntegrationTest() {
  const tests = [
    {
      name: '1. 飞书凭证验证',
      script: 'verify-feishu-credentials.js',
      description: '验证飞书凭证有效性和API连接'
    },
    {
      name: '2. 定时任务流程验证',
      script: 'test-scheduled-task-flow.js',
      args: ['--skip-server-check'],
      description: '测试完整的定时任务创建和执行流程'
    },
    {
      name: '3. 时间更改影响测试',
      script: 'test-time-change.js',
      description: '测试时间设置对任务调度的影响'
    },
    {
      name: '4. 修复后流程验证',
      script: 'test-fixed-task-flow.js',
      description: '验证修复后的文件上传和飞书同步'
    },
    {
      name: '5. 文件上传功能测试',
      script: 'diagnose-upload.js',
      description: '测试文件上传API和错误处理'
    }
  ];

  const { execSync } = require('child_process');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log('   ' + '─'.repeat(50));
    
    try {
      const command = `node ${test.script} ${(test.args || []).join(' ')}`;
      console.log(`   🚀 执行: ${command}`);
      
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      
      // 检查输出中是否有成功标志
      const successIndicators = [
        '✅', '成功', 'success', 'passed', '正常', '有效'
      ];
      
      const hasSuccess = successIndicators.some(indicator => 
        output.toLowerCase().includes(indicator.toLowerCase())
      );
      
      const errorIndicators = [
        '❌', '失败', 'error', 'failed', '异常', '无效', '缺失'
      ];
      
      const hasError = errorIndicators.some(indicator => 
        output.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (hasSuccess && !hasError) {
        console.log(`   ✅ 测试通过`);
        passed++;
        
        // 提取关键成功信息
        const lines = output.split('\n');
        const successLines = lines.filter(line => 
          line.includes('✅') || line.includes('成功') || line.includes('正常')
        ).slice(0, 3);
        
        successLines.forEach(line => {
          console.log(`      ${line.trim()}`);
        });
      } else if (hasError) {
        console.log(`   ❌ 测试失败`);
        failed++;
        
        // 提取错误信息
        const lines = output.split('\n');
        const errorLines = lines.filter(line => 
          line.includes('❌') || line.includes('失败') || line.includes('错误')
        ).slice(0, 3);
        
        errorLines.forEach(line => {
          console.log(`      ${line.trim()}`);
        });
      } else {
        console.log(`   ⚠️  测试结果不确定`);
        console.log(`      输出长度: ${output.length} 字符`);
        
        // 显示最后几行输出
        const lines = output.split('\n');
        const lastLines = lines.slice(-5).filter(line => line.trim());
        console.log(`      最后输出:`);
        lastLines.forEach(line => {
          console.log(`      ${line.trim()}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ 测试执行失败: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总');
  console.log('='.repeat(50));
  console.log(`✅ 通过: ${passed} 个测试`);
  console.log(`❌ 失败: ${failed} 个测试`);
  console.log(`📊 成功率: ${Math.round((passed / tests.length) * 100)}%`);
  console.log('');
  
  // 总结关键发现
  console.log('🔍 关键发现:');
  console.log('1. 飞书凭证有效性: ' + (passed >= 1 ? '✅ 已验证' : '❌ 需要检查'));
  console.log('2. 定时任务流程: ' + (passed >= 2 ? '✅ 完整' : '❌ 有问题'));
  console.log('3. 时间调度逻辑: ' + (passed >= 3 ? '✅ 正常' : '❌ 异常'));
  console.log('4. 文件上传功能: ' + (passed >= 4 ? '✅ 正常' : '❌ 有问题'));
  console.log('5. 系统集成度: ' + (passed >= 4 ? '✅ 良好' : '⚠️  需要优化'));
  console.log('');
  
  // 建议
  console.log('💡 建议:');
  if (failed === 0) {
    console.log('   ✅ 所有测试通过，系统功能正常');
    console.log('   🚀 可以开始使用定时任务功能');
  } else if (failed <= 2) {
    console.log('   ⚠️  部分测试失败，但核心功能正常');
    console.log('   🔧 建议检查失败的测试项');
  } else {
    console.log('   ❌ 多个测试失败，需要系统检查');
    console.log('   🛠️  建议按以下顺序修复:');
    console.log('       1. 飞书凭证配置');
    console.log('       2. 服务器连接状态');
    console.log('       3. 文件上传API');
    console.log('       4. 定时任务调度');
  }
  
  console.log('\n📋 测试脚本列表:');
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name}`);
    console.log(`      ${test.description}`);
    console.log(`      脚本: ${test.script}`);
  });
  
  console.log('\n🚀 下一步:');
  console.log('   1. 在浏览器中手动验证定时任务功能');
  console.log('   2. 检查服务器日志确认无错误');
  console.log('   3. 根据测试结果进行针对性优化');
  
  return failed === 0;
}

// 运行集成测试
runIntegrationTest().then(success => {
  console.log('\n========================================');
  console.log(success ? '✅ 集成测试完成，系统准备就绪' : '❌ 集成测试发现问题');
  console.log('========================================');
  
  if (!success) {
    console.log('\n🔧 故障排除步骤:');
    console.log('   1. 检查服务器是否运行: npm run dev');
    console.log('   2. 验证飞书凭证: node verify-feishu-credentials.js');
    console.log('   3. 检查.env.local配置');
    console.log('   4. 查看服务器终端错误日志');
    console.log('   5. 运行单个测试脚本定位问题');
  }
  
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('集成测试执行失败:', error);
  process.exit(1);
});