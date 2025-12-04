'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle, Shield, Sparkles, Bell, AlertTriangle, ChevronRight, FileText, Download, Wallet, Check, X } from 'lucide-react';
import { parseInvoiceRequest, validateInvoiceLogic, smartComplete, ParsedInvoice } from '@/lib/invoiceParser';
import { mockCustomers, productTypes, invoiceTemplates } from '@/lib/mockData';
import { detectInvoiceRisks, generateSmartRecommendations, RiskWarning, SmartRecommendation } from '@/lib/smartFeatures';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'error' | 'success' | 'info' | 'processing' | 'risk' | 'recommendation' | 'balance-check' | 'invoice-confirm' | 'invoice-success';
  data?: any;
}

interface InitialData {
  customer?: string;
  product?: string;
  amount?: string;
  quantity?: string;
  unitPrice?: string;
}

interface ChatInterfaceProps {
  onInvoiceUpdate: (invoice: ParsedInvoice | null) => void;
  initialData?: InitialData | null;
}

export default function ChatInterface({ onInvoiceUpdate, initialData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是AI智能开票助手。请告诉我您的开票需求，我会自动为您提取信息并生成发票。',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRisks, setCurrentRisks] = useState<RiskWarning[]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<SmartRecommendation[]>([]);
  const [pendingInvoice, setPendingInvoice] = useState<ParsedInvoice | null>(null);
  const [invoiceBalance] = useState(5000000); // 模拟开票余额：500万
  const [isConfirming, setIsConfirming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasProcessedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 自动提交初始数据
  useEffect(() => {
    if (initialData && !hasProcessedRef.current) {
      const { customer, product, amount, quantity, unitPrice } = initialData;
      
      let inputText = '请帮我开票：';
      if (customer) inputText += `给${customer}`;
      if (product) inputText += `开${product}`;
      if (amount) inputText += `，金额${amount}元`;
      if (quantity) inputText += `，数量${quantity}个`;
      if (unitPrice) inputText += `，单价${unitPrice}元/个`;
      
      if (customer || product || amount) {
        hasProcessedRef.current = true;
        setTimeout(() => {
          processMessage(inputText);
        }, 500);
      }
    }
  }, []);

  // 生成发票PDF（模拟）
  const generateInvoicePDF = async (invoice: ParsedInvoice) => {
    // 模拟生成PDF的过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 生成发票号
    const invoiceNumber = `FP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    return {
      invoiceNumber,
      pdfUrl: `/invoices/${invoiceNumber}.pdf`,
      createTime: new Date().toISOString()
    };
  };

  // 确认开票
  const handleConfirmInvoice = async () => {
    if (!pendingInvoice) return;
    
    setIsConfirming(true);
    
    // 添加确认消息
    const confirmingMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '🔄 正在生成电子发票...',
      timestamp: new Date(),
      type: 'processing'
    };
    setMessages(prev => [...prev, confirmingMsg]);
    
    try {
      // 生成发票PDF
      const pdfResult = await generateInvoicePDF(pendingInvoice);
      
      // 显示成功消息
      const successMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: JSON.stringify({
          invoice: pendingInvoice,
          pdf: pdfResult
        }),
        timestamp: new Date(),
        type: 'invoice-success'
      };
      
      setMessages(prev => [...prev.slice(0, -1), successMsg]);
      setPendingInvoice(null);
      
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ 发票生成失败，请稍后重试',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
    }
    
    setIsConfirming(false);
  };

  // 取消开票
  const handleCancelInvoice = () => {
    setPendingInvoice(null);
    
    const cancelMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '已取消本次开票操作。如需开票，请重新输入您的需求。',
      timestamp: new Date(),
      type: 'info'
    };
    setMessages(prev => [...prev, cancelMsg]);
  };

  // 处理消息
  const processMessage = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
      const parsed = parseInvoiceRequest(messageText);
      
      // 步骤2: 显示解析结果
      let extractedInfo = '✨ 已提取以下信息：\n\n';
      if (parsed.customerName) extractedInfo += `👤 客户名称：${parsed.customerName}\n`;
      if (parsed.productType) extractedInfo += `📦 商品类型：${parsed.productType}\n`;
      if (parsed.amount !== null) extractedInfo += `💰 金额：${parsed.amount}元\n`;
      if (parsed.quantity !== null) extractedInfo += `🔢 数量：${parsed.quantity}个\n`;
      if (parsed.unitPrice !== null) extractedInfo += `💵 单价：${parsed.unitPrice}元/个\n`;

      const extractMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: extractedInfo,
        timestamp: new Date(),
        type: 'info'
      };
      setMessages(prev => [...prev.slice(0, -1), extractMsg]);
      await new Promise(resolve => setTimeout(resolve, 600));

      // 步骤3: 逻辑校验
      const validationMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: '⚙️ 正在校验数据逻辑...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev, validationMsg]);
      await new Promise(resolve => setTimeout(resolve, 500));

      const errors = validateInvoiceLogic(parsed);
      
      if (errors.length > 0) {
        const errorMessage: Message = {
          id: (Date.now() + 4).toString(),
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
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: '🤖 正在智能补全客户信息...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev.slice(0, -1), completingMsg]);
      await new Promise(resolve => setTimeout(resolve, 700));

      const completed = smartComplete(parsed, mockCustomers, productTypes, invoiceTemplates);
      
      // 风险检测和智能推荐
      const risks = detectInvoiceRisks(completed);
      const recommendations = generateSmartRecommendations(completed);
      
      setCurrentRisks(risks);
      setCurrentRecommendations(recommendations);
      
      // 步骤5: 显示解析信息
      let confirmContent = '✅ 信息解析完成：\n\n';
      confirmContent += `━━━━━━━━━━━━━━━━━━━━\n`;
      confirmContent += `📋 收票方信息\n`;
      confirmContent += `   名称：${completed.customerInfo?.name || completed.customerName}\n`;
      if (completed.customerInfo) {
        confirmContent += `   税号：${completed.customerInfo.taxNumber}\n`;
      }
      confirmContent += `\n🛍️ 商品信息\n`;
      confirmContent += `   商品：${completed.productName || completed.productType}\n`;
      if (completed.quantity) confirmContent += `   数量：${completed.quantity}\n`;
      if (completed.unitPrice) confirmContent += `   单价：¥${completed.unitPrice.toFixed(2)}\n`;
      if (completed.amount) confirmContent += `   金额：¥${completed.amount.toFixed(2)}\n`;
      confirmContent += `\n💳 税费信息\n`;
      if (completed.taxRate) confirmContent += `   税率：${completed.taxRate}%\n`;
      if (completed.taxAmount) confirmContent += `   税额：¥${completed.taxAmount.toFixed(2)}\n`;
      if (completed.totalAmount) confirmContent += `   价税合计：¥${completed.totalAmount.toFixed(2)}\n`;
      confirmContent += `━━━━━━━━━━━━━━━━━━━━`;

      const confirmMessage: Message = {
        id: (Date.now() + 5).toString(),
        role: 'assistant',
        content: confirmContent,
        timestamp: new Date(),
        type: 'success',
        data: completed
      };

      setMessages(prev => [...prev.slice(0, -1), confirmMessage]);
      onInvoiceUpdate(completed);
      
      // 步骤6: 检验开票余额
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const balanceCheckMsg: Message = {
        id: (Date.now() + 6).toString(),
        role: 'system',
        content: JSON.stringify({
          balance: invoiceBalance,
          required: completed.totalAmount || completed.amount || 0,
          sufficient: invoiceBalance >= (completed.totalAmount || completed.amount || 0)
        }),
        timestamp: new Date(),
        type: 'balance-check'
      };
      setMessages(prev => [...prev, balanceCheckMsg]);
      
      // 步骤7: 显示确认开票卡片
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const invoiceAmount = completed.totalAmount || completed.amount || 0;
      if (invoiceBalance >= invoiceAmount) {
        setPendingInvoice(completed);
        
        const confirmCardMsg: Message = {
          id: (Date.now() + 7).toString(),
          role: 'system',
          content: JSON.stringify(completed),
          timestamp: new Date(),
          type: 'invoice-confirm'
        };
        setMessages(prev => [...prev, confirmCardMsg]);
      } else {
        const insufficientMsg: Message = {
          id: (Date.now() + 7).toString(),
          role: 'assistant',
          content: `❌ 开票余额不足\n\n当前余额：¥${invoiceBalance.toLocaleString()}\n需要金额：¥${invoiceAmount.toLocaleString()}\n\n请联系管理员增加开票额度。`,
          timestamp: new Date(),
          type: 'error'
        };
        setMessages(prev => [...prev, insufficientMsg]);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 8).toString(),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // 渲染余额检查卡片
  const renderBalanceCheckCard = (data: string) => {
    const { balance, required, sufficient } = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className={`rounded-2xl overflow-hidden border-2 ${sufficient ? 'border-green-200' : 'border-red-200'}`}>
          <div className={`px-5 py-4 ${sufficient ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">开票余额检验</h3>
                <p className="text-white/80 text-sm">
                  {sufficient ? '✓ 余额充足，可以开票' : '✗ 余额不足'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">当前余额</div>
                <div className="text-xl font-bold text-gray-800">¥{balance.toLocaleString()}</div>
              </div>
              <div className={`rounded-xl p-4 ${sufficient ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-xs text-gray-500 mb-1">本次开票</div>
                <div className={`text-xl font-bold ${sufficient ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{required.toLocaleString()}
                </div>
              </div>
            </div>
            
            {sufficient && (
              <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <Check className="w-4 h-4 mr-2" />
                开票后剩余：¥{(balance - required).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染确认开票卡片
  const renderInvoiceConfirmCard = (data: string) => {
    const invoice: ParsedInvoice = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="rounded-2xl overflow-hidden border-2 border-blue-200 shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">确认开票</h3>
                <p className="text-white/80 text-sm">请确认是否立即开具发票</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5">
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">购买方</span>
                <span className="font-medium text-gray-800">{invoice.customerInfo?.name || invoice.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">商品名称</span>
                <span className="font-medium text-gray-800">{invoice.productName || invoice.productType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">价税合计</span>
                <span className="font-bold text-xl text-blue-600">
                  ¥{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelInvoice}
                disabled={isConfirming}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                <X className="w-4 h-4 inline mr-2" />
                取消
              </button>
              <button
                onClick={handleConfirmInvoice}
                disabled={isConfirming}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {isConfirming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    确认开票
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染开票成功卡片
  const renderInvoiceSuccessCard = (data: string) => {
    const { invoice, pdf } = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="rounded-2xl overflow-hidden border-2 border-green-200 shadow-lg">
          {/* 成功头部 */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-white font-bold text-xl mb-1">🎉 开票成功！</h3>
            <p className="text-white/80 text-sm">电子发票已生成</p>
          </div>
          
          {/* 发票信息 */}
          <div className="bg-white p-5">
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">发票号码</span>
                <span className="font-mono font-bold text-gray-800">{pdf.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">购买方</span>
                <span className="font-medium text-gray-800">{invoice.customerInfo?.name || invoice.customerName}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">开票金额</span>
                <span className="font-bold text-green-600">¥{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">开票时间</span>
                <span className="text-gray-600">{new Date(pdf.createTime).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            
            {/* 下载按钮 */}
            <button
              onClick={() => {
                // 模拟下载PDF
                alert(`正在下载发票：${pdf.invoiceNumber}.pdf`);
              }}
              className="w-full px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>下载发票 PDF</span>
            </button>
            
            <div className="mt-3 text-center">
              <button className="text-sm text-gray-500 hover:text-gray-700">
                发送至邮箱 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染风险预警卡片
  const renderRiskCard = (risksData: string) => {
    const risks: RiskWarning[] = JSON.parse(risksData);

    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">风险预警中心</h3>
                <p className="text-white/80 text-xs">检测到 {risks.length} 项需要关注</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-2 border-t-0 border-orange-200 rounded-b-2xl divide-y divide-orange-100">
          {risks.map((risk) => (
            <div key={risk.id} className="p-4 hover:bg-orange-50/50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  risk.level === 'high' ? 'bg-red-100' :
                  risk.level === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}>
                  {risk.level === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : risk.level === 'medium' ? (
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-bold ${
                      risk.level === 'high' ? 'text-red-700' :
                      risk.level === 'medium' ? 'text-orange-700' : 'text-yellow-700'
                    }`}>
                      {risk.title}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      risk.level === 'high' ? 'bg-red-100 text-red-700' :
                      risk.level === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '提醒'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{risk.message}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3" />
                    <span>{risk.suggestion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染智能推荐卡片
  const renderRecommendationCard = (recsData: string) => {
    const recommendations: SmartRecommendation[] = JSON.parse(recsData);

    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl px-5 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">智能推荐</h3>
              <p className="text-white/80 text-xs">为您精选 {recommendations.length} 条建议</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-2 border-t-0 border-blue-200 rounded-b-2xl">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div 
              key={rec.id}
              className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                index < Math.min(recommendations.length, 3) - 1 ? 'border-b border-blue-100' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">{rec.icon || '💡'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-800">{rec.title}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-gray-600">{rec.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-[calc(100vh-240px)] min-h-[600px] relative">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              AI智能开票助手
            </h2>
            <p className="text-sm text-white/80 mt-0.5">智能识别 · 风险预警 · 活动推送</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-1.5 bg-white/20 rounded-lg">
              <Wallet className="w-4 h-4 text-white mr-1.5" />
              <span className="text-white text-xs font-medium">余额: ¥{invoiceBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            {/* 余额检查卡片 */}
            {message.type === 'balance-check' && (
              <div className="w-full flex justify-start">
                {renderBalanceCheckCard(message.content)}
              </div>
            )}
            
            {/* 确认开票卡片 */}
            {message.type === 'invoice-confirm' && pendingInvoice && (
              <div className="w-full flex justify-start">
                {renderInvoiceConfirmCard(message.content)}
              </div>
            )}
            
            {/* 开票成功卡片 */}
            {message.type === 'invoice-success' && (
              <div className="w-full flex justify-start">
                {renderInvoiceSuccessCard(message.content)}
              </div>
            )}
            
            {/* 风险预警卡片 */}
            {message.type === 'risk' && (
              <div className="w-full flex justify-start">
                {renderRiskCard(message.content)}
              </div>
            )}
            
            {/* 智能推荐卡片 */}
            {message.type === 'recommendation' && (
              <div className="w-full flex justify-start">
                {renderRecommendationCard(message.content)}
              </div>
            )}
            
            {/* 普通消息 */}
            {!['risk', 'recommendation', 'balance-check', 'invoice-confirm', 'invoice-success'].includes(message.type || '') && (
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-50 border-2 border-red-400 text-red-800'
                    : message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-900'
                    : message.type === 'processing'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'error' && (
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                    <span className="font-semibold">校验失败</span>
                  </div>
                )}
                {message.type === 'success' && (
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    <span className="font-semibold">解析成功</span>
                  </div>
                )}
                
                {message.type === 'processing' ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                )}

                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
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
              onKeyDown={handleKeyDown}
              placeholder="输入您的开票需求，例如：给腾讯开软件服务，金额50000元..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-400 transition-all"
              rows={2}
              disabled={isProcessing || isConfirming}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || isConfirming}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="font-medium">发送</span>
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-400 text-center">
          💡 支持自然语言描述开票需求
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
