import { NextRequest, NextResponse } from 'next/server';
import { logApiCall } from '@/lib/logger';

// /api/premium 路由：兼容旧机器人配置，转发到 TON Premium 处理逻辑
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let responseData: any = null;
  let statusCode = 200;
  let errorMessage: string | undefined = undefined;

  try {
    const body = await request.json();

    // gift 模式：amount + payload + duration
    if (body?.mode === 'gift' || (body?.amount && body?.payload && body?.duration)) {
      const { processTonPremiumGift } = await import('@/lib/ton');
      const result = await processTonPremiumGift({
        amount: body.amount,
        payload: body.payload,
        duration: body.duration,
        mnemonic: body.mnemonic,
      });

      responseData = result;
      statusCode = result?.code >= 400 ? result.code : 200;
      const response = NextResponse.json(result, { status: statusCode });

      setTimeout(() => {
        logApiCall(request, responseData, statusCode, Date.now() - startTime, errorMessage);
      }, 0);

      return response;
    }

    // legacy 模式：username + mnemonic + hash_value + cookie + months
    const { username, mnemonic, hash_value, cookie, months } = body;

    if (!username || !mnemonic || !hash_value || !cookie || !months) {
      statusCode = 400;
      responseData = { code: 400, msg: '缺少必要参数' };
      const response = NextResponse.json(responseData, { status: 400 });
      setTimeout(() => {
        logApiCall(request, responseData, statusCode, Date.now() - startTime, errorMessage);
      }, 0);
      return response;
    }

    const { processTonPremium } = await import('@/lib/ton');

    const result = await processTonPremium({
      username,
      mnemonic,
      hash_value,
      cookie,
      months,
    });

    responseData = result;
    statusCode = result?.code >= 400 ? result.code : 200;
    const response = NextResponse.json(result, { status: statusCode });

    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime, errorMessage);
    }, 0);

    return response;
  } catch (error: any) {
    statusCode = 500;
    errorMessage = error.message || '处理失败';
    responseData = {
      code: 500,
      msg: errorMessage,
    };

    const response = NextResponse.json(responseData, { status: 500 });

    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime, errorMessage);
    }, 0);

    return response;
  }
}
