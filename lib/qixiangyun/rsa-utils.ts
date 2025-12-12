/**
 * RSA加密工具
 * 用于加密税务APP密码
 * 使用 jsencrypt 库实现 PKCS#1 v1.5 加密（与企享云API兼容）
 */

import JSEncrypt from 'jsencrypt';

// 企享云提供的RSA公钥（PEM格式）
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+vuYMGtTU+42wwbaFX+PkCuSe
oREKe5V4EJMi553Gc03ficUdpLHIFdEjAMHAxepwm3RAGLwyxYFK/S93k8GYMuV3
5L2Nj/cVeHS8scsdqXzqLUKaI4wj438OI6HDh7rWsw1M5EgMsoZvQqja53+SgD3m
gIy3XyILbmA5jUp2IwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * 使用RSA公钥加密密码
 * @param password 明文密码
 * @returns Base64编码的加密数据
 */
export function encryptPassword(password: string): string {
  try {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(PUBLIC_KEY);
    
    const encrypted = encrypt.encrypt(password);
    
    if (!encrypted) {
      throw new Error('RSA加密返回空值');
    }
    
    console.log('✅ RSA加密成功，密文长度:', encrypted.length);
    return encrypted;
  } catch (error) {
    console.error('❌ RSA加密失败:', error);
    throw new Error('密码加密失败');
  }
}

/**
 * 验证手机号格式
 */
export function validatePhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证密码格式（基本检查）
 */
export function validatePassword(password: string): boolean {
  // 至少6位
  return password.length >= 6;
}
