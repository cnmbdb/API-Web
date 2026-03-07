import { NextRequest, NextResponse } from 'next/server';
import { registerBotHeartbeat } from '@/lib/db';
import { logApiCall } from '@/lib/logger';
import { isPublicIp, normalizeIp, pickBestPublicIpFromXff } from '@/lib/ip';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;
  let responseData: any;

  try {
    const body = await request.json();

    const xff = request.headers.get('x-forwarded-for');
    const sourceIp =
      normalizeIp(xff?.split(',')[0]) ||
      normalizeIp(request.headers.get('x-real-ip')) ||
      'unknown';
    // 优先使用机器人上报的主机名（x-bot-host），否则退回到 API-Web 的 Host 头
    const sourceHost =
      request.headers.get('x-bot-host') ||
      request.headers.get('host') ||
      undefined;

    let botId = body?.bot_id || body?.botId || body?.tg_bot_id || request.headers.get('x-bot-id') || '';
    if (!botId && sourceIp !== 'unknown') {
      botId = `heartbeat-${sourceIp}`;
    }
    const botName = body?.bot_name || body?.botName || undefined;
    const adminUsername = body?.admin_username || body?.adminUsername || body?.tg_admin_username || request.headers.get('x-bot-admin') || undefined;
    const processName = body?.process_name || body?.processName || body?.worker || request.headers.get('x-bot-process') || undefined;
    const status = body?.status || 'active';

    let publicIp =
      normalizeIp(request.headers.get('x-bot-public-ip')) ||
      normalizeIp(body?.public_ip) ||
      normalizeIp(body?.publicIp) ||
      normalizeIp(body?.server_ip) ||
      normalizeIp(body?.serverIp) ||
      null;

    const xffPublic = pickBestPublicIpFromXff(xff);
    if (!publicIp && xffPublic) publicIp = xffPublic;
    if (publicIp && !isPublicIp(publicIp)) publicIp = null;

    if (!botId) {
      statusCode = 400;
      responseData = { code: 400, msg: '缺少 bot_id' };
      const resp = NextResponse.json(responseData, { status: 400 });
      setTimeout(() => {
        logApiCall(request, responseData, statusCode, Date.now() - startTime);
      }, 0);
      return resp;
    }

    const row = await registerBotHeartbeat({
      botId: String(botId),
      botName: botName ? String(botName) : undefined,
      adminUsername: adminUsername ? String(adminUsername) : undefined,
      processName: processName ? String(processName) : undefined,
      sourceIp: String(sourceIp),
      publicIp: publicIp || undefined,
      sourceHost: sourceHost ? String(sourceHost) : undefined,
      status: String(status),
    });

    responseData = {
      code: 200,
      msg: 'heartbeat ok',
      data: {
        bot_id: row?.bot_id,
        source_ip: row?.source_ip,
        public_ip: row?.public_ip || null,
        process_name: row?.process_name,
        admin_username: row?.admin_username,
        last_request_time: row?.last_request_time,
        status: row?.status,
      },
    };

    const resp = NextResponse.json(responseData);
    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime);
    }, 0);
    return resp;
  } catch (error: any) {
    statusCode = 500;
    responseData = {
      code: 500,
      msg: error?.message || 'heartbeat 注册失败',
    };

    const resp = NextResponse.json(responseData, { status: 500 });
    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime, responseData.msg);
    }, 0);
    return resp;
  }
}
