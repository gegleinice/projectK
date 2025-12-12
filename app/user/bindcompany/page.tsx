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
  AlertCircle,
  Phone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { getCurrentUser, updateUser, User as UserType, CompanyInfo } from '@/lib/auth';
import { bindCompany, inferInvoiceLocation, getRecommendedTaxRate } from '@/lib/qixiangyun';
import { queryNaturalPersonCompanies } from '@/lib/qixiangyun/natural-person';
import { validatePhoneNumber, validatePassword } from '@/lib/qixiangyun/rsa-utils';
import type { NaturalPersonCompany } from '@/lib/qixiangyun/types';

export default function BindCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [step, setStep] = useState<'auth' | 'selectCompany' | 'preview' | 'complete'>('auth');
  
  // 办税人认证相关
  const [taxPayerName, setTaxPayerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // 企业列表
  const [companies, setCompanies] = useState<NaturalPersonCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  
  // 企业详情
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

  // 办税人认证并获取企业列表
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // 表单验证
    if (!taxPayerName.trim()) {
      setAuthError('请输入办税人姓名');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setAuthError('请输入正确的手机号');
      return;
    }
    if (!validatePassword(password)) {
      setAuthError('密码至少6位');
      return;
    }
    
    setAuthenticating(true);
    
    try {
      const companyList = await queryNaturalPersonCompanies(phoneNumber, password);
      
      if (companyList.length === 0) {
        setAuthError('该办税人名下暂无可用企业');
        return;
      }
      
      setCompanies(companyList);
      setStep('selectCompany');
    } catch (error: any) {
      setAuthError(error.message || '认证失败，请检查手机号和密码');
    } finally {
      setAuthenticating(false);
    }
  };

  // 选择企业并获取详情
  const handleSelectCompany = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setLoading(true);
    
    try {
      const selected = companies.find(c => c.nsrsbh === companyId);
      if (!selected) return;
      
      const result = await bindCompany(selected.nsrmc);
      
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
    } catch (error) {
      console.error('获取企业信息失败:', error);
      alert('获取企业信息失败，请重试');
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
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'auth' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
            }`}>2</span>
            <span className={step === 'auth' ? 'text-blue-600 font-medium' : 'text-slate-500'}>办税人认证</span>
            <ChevronRight className="w-4 h-4" />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>3</span>
            <span className={step === 'complete' ? 'text-emerald-600 font-medium' : 'text-slate-400'}>完成</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {step === 'auth' && (
          <div className="space-y-8">
            {/* 标题区域 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">自然人认证</h1>
              <p className="text-slate-500 max-w-md mx-auto">
                完成实名认证后自动带出您名下的企业
              </p>
            </div>

            {/* 认证表单 */}
            <form onSubmit={handleAuth} className="max-w-md mx-auto space-y-6">
              {/* 办税人 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  办税人<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={taxPayerName}
                    onChange={(e) => setTaxPayerName(e.target.value)}
                    placeholder="请输入真实姓名"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 办税人手机号 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  办税人手机号<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 办税人密码(税务APP) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  办税人密码（税务APP）<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {authError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={authenticating}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {authenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>认证中...</span>
                  </>
                ) : (
                  <>
                    <span>认证并查询名下企业</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* 安全说明 */}
            <div className="max-w-md mx-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">🔒 您的信息将通过税务系统安全认证</p>
                  <p className="text-blue-600">仅用于查询关联企业，不会泄露或存储</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'selectCompany' && companies.length > 0 && (
          <div className="space-y-8">
            {/* 标题区域 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">选择企业</h1>
              <p className="text-slate-500 max-w-md mx-auto">
                找到 {companies.length} 家企业，请选择要绑定的企业
              </p>
            </div>

            {/* 企业列表 */}
            <div className="max-w-2xl mx-auto space-y-3">
              {companies.map((company) => (
                <button
                  key={company.nsrsbh}
                  onClick={() => handleSelectCompany(company.nsrsbh)}
                  disabled={loading}
                  className="w-full p-6 bg-white border-2 border-slate-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg">
                          {company.nsrmc.substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {company.nsrmc}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {company.nsrsbh}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                          {company.sflx === 'BSY' ? '办税员' : company.sflx}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {company.glzt === '00' ? '已启用' : '未启用'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            {/* 返回按钮 */}
            <div className="flex justify-center">
              <button
                onClick={() => setStep('auth')}
                disabled={loading}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-50"
              >
                ← 重新认证
              </button>
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
                onClick={() => setStep('selectCompany')}
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



