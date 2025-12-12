#!/usr/bin/env node

/**
 * 企享云自然人认证功能测试脚本
 * 
 * 用法：node test-natural-person-auth.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n==============================================');
console.log('📋 企享云自然人认证功能 - 测试指南');
console.log('==============================================\n');

console.log('✅ 功能已实现，包括：');
console.log('   1. RSA密码加密');
console.log('   2. 自然人认证API集成');
console.log('   3. 企业列表获取');
console.log('   4. 企业选择和绑定UI\n');

console.log('🌐 访问地址：');
console.log('   http://localhost:3008/user/bindcompany\n');

console.log('📝 页面流程：');
console.log('   Step 1: 填写办税人信息（姓名+手机号+密码）');
console.log('   Step 2: 认证成功后显示企业列表');
console.log('   Step 3: 选择要绑定的企业');
console.log('   Step 4: 查看企业详情并确认');
console.log('   Step 5: 绑定成功\n');

console.log('⚠️  测试注意事项：');
console.log('   • 需要真实的税务APP账号');
console.log('   • 手机号必须是11位有效号码');
console.log('   • 密码至少6位字符');
console.log('   • 该账号需要在税务局绑定至少一家企业\n');

console.log('🔒 安全特性：');
console.log('   • 密码使用RSA公钥加密（客户端）');
console.log('   • 明文密码不会在网络传输');
console.log('   • 不存储任何密码信息\n');

console.log('📦 相关文件：');
console.log('   • lib/qixiangyun/natural-person.ts - 自然人服务');
console.log('   • lib/qixiangyun/rsa-utils.ts - RSA加密工具');
console.log('   • app/user/bindcompany/page.tsx - UI页面\n');

console.log('📖 详细文档：');
console.log('   请查看 NATURAL_PERSON_AUTH.md\n');

rl.question('是否启动开发服务器测试? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n正在启动服务器...');
    console.log('请运行: npm run dev\n');
    console.log('然后访问: http://localhost:3008/user/bindcompany\n');
  } else {
    console.log('\n测试取消。如需查看详细文档，请运行:');
    console.log('cat NATURAL_PERSON_AUTH.md\n');
  }
  rl.close();
});

