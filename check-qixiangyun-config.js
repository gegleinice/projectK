#!/usr/bin/env node

/**
 * 企享云API配置检查工具
 * 用于验证环境变量配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 企享云API配置检查工具\n');
console.log('='.repeat(50));

// 读取.env.local文件
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf-8');
  console.log('✅ 找到 .env.local 文件\n');
} catch (error) {
  console.log('❌ 未找到 .env.local 文件');
  console.log('   请复制 .env.example 并重命名为 .env.local\n');
  process.exit(1);
}

// 解析环境变量
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

// 检查必需配置
const required = {
  'NEXT_PUBLIC_QIXIANGYUN_BASE_URL': '企享云API基础URL',
  'QIXIANGYUN_APPKEY': '应用Key',
  'QIXIANGYUN_APPSECRET': '应用Secret'
};

const optional = {
  'QIXIANGYUN_AGG_ORG_ID': '企业ID',
  'QIXIANGYUN_DEFAULT_NSRSBH': '默认税号',
  'QIXIANGYUN_DEFAULT_AREA_CODE': '默认地区编码'
};

console.log('📋 必需配置检查:\n');
let hasAllRequired = true;

Object.entries(required).forEach(([key, desc]) => {
  if (env[key] && env[key] !== 'your_appkey_here' && env[key] !== 'your_appsecret_here') {
    const displayValue = key.includes('SECRET') 
      ? env[key].substring(0, 10) + '...' 
      : env[key];
    console.log(`  ✅ ${desc}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${desc}: 未配置`);
    hasAllRequired = false;
  }
});

console.log('\n📋 可选配置检查:\n');
let hasAllOptional = true;

Object.entries(optional).forEach(([key, desc]) => {
  if (env[key] && env[key] !== 'your_agg_org_id' && env[key] !== 'your_company_tax_number') {
    const displayValue = env[key].length > 20 
      ? env[key].substring(0, 15) + '...' 
      : env[key];
    console.log(`  ✅ ${desc}: ${displayValue}`);
  } else {
    console.log(`  ⚠️  ${desc}: 未配置（部分功能受限）`);
    hasAllOptional = false;
  }
});

console.log('\n' + '='.repeat(50));
console.log('\n🎯 配置状态总结:\n');

if (hasAllRequired && hasAllOptional) {
  console.log('  ✅ 所有配置项完整，可以使用全部功能！');
  console.log('  ✅ 真实API模式已启用');
} else if (hasAllRequired) {
  console.log('  ⚠️  基础配置完整，可以使用核心功能');
  console.log('  ⚠️  部分高级功能需要可选配置');
  console.log('\n  建议配置:');
  if (!env['QIXIANGYUN_AGG_ORG_ID'] || env['QIXIANGYUN_AGG_ORG_ID'] === 'your_agg_org_id') {
    console.log('    - QIXIANGYUN_AGG_ORG_ID (从企享云后台获取)');
  }
  if (!env['QIXIANGYUN_DEFAULT_NSRSBH'] || env['QIXIANGYUN_DEFAULT_NSRSBH'] === 'your_company_tax_number') {
    console.log('    - QIXIANGYUN_DEFAULT_NSRSBH (您公司的18位税号)');
  }
} else {
  console.log('  ❌ 必需配置不完整，无法使用真实API');
  console.log('  📋 将使用模拟数据模式');
  console.log('\n  请配置以下项目:');
  Object.entries(required).forEach(([key, desc]) => {
    if (!env[key] || env[key] === 'your_appkey_here' || env[key] === 'your_appsecret_here') {
      console.log(`    - ${key}: ${desc}`);
    }
  });
}

console.log('\n📚 更多帮助:');
console.log('  - 快速开始: QUICKSTART.md');
console.log('  - 完整文档: QIXIANGYUN_API_USAGE.md');
console.log('  - 企享云官网: https://www.qixiangyun.com\n');

console.log('='.repeat(50));

// 返回退出码
process.exit(hasAllRequired ? 0 : 1);

