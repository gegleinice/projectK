'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Building2, 
  MapPin, 
  User, 
  Calendar,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  FileText,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getCurrentUser, updateUser, User as UserType, CompanyInfo } from '@/lib/auth';
import { searchCompany, bindCompany, inferInvoiceLocation, getRecommendedTaxRate } from '@/lib/qixiangyun';

export default function BindCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [step, setStep] = useState<'search' | 'preview' | 'complete'>('search');
  
  // 搜索相关
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // 企业信息
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceLocation, setInvoiceLocation] = useState<ReturnType<typeof inferInvoiceLocation> | null>(null);
  const [taxInfo, setTaxInfo] = useState<ReturnType<typeof getRecommendedTaxRate> | null>(null);

  // 检查登录状态
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.companyBound) {
      router.push('/user');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // 搜索企业
  const handleSearch = async (value: string) => {
    setKeyword(value);
    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setSearching(true);
    try {
      const result = await searchCompany(value);
      setSearchResults(result.results);
      setShowResults(result.results.length > 0);
    } catch {
      console.error('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  // 选择企业并获取详情
  const handleSelectCompany = async (companyName: string) => {
    setSelectedCompany(companyName);
    setShowResults(false);
    setLoading(true);
    
    try {
      const result = await bindCompany(companyName);
      
      if (result.success && result.companyInfo) {
        setCompanyInfo(result.companyInfo);
        
        // 获取开票地推测
        const location = inferInvoiceLocation(
          result.companyInfo.registeredAddress,
          result.companyInfo.province,
          result.companyInfo.city
        );
        setInvoiceLocation(location);
        
        // 获取税率建议
        const tax = getRecommendedTaxRate(result.companyInfo.industryCategory);
        setTaxInfo(tax);
        
        setStep('preview');
      }
    } catch {
      console.error('获取企业信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 确认绑定
  const handleConfirmBind = () => {
    if (!user || !companyInfo) return;
    
    const updatedUser: UserType = {
      ...user,
      companyBound: true,
      company: companyInfo
    };
    
    updateUser(updatedUser);
    setUser(updatedUser);
    setStep('complete');
    
    // 延迟跳转
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  // 快速选择示例企业
  const sampleCompanies = [
    '深圳市智慧科技有限公司',
    '杭州云端网络科技有限公司',
    '上海智联贸易有限公司',
    '北京创新医疗科技有限公司',
    '广州美食餐饮管理有限公司'
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">AI财税助手</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">1</span>
            <span>登录</span>
            <ChevronRight className="w-4 h-4" />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step !== 'search' ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white'}`}>2</span>
            <span className={step !== 'search' ? 'text-slate-500' : 'text-blue-600 font-medium'}>绑定企业</span>
            <ChevronRight className="w-4 h-4" />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>3</span>
            <span className={step === 'complete' ? 'text-emerald-600 font-medium' : 'text-slate-400'}>完成</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {step === 'search' && (
          <div className="space-y-8">
            {/* 标题区域 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">绑定您的企业</h1>
              <p className="text-slate-500 max-w-md mx-auto">
                通过企享云自动获取工商信息，智能推荐开票方案，让开票更高效
              </p>
            </div>

            {/* 搜索框 */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="搜索企业名称或统一社会信用代码"
                  className="w-full pl-14 pr-14 py-5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg shadow-sm"
                />
                {searching && (
                  <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
                )}
              </div>

              {/* 搜索结果 */}
              {showResults && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-w-xl mx-auto">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">企享云智能匹配</span>
                  </div>
                  {searchResults.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleSelectCompany(name)}
                      className="w-full px-5 py-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-900 font-medium">{name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 快速选择 */}
            <div className="max-w-xl mx-auto">
              <p className="text-sm text-slate-500 mb-4 text-center">💡 演示企业（点击快速体验）</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sampleCompanies.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSelectCompany(name)}
                    disabled={loading}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm text-slate-700 hover:text-blue-700 disabled:opacity-50"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 功能说明 */}
            <div className="max-w-xl mx-auto grid grid-cols-3 gap-4 mt-12">
              {[
                { icon: <Building2 className="w-5 h-5" />, title: '工商信息', desc: '自动获取' },
                { icon: <MapPin className="w-5 h-5" />, title: '开票地址', desc: '智能推荐' },
                { icon: <Shield className="w-5 h-5" />, title: '税率方案', desc: '行业匹配' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 bg-white rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600">
                    {item.icon}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'preview' && companyInfo && (
          <div className="space-y-6">
            {/* 企业信息卡片 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* 头部 */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold">
                    {companyInfo.name.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{companyInfo.name}</h2>
                    <p className="text-blue-100 mt-1">{companyInfo.creditCode}</p>
                  </div>
                </div>
              </div>

              {/* 基础信息 - 新布局 */}
              <div className="p-8 space-y-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">工商信息</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  <InfoItem icon={<Briefcase />} label="企业行业" value={companyInfo.industry || companyInfo.industryCategory} />
                  <InfoItem icon={<CheckCircle2 />} label="经营状态" value={companyInfo.businessStatus} highlight />
                  <InfoItem 
                    icon={<Shield />} 
                    label="信用等级" 
                    value={`${companyInfo.creditLevel || 'B'}级`} 
                    badge={companyInfo.creditLevel === 'A' ? 'success' : companyInfo.creditLevel === 'B' ? 'warning' : 'default'}
                  />
                  <InfoItem icon={<Building2 />} label="注册资本" value={companyInfo.registeredCapital} />
                  <InfoItem icon={<FileText />} label="企业类型" value={companyInfo.companyType || '有限责任公司'} />
                  <InfoItem icon={<Calendar />} label="成立时间" value={companyInfo.establishDate} />
                  <InfoItem icon={<User />} label="法定代表人" value={companyInfo.legalPerson} />
                </div>

                {/* 地址信息 */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">注册地址</h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-slate-900 font-medium">{companyInfo.registeredAddress}</p>
                        <p className="text-slate-500 text-sm mt-1">
                          {companyInfo.province} · {companyInfo.city} · {companyInfo.district}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 所属税务机关 */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">所属税务机关</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold">{companyInfo.taxAuthority || `${companyInfo.province}${companyInfo.city}税务局`}</p>
                        <p className="text-slate-500 text-xs mt-0.5">主管税务机关</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 主营业务 */}
              <div className="px-8 pb-8">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  <Sparkles className="w-4 h-4 inline mr-1 text-amber-500" />
                  AI解析 · 主营业务
                </h3>
                <div className="flex flex-wrap gap-2">
                  {companyInfo.mainBusiness.map((business, i) => (
                    <span 
                      key={i} 
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
                    >
                      {business}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  基于经营范围智能提取，用于发票商品自动匹配
                </p>
              </div>
            </div>

            {/* 智能推荐 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 开票地推荐 */}
              {invoiceLocation && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-slate-900">开票地推荐</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">所属区域</span>
                      <span className="text-slate-900 font-medium">{invoiceLocation.invoiceProvince} {invoiceLocation.invoiceCity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-sm">主管税务</span>
                      <span className="text-slate-900 font-medium">{invoiceLocation.taxAuthority}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
                    <p className="text-xs text-emerald-700">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {invoiceLocation.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* 税率推荐 */}
              {taxInfo && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-slate-900">税率推荐</h3>
                  </div>
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-violet-600">{taxInfo.defaultRate}%</div>
                    <div className="text-sm text-slate-500 mt-1">行业默认税率</div>
                  </div>
                  <div className="space-y-2">
                    {taxInfo.rateOptions.map((option, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{option.description}</span>
                        <span className="font-medium text-slate-700">{option.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep('search')}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                ← 重新选择
              </button>
              <button
                onClick={handleConfirmBind}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/30"
              >
                <span>确认绑定</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">绑定成功！</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              您的企业信息已成功绑定，现在可以开始使用智能开票功能了
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-100 rounded-xl text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>正在跳转到首页...</span>
            </div>
          </div>
        )}
      </main>

      {/* Loading 遮罩 */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">正在获取企业信息...</p>
            <p className="text-slate-400 text-sm mt-1">通过企享云查询工商数据</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 信息项组件
function InfoItem({ icon, label, value, highlight = false, badge }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  highlight?: boolean;
  badge?: 'success' | 'warning' | 'default';
}) {
  const getBadgeStyle = () => {
    switch (badge) {
      case 'success': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return '';
    }
  };
  
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        {badge ? (
          <span className={`inline-block px-2 py-0.5 text-sm font-semibold rounded-md border ${getBadgeStyle()}`}>
            {value}
          </span>
        ) : (
          <p className={`font-medium text-sm ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
        )}
      </div>
    </div>
  );
}



