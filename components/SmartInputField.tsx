'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { searchProducts, Product } from '@/lib/productCatalog';
import { mockCustomers } from '@/lib/mockData';

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
  const [suggestions, setSuggestions] = useState<any[]>([]);
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

  // 处理输入变化
  const handleInputChange = (slotId: string, value: string) => {
    updateSlotValue(slotId, value);
    
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    // 根据槽位类型进行智能匹配
    if (slot.type === 'product' && value.length >= 1) {
      const results = searchProducts(value, 6);
      setSuggestions(results);
      setSuggestionType('product');
      setShowSuggestions(results.length > 0);
    } else if (slot.type === 'customer' && value.length >= 1) {
      const customerNames = Object.keys(mockCustomers);
      const filtered = customerNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase()) ||
        mockCustomers[name].name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.map(key => ({ key, ...mockCustomers[key] })));
      setSuggestionType('customer');
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 选择建议项
  const handleSelectSuggestion = (item: any) => {
    if (suggestionType === 'product') {
      updateSlotValue('product', item.name);
      // 自动填充单价
      updateSlotValue('unitPrice', item.unitPrice.toString());
    } else if (suggestionType === 'customer') {
      updateSlotValue('customer', item.key);
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
    const data = {
      customerName: slots.find(s => s.id === 'customer')?.value || '',
      productName: slots.find(s => s.id === 'product')?.value || '',
      amount: slots.find(s => s.id === 'amount')?.value || '',
      quantity: slots.find(s => s.id === 'quantity')?.value || '',
      unitPrice: slots.find(s => s.id === 'unitPrice')?.value || '',
      rawText: `请帮我开票：给 ${slots.find(s => s.id === 'customer')?.value || '[客户名称]'} 开 ${slots.find(s => s.id === 'product')?.value || '[商品类型]'}，金额 ${slots.find(s => s.id === 'amount')?.value || '[金额]'} 元，数量 ${slots.find(s => s.id === 'quantity')?.value || '[数量]'} 个，单价 ${slots.find(s => s.id === 'unitPrice')?.value || '[单价]'} 元/个`
    };
    onSubmit(data);
  };

  // 检查是否可以提交
  const canSubmit = slots.some(slot => slot.value.trim() !== '');

  // 渲染商品建议
  const renderProductSuggestion = (product: Product) => (
    <button
      key={product.id}
      type="button"
      onClick={() => handleSelectSuggestion(product)}
      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-b border-gray-100 last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
            {product.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.category}</span>
            <span>·</span>
            <span>{product.unit}</span>
            {product.specification && (
              <>
                <span>·</span>
                <span>{product.specification}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-sm font-bold text-blue-600">
            ¥{product.unitPrice.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">税率 {product.taxRate}%</div>
        </div>
      </div>
    </button>
  );

  // 渲染客户建议
  const renderCustomerSuggestion = (customer: any) => (
    <button
      key={customer.key}
      type="button"
      onClick={() => handleSelectSuggestion(customer)}
      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-b border-gray-100 last:border-b-0 group"
    >
      <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
        {customer.key}
      </div>
      <div className="text-xs text-gray-500 mt-0.5 truncate">
        {customer.name}
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
              onFocus={() => setActiveSlot('customer')}
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
              onFocus={() => setActiveSlot('product')}
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
              onFocus={() => setActiveSlot('amount')}
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
              onFocus={() => setActiveSlot('quantity')}
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
              onFocus={() => setActiveSlot('unitPrice')}
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
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-slideInUp"
          style={{
            top: activeSlot === 'customer' ? '60px' : activeSlot === 'product' ? '60px' : 'auto'
          }}
        >
          {/* 建议头部 */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm font-semibold text-blue-800">
                <Sparkles className="w-4 h-4 mr-2" />
                {suggestionType === 'product' ? '智能匹配商品' : '匹配客户'} ({suggestions.length})
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* 建议列表 */}
          <div className="max-h-72 overflow-y-auto">
            {suggestionType === 'product' 
              ? suggestions.map((item: Product) => renderProductSuggestion(item))
              : suggestions.map((item: any) => renderCustomerSuggestion(item))
            }
          </div>
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

