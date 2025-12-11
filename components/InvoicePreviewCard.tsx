'use client';

import { ParsedInvoice } from '@/lib/invoiceParser';
import { CompanyInfo } from '@/lib/auth';

interface InvoicePreviewCardProps {
  invoice: ParsedInvoice;
  companyInfo?: CompanyInfo | null;
}

// 数字转中文大写金额
const numberToChinese = (num: number): string => {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];
  
  if (num === 0) return '零圆整';
  
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  
  let result = '';
  let numStr = intPart.toString();
  let len = numStr.length;
  
  for (let i = 0; i < len; i++) {
    let digit = parseInt(numStr[i]);
    let pos = len - i - 1;
    let bigUnit = Math.floor(pos / 4);
    let unit = pos % 4;
    
    if (digit !== 0) {
      result += digits[digit] + units[unit];
    } else {
      if (result && !result.endsWith('零')) {
        result += '零';
      }
    }
    
    if (unit === 0 && bigUnit > 0) {
      result = result.replace(/零+$/, '');
      result += bigUnits[bigUnit];
    }
  }
  
  result = result.replace(/零+$/, '') + '圆';
  
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao > 0) result += digits[jiao] + '角';
    if (fen > 0) result += digits[fen] + '分';
  } else {
    result += '整';
  }
  
  return result;
};

// 生成发票号码
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `${year}${month}${random}`;
};

