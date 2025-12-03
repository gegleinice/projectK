'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, Search, Receipt, Sparkles, Send, ArrowRight, CheckCircle, BarChart3, Clock, DollarSign } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showInvoiceInput, setShowInvoiceInput] = useState(false);
  const [inputValue, setInputValue] = useState('请帮我开票：给 [客户名称] 开 [商品类型]，金额 [数值] 元，数量 [数值] 个，单价 [数值] 元/个');

  // Mock 数据：统计信息
  const stats = {
    monthlyCount: 127,
    monthlyAmount: 1856320,
    remainingQuota: 5000000
  };

  // Mock 数据：最近开票记录
  const recentInvoices = [
    {
      id: 1,
      customer: '腾讯',
      product: '软件服务',
      amount: 50000,
      quantity: 5,
      unitPrice: 10000,
      date: '2025-11-27',
      fullText: '请帮我开票：给腾讯开软件服务，金额50000元，数量5个，单价10000元/个'
    },
    {
      id: 2,
      customer: '华为',
      product: '硬件设备',
      amount: 26000,
      quantity: 2,
      unitPrice: 13000,
      date: '2025-11-26',
      fullText: '请帮我开票：给华为开硬件设备，金额26000元，数量2台，单价13000元/台'
    },
    {
      id: 3,
      customer: '阿里巴巴',
      product: '云服务',
      amount: 88000,
      quantity: 12,
      unitPrice: 7333.33,
      date: '2025-11-25',
      fullText: '请帮我开票：给阿里巴巴开云服务，金额88000元，数量12个月，单价7333.33元/月'
    }
  ];

  const features = [
    {
      id: 'invoice',
      title: '一键开票',
      description: '智能识别开票信息，自动补全客户资料，快速生成电子发票',
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-blue-600 to-cyan-500',
      available: true,
      action: () => {
        setShowInvoiceInput(true);
        setTimeout(() => {
          document.getElementById('invoice-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    },
    {
      id: 'tax',
      title: 'AI办税',
      description: '智能税务筹划，自动申报纳税，实时税务风险预警',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-emerald-600 to-teal-500',
      available: false
    },
    {
      id: 'audit',
      title: '智能审计',
      description: '自动审计账目，发现异常数据，生成审计报告',
      icon: <Search className="w-6 h-6" />,
      gradient: 'from-violet-600 to-purple-500',
      available: false
    },
    {
      id: 'reimbursement',
      title: '智能报销',
      description: 'OCR识别发票，自动填写报销单，快速审批流程',
      icon: <Receipt className="w-6 h-6" />,
      gradient: 'from-orange-600 to-amber-500',
      available: false
    }
  ];

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.available && feature.action) {
      feature.action();
    }
  };

  const handleStartInvoice = () => {
    const encodedInput = encodeURIComponent(inputValue);
    router.push(`/invoice?input=${encodedInput}&autoSubmit=true`);
  };

  const handleHistoryClick = (invoice: typeof recentInvoices[0]) => {
    setInputValue(invoice.fullText);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN').format(amount);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">AI财税助手</h1>
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

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-semibold text-slate-900 mb-5 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            你好，我是你的
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {' '}AI会计
            </span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
            智能开票 · 自动办税 · 快速审计
          </p>
        </div>

        {/* 输入框区域 */}
        {showInvoiceInput && (
          <div id="invoice-input" className="mb-12 animate-slideDown">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="p-8">
                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">本月已开票</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.monthlyCount}</div>
                    <div className="text-xs text-slate-500 mt-1">张发票</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">已开票金额</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">¥{formatAmount(stats.monthlyAmount)}</div>
                    <div className="text-xs text-slate-500 mt-1">本月累计</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-medium text-violet-600">剩余额度</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">¥{formatAmount(stats.remainingQuota)}</div>
                    <div className="text-xs text-slate-500 mt-1">本月可用</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">智能开票</h3>
                    <p className="text-sm text-slate-500">描述您的开票需求，AI将自动识别并生成</p>
                  </div>
                </div>

                {/* 输入框 */}
                <div className="mb-6">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-6 py-4 text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-slate-400"
                    rows={3}
                    placeholder="例如：请帮我开票：给腾讯开软件服务，金额50000元..."
                  />
                </div>

                {/* 快速示例 */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-700 mb-3">💡 快速示例</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setInputValue('请帮我开票：给腾讯开软件服务，金额50000元，数量5个，单价10000元/个')}
                      className="text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 hover:border-blue-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-900">服务类发票</div>
                        <ArrowRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate-600">腾讯 · 软件服务 · ¥50,000</div>
                    </button>
                    <button
                      onClick={() => setInputValue('请帮我开票：给华为开硬件设备，金额26000元，数量2台，单价13000元/台')}
                      className="text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-100 hover:border-purple-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-900">货物类发票</div>
                        <ArrowRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate-600">华为 · 硬件设备 · ¥26,000</div>
                    </button>
                  </div>
                </div>

                {/* 最近开票记录 */}
                <div className="mb-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <div className="text-sm font-medium text-slate-700">最近开票记录</div>
                  </div>
                  <div className="space-y-2">
                    {recentInvoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        onClick={() => handleHistoryClick(invoice)}
                        className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 hover:border-slate-300 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {invoice.customer.substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{invoice.customer}</div>
                              <div className="text-xs text-slate-500">{invoice.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">¥{formatAmount(invoice.amount)}</div>
                            <div className="text-xs text-slate-500">{invoice.product}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">数量: {invoice.quantity} · 单价: ¥{formatAmount(invoice.unitPrice)}</div>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowInvoiceInput(false)}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    收起
                  </button>
                  <button
                    onClick={handleStartInvoice}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold flex items-center space-x-2 group"
                  >
                    <span>开始开票</span>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mb-16">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-2xl font-bold text-slate-900">核心功能</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
                className={`group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 ${
                  feature.available ? 'cursor-pointer hover:border-slate-300' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {!feature.available && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                    即将上线
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white shadow-lg ${
                      feature.available ? 'group-hover:scale-110' : ''
                    } transition-transform`}
                  >
                    {feature.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {feature.available && (
                    <ArrowRight className="flex-shrink-0 w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">© 2025 AI财税助手 · 技术演示版本</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
