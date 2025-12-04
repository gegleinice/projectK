'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle, Lightbulb, Shield, TrendingUp, X, Sparkles } from 'lucide-react';
import { parseInvoiceRequest, validateInvoiceLogic, smartComplete, ParsedInvoice } from '@/lib/invoiceParser';
import { mockCustomers, productTypes, invoiceTemplates } from '@/lib/mockData';
import { searchProducts, Product } from '@/lib/productCatalog';
import { detectInvoiceRisks, generateSmartRecommendations, RiskWarning, SmartRecommendation } from '@/lib/smartFeatures';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'error' | 'success' | 'info' | 'processing' | 'warning' | 'recommendation';
  data?: any;
  risks?: RiskWarning[];
  recommendations?: SmartRecommendation[];
}

interface ChatInterfaceProps {
  onInvoiceUpdate: (invoice: ParsedInvoice | null) => void;
  initialInput?: string;
}

export default function ChatInterface({ onInvoiceUpdate, initialInput }: ChatInterfaceProps) {
  // 检查是否需要自动提交
  const shouldAutoSubmit = initialInput?.includes('|autosubmit') || false;
  const cleanInitialInput = initialInput && shouldAutoSubmit 
    ? initialInput.replace('|autosubmit', '') 
    : initialInput || '';

  const defaultTemplate = '请帮我开票：给 [客户名称] 开 [商品类型]，金额 [数值] 元，数量 [数值] 个，单价 [数值] 元/个';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是AI智能开票助手。请告诉我您的开票需求，我会自动为您提取信息并生成发票。',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  
  // 使用初始值
  const [input, setInput] = useState(() => {
    return cleanInitialInput && cleanInitialInput.length > 0 ? cleanInitialInput : defaultTemplate;
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  
  // 新增：商品搜索相关状态
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 新增：风险和推荐
  const [currentRisks, setCurrentRisks] = useState<RiskWarning[]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<SmartRecommendation[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 当有初始输入且需要自动提交时，自动提交
  useEffect(() => {
    if (shouldAutoSubmit && cleanInitialInput && cleanInitialInput.trim() && !hasAutoSubmitted && cleanInitialInput !== defaultTemplate) {
      setHasAutoSubmitted(true);
      setTimeout(() => {
        const form = inputRef.current?.form;
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }, 800);
    }
  }, [shouldAutoSubmit, cleanInitialInput, hasAutoSubmitted, defaultTemplate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 商品智能搜索
  useEffect(() => {
    // 从输入中提取可能的商品关键词
    const extractProductKeyword = (text: string): string => {
      const patterns = [
        /开\s*([^\s，。,]+)/,
        /商品[类型]*[:：]?\s*([^\s，。,]+)/,
        /\*\*([^\*]+)\*\*/,
        /\[([^\]]+)\]/
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };

    const keyword = extractProductKeyword(input);
    
    if (keyword && keyword.length >= 2 && !keyword.includes('客户') && !keyword.includes('金额')) {
      setSearchQuery(keyword);
      const results = searchProducts(keyword, 5);
      setProductSuggestions(results);
      setShowSuggestions(results.length > 0 && isFocused);
    } else {
      setShowSuggestions(false);
      setProductSuggestions([]);
    }
  }, [input, isFocused]);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsProcessing(true);
    setShowSuggestions(false);

    // 步骤1: 开始解析
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '📝 正在解析您的开票需求...',
      timestamp: new Date(),
      type: 'processing'
    };
    setMessages(prev => [...prev, processingMessage]);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const parsed = parseInvoiceRequest(userInput);
      
      // 步骤2: 显示解析出的字段
      const parsingMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '🔍 正在提取关键信息...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev.slice(0, -1), parsingMessage]);
      await new Promise(resolve => setTimeout(resolve, 600));

      // 逐个显示提取的字段
      let extractedInfo = '✨ 已提取以下信息：\n\n';
      
      if (parsed.customerName) {
        extractedInfo += `👤 客户名称：[${parsed.customerName}]\n`;
        const tempMsg: Message = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: extractedInfo,
          timestamp: new Date(),
          type: 'info'
        };
        setMessages(prev => [...prev.slice(0, -1), tempMsg]);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      if (parsed.productType) {
        extractedInfo += `📦 商品类型：[${parsed.productType}]\n`;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: extractedInfo
          };
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      if (parsed.amount !== null) {
        extractedInfo += `💰 金额：[${parsed.amount}元]\n`;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: extractedInfo
          };
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      if (parsed.quantity !== null) {
        extractedInfo += `🔢 数量：[${parsed.quantity}个]\n`;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: extractedInfo
          };
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      if (parsed.unitPrice !== null) {
        extractedInfo += `💵 单价：[${parsed.unitPrice}元/个]\n`;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: extractedInfo
          };
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // 步骤3: 逻辑校验
      const validationMsg: Message = {
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: '⚙️ 正在校验数据逻辑...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev, validationMsg]);
      await new Promise(resolve => setTimeout(resolve, 600));

      const errors = validateInvoiceLogic(parsed);
      
      if (errors.length > 0) {
        const errorMessage: Message = {
          id: (Date.now() + 5).toString(),
          role: 'assistant',
          content: '❌ ' + errors.map(e => e.message).join('\n'),
          timestamp: new Date(),
          type: 'error'
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        setIsProcessing(false);
        onInvoiceUpdate(null);
        return;
      }

      // 步骤4: 智能补全
      const completingMsg: Message = {
        id: (Date.now() + 5).toString(),
        role: 'assistant',
        content: '🤖 正在智能补全客户信息...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev.slice(0, -1), completingMsg]);
      await new Promise(resolve => setTimeout(resolve, 800));

      const completed = smartComplete(parsed, mockCustomers, productTypes, invoiceTemplates);
      
      // 新增：风险检测
      const risks = detectInvoiceRisks(completed);
      const recommendations = generateSmartRecommendations(completed);
      
      setCurrentRisks(risks);
      setCurrentRecommendations(recommendations);
      
      // 步骤5: 显示确认信息
      let confirmContent = '✅ 信息解析完成，请确认以下开票信息：\n\n';
      confirmContent += `━━━━━━━━━━━━━━━━━━━━\n`;
      confirmContent += `📋 收票方信息\n`;
      confirmContent += `   名称：${completed.customerInfo?.name || completed.customerName}\n`;
      if (completed.customerInfo) {
        confirmContent += `   税号：${completed.customerInfo.taxNumber}\n`;
        confirmContent += `   地址：${completed.customerInfo.address}\n`;
        confirmContent += `   电话：${completed.customerInfo.phone}\n`;
        confirmContent += `   开户行：${completed.customerInfo.bank}\n`;
        confirmContent += `   账号：${completed.customerInfo.accountNumber}\n`;
      }
      confirmContent += `\n🛍️ 商品信息\n`;
      confirmContent += `   商品：${completed.productName || completed.productType}\n`;
      confirmContent += `   类别：${completed.category || '未分类'}\n`;
      if (completed.quantity) confirmContent += `   数量：${completed.quantity}\n`;
      if (completed.unitPrice) confirmContent += `   单价：¥${completed.unitPrice.toFixed(2)}\n`;
      if (completed.amount) confirmContent += `   金额：¥${completed.amount.toFixed(2)}\n`;
      confirmContent += `\n💳 税费信息\n`;
      if (completed.taxRate) confirmContent += `   税率：${completed.taxRate}%\n`;
      if (completed.taxAmount) confirmContent += `   税额：¥${completed.taxAmount.toFixed(2)}\n`;
      if (completed.totalAmount) confirmContent += `   价税合计：¥${completed.totalAmount.toFixed(2)}\n`;
      confirmContent += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      confirmContent += `✨ 信息已自动补全，发票预览已生成 →`;

      const confirmMessage: Message = {
        id: (Date.now() + 6).toString(),
        role: 'assistant',
        content: confirmContent,
        timestamp: new Date(),
        type: 'success',
        data: completed,
        risks: risks,
        recommendations: recommendations
      };

      setMessages(prev => [...prev.slice(0, -1), confirmMessage]);
      
      // 如果有高风险警告，显示风险提示消息
      const highRisks = risks.filter(r => r.level === 'high');
      if (highRisks.length > 0) {
        const riskMessage: Message = {
          id: (Date.now() + 7).toString(),
          role: 'system',
          content: '检测到风险项，请注意核对',
          timestamp: new Date(),
          type: 'warning',
          risks: highRisks
        };
        setMessages(prev => [...prev, riskMessage]);
      }
      
      // 如果有高优先级推荐，显示推荐消息
      const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
      if (highPriorityRecs.length > 0) {
        const recMessage: Message = {
          id: (Date.now() + 8).toString(),
          role: 'system',
          content: '为您推荐',
          timestamp: new Date(),
          type: 'recommendation',
          recommendations: highPriorityRecs
        };
        setMessages(prev => [...prev, recMessage]);
      }
      
      onInvoiceUpdate(completed);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 7).toString(),
        role: 'assistant',
        content: '❌ 抱歉，解析过程中出现错误，请检查输入格式后重试。',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      onInvoiceUpdate(null);
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // 选择商品建议
  const handleSelectProduct = (product: Product) => {
    // 替换输入中的商品关键词
    let newInput = input.replace(searchQuery, product.name);
    
    // 如果没有单价，自动填充
    if (!input.match(/单价.*\d/)) {
      newInput += `，单价 ${product.unitPrice} 元/${product.unit}`;
    }
    
    setInput(newInput);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 渲染风险警告卡片
  const renderRiskCard = (risk: RiskWarning) => {
    const levelColors = {
      high: 'bg-red-50 border-red-300 text-red-800',
      medium: 'bg-orange-50 border-orange-300 text-orange-800',
      low: 'bg-yellow-50 border-yellow-300 text-yellow-800'
    };

    const levelIcons = {
      high: '🚨',
      medium: '⚠️',
      low: '💡'
    };

    return (
      <div key={risk.id} className={`border-2 rounded-xl p-4 mb-2 ${levelColors[risk.level]}`}>
        <div className="flex items-start">
          <span className="text-2xl mr-3">{levelIcons[risk.level]}</span>
          <div className="flex-1">
            <h4 className="font-bold mb-1">{risk.title}</h4>
            <p className="text-sm mb-2">{risk.message}</p>
            <p className="text-xs opacity-80">{risk.suggestion}</p>
          </div>
        </div>
      </div>
    );
  };

  // 渲染推荐卡片
  const renderRecommendationCard = (rec: SmartRecommendation) => {
    const priorityColors = {
      high: 'bg-blue-50 border-blue-300',
      medium: 'bg-purple-50 border-purple-300',
      low: 'bg-gray-50 border-gray-300'
    };

    return (
      <div key={rec.id} className={`border-2 rounded-xl p-4 mb-2 ${priorityColors[rec.priority]}`}>
        <div className="flex items-start">
          <span className="text-2xl mr-3">{rec.icon || '💡'}</span>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-1">{rec.title}</h4>
            <p className="text-sm text-gray-700 mb-2">{rec.content}</p>
            {rec.action && (
              <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors">
                {rec.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-[calc(100vh-240px)] min-h-[600px]">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          AI智能开票助手
        </h2>
        <p className="text-sm text-blue-100 mt-1">智能识别·风险预警·活动推送</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-slideInRight'
                  : message.type === 'error'
                  ? 'bg-red-50 border-2 border-red-500 text-red-700 animate-slideInLeft'
                  : message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-900 animate-slideInLeft'
                  : message.type === 'warning'
                  ? 'bg-orange-50 border-2 border-orange-400 text-orange-900 animate-slideInLeft'
                  : message.type === 'recommendation'
                  ? 'bg-blue-50 border-2 border-blue-400 text-blue-900 animate-slideInLeft'
                  : message.type === 'processing'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 animate-slideInLeft'
                  : 'bg-gray-100 text-gray-800 animate-slideInLeft'
              }`}
            >
              {/* 消息头部图标 */}
              {message.type === 'error' && (
                <div className="flex items-start mb-2">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">校验失败</span>
                </div>
              )}
              {message.type === 'success' && (
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="font-semibold">解析成功</span>
                </div>
              )}
              {message.type === 'warning' && (
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="font-semibold">风险预警</span>
                </div>
              )}
              {message.type === 'recommendation' && (
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="font-semibold">智能推荐</span>
                </div>
              )}
              
              {/* 处理中动画 */}
              {message.type === 'processing' && (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{message.content}</span>
                </div>
              )}
              
              {/* 消息内容 */}
              {message.type !== 'processing' && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              )}

              {/* 风险警告卡片 */}
              {message.risks && message.risks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.risks.map(risk => renderRiskCard(risk))}
                </div>
              )}

              {/* 推荐卡片 */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.recommendations.map(rec => renderRecommendationCard(rec))}
                </div>
              )}

              {/* 时间戳 */}
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            {/* 商品建议下拉框 */}
            {showSuggestions && productSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-blue-300 rounded-xl shadow-2xl overflow-hidden z-50 animate-slideInUp"
              >
                <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                  <div className="flex items-center text-sm font-semibold text-blue-900">
                    <Sparkles className="w-4 h-4 mr-2" />
                    智能匹配商品 ({productSuggestions.length})
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {productSuggestions.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {product.category} · {product.unit}
                            {product.specification && ` · ${product.specification}`}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-bold text-blue-600">
                            ¥{product.unitPrice}
                          </div>
                          <div className="text-xs text-gray-500">税率{product.taxRate}%</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="请输入开票需求，例如：给腾讯开软件开发服务，金额 10000 元..."
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-400 transition-all ${
                isFocused ? 'border-blue-400 shadow-lg' : 'border-gray-300'
              }`}
              style={{
                background: input.match(/\[([^\]]+)\]/) 
                  ? 'linear-gradient(to right, #ffffff 0%, #f0f9ff 100%)'
                  : 'white',
              }}
              rows={3}
              disabled={isProcessing}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
              {input.length > 0 && `${input.length} 字`}
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="font-medium">发送</span>
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>💡 开始输入商品名称，系统将智能匹配推荐</span>
          <span className="text-blue-600 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            支持自然语言输入
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }

        .animate-slideInUp {
          animation: slideInUp 0.2s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        textarea {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
}
