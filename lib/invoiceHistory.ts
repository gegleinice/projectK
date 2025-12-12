// 开票历史记录管理 - 客户和商品历史

const CUSTOMER_HISTORY_KEY = 'invoice_history_customers';
const PRODUCT_HISTORY_KEY = 'invoice_history_products';
const MAX_HISTORY_ITEMS = 10;

// 客户历史记录类型
export interface CustomerHistoryItem {
  key: string;        // 简称（如：腾讯）
  name: string;       // 全称
  taxNumber?: string; // 税号
  lastUsed: number;   // 最后使用时间戳
}

// 商品历史记录类型
export interface ProductHistoryItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  taxRate: number;
  lastUsed: number;
}

// 获取客户历史记录
export function getCustomerHistory(): CustomerHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CUSTOMER_HISTORY_KEY);
    if (!stored) return [];
    
    const items: CustomerHistoryItem[] = JSON.parse(stored);
    // 按最后使用时间排序（最近的在前）
    return items.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch {
    return [];
  }
}

// 添加客户到历史记录
export function addCustomerToHistory(customer: Omit<CustomerHistoryItem, 'lastUsed'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getCustomerHistory();
    
    // 移除已存在的相同客户
    const filtered = history.filter(item => item.key !== customer.key);
    
    // 添加新记录到开头
    const newItem: CustomerHistoryItem = {
      ...customer,
      lastUsed: Date.now()
    };
    
    filtered.unshift(newItem);
    
    // 保留最多 MAX_HISTORY_ITEMS 条
    const limited = filtered.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(CUSTOMER_HISTORY_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('Failed to save customer history:', e);
  }
}

// 获取商品历史记录
export function getProductHistory(): ProductHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(PRODUCT_HISTORY_KEY);
    if (!stored) return [];
    
    const items: ProductHistoryItem[] = JSON.parse(stored);
    // 按最后使用时间排序（最近的在前）
    return items.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch {
    return [];
  }
}

// 添加商品到历史记录
export function addProductToHistory(product: Omit<ProductHistoryItem, 'lastUsed'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getProductHistory();
    
    // 移除已存在的相同商品
    const filtered = history.filter(item => item.id !== product.id);
    
    // 添加新记录到开头
    const newItem: ProductHistoryItem = {
      ...product,
      lastUsed: Date.now()
    };
    
    filtered.unshift(newItem);
    
    // 保留最多 MAX_HISTORY_ITEMS 条
    const limited = filtered.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(PRODUCT_HISTORY_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('Failed to save product history:', e);
  }
}

// 搜索历史记录（客户）
export function searchCustomerHistory(query: string): CustomerHistoryItem[] {
  const history = getCustomerHistory();
  if (!query) return history;
  
  const lowerQuery = query.toLowerCase();
  return history.filter(item => 
    item.key.toLowerCase().includes(lowerQuery) ||
    item.name.toLowerCase().includes(lowerQuery)
  );
}

// 搜索历史记录（商品）
export function searchProductHistory(query: string): ProductHistoryItem[] {
  const history = getProductHistory();
  if (!query) return history;
  
  const lowerQuery = query.toLowerCase();
  return history.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );
}

// 清除所有历史记录
export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(CUSTOMER_HISTORY_KEY);
  localStorage.removeItem(PRODUCT_HISTORY_KEY);
}


