'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { parseInvoiceRequest, validateInvoiceLogic, smartComplete, ParsedInvoice } from '@/lib/invoiceParser';
import { mockCustomers, productTypes, invoiceTemplates } from '@/lib/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'error' | 'success' | 'info' | 'processing';
  data?: any;
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

  console.log('ChatInterface initialized with:', {
    initialInput,
    shouldAutoSubmit,
    cleanInitialInput
  });

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 当有初始输入且需要自动提交时，自动提交
  useEffect(() => {
    if (shouldAutoSubmit && cleanInitialInput && cleanInitialInput.trim() && !hasAutoSubmitted && cleanInitialInput !== defaultTemplate) {
      setHasAutoSubmitted(true);
      console.log('Auto-submitting:', cleanInitialInput);
      // 延迟800ms后自动提交
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
        data: completed
      };

      setMessages(prev => [...prev.slice(0, -1), confirmMessage]);
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

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-[calc(100vh-240px)] min-h-[600px]">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          对话式开票
        </h2>
        <p className="text-sm text-blue-100 mt-1">告诉我您的需求，我来帮您智能开票</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-slideInRight'
                  : message.type === 'error'
                  ? 'bg-red-50 border-2 border-red-500 text-red-700 animate-slideInLeft'
                  : message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-900 animate-slideInLeft'
                  : message.type === 'processing'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 animate-slideInLeft'
                  : 'bg-gray-100 text-gray-800 animate-slideInLeft'
              }`}
            >
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
              {message.type === 'processing' && (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{message.content}</span>
                </div>
              )}
              {message.type !== 'processing' && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              )}
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
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="请帮我开票：给 [客户名称] 开 [商品类型]，金额 [数值] 元，数量 [数值] 个，单价 [数值] 元/个..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-400"
              style={{
                // 用CSS自定义槽位颜色效果
                background: 'white',
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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
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
          <span>💡 提示：用方括号 [] 标记的内容可直接替换</span>
          <span className="text-blue-600">支持自然语言输入</span>
        </div>
      </div>

      <style jsx>{`
        textarea {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
}
