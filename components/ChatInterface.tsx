'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle, Shield, Sparkles, Bell, AlertTriangle, ChevronRight, FileText, Download, Wallet, Check, X, Building2 } from 'lucide-react';
import InvoicePreviewCard from './InvoicePreviewCard';
import { parseInvoiceRequest, validateInvoiceLogic, smartComplete, ParsedInvoice } from '@/lib/invoiceParser';
import { getAllCustomers, productTypes, invoiceTemplates } from '@/lib/mockData';
import { parseInvoiceWithLLM, toDisplayResult, ParsedInvoiceResult, ParseResultDisplay } from '@/lib/llmService';
import { detectInvoiceRisks, generateSmartRecommendations, RiskWarning, SmartRecommendation } from '@/lib/smartFeatures';
import { CompanyInfo } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'error' | 'success' | 'info' | 'processing' | 'risk' | 'recommendation' | 'balance-check' | 'invoice-confirm' | 'invoice-success' | 'seller-info' | 'missing-info' | 'invoice-preview' | 'ai-parse-result' | 'parse-complete';
  data?: any;
}

interface InitialData {
  invoiceType?: string;
  customer?: string;
  product?: string;
  amount?: string;
  quantity?: string;
  unitPrice?: string;
  mode?: 'template' | 'freeform';
}

interface ChatInterfaceProps {
  onInvoiceUpdate: (invoice: ParsedInvoice | null) => void;
  initialData?: InitialData | null;
  companyInfo?: CompanyInfo | null;
}

