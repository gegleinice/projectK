'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import InvoicePreview from '@/components/InvoicePreview';
import { ParsedInvoice } from '@/lib/invoiceParser';
import { ArrowLeft, FileText, Sparkles, Building2, BadgeCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User, CompanyInfo } from '@/lib/auth';

function InvoiceContent() {
  const [invoiceData, setInvoiceData] = useState<ParsedInvoice | null>(null);
  const [initialData, setInitialData] = useState<{
    customer?: string;
    product?: string;
    amount?: string;
    quantity?: string;
    unitPrice?: string;
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
    const customer = searchParams.get('customer');
    const product = searchParams.get('product');
    const amount = searchParams.get('amount');
    const quantity = searchParams.get('quantity');
    const unitPrice = searchParams.get('unitPrice');
    
    if (customer || product || amount) {
      setInitialData({
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center">
                  AI智能开票
                  <Sparkles className="w-4 h-4 ml-2 text-amber-500" />
                </h1>
                <p className="text-xs text-slate-500">智能识别 · 风险预警 · 活动推送</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 销售方企业信息 */}
              {company && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{company.name}</span>
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                </div>
              )}
              <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                ✨ 在线演示
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {isReady ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：对话界面 */}
            <div className="lg:col-span-1">
              <ChatInterface 
                onInvoiceUpdate={setInvoiceData} 
                initialData={initialData}
                companyInfo={company}
                key={JSON.stringify(initialData)}
              />
            </div>

            {/* 右侧：发票预览 */}
            <div className="lg:col-span-1">
              <InvoicePreview invoiceData={invoiceData} sellerInfo={company} />
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">加载中...</p>
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

