'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { ParsedInvoice } from '@/lib/invoiceParser';
import { ArrowLeft, FileText, Sparkles, Building2, BadgeCheck, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User, CompanyInfo } from '@/lib/auth';

function InvoiceContent() {
  const [invoiceData, setInvoiceData] = useState<ParsedInvoice | null>(null);
  const [initialData, setInitialData] = useState<{
    invoiceType?: string;
    customer?: string;
    product?: string;
    amount?: string;
    quantity?: string;
    unitPrice?: string;
    mode?: 'template' | 'freeform';
  } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查用户登录和企业绑定
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!currentUser.companyBound || !currentUser.company) {
      router.push('/user/bindcompany');
      return;
    }
    
    setUser(currentUser);
    setCompany(currentUser.company);
    
    // 解析URL参数
    const mode = searchParams.get('mode') as 'template' | 'freeform' | null;
    const invoiceType = searchParams.get('invoiceType');
    const customer = searchParams.get('customer');
    const product = searchParams.get('product');
    const amount = searchParams.get('amount');
    const quantity = searchParams.get('quantity');
    const unitPrice = searchParams.get('unitPrice');
    
    if (mode === 'freeform') {
      // 自由输入模式：不设置初始数据，让用户自己输入
      setInitialData({
        mode: 'freeform'
      });
    } else if (invoiceType || customer || product || amount) {
      setInitialData({
        mode: 'template',
        invoiceType: invoiceType || '普票',
        customer: customer || undefined,
        product: product || undefined,
        amount: amount || undefined,
        quantity: quantity || undefined,
        unitPrice: unitPrice || undefined
      });
    }
    
    setIsReady(true);
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white">
      {/* 简洁的顶部导航 */}
      <header className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* 左侧：返回和标题 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-800" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white flex items-center">
                    智能开票
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-400/20 text-amber-400 text-xs rounded font-medium">AI</span>
                  </h1>
                </div>
              </div>
            </div>
            
            {/* 右侧：企业信息 */}
            <div className="flex items-center space-x-3">
              {company && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300 max-w-[150px] truncate">{company.name}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 单栏居中布局 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {isReady ? (
          <ChatInterface 
            onInvoiceUpdate={setInvoiceData} 
            initialData={initialData}
            companyInfo={company}
            key={JSON.stringify(initialData)}
          />
        ) : (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-500 text-sm">加载中...</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}

