// 企享云API代理路由 - 解决CORS问题
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_QIXIANGYUN_BASE_URL || 'https://mcp.qixiangyun.com';
const APP_KEY = process.env.NEXT_PUBLIC_QIXIANGYUN_APPKEY || '';
const APP_SECRET = process.env.NEXT_PUBLIC_QIXIANGYUN_APPSECRET || '';

// 生成MD5
function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').toLowerCase();
}

// 获取AppSecret的MD5值
function getAppSecretMd5(): string {
  return md5(APP_SECRET);
}

// Token缓存
let cachedToken: { 
  accessToken: string; 
  refreshToken: string;
  expiresAt: number 
} | null = null;

// 获取access_token
async function getAccessToken(): Promise<string> {
  // 检查缓存（提前1小时刷新）
  if (cachedToken && Date.now() < cachedToken.expiresAt - 3600000) {
    console.log('📋 使用缓存的access_token');
    return cachedToken.accessToken;
  }

  console.log('🔑 正在获取新的access_token...');
  console.log('APP_KEY:', APP_KEY ? `${APP_KEY.slice(0, 4)}****` : '未配置');

  if (!APP_KEY || !APP_SECRET) {
    throw new Error('API凭证未配置: APP_KEY或APP_SECRET为空');
  }

  const tokenUrl = `${BASE_URL}/v2/public/oauth2/login`;
  const reqDate = Date.now().toString();
  const appSecretMd5 = getAppSecretMd5();
  
  // 请求体
  const body = {
    grant_type: 'client_credentials',
    client_appkey: APP_KEY,
    client_secret: appSecretMd5
  };
  const bodyStr = JSON.stringify(body);

  // 生成登录签名: MD5(appKey + reqDate + bodyStr + appSecretMd5)
  const signContent = `${APP_KEY}${reqDate}${bodyStr}${appSecretMd5}`;
  const reqSign = md5(signContent);

  console.log('请求URL:', tokenUrl);
  console.log('请求体:', bodyStr);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'req_sign': reqSign,
      'req_date': reqDate
    },
    body: bodyStr
  });

  const data = await response.json();
  
  console.log('Token响应:', JSON.stringify(data, null, 2));
  
  if (data.success && data.data?.access_token) {
    cachedToken = {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: Date.now() + data.data.expires_in
    };
    console.log('✅ 成功获取access_token，有效期:', Math.floor(data.data.expires_in / 86400000), '天');
    return cachedToken.accessToken;
  }

  throw new Error(data.message || `获取access_token失败: ${JSON.stringify(data)}`);
}

// 生成API请求签名
// 正确的签名算法：
// 1. content_md5 = MD5(json_body)
// 2. 拼接原串 = POST_{content_md5}_{req_date}_{access_token}_{APP_SECRET} (明文)
// 3. md5_result = MD5(拼接原串)
// 4. base64_result = Base64(md5_result)
// 5. req_sign = API-SV1:{APP_KEY}:{base64_result}
function generateSignature(accessToken: string, body: string): { reqSign: string; reqDate: string } {
  const reqDate = Date.now().toString();
  
  // 步骤1: 计算Body的MD5
  const contentMd5 = md5(body);
  
  // 步骤2: 拼接签名原串 (使用明文APP_SECRET)
  const signContent = `POST_${contentMd5}_${reqDate}_${accessToken}_${APP_SECRET}`;
  
  // 步骤3: 计算签名MD5
  const md5Result = md5(signContent);
  
  // 步骤4: Base64编码
  const base64Result = Buffer.from(md5Result).toString('base64');
  
  // 步骤5: 拼接最终Header值
  const reqSign = `API-SV1:${APP_KEY}:${base64Result}`;
  
  return { reqSign, reqDate };
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, body, requireAuth = true } = await request.json();

    if (!APP_KEY || !APP_SECRET) {
      return NextResponse.json({
        success: false,
        code: 'NOT_CONFIGURED',
        message: '企享云API凭证未配置'
      }, { status: 500 });
    }

    const url = `${BASE_URL}${endpoint}`;
    const bodyStr = JSON.stringify(body);

    let headers: Record<string, string> = {
      'Content-Type': 'application/json;charset=UTF-8'
    };

    if (requireAuth) {
      const accessToken = await getAccessToken();
      const { reqSign, reqDate } = generateSignature(accessToken, bodyStr);
      
      headers = {
        ...headers,
        'access_token': accessToken,
        'req_date': reqDate,
        'req_sign': reqSign
      };
    }

    console.log(`📤 代理请求: ${endpoint}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyStr
    });

    const data = await response.json();
    
    console.log(`📥 响应: ${endpoint}`, { success: data.success, code: data.code });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API代理错误:', error);
    return NextResponse.json({
      success: false,
      code: 'PROXY_ERROR',
      message: error.message || '请求失败'
    }, { status: 500 });
  }
}

