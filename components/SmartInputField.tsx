'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Clock, Search } from 'lucide-react';
import { searchProducts, Product } from '@/lib/productCatalog';
import { getAllCustomers } from '@/lib/mockData';
import {
  getCustomerHistory,
  getProductHistory,
  addCustomerToHistory,
  addProductToHistory,
  searchCustomerHistory,
  searchProductHistory,
  CustomerHistoryItem,
  ProductHistoryItem
} from '@/lib/invoiceHistory';

interface InputSlot {
  id: string;
  type: 'customer' | 'product' | 'amount' | 'quantity' | 'unitPrice';
  label: string;
  value: string;
  placeholder: string;
}

interface InitialData {
  customer?: string;
  product?: string;
  amount?: string;
  quantity?: string;
  unitPrice?: string;
}

interface SmartInputFieldProps {
  onSubmit: (data: {
    customerName: string;
    productName: string;
    amount: string;
    quantity: string;
    unitPrice: string;
    rawText: string;
  }) => void;
  disabled?: boolean;
  initialData?: InitialData | null;
}

// 统一的建议项类型
interface SuggestionItem {
  type: 'history' | 'search';
  id: string;
  name: string;
  subtitle?: string;
  extra?: string;
  data: any;
}

export default function SmartInputField({ onSubmit, disabled, initialData }: SmartInputFieldProps) {
  // 定义输入槽位
  const [slots, setSlots] = useState<InputSlot[]>([
    { id: 'customer', type: 'customer', label: '客户名称', value: initialData?.customer || '', placeholder: '输入客户名称' },
    { id: 'product', type: 'product', label: '商品/服务', value: initialData?.product || '', placeholder: '输入商品类型' },
    { id: 'amount', type: 'amount', label: '金额', value: initialData?.amount || '', placeholder: '金额' },
    { id: 'quantity', type: 'quantity', label: '数量', value: initialData?.quantity || '', placeholder: '数量' },
    { id: 'unitPrice', type: 'unitPrice', label: '单价', value: initialData?.unitPrice || '', placeholder: '单价' },
  ]);
  
  // 当初始数据变化时更新槽位
  useEffect(() => {
    if (initialData) {
      setSlots(prev => prev.map(slot => {
        switch (slot.id) {
          case 'customer': return { ...slot, value: initialData.customer || '' };
          case 'product': return { ...slot, value: initialData.product || '' };
          case 'amount': return { ...slot, value: initialData.amount || '' };
          case 'quantity': return { ...slot, value: initialData.quantity || '' };
          case 'unitPrice': return { ...slot, value: initialData.unitPrice || '' };
          default: return slot;
        }
      }));
    }
  }, [initialData]);

  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [historySuggestions, setHistorySuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionType, setSuggestionType] = useState<'customer' | 'product' | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 更新槽位值
  const updateSlotValue = useCallback((slotId: string, value: string) => {
    setSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, value } : slot
    ));
  }, []);

  // 获取客户建议（历史 + 搜索）
  const getCustomerSuggestions = useCallback((query: string): { history: SuggestionItem[], search: SuggestionItem[] } => {
    const allCustomersMap = getAllCustomers();
    // 将对象转换为数组，添加 key 属性
    const allCustomers = Object.entries(allCustomersMap).map(([key, value]) => ({
      key,
      ...value
    }));
    
    // 历史记录
    const historyItems = query 
      ? searchCustomerHistory(query) 
      : getCustomerHistory();
    
    const history: SuggestionItem[] = historyItems.slice(0, 5).map(item => ({
      type: 'history' as const,
      id: `history-${item.key}`,
      name: item.key,
      subtitle: item.name,
      data: item
    }));
    
    // 搜索结果（排除已在历史中的）
    const historyKeys = new Set(historyItems.map(h => h.key));
    const searchResults = query 
      ? allCustomers.filter(c => 
          !historyKeys.has(c.key) && (
            c.key.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
          )
        )
      : allCustomers.filter(c => !historyKeys.has(c.key));
    
    const search: SuggestionItem[] = searchResults.slice(0, 5).map(item => ({
      type: 'search' as const,
      id: `search-${item.key}`,
      name: item.key,
      subtitle: item.name,
      data: item
    }));
    
    return { history, search };
  }, []);

  // 获取商品建议（历史 + 搜索）
  const getProductSuggestions = useCallback((query: string): { history: SuggestionItem[], search: SuggestionItem[] } => {
    // 历史记录
    const historyItems = query 
      ? searchProductHistory(query) 
      : getProductHistory();
    
    const history: SuggestionItem[] = historyItems.slice(0, 5).map(item => ({
      type: 'history' as const,
      id: `history-${item.id}`,
      name: item.name,
      subtitle: item.category,
      extra: `¥${item.unitPrice.toLocaleString()}`,
      data: item
    }));
    
    // 搜索结果（排除已在历史中的）
    const historyIds = new Set(historyItems.map(h => h.id));
    const searchResults = searchProducts(query || '', 10).filter(p => !historyIds.has(p.id));
    
    const search: SuggestionItem[] = searchResults.slice(0, 5).map(item => ({
      type: 'search' as const,
      id: `search-${item.id}`,
      name: item.name,
      subtitle: item.category,
      extra: `¥${item.unitPrice.toLocaleString()}`,
      data: item
    }));
    
    return { history, search };
  }, []);

  // 处理输入框聚焦 - 显示历史记录
  const handleInputFocus = (slotId: string) => {
    setActiveSlot(slotId);
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    if (slot.type === 'customer') {
      const { history, search } = getCustomerSuggestions(slot.value);
      setHistorySuggestions(history);
      setSuggestions(search);
      setSuggestionType('customer');
      setShowSuggestions(history.length > 0 || search.length > 0);
    } else if (slot.type === 'product') {
      const { history, search } = getProductSuggestions(slot.value);
      setHistorySuggestions(history);
      setSuggestions(search);
      setSuggestionType('product');
      setShowSuggestions(history.length > 0 || search.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理输入变化 - 实时搜索
  const handleInputChange = (slotId: string, value: string) => {
    updateSlotValue(slotId, value);
    
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    if (slot.type === 'customer') {
      const { history, search } = getCustomerSuggestions(value);
      setHistorySuggestions(history);
      setSuggestions(search);
      setSuggestionType('customer');
      setShowSuggestions(history.length > 0 || search.length > 0);
    } else if (slot.type === 'product') {
      const { history, search } = getProductSuggestions(value);
      setHistorySuggestions(history);
      setSuggestions(search);
      setSuggestionType('product');
      setShowSuggestions(history.length > 0 || search.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 选择建议项
  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (suggestionType === 'product') {
      updateSlotValue('product', item.name);
      // 自动填充单价
      if (item.data.unitPrice) {
        updateSlotValue('unitPrice', item.data.unitPrice.toString());
      }
      // 添加到历史记录
      addProductToHistory({
        id: item.data.id || `product-${Date.now()}`,
        name: item.name,
        category: item.data.category || '',
        unitPrice: item.data.unitPrice || 0,
        unit: item.data.unit || '项',
        taxRate: item.data.taxRate || 6
      });
    } else if (suggestionType === 'customer') {
      updateSlotValue('customer', item.name);
      // 添加到历史记录
      addCustomerToHistory({
        key: item.name,
        name: item.data.name || item.name,
        taxNumber: item.data.taxNumber
      });
    }
    setShowSuggestions(false);
    
    // 聚焦下一个空的槽位
    const currentIndex = slots.findIndex(s => s.id === activeSlot);
    const nextEmptySlot = slots.slice(currentIndex + 1).find(s => !s.value);
    if (nextEmptySlot && inputRefs.current[nextEmptySlot.id]) {
      inputRefs.current[nextEmptySlot.id]?.focus();
    }
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 提交数据
  const handleSubmit = () => {
    const customerValue = slots.find(s => s.id === 'customer')?.value || '';
    const productValue = slots.find(s => s.id === 'product')?.value || '';
    
    // 提交时也添加到历史记录
    if (customerValue) {
      const allCustomersMap = getAllCustomers();
      const allCustomers = Object.entries(allCustomersMap).map(([key, value]) => ({ key, ...value }));
      const customer = allCustomers.find(c => c.key === customerValue || c.name.includes(customerValue));
      addCustomerToHistory({
        key: customerValue,
        name: customer?.name || customerValue,
        taxNumber: customer?.taxNumber
      });
    }
    
    if (productValue) {
      const products = searchProducts(productValue, 1);
      if (products.length > 0) {
        addProductToHistory({
          id: products[0].id,
          name: productValue,
          category: products[0].category,
          unitPrice: products[0].unitPrice,
          unit: products[0].unit,
          taxRate: products[0].taxRate
        });
      }
    }
    
    const data = {
      customerName: customerValue,
      productName: productValue,
      amount: slots.find(s => s.id === 'amount')?.value || '',
      quantity: slots.find(s => s.id === 'quantity')?.value || '',
      unitPrice: slots.find(s => s.id === 'unitPrice')?.value || '',
      rawText: `请帮我开票：给 ${customerValue || '[客户名称]'} 开 ${productValue || '[商品类型]'}，金额 ${slots.find(s => s.id === 'amount')?.value || '[金额]'} 元，数量 ${slots.find(s => s.id === 'quantity')?.value || '[数量]'} 个，单价 ${slots.find(s => s.id === 'unitPrice')?.value || '[单价]'} 元/个`
    };
    onSubmit(data);
  };

  // 检查是否可以提交
  const canSubmit = slots.some(slot => slot.value.trim() !== '');

  // 渲染建议项
  const renderSuggestionItem = (item: SuggestionItem, isHistory: boolean) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleSelectSuggestion(item)}
      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-b border-gray-100 last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          {isHistory && (
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
              {item.name}
            </div>
            {item.subtitle && (
              <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                {item.subtitle}
              </div>
            )}
          </div>
        </div>
        {item.extra && (
          <div className="text-sm font-bold text-blue-600 ml-4">
            {item.extra}
          </div>
        )}
      </div>
    </button>
  );

  return (
    <div className="relative">
      {/* 主输入区域 - 模板化设计 */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-colors focus-within:border-blue-400 focus-within:shadow-lg">
        {/* 模板文本 */}
        <div className="flex flex-wrap items-center gap-2 text-base leading-relaxed">
          <span className="text-blue-600 font-medium">请帮我开票：给</span>
          
          {/* 客户名称槽位 */}
          <div className="relative inline-flex">
            <input
              ref={el => inputRefs.current['customer'] = el}
              type="text"
              value={slots.find(s => s.id === 'customer')?.value || ''}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              onFocus={() => handleInputFocus('customer')}
              placeholder="客户名称"
              disabled={disabled}
              className="bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all min-w-[120px] text-center font-medium"
            />
          </div>
          
          <span className="text-blue-600 font-medium">开</span>
          
          {/* 商品类型槽位 */}
          <div className="relative inline-flex">
            <input
              ref={el => inputRefs.current['product'] = el}
              type="text"
              value={slots.find(s => s.id === 'product')?.value || ''}
              onChange={(e) => handleInputChange('product', e.target.value)}
              onFocus={() => handleInputFocus('product')}
              placeholder="商品/服务类型"
              disabled={disabled}
              className="bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all min-w-[140px] text-center font-medium"
            />
          </div>
          
          <span className="text-gray-600">，</span>
          <span className="text-blue-600 font-medium">金额</span>
          
          {/* 金额槽位 */}
          <div className="relative inline-flex items-center">
            <input
              ref={el => inputRefs.current['amount'] = el}
              type="text"
              value={slots.find(s => s.id === 'amount')?.value || ''}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              onFocus={() => handleInputFocus('amount')}
              placeholder="金额"
              disabled={disabled}
              className="bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all w-[100px] text-center font-medium"
            />
            <span className="text-gray-600 ml-1">元</span>
          </div>
          
          <span className="text-gray-600">，</span>
          <span className="text-blue-600 font-medium">数量</span>
          
          {/* 数量槽位 */}
          <div className="relative inline-flex items-center">
            <input
              ref={el => inputRefs.current['quantity'] = el}
              type="text"
              value={slots.find(s => s.id === 'quantity')?.value || ''}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              onFocus={() => handleInputFocus('quantity')}
              placeholder="数量"
              disabled={disabled}
              className="bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all w-[80px] text-center font-medium"
            />
            <span className="text-gray-600 ml-1">个</span>
          </div>
          
          <span className="text-gray-600">，</span>
          <span className="text-blue-600 font-medium">单价</span>
          
          {/* 单价槽位 */}
          <div className="relative inline-flex items-center">
            <input
              ref={el => inputRefs.current['unitPrice'] = el}
              type="text"
              value={slots.find(s => s.id === 'unitPrice')?.value || ''}
              onChange={(e) => handleInputChange('unitPrice', e.target.value)}
              onFocus={() => handleInputFocus('unitPrice')}
              placeholder="单价"
              disabled={disabled}
              className="bg-gray-100 border-0 rounded-lg px-3 py-1.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all w-[100px] text-center font-medium"
            />
            <span className="text-gray-600 ml-1">元/个</span>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              onClick={() => {
                // 清空所有槽位
                setSlots(prev => prev.map(slot => ({ ...slot, value: '' })));
              }}
            >
              <X className="w-4 h-4" />
              <span>清空</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || disabled}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>智能开票</span>
          </button>
        </div>
      </div>

      {/* 智能建议下拉框 */}
      {showSuggestions && (historySuggestions.length > 0 || suggestions.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-slideInUp"
        >
          {/* 最近使用 */}
          {historySuggestions.length > 0 && (
            <>
              <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center text-xs font-semibold text-amber-700">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  最近使用
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {historySuggestions.map(item => renderSuggestionItem(item, true))}
              </div>
            </>
          )}
          
          {/* 更多匹配 */}
          {suggestions.length > 0 && (
            <>
              <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs font-semibold text-blue-700">
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    {suggestionType === 'product' ? '商品匹配' : '客户匹配'}
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {suggestions.map(item => renderSuggestionItem(item, false))}
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideInUp {
          animation: slideInUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
