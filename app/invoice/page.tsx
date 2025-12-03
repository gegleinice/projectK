'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import InvoicePreview from '@/components/InvoicePreview';
import { ParsedInvoice } from '@/lib/invoiceParser';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

function InvoiceContent() {
  const [invoiceData, setInvoiceData] = useState<ParsedInvoice | null>(null);
  const [initialInput, setInitialInput] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const inputParam = searchParams.get('input');
    const autoSubmit = searchParams.get('autoSubmit');
    
    console.log('URL params:', { inputParam, autoSubmit });
    
    if (inputParam) {
      try {
        const decodedInput = decodeURIComponent(inputParam);
        console.log('Decoded input:', decodedInput);
        
        if (autoSubmit === 'true') {
          setInitialInput(decodedInput + '|autosubmit');
        } else {
          setInitialInput(decodedInput);
        }
      } catch (e) {
        console.error('Failed to decode input:', e);
      }
    }
    
    setIsReady(true);
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">AI智能开票</h1>
                <p className="text-xs text-slate-500">自然语言 · 智能处理</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                在线演示
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
              <ChatInterface onInvoiceUpdate={setInvoiceData} initialInput={initialInput} key={initialInput} />
            </div>

            {/* 右侧：发票预览 */}
            <div className="lg:col-span-1">
              <InvoicePreview invoiceData={invoiceData} />
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
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
