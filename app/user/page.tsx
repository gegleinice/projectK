'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Building2, 
  MapPin, 
  User, 
  Calendar,
  Briefcase,
  Phone,
  CreditCard,
  Edit3,
  ChevronRight,
  Shield,
  LogOut,
  Settings,
  Bell,
  BarChart3,
  Receipt,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  BadgeCheck
} from 'lucide-react';
import { getCurrentUser, logout, User as UserType } from '@/lib/auth';
import { inferInvoiceLocation, getRecommendedTaxRate } from '@/lib/qixiangyun';

export default function UserCenterPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'company' | 'invoice' | 'settings'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  // 检查登录状态
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // 登出
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // 复制到剪贴板
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!user) return null;

  const company = user.company;
  const invoiceLocation = company ? inferInvoiceLocation(company.registeredAddress, company.province, company.city) : null;
  const taxInfo = company ? getRecommendedTaxRate(company.industryCategory) : null;

  // 快捷功能
  const quickActions = [
    { icon: <Receipt className="w-5 h-5" />, title: '开票记录', desc: '查看历史发票', color: 'blue' },
    { icon: <BarChart3 className="w-5 h-5" />, title: '开票统计', desc: '本月数据分析', color: 'emerald' },
    { icon: <Bell className="w-5 h-5" />, title: '消息通知', desc: '3条未读', color: 'amber', badge: 3 },
    { icon: <Shield className="w-5 h-5" />, title: '安全设置', desc: '账号保护', color: 'violet' },
  ];

  // 侧边栏菜单
  const menuItems = [
    { id: 'overview', icon: <User />, label: '概览' },
    { id: 'company', icon: <Building2 />, label: '企业信息' },
    { id: 'invoice', icon: <FileText />, label: '开票设置' },
    { id: 'settings', icon: <Settings />, label: '账号设置' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.push('/')} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">AI财税助手</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-500">用户中心</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 侧边栏 */}
          <div className="w-64 flex-shrink-0">
            {/* 用户卡片 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {user.name.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.phone}</p>
                </div>
              </div>
              {company && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700 text-sm">
                  <BadgeCheck className="w-4 h-4" />
                  <span>已认证企业</span>
                </div>
              )}
            </div>

            {/* 菜单 */}
            <nav className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center space-x-3 px-5 py-4 text-left transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 企业概览 */}
                {company && (
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <BadgeCheck className="w-5 h-5" />
                          <span className="text-blue-100 text-sm">已认证企业</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{company.name}</h2>
                        <p className="text-blue-100">{company.creditCode}</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('company')}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>查看详情</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-6 mt-8">
                      <div>
                        <p className="text-blue-100 text-sm mb-1">本月开票</p>
                        <p className="text-2xl font-bold">127张</p>
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm mb-1">开票金额</p>
                        <p className="text-2xl font-bold">¥185.6万</p>
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm mb-1">剩余额度</p>
                        <p className="text-2xl font-bold">¥500万</p>
                      </div>
                      <div>
                        <p className="text-blue-100 text-sm mb-1">纳税人类型</p>
                        <p className="text-2xl font-bold">{company.taxType}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 快捷功能 */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">快捷功能</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                      <button 
                        key={i} 
                        className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all text-left group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          action.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                          action.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                          'bg-violet-100 text-violet-600'
                        }`}>
                          {action.icon}
                          {action.badge && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{action.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 最近活动 */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">最近活动</h3>
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {[
                      { time: '今天 14:30', action: '开具发票', target: '腾讯科技 - ¥50,000', status: 'success' },
                      { time: '今天 11:20', action: '开具发票', target: '华为技术 - ¥26,000', status: 'success' },
                      { time: '昨天 16:45', action: '更新企业信息', target: '开票地址变更', status: 'info' },
                      { time: '2天前', action: '开具发票', target: '阿里巴巴 - ¥88,000', status: 'success' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-slate-900 font-medium">{item.action}</p>
                            <p className="text-sm text-slate-500">{item.target}</p>
                          </div>
                        </div>
                        <span className="text-sm text-slate-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && company && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">企业信息</h2>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <Edit3 className="w-4 h-4" />
                    <span>编辑信息</span>
                  </button>
                </div>

                {/* 基础信息 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">工商信息</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <InfoRow label="企业名称" value={company.name} copiable onCopy={handleCopy} copied={copied} />
                    <InfoRow label="统一社会信用代码" value={company.creditCode} copiable onCopy={handleCopy} copied={copied} />
                    <InfoRow label="法定代表人" value={company.legalPerson} />
                    <InfoRow label="注册资本" value={company.registeredCapital} />
                    <InfoRow label="成立日期" value={company.establishDate} />
                    <InfoRow label="经营状态" value={company.businessStatus} highlight />
                    <div className="col-span-2">
                      <InfoRow label="注册地址" value={company.registeredAddress} copiable onCopy={handleCopy} copied={copied} />
                    </div>
                    <div className="col-span-2">
                      <InfoRow label="行业类别" value={company.industryCategory} />
                    </div>
                  </div>
                </div>

                {/* 主营业务 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-slate-900">AI解析 · 主营业务</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {company.mainBusiness.map((business, i) => (
                        <span 
                          key={i} 
                          className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                        >
                          {business}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      <strong>经营范围：</strong>{company.businessScope}
                    </p>
                  </div>
                </div>

                {/* 开票地推荐 */}
                {invoiceLocation && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-semibold text-slate-900">智能推荐 · 开票地</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">所属区域</p>
                          <p className="text-slate-900 font-medium">{invoiceLocation.invoiceProvince} {invoiceLocation.invoiceCity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">主管税务机关</p>
                          <p className="text-slate-900 font-medium">{invoiceLocation.taxAuthority}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <p className="text-sm text-emerald-700">
                          <Sparkles className="w-4 h-4 inline mr-1" />
                          {invoiceLocation.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoice' && company && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">开票设置</h2>

                {/* 开票信息 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">开票资料</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <InfoRow label="企业名称" value={company.name} copiable onCopy={handleCopy} copied={copied} />
                    <InfoRow label="纳税人识别号" value={company.creditCode} copiable onCopy={handleCopy} copied={copied} />
                    <InfoRow label="开票地址" value={company.invoiceAddress || company.registeredAddress} copiable onCopy={handleCopy} copied={copied} />
                    <InfoRow label="开票电话" value={company.invoicePhone || '待设置'} editable />
                    <InfoRow label="开户银行" value={company.bankName || '待设置'} editable />
                    <InfoRow label="银行账号" value={company.bankAccount || '待设置'} editable />
                  </div>
                </div>

                {/* 税率设置 */}
                {taxInfo && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-violet-500" />
                      <h3 className="font-semibold text-slate-900">税率设置</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center">
                          <span className="text-3xl font-bold text-violet-600">{taxInfo.defaultRate}%</span>
                        </div>
                        <div>
                          <p className="text-slate-900 font-semibold">默认开票税率</p>
                          <p className="text-sm text-slate-500">基于行业类别智能推荐</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {taxInfo.rateOptions.map((option, i) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-xl border-2 ${
                              option.rate === taxInfo.defaultRate 
                                ? 'border-violet-500 bg-violet-50' 
                                : 'border-slate-200 hover:border-slate-300'
                            } cursor-pointer transition-colors`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl font-bold text-slate-900">{option.rate}%</span>
                              {option.rate === taxInfo.defaultRate && (
                                <Check className="w-5 h-5 text-violet-600" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{option.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 一键复制开票信息 */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">一键复制开票信息</h3>
                      <p className="text-sm text-slate-500">快速复制完整开票资料，方便填写</p>
                    </div>
                    <button 
                      onClick={() => {
                        const info = `企业名称：${company.name}\n纳税人识别号：${company.creditCode}\n地址：${company.invoiceAddress || company.registeredAddress}\n电话：${company.invoicePhone || ''}\n开户银行：${company.bankName || ''}\n银行账号：${company.bankAccount || ''}`;
                        navigator.clipboard.writeText(info);
                        setCopied('all');
                        setTimeout(() => setCopied(null), 2000);
                      }}
                      className="flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      {copied === 'all' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>复制全部</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">账号设置</h2>

                {/* 账号信息 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">账号信息</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <SettingRow 
                      icon={<Phone className="w-5 h-5" />}
                      title="手机号码"
                      desc={user.phone}
                      action="修改"
                    />
                    <SettingRow 
                      icon={<User className="w-5 h-5" />}
                      title="用户昵称"
                      desc={user.name}
                      action="修改"
                    />
                    <SettingRow 
                      icon={<Calendar className="w-5 h-5" />}
                      title="注册时间"
                      desc={user.createdAt}
                    />
                  </div>
                </div>

                {/* 安全设置 */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">安全设置</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <SettingRow 
                      icon={<Shield className="w-5 h-5" />}
                      title="登录密码"
                      desc="未设置"
                      action="设置"
                    />
                    <SettingRow 
                      icon={<Bell className="w-5 h-5" />}
                      title="消息通知"
                      desc="开启"
                      hasToggle
                    />
                  </div>
                </div>

                {/* 危险操作 */}
                <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                    <h3 className="font-semibold text-red-900">危险操作</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">注销账号</p>
                        <p className="text-sm text-slate-500 mt-1">注销后所有数据将被删除且无法恢复</p>
                      </div>
                      <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                        注销账号
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 信息行组件
function InfoRow({ 
  label, 
  value, 
  highlight = false, 
  copiable = false, 
  editable = false,
  onCopy,
  copied
}: { 
  label: string; 
  value: string;
  highlight?: boolean;
  copiable?: boolean;
  editable?: boolean;
  onCopy?: (text: string, field: string) => void;
  copied?: string | null;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <div className="flex items-center space-x-2">
        <p className={`font-medium ${highlight ? 'text-emerald-600' : value === '待设置' ? 'text-slate-400' : 'text-slate-900'}`}>
          {value}
        </p>
        {copiable && value !== '待设置' && onCopy && (
          <button 
            onClick={() => onCopy(value, label)}
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
          >
            {copied === label ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
        {editable && (
          <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// 设置行组件
function SettingRow({ 
  icon, 
  title, 
  desc, 
  action,
  hasToggle = false
}: { 
  icon: React.ReactNode;
  title: string; 
  desc: string;
  action?: string;
  hasToggle?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          {icon}
        </div>
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      {action && (
        <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
          {action}
        </button>
      )}
      {hasToggle && (
        <div className="w-12 h-7 bg-blue-600 rounded-full relative cursor-pointer">
          <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
        </div>
      )}
    </div>
  );
}



