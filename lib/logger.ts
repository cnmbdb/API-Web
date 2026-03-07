import { NextRequest } from 'next/server';
import { logApiRequest } from './db';
import { isPublicIp, normalizeIp, pickBestPublicIpFromXff } from './ip';

export async function logApiCall(
  request: NextRequest,
  responseData: any,
  statusCode: number,
  responseTime: number,
  errorMessage?: string
) {
  try {
    const xff = request.headers.get('x-forwarded-for');
    const sourceIp =
      normalizeIp(xff?.split(',')[0]) ||
      normalizeIp(request.headers.get('x-real-ip')) ||
      'unknown';
    const sourceHost = request.headers.get('host') || null;

    // 先尝试从请求头/URL 读机器人标识
    let botId = request.headers.get('x-bot-id') || request.nextUrl.searchParams.get('bot_id') || null;
    let adminUsername = request.headers.get('x-bot-admin') || request.nextUrl.searchParams.get('admin_username') || null;
    let botProcess = request.headers.get('x-bot-process') || request.nextUrl.searchParams.get('bot_process') || null;
    let publicIp =
      normalizeIp(request.headers.get('x-bot-public-ip')) ||
      normalizeIp(request.nextUrl.searchParams.get('public_ip')) ||
      null;

    // 读取请求数据（如果是 POST/PUT/PATCH），并从 body 补充机器人标识
    let requestData: any = null;
    try {
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json().catch(() => null);
        if (body) {
          requestData = sanitizeRequestData(body);

          // 兼容机器人后台只填 URL 的场景：从 body 自动识别关键字段
          botId =
            botId ||
            body.bot_id ||
            body.botId ||
            body.tg_bot_id ||
            body.username ||
            null;

          adminUsername =
            adminUsername ||
            body.admin_username ||
            body.adminUsername ||
            body.tg_admin_username ||
            body.manager ||
            null;

          botProcess =
            botProcess ||
            body.process_name ||
            body.processName ||
            body.bot_process ||
            body.worker ||
            null;

          publicIp =
            publicIp ||
            normalizeIp(body.public_ip) ||
            normalizeIp(body.publicIp) ||
            normalizeIp(body.server_ip) ||
            normalizeIp(body.serverIp) ||
            null;
        }
      }
    } catch {
      // 忽略解析错误
    }

    // 如果没有显式上报公网 IP，则尝试从 XFF 中挑一个“公网 IP”
    const xffPublic = pickBestPublicIpFromXff(xff);
    if (!publicIp && xffPublic) publicIp = xffPublic;
    if (publicIp && !isPublicIp(publicIp)) publicIp = null;

    await logApiRequest({
      apiPath: request.nextUrl.pathname,
      method: request.method,
      sourceIp: sourceIp as string,
      publicIp: publicIp || undefined,
      sourceHost: sourceHost || undefined,
      botId: botId || undefined,
      adminUsername: adminUsername || undefined,
      botProcess: botProcess || undefined,
      requestData,
      responseData: sanitizeResponseData(responseData),
      statusCode,
      responseTime,
      errorMessage,
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}

function sanitizeRequestData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['mnemonic', 'privatekey', 'private_key', 'password', 'pwd', 'secret', 'key'];
  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '***HIDDEN***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeResponseData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['privatekey', 'private_key', 'secret'];
  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '***HIDDEN***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponseData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
