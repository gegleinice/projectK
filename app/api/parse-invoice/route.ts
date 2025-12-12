import { NextRequest, NextResponse } from 'next/server';
import { INVOICE_PARSE_SYSTEM_PROMPT, LLM_CONFIG, extractJsonFromResponse, ParsedInvoiceResult } from '@/lib/llmService';

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: '缺少用户输入' },
        { status: 400 }
      );
    }

    // 调用 DeepSeek API
    const response = await fetch(`${LLM_CONFIG.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        messages: [
          { role: 'system', content: INVOICE_PARSE_SYSTEM_PROMPT },
          { role: 'user', content: userInput }
        ],
        max_tokens: LLM_CONFIG.maxTokens,
        temperature: LLM_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API Error:', errorText);
      return NextResponse.json(
        { error: 'LLM API 调用失败' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: '未获取到有效响应' },
        { status: 500 }
      );
    }

    // 解析 LLM 返回的 JSON
    const parsedResult = extractJsonFromResponse(content);

    if (!parsedResult) {
      console.error('Failed to parse LLM response:', content);
      // 返回默认结果
      const defaultResult: ParsedInvoiceResult = {
        invoiceType: '普票',
        customerName: null,
        productType: null,
        amount: null,
        quantity: null,
        unitPrice: null,
        confidence: 30,
        missing: ['customerName', 'productType', 'amount'],
        clarification: '抱歉，我无法完全理解您的需求，请更详细地描述开票信息'
      };
      return NextResponse.json(defaultResult);
    }

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error('Parse invoice error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}