export default function ChatInterface({ onInvoiceUpdate, initialData, companyInfo }: ChatInterfaceProps) {
  // 初始消息包含企业信息
  const getInitialMessages = (): Message[] => {
    const msgs: Message[] = [];
    
    // 如果有企业信息，先显示销售方信息
    if (companyInfo) {
      msgs.push({
        id: 'seller-info',
        role: 'system',
        content: '',
        timestamp: new Date(),
        type: 'seller-info',
        data: companyInfo
      });
    }
    
    msgs.push({
      id: '1',
      role: 'assistant',
      content: companyInfo 
        ? `您好！我是AI智能开票助手。当前开票企业：${companyInfo.name}（${companyInfo.taxType}），请告诉我您的开票需求。`
        : '您好！我是AI智能开票助手。请告诉我您的开票需求，我会自动为您提取信息并生成发票。',
      timestamp: new Date(),
      type: 'info'
    });
    
    return msgs;
  };
  
  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRisks, setCurrentRisks] = useState<RiskWarning[]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<SmartRecommendation[]>([]);
  const [pendingInvoice, setPendingInvoice] = useState<ParsedInvoice | null>(null);
  // 从企业信息获取开票余额
  const [invoiceBalance] = useState(companyInfo?.invoiceQuota || 5000000);
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

  // 是否为自由输入模式
  const isFreeformMode = initialData?.mode === 'freeform';

  // 自动提交初始数据（仅模板模式）
  useEffect(() => {
    if (initialData && !hasProcessedRef.current && initialData.mode !== 'freeform') {
      const { invoiceType, customer, product, amount, quantity, unitPrice } = initialData;
      
      const invoiceTypeText = invoiceType === '专票' ? '增值税专用发票' : '增值税普通发票';
      let inputText = `请帮我开一张${invoiceTypeText}：`;
      if (customer) inputText += `给${customer}`;
      if (product) inputText += `开${product}`;
      if (amount) inputText += `，金额${amount}元`;
      if (quantity) inputText += `，数量${quantity}个`;
      if (unitPrice) inputText += `，单价${unitPrice}元/个`;
      
      if (customer || product || amount) {
        hasProcessedRef.current = true;
        setTimeout(() => {
          const type: '普票' | '专票' = invoiceType === '专票' ? '专票' : '普票';
          processMessage(inputText, type);
        }, 500);
      }
    }
  }, []);

  // 生成发票（集成真实API）
  const generateInvoicePDF = async (invoice: ParsedInvoice) => {
    // 检查是否配置了真实API
    const useRealAPI = Boolean(process.env.NEXT_PUBLIC_QIXIANGYUN_BASE_URL);
    
    if (useRealAPI && company) {
      try {
        // 动态导入企享云发票服务
        const { getInvoiceService } = await import('@/lib/qixiangyun/invoice');
        const invoiceService = getInvoiceService();
        
        console.log('🎫 调用真实API开票...');
        const result = await invoiceService.createInvoice(invoice, company);
        
        if (result.success) {
          return {
            invoiceNumber: result.invoiceNumber!,
            pdfUrl: result.pdfUrl || `/invoices/${result.invoiceNumber}.pdf`,
            createTime: result.createTime || new Date().toISOString(),
            isRealInvoice: true
          };
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('真实API开票失败，使用模拟数据:', error);
        // 回退到模拟开票
      }
    }
    
    // 模拟生成PDF的过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 生成发票号
    const invoiceNumber = `FP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    return {
      invoiceNumber,
      pdfUrl: `/invoices/${invoiceNumber}.pdf`,
      createTime: new Date().toISOString(),
      isRealInvoice: false
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
      content: '正在生成电子发票...',
      timestamp: new Date(),
      type: 'processing'
    };
    setMessages(prev => [...prev, confirmingMsg]);
    
    try {
      // 生成发票
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
      
      // 保存发票历史
      if (pdfResult.isRealInvoice) {
        console.log('✅ 真实发票已开具:', pdfResult.invoiceNumber);
      } else {
        console.log('📋 模拟发票已生成:', pdfResult.invoiceNumber);
      }
      
    } catch (error) {
      console.error('发票生成失败:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ 发票生成失败: ${error instanceof Error ? error.message : '请稍后重试'}`,
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
  const processMessage = async (messageText: string, invoiceType: '普票' | '专票' = '普票') => {
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
      content: isFreeformMode ? 'AI 正在解析您的开票需求...' : '正在解析开票信息...',
      timestamp: new Date(),
      type: 'processing'
    };
    setMessages(prev => [...prev, processingMessage]);

    let parsed;
    
    if (isFreeformMode) {
      // 自由输入模式：使用大模型解析
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const llmResult = await parseInvoiceWithLLM(messageText);
      
      // 显示AI解析结果卡片
      const displayResult = toDisplayResult(llmResult);
      const aiResultMsg: Message = {
        id: (Date.now() + 1.5).toString(),
        role: 'system',
        content: JSON.stringify(displayResult),
        timestamp: new Date(),
        type: 'ai-parse-result'
      };
      setMessages(prev => [...prev.slice(0, -1), aiResultMsg]);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 如果必填信息缺失，停止流程
      if (!displayResult.canProceed) {
        setIsProcessing(false);
        return;
      }
      
      // 转换为本地解析格式（自动填充可选字段默认值）
      parsed = {
        invoiceType: llmResult.invoiceType,
        customerName: llmResult.customerName || '',
        productType: llmResult.productType || '',
        amount: llmResult.amount,
        quantity: llmResult.quantity || 1,  // 默认数量为1
        unitPrice: llmResult.unitPrice || llmResult.amount  // 默认单价等于金额
      };
    } else {
      // 模板模式：使用本地解析
      await new Promise(resolve => setTimeout(resolve, 800));
      parsed = parseInvoiceRequest(messageText, invoiceType);
      
      // 检查必填信息
      const missingRequired: string[] = [];
      if (!parsed.customerName) missingRequired.push('客户名称');
      if (!parsed.productType) missingRequired.push('商品/服务');
      if (parsed.amount === null) missingRequired.push('金额');
      
      const missingOptional: string[] = [];
      if (parsed.quantity === null) missingOptional.push('数量');
      if (parsed.unitPrice === null) missingOptional.push('单价');
      
      // 显示解析结果卡片
      const displayResult: ParseResultDisplay = {
        invoiceType: parsed.invoiceType === '专票' ? '增值税专用发票' : '增值税普通发票',
        customerName: parsed.customerName || undefined,
        productType: parsed.productType || undefined,
        amount: parsed.amount || undefined,
        quantity: parsed.quantity || undefined,
        unitPrice: parsed.unitPrice || undefined,
        missingRequired,
        missingOptional,
        confidence: missingRequired.length === 0 ? 90 : 50,
        canProceed: missingRequired.length === 0
      };

      const extractMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: JSON.stringify(displayResult),
        timestamp: new Date(),
        type: 'ai-parse-result'
      };
      setMessages(prev => [...prev.slice(0, -1), extractMsg]);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 如果必填信息缺失，停止流程
      if (!displayResult.canProceed) {
        setIsProcessing(false);
        return;
      }
      
      // 自动填充可选字段默认值
      if (parsed.quantity === null) parsed.quantity = 1;
      if (parsed.unitPrice === null) parsed.unitPrice = parsed.amount;
    }

    // 步骤3: 逻辑校验
    try {
      const validationMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: '正在校验数据...',
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
          content: errors.map(e => e.message).join('\n'),
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
        content: '正在智能补全信息...',
        timestamp: new Date(),
        type: 'processing'
      };
      setMessages(prev => [...prev.slice(0, -1), completingMsg]);
      await new Promise(resolve => setTimeout(resolve, 700));

      const completed = smartComplete(parsed, getAllCustomers(), productTypes, invoiceTemplates);
      
      // 风险检测和智能推荐
      const risks = detectInvoiceRisks(completed);
      const recommendations = generateSmartRecommendations(completed);
      
      setCurrentRisks(risks);
      setCurrentRecommendations(recommendations);
      
      // 步骤5: 直接显示发票预览卡片（跳过重复的解析完成卡片）
      const invoicePreviewMsg: Message = {
        id: (Date.now() + 5).toString(),
        role: 'system',
        content: JSON.stringify(completed),
        timestamp: new Date(),
        type: 'invoice-preview'
      };
      setMessages(prev => [...prev.slice(0, -1), invoicePreviewMsg]);
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

  // 渲染销售方企业信息卡片 - 统一设计语言
  const renderSellerInfoCard = (company: CompanyInfo) => {
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-slate-800 font-bold text-sm">
                {company.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white text-sm truncate">{company.name}</h3>
                  <span className="text-amber-400 text-xs flex items-center">
                    <CheckCircle className="w-3 h-3 mr-0.5" />
                    已认证
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 核心信息 */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-slate-400">纳税人识别号</span>
                <p className="font-mono text-slate-700 text-xs mt-0.5">{company.creditCode}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">纳税人类型</span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    company.taxType === '一般纳税人' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {company.taxType}
                  </span>
                </p>
              </div>
            </div>
            
            {/* 地址 */}
            <div className="py-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">开票地址</span>
              <p className="text-xs text-slate-600 mt-0.5">{company.invoiceAddress || company.registeredAddress}</p>
            </div>
            
            {/* 主营业务 */}
            {company.mainBusiness && company.mainBusiness.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">主营业务</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {company.mainBusiness.slice(0, 4).map((business, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      {business}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染余额检查卡片 - 统一设计语言
  const renderBalanceCheckCard = (data: string) => {
    const { balance, required, sufficient } = JSON.parse(data);
    const remaining = balance - required;
    const usagePercent = Math.min(100, (required / balance) * 100);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${sufficient ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  <Wallet className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">额度校验</span>
              </div>
              <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                sufficient ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {sufficient ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>{sufficient ? '额度充足' : '额度不足'}</span>
              </div>
            </div>
          </div>
          
          {/* 数据区 */}
          <div className="p-4">
            {/* 额度可视化 */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>已用额度</span>
                <span className="font-mono">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${sufficient ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
            </div>
            
            {/* 数值对比 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">可用额度</div>
                <div className="text-base font-bold text-slate-700 font-mono">¥{balance.toLocaleString()}</div>
              </div>
              <div className={`rounded-lg p-3 ${sufficient ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className={`text-xs mb-1 ${sufficient ? 'text-emerald-600' : 'text-red-600'}`}>本次金额</div>
                <div className={`text-base font-bold font-mono ${sufficient ? 'text-emerald-700' : 'text-red-600'}`}>
                  ¥{required.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* 剩余额度 */}
            {sufficient && (
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                <span className="text-slate-500">开票后剩余</span>
                <span className="font-semibold text-slate-700 font-mono">¥{remaining.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染确认开票卡片 - 统一设计语言
  const renderInvoiceConfirmCard = (data: string) => {
    const invoice: ParsedInvoice = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-slate-800" />
              </div>
              <span className="text-sm font-semibold text-white">确认开票</span>
            </div>
          </div>
          
          {/* 信息区 */}
          <div className="p-4">
            {/* 双方信息 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 销售方 */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">销售方</div>
                <div className="text-sm font-medium text-slate-700 truncate">{companyInfo?.name || '-'}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{companyInfo?.creditCode || ''}</div>
              </div>
              {/* 购买方 */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">购买方</div>
                <div className="text-sm font-medium text-slate-700 truncate">{invoice.customerInfo?.name || invoice.customerName}</div>
                {invoice.customerInfo?.taxNumber && (
                  <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{invoice.customerInfo.taxNumber}</div>
                )}
              </div>
            </div>
            
            {/* 商品和金额 */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-400">商品/服务</span>
                <span className="text-sm text-slate-700">{invoice.productName || invoice.productType}</span>
              </div>
              <div className="flex items-center justify-between py-3 bg-amber-50 rounded-lg px-3 border border-amber-100">
                <span className="text-sm text-slate-600">价税合计</span>
                <span className="font-bold text-lg text-slate-800 font-mono">
                  ¥{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* 按钮区 */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancelInvoice}
                disabled={isConfirming}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirmInvoice}
                disabled={isConfirming}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center text-sm"
              >
                {isConfirming ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
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

  // 渲染开票成功卡片 - 统一设计语言
  const renderInvoiceSuccessCard = (data: string) => {
    const { invoice, pdf } = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          {/* 成功头部 */}
          <div className="bg-emerald-500 px-4 py-4 text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-white font-semibold">开票成功</h3>
            <p className="text-emerald-100 text-xs mt-0.5">电子发票已生成</p>
          </div>
          
          {/* 发票信息 */}
          <div className="p-4">
            <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">发票号码</span>
                <span className="font-mono font-semibold text-slate-700 text-sm">{pdf.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">购买方</span>
                <span className="text-sm text-slate-700">{invoice.customerInfo?.name || invoice.customerName}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">开票金额</span>
                <span className="font-bold text-emerald-600 text-lg font-mono">¥{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">开票时间</span>
                <span className="text-xs text-slate-500">{new Date(pdf.createTime).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            
            {/* 下载按钮 */}
            <button
              onClick={() => {
                alert(`正在下载发票：${pdf.invoiceNumber}.pdf`);
              }}
              className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-medium flex items-center justify-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>下载电子发票</span>
            </button>
            
            <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-slate-400">
              <button className="hover:text-slate-600 transition-colors">发送邮箱</button>
              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
              <button className="hover:text-slate-600 transition-colors">打印发票</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染风险预警卡片 - 统一设计语言
  const renderRiskCard = (risksData: string) => {
    const risks: RiskWarning[] = JSON.parse(risksData);

    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-800">风险提示</span>
              </div>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{risks.length} 项</span>
            </div>
          </div>
          
          {/* 风险列表 */}
          <div className="divide-y divide-slate-100">
            {risks.map((risk) => (
              <div key={risk.id} className="p-3">
                <div className="flex items-start space-x-2.5">
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 ${
                    risk.level === 'high' ? 'bg-red-100' :
                    risk.level === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {risk.level === 'high' ? (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    ) : risk.level === 'medium' ? (
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    ) : (
                      <Bell className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-700">{risk.title}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        risk.level === 'high' ? 'bg-red-50 text-red-600' :
                        risk.level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1.5">{risk.message}</p>
                    <p className="text-xs text-slate-400">{risk.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染智能推荐卡片 - 统一设计语言
  const renderRecommendationCard = (recsData: string) => {
    const recommendations: SmartRecommendation[] = JSON.parse(recsData);

    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700">智能建议</span>
              </div>
              <span className="text-xs text-slate-500">{recommendations.length} 条</span>
            </div>
          </div>
          
          {/* 推荐列表 */}
          <div className="divide-y divide-slate-100">
            {recommendations.slice(0, 3).map((rec) => (
              <div 
                key={rec.id}
                className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-slate-700">{rec.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-slate-500">{rec.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染缺失信息提示卡片 - 统一设计语言
  const renderMissingInfoCard = (data: string) => {
    const { missingFields, confidence } = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-amber-800">信息不完整</span>
            </div>
          </div>
          
          {/* 缺失字段列表 */}
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">请补充以下信息后重新发送</p>
            
            <div className="space-y-2 mb-4">
              {missingFields.map((field: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
                  <X className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-sm text-amber-800">{field}</span>
                  <span className="text-xs text-amber-500 ml-auto px-1.5 py-0.5 bg-amber-100 rounded">必填</span>
                </div>
              ))}
            </div>
            
            {/* 提示 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">输入示例</p>
              <p className="text-xs text-slate-600">
                给<span className="text-amber-600 font-medium">腾讯</span>开<span className="text-amber-600 font-medium">软件服务费</span>，金额<span className="text-amber-600 font-medium">5万元</span>
              </p>
            </div>
            
            {confidence !== undefined && (
              <div className="mt-3 text-center text-xs text-slate-400">
                解析置信度 {confidence}%
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染AI解析结果卡片 - 区分必填和可选字段
  const renderAIParseResultCard = (data: string) => {
    const result: ParseResultDisplay = JSON.parse(data);
    const hasMissingRequired = result.missingRequired && result.missingRequired.length > 0;
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
          hasMissingRequired ? 'border-red-200' : 'border-slate-200'
        }`}>
          {/* 头部 */}
          <div className={`px-4 py-3 border-b ${
            hasMissingRequired 
              ? 'bg-red-50 border-red-100' 
              : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  hasMissingRequired ? 'bg-red-500' : 'bg-slate-700'
                }`}>
                  {hasMissingRequired 
                    ? <AlertCircle className="w-3.5 h-3.5 text-white" />
                    : <Sparkles className="w-3 h-3 text-amber-400" />
                  }
                </div>
                <span className={`text-sm font-semibold ${hasMissingRequired ? 'text-red-700' : 'text-slate-700'}`}>
                  {hasMissingRequired ? '信息不完整' : 'AI 解析结果'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  result.canProceed ? 'bg-emerald-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs ${hasMissingRequired ? 'text-red-500' : 'text-slate-500'}`}>
                  置信度 {result.confidence}%
                </span>
              </div>
            </div>
          </div>
          
          {/* 内容 */}
          <div className="p-4 space-y-3">
            {/* 发票类型 */}
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500">发票类型</span>
              <span className="text-sm font-medium text-slate-700">{result.invoiceType}</span>
            </div>
            
            {/* 识别到的信息 */}
            <div className="space-y-2">
              {result.customerName ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">客户名称</span>
                  <span className="text-sm text-slate-700">{result.customerName}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-red-400">客户名称</span>
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">未识别 · 必填</span>
                </div>
              )}
              
              {result.productType ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">商品/服务</span>
                  <span className="text-sm text-slate-700">{result.productType}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-red-400">商品/服务</span>
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">未识别 · 必填</span>
                </div>
              )}
              
              {result.amount !== undefined ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">金额</span>
                  <span className="text-sm font-semibold text-slate-800">¥{result.amount.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-red-400">金额</span>
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">未识别 · 必填</span>
                </div>
              )}
              
              {/* 可选字段 - 数量 */}
              {result.quantity !== undefined ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">数量</span>
                  <span className="text-sm text-slate-700">{result.quantity}</span>
                </div>
              ) : result.canProceed && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-300">数量</span>
                  <span className="text-xs text-slate-400">默认 1</span>
                </div>
              )}
              
              {/* 可选字段 - 单价 */}
              {result.unitPrice !== undefined ? (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-400">单价</span>
                  <span className="text-sm text-slate-700">¥{result.unitPrice.toLocaleString()}</span>
                </div>
              ) : result.canProceed && result.amount && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-300">单价</span>
                  <span className="text-xs text-slate-400">默认 ¥{result.amount.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* 必填信息缺失提示 */}
            {hasMissingRequired && (
              <div className="mt-3 pt-3 border-t border-red-100">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600 font-medium mb-2">请补充以下必填信息后重新发送：</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingRequired.map((field, i) => (
                      <span key={i} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-red-400 mt-2">
                    示例："给<span className="text-red-600">腾讯</span>开<span className="text-red-600">软件服务费</span>，金额<span className="text-red-600">5万元</span>"
                  </p>
                </div>
              </div>
            )}
            
            {/* 可继续流程的确认 */}
            {result.canProceed && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>必填信息完整，正在继续处理...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染解析完成卡片 - 统一专业设计
  const renderParseCompleteCard = (data: string) => {
    const invoice: ParsedInvoice = JSON.parse(data);
    
    return (
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-emerald-700">信息解析完成</span>
            </div>
          </div>
          
          {/* 内容 */}
          <div className="p-4">
            {/* 发票类型标签 */}
            <div className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600 mb-3">
              {invoice.invoiceType === '专票' ? '增值税专用发票' : '增值税普通发票'}
            </div>
            
            {/* 收票方 */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1.5">收票方信息</div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-sm font-medium text-slate-800">{invoice.customerInfo?.name || invoice.customerName}</div>
                {invoice.customerInfo?.taxNumber && (
                  <div className="text-xs text-slate-500 font-mono mt-1">{invoice.customerInfo.taxNumber}</div>
                )}
              </div>
            </div>
            
            {/* 商品信息 */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1.5">商品/服务</div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-700">{invoice.productName || invoice.productType}</span>
                {invoice.quantity && <span className="text-xs text-slate-500">x{invoice.quantity}</span>}
              </div>
            </div>
            
            {/* 金额汇总 */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">价税合计</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  ¥{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}
                </span>
              </div>
              {invoice.taxRate && (
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-amber-200/50">
                  <span className="text-xs text-slate-500">税率 {invoice.taxRate}%</span>
                  {invoice.taxAmount && (
                    <span className="text-xs text-slate-500">税额 ¥{invoice.taxAmount.toLocaleString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染发票预览卡片 - 使用仿真电子发票组件
  const renderInvoicePreviewCard = (data: string) => {
    const invoice: ParsedInvoice = JSON.parse(data);
    return <InvoicePreviewCard invoice={invoice} companyInfo={companyInfo} />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 flex flex-col h-[calc(100vh-120px)] min-h-[500px] relative overflow-hidden">
      {/* Chat Header - 简洁专业风格 */}
      <div className="relative px-5 py-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                智能开票助手
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-semibold">AI</span>
              </h2>
              <p className="text-xs text-slate-400">自然语言 · 智能解析 · 一键开票</p>
            </div>
          </div>
          
          {/* 开票余额指示器 - 简洁版 */}
          <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
            <Wallet className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <span className="text-slate-600 text-xs font-semibold">¥{invoiceBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Messages Area - 简洁优雅 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/30">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            {/* 销售方企业信息卡片 */}
            {message.type === 'seller-info' && message.data && (
              <div className="w-full flex justify-start">
                {renderSellerInfoCard(message.data as CompanyInfo)}
              </div>
            )}
            
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
            
            {/* 缺失信息提示卡片 */}
            {message.type === 'missing-info' && (
              <div className="w-full flex justify-start">
                {renderMissingInfoCard(message.content)}
              </div>
            )}
            
            {/* 发票预览卡片 */}
            {message.type === 'invoice-preview' && (
              <div className="w-full flex justify-start">
                {renderInvoicePreviewCard(message.content)}
              </div>
            )}
            
            {/* AI解析结果卡片 */}
            {message.type === 'ai-parse-result' && (
              <div className="w-full flex justify-start">
                {renderAIParseResultCard(message.content)}
              </div>
            )}
            
            {/* 解析完成卡片 */}
            {message.type === 'parse-complete' && (
              <div className="w-full flex justify-start">
                {renderParseCompleteCard(message.content)}
              </div>
            )}
            
            {/* 普通消息 - 专业财务风格 */}
            {!['risk', 'recommendation', 'balance-check', 'invoice-confirm', 'invoice-success', 'seller-info', 'missing-info', 'invoice-preview', 'ai-parse-result', 'parse-complete'].includes(message.type || '') && (
              <div className={`max-w-[80%] ${message.role === 'user' ? '' : 'flex items-end space-x-2'}`}>
                {/* AI头像 - 仅非用户消息显示 */}
                {message.role !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-sm mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-tr-md'
                      : message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-md'
                      : message.type === 'success'
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-emerald-900 rounded-tl-md'
                      : message.type === 'processing'
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 text-amber-900 rounded-tl-md'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-md'
                  }`}
                >
                  {message.type === 'error' && (
                    <div className="flex items-center mb-2 pb-2 border-b border-red-200">
                      <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="font-semibold text-sm">校验失败</span>
                    </div>
                  )}
                  {message.type === 'success' && (
                    <div className="flex items-center mb-2 pb-2 border-b border-emerald-200">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-semibold text-sm text-emerald-700">解析成功</span>
                    </div>
                  )}
                  
                  {message.type === 'processing' ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm">{message.content}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}

                  <div className={`text-xs mt-2 flex items-center ${message.role === 'user' ? 'text-slate-400 justify-end' : 'text-slate-400'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - 简洁输入区域 */}
      <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="告诉我：给谁开、开什么、多少钱"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-300 focus:border-slate-300 resize-none bg-slate-50 text-slate-700 placeholder-slate-400 transition-all text-sm"
              rows={1}
              disabled={isProcessing || isConfirming}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || isConfirming}
            className="px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <div className="mt-2 text-center text-xs text-slate-400">
          <span>示例：给腾讯开软件服务费5万 | 给华为开10台服务器每台2万 | 给阿里开专票技术咨询30万</span>
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
