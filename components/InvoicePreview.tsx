'use client';

import { ParsedInvoice } from '@/lib/invoiceParser';
import { FileText } from 'lucide-react';
import { CompanyInfo } from '@/lib/auth';

interface InvoicePreviewProps {
  invoiceData: ParsedInvoice | null;
  sellerInfo?: CompanyInfo | null;
}

export default function InvoicePreview({ invoiceData, sellerInfo }: InvoicePreviewProps) {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '年').replace(/年(\d{2})年/, '年$1月') + '日';

  const invoiceNumber = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(4, '0')}${String(Math.floor(Math.random() * 10000)).padStart(8, '0')}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 h-[calc(100vh-240px)] min-h-[600px] overflow-y-auto">
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">发票预览</h2>
        </div>
        <div className="text-sm text-gray-500">
          实时预览
        </div>
      </div>

      {!invoiceData ? (
        // Empty State
        <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-gray-400">
          <div className="w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
          <p className="text-lg font-medium mb-2">暂无发票信息</p>
          <p className="text-sm text-center">
            请在左侧输入开票需求<br />
            系统将自动生成发票预览
          </p>
        </div>
      ) : (
        // Invoice Display - 复刻真实发票样式
        <div className={`border-4 bg-white p-6 ${invoiceData.invoiceType === '专票' ? 'border-red-700' : 'border-red-600'}`}>
          {/* 发票标题和印章 */}
          <div className="relative mb-6">
            <div className="text-center">
              <h1 className={`text-3xl font-bold mb-1 ${invoiceData.invoiceType === '专票' ? 'text-red-700' : 'text-gray-800'}`}>
                {invoiceData.invoiceType === '专票' ? '增值税专用发票' : '电子发票（普通发票）'}
              </h1>
              <div className={`h-0.5 mx-auto ${invoiceData.invoiceType === '专票' ? 'bg-red-700' : 'bg-red-600'}`} style={{ width: '500px' }}></div>
            </div>
            {/* 模拟红色印章 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="relative w-32 h-32 border-4 border-red-600 rounded-full flex items-center justify-center bg-white bg-opacity-80">
                <div className="text-center">
                  <div className="text-red-600 text-xs font-bold">电子发票专用章</div>
                  <div className="text-red-600 text-[10px] mt-1">AI智能开票</div>
                </div>
              </div>
            </div>
            {/* 右上角发票信息 */}
            <div className="absolute top-0 right-0 text-right text-sm">
              <div className="text-gray-700">发票号码：<span className="font-mono">{invoiceNumber}</span></div>
              <div className="text-gray-700 mt-1">开票日期：{today}</div>
            </div>
          </div>

          {/* 购买方和销售方信息 - 左右分栏 */}
          <div className="grid grid-cols-2 gap-4 mb-6 mt-20">
            {/* 购买方 */}
            <div className="border-2 border-gray-800 p-3">
              <div className="flex">
                <div className="text-gray-700 font-bold text-sm border-r-2 border-gray-800 pr-2 mr-2 writing-mode-vertical">
                  购买方信息
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-2">
                    <span className="text-gray-600">名称：</span>
                    <span className="font-medium text-gray-900">
                      {invoiceData.customerInfo?.name || invoiceData.customerName || '待填写'}
                    </span>
                  </div>
                  {invoiceData.customerInfo && (
                    <>
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">统一社会信用代码/纳税人识别号：</span>
                        <span className="font-mono text-gray-900 text-xs">
                          {invoiceData.customerInfo.taxNumber}
                        </span>
                      </div>
                      {invoiceData.invoiceType === '专票' && (
                        <>
                          <div className="text-sm mb-2">
                            <span className="text-gray-600">地址、电话：</span>
                            <span className="text-gray-900 text-xs">
                              {invoiceData.customerInfo.address} {invoiceData.customerInfo.phone}
                            </span>
                          </div>
                          <div className="text-sm mb-2">
                            <span className="text-gray-600">开户行及账号：</span>
                            <span className="text-gray-900 text-xs">
                              {invoiceData.customerInfo.bank} {invoiceData.customerInfo.accountNumber}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 销售方 */}
            <div className="border-2 border-gray-800 p-3">
              <div className="flex">
                <div className="text-gray-700 font-bold text-sm border-r-2 border-gray-800 pr-2 mr-2 writing-mode-vertical">
                  销售方信息
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-2">
                    <span className="text-gray-600">名称：</span>
                    <span className="font-medium text-gray-900">{sellerInfo?.name || '企享云科技有限公司'}</span>
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-gray-600">统一社会信用代码/纳税人识别号：</span>
                    <span className="font-mono text-gray-900 text-xs">{sellerInfo?.creditCode || '91440300MA5XXXXXX'}</span>
                  </div>
                  {invoiceData.invoiceType === '专票' && sellerInfo && (
                    <>
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">地址、电话：</span>
                        <span className="text-gray-900 text-xs">
                          {sellerInfo.invoiceAddress || sellerInfo.registeredAddress} {sellerInfo.invoicePhone || ''}
                        </span>
                      </div>
                      <div className="text-sm mb-2">
                        <span className="text-gray-600">开户行及账号：</span>
                        <span className="text-gray-900 text-xs">
                          {sellerInfo.bankName} {sellerInfo.bankAccount}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 发票明细表格 */}
          <div className="border-2 border-gray-800 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">项目名称</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">规格型号</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">单位</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">数量</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">单价</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">金额</th>
                  <th className="border-r-2 border-gray-800 py-2 px-2 text-gray-700 font-bold text-xs">税率/征收率</th>
                  <th className="py-2 px-2 text-gray-700 font-bold text-xs">税额</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-gray-800">
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-gray-900 text-xs">
                    ＊{invoiceData.category || '服务'} ＊{invoiceData.productName || invoiceData.productType || '待填写'}
                  </td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-center text-gray-900 text-xs">-</td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-center text-gray-900 text-xs">-</td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-center text-gray-900 text-xs">
                    {invoiceData.quantity || '-'}
                  </td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-right text-gray-900 text-xs">
                    {invoiceData.unitPrice ? invoiceData.unitPrice.toFixed(2) : '-'}
                  </td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-right text-gray-900 font-medium text-xs">
                    {invoiceData.amount ? invoiceData.amount.toFixed(2) : '-'}
                  </td>
                  <td className="border-r-2 border-gray-800 py-3 px-2 text-center text-gray-900 text-xs">
                    {invoiceData.taxRate ? `${invoiceData.taxRate}%` : '-'}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900 font-medium text-xs">
                    {invoiceData.taxAmount ? invoiceData.taxAmount.toFixed(2) : '-'}
                  </td>
                </tr>
                {/* 合计行 */}
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={5} className="border-r-2 border-gray-800 py-2 px-2 text-center text-gray-700 font-bold text-xs">
                    合　　计
                  </td>
                  <td className="border-r-2 border-gray-800 py-2 px-2 text-right text-gray-900 font-bold text-xs">
                    ¥{invoiceData.amount ? invoiceData.amount.toFixed(2) : '0.00'}
                  </td>
                  <td className="border-r-2 border-gray-800 py-2 px-2"></td>
                  <td className="py-2 px-2 text-right text-gray-900 font-bold text-xs">
                    ¥{invoiceData.taxAmount ? invoiceData.taxAmount.toFixed(2) : '0.00'}
                  </td>
                </tr>
                {/* 价税合计 */}
                <tr>
                  <td colSpan={3} className="border-r-2 border-gray-800 py-3 px-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-700 font-bold mr-2">价税合计（大写）</span>
                      <div className="flex items-center">
                        <div className="w-4 h-4 border border-gray-800 rounded-sm mr-1 flex items-center justify-center">
                          <span className="text-lg">✕</span>
                        </div>
                        <span className="text-xs text-gray-600">壹佰壹拾捌圆捌角整</span>
                      </div>
                    </div>
                  </td>
                  <td colSpan={5} className="py-3 px-2 text-right">
                    <span className="text-xs text-gray-600">（小写）</span>
                    <span className="text-lg font-bold text-red-600 ml-2">
                      ¥{invoiceData.totalAmount ? invoiceData.totalAmount.toFixed(2) : '0.00'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 备注 */}
          <div className="border-2 border-gray-800 mb-4">
            <div className="flex">
              <div className="text-gray-700 font-bold text-sm border-r-2 border-gray-800 py-2 px-2 writing-mode-vertical">
                备注
              </div>
              <div className="flex-1 py-2 px-3 min-h-[60px] text-xs text-gray-600">
                {today}
              </div>
            </div>
          </div>

          {/* 开票人 */}
          <div className="text-left text-sm text-gray-700">
            <span>开票人：系统</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: upright;
        }
      `}</style>
    </div>
  );
}
