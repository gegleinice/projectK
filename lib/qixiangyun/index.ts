// 企享云API统一导出
export * from './errors';
export * from './auth';
export * from './base';
export * from './types';
export * from './company';
export * from './product';
export * from './customer';
export * from './invoice';
export * from './natural-person';  // 自然人认证
export * from './rsa-utils';       // RSA加密
export * from './area-codes';      // 地区代码

// 便捷方法导出
export { getAuthManager } from './auth';
export { getCompanyService } from './company';
export { getProductService } from './product';
export { getCustomerService } from './customer';
export { getInvoiceService } from './invoice';