export default function InvoicePreviewCard({ invoice, companyInfo }: InvoicePreviewCardProps) {
  const invoiceNumber = invoice.invoiceNumber || generateInvoiceNumber();
  const totalAmount = invoice.totalAmount || invoice.amount || 0;
  const taxAmount = invoice.taxAmount || 0;
  const amountWithoutTax = totalAmount - taxAmount;
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
  
  return (
    <div className="w-full max-w-2xl animate-slideUp">
      {/* 发票外框 - 仿真票据样式 */}
      <div 
        className="bg-white border-2 border-red-400 shadow-lg relative overflow-hidden"
        style={{ fontFamily: 'SimSun, "Songti SC", serif' }}
      >
        
        {/* 发票头部 */}
        <div className="text-center py-4 border-b border-red-200 relative bg-gradient-to-b from-red-50 to-white">
          {/* 发票号码 - 右上角 */}
          <div className="absolute top-3 right-4 text-right">
            <div className="text-xs text-slate-500">
              发票号码：<span className="text-red-600 font-mono font-bold">{invoiceNumber}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              开票日期：<span className="text-slate-700">{dateStr}</span>
            </div>
          </div>
          
          {/* 发票标题 */}
          <h1 className="text-xl font-bold text-red-600 tracking-widest pt-1">
            {invoice.invoiceType === '专票' ? '增值税专用发票' : '电子发票（普通发票）'}
          </h1>
          <div className="text-xs text-red-400 mt-1 tracking-wider">( 预 览 )</div>
        </div>
        
        {/* 购销方信息 */}
        <div className="grid grid-cols-2 border-b border-red-200">
          {/* 购买方 */}
          <div className="p-3 border-r border-red-200 bg-red-50/30">
            <div className="text-xs text-red-600 mb-2 font-bold border-b border-red-100 pb-1">购买方信息</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">名　　称：</span>
                <span className="text-slate-800 font-medium">{invoice.customerInfo?.name || invoice.customerName}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">识 别 号：</span>
                <span className="text-slate-700 font-mono" style={{ fontSize: '10px' }}>{invoice.customerInfo?.taxNumber || '-'}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">地址电话：</span>
                <span className="text-slate-600" style={{ fontSize: '10px' }}>{invoice.customerInfo?.address || '-'}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">开户银行：</span>
                <span className="text-slate-600" style={{ fontSize: '10px' }}>{invoice.customerInfo?.bank ? `${invoice.customerInfo.bank} ${invoice.customerInfo.accountNumber || ''}` : '-'}</span>
              </div>
            </div>
          </div>
          
          {/* 销售方 */}
          <div className="p-3 bg-red-50/30">
            <div className="text-xs text-red-600 mb-2 font-bold border-b border-red-100 pb-1">销售方信息</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">名　　称：</span>
                <span className="text-slate-800 font-medium">{companyInfo?.name || '销售方'}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">识 别 号：</span>
                <span className="text-slate-700 font-mono" style={{ fontSize: '10px' }}>{companyInfo?.creditCode || '-'}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">地址电话：</span>
                <span className="text-slate-600" style={{ fontSize: '10px' }}>{companyInfo?.invoiceAddress || companyInfo?.registeredAddress || '-'}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-20 flex-shrink-0">开户银行：</span>
                <span className="text-slate-600" style={{ fontSize: '10px' }}>{companyInfo?.bankName ? `${companyInfo.bankName}` : '-'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 商品明细表格 */}
        <div className="border-b border-red-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-red-50 border-b border-red-200">
                <th className="py-2 px-2 text-left text-slate-700 font-bold border-r border-red-200" style={{ width: '28%' }}>项目名称</th>
                <th className="py-2 px-2 text-center text-slate-700 font-bold border-r border-red-200" style={{ width: '10%' }}>规格型号</th>
                <th className="py-2 px-2 text-center text-slate-700 font-bold border-r border-red-200" style={{ width: '7%' }}>单位</th>
                <th className="py-2 px-2 text-right text-slate-700 font-bold border-r border-red-200" style={{ width: '9%' }}>数量</th>
                <th className="py-2 px-2 text-right text-slate-700 font-bold border-r border-red-200" style={{ width: '12%' }}>单价</th>
                <th className="py-2 px-2 text-right text-slate-700 font-bold border-r border-red-200" style={{ width: '12%' }}>金额</th>
                <th className="py-2 px-2 text-center text-slate-700 font-bold border-r border-red-200" style={{ width: '10%' }}>税率</th>
                <th className="py-2 px-2 text-right text-slate-700 font-bold" style={{ width: '12%' }}>税额</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-red-100 hover:bg-red-50/30">
                <td className="py-2.5 px-2 text-slate-800 border-r border-red-100">
                  <span className="text-red-400">*服务*</span>{invoice.productName || invoice.productType}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-400 border-r border-red-100">-</td>
                <td className="py-2.5 px-2 text-center text-slate-600 border-r border-red-100">{invoice.unit || '项'}</td>
                <td className="py-2.5 px-2 text-right text-slate-700 border-r border-red-100">{invoice.quantity || 1}</td>
                <td className="py-2.5 px-2 text-right text-slate-700 border-r border-red-100">
                  {invoice.unitPrice ? invoice.unitPrice.toFixed(2) : amountWithoutTax.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right text-slate-800 font-medium border-r border-red-100">
                  {amountWithoutTax.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-600 border-r border-red-100">
                  {invoice.taxRate ? `${invoice.taxRate}%` : '0%'}
                </td>
                <td className="py-2.5 px-2 text-right text-slate-700">
                  {taxAmount.toFixed(2)}
                </td>
              </tr>
              {/* 空行占位 */}
              <tr className="border-b border-red-100 h-6">
                <td colSpan={8}></td>
              </tr>
            </tbody>
            <tfoot>
              {/* 合计行 */}
              <tr className="border-b border-red-200 bg-red-50/50">
                <td className="py-2 px-2 text-slate-700 font-bold border-r border-red-200">合　　计</td>
                <td className="border-r border-red-200"></td>
                <td className="border-r border-red-200"></td>
                <td className="border-r border-red-200"></td>
                <td className="border-r border-red-200"></td>
                <td className="py-2 px-2 text-right text-slate-800 font-bold border-r border-red-200">
                  ¥{amountWithoutTax.toFixed(2)}
                </td>
                <td className="border-r border-red-200"></td>
                <td className="py-2 px-2 text-right text-slate-800 font-bold">
                  ¥{taxAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* 价税合计 */}
        <div className="px-3 py-3 border-b border-red-200 bg-amber-50/50">
          <div className="flex items-center">
            <span className="text-xs text-slate-600 font-medium">价税合计（大写）</span>
            <span className="text-sm text-slate-800 font-bold flex-1 mx-3 px-2 border-b border-dashed border-slate-300 text-center tracking-wider">
              {numberToChinese(totalAmount)}
            </span>
            <span className="text-xs text-slate-600">（小写）</span>
            <span className="text-red-600 font-bold text-lg ml-2 font-mono">¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        {/* 备注 */}
        <div className="px-3 py-2 border-b border-red-200">
          <div className="flex items-start">
            <span className="text-xs text-slate-500 font-medium mr-2 flex-shrink-0">备　　注：</span>
            <span className="text-xs text-slate-600 flex-1">{invoice.remark || dateStr}</span>
          </div>
        </div>
        
        {/* 底部 - 开票人 & 电子发票章 */}
        <div className="px-3 py-3 flex items-center justify-between relative bg-gradient-to-t from-red-50/50 to-white">
          <div className="text-xs text-slate-500">
            开票人：<span className="text-slate-700 font-medium">系统自动</span>
          </div>
          <div className="text-xs text-slate-500">
            复核：<span className="text-slate-400">-</span>
          </div>
          <div className="text-xs text-slate-500">
            收款：<span className="text-slate-400">-</span>
          </div>
          
          {/* 电子发票专用章 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-70">
            <div className="relative w-full h-full">
              {/* 外圈 */}
              <div className="absolute inset-0 border-2 border-red-500 rounded-full"></div>
              {/* 内圈 */}
              <div className="absolute inset-1 border border-red-400 rounded-full"></div>
              {/* 五角星 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              {/* 文字 - 发票专用章 */}
              <div className="absolute top-0.5 left-0 right-0 text-center">
                <span className="text-red-500 font-bold" style={{ fontSize: '5px', letterSpacing: '0.5px' }}>发票专用章</span>
              </div>
              {/* 底部公司名 */}
              <div className="absolute bottom-1.5 left-0 right-0 text-center">
                <span className="text-red-500" style={{ fontSize: '4px' }}>AI开票</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

