import { NextRequest, NextResponse } from 'next/server';
import { processTonPremium, processTonPremiumGift } from '@/lib/ton';
import { logApiCall } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let responseData: any = null;
  let statusCode = 200;
  let errorMessage: string | undefined;

  try {
    const body = await request.json();

    // 兼容两种模式：
    // 1) 旧模式（月度开通）: username, mnemonic, hash_value, cookie, months
    // 2) 融合 main.go 模式: amount, payload, duration, mnemonic?
    const mode = body?.mode || 'legacy';

    let result: any;
    if (mode === 'gift' || (body?.amount && body?.payload && body?.duration)) {
      const { amount, payload, duration, mnemonic } = body;
      if (!amount || !payload || !duration) {
        statusCode = 400;
        responseData = { code: 400, msg: 'gift 模式缺少参数: amount/payload/duration' };
        const resp = NextResponse.json(responseData, { status: 400 });
        setTimeout(() => {
          logApiCall(request, responseData, statusCode, Date.now() - startTime);
        }, 0);
        return resp;
      }

      result = await processTonPremiumGift({ amount, payload, duration, mnemonic });
    } else {
      const { username, mnemonic, hash_value, cookie, months } = body;
      if (!username || !mnemonic || !hash_value || !cookie || !months) {
        statusCode = 400;
        responseData = { code: 400, msg: '缺少必要参数' };
        const resp = NextResponse.json(responseData, { status: 400 });
        setTimeout(() => {
          logApiCall(request, responseData, statusCode, Date.now() - startTime);
        }, 0);
        return resp;
      }

      result = await processTonPremium({
        username,
        mnemonic,
        hash_value,
        cookie,
        months,
      });
    }

    responseData = result;
    const resp = NextResponse.json(result, { status: result?.code >= 400 ? result.code : 200 });
    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime);
    }, 0);
    return resp;
  } catch (error: any) {
    statusCode = 500;
    errorMessage = error.message || '处理失败';
    responseData = {
      code: 500,
      msg: errorMessage,
    };
    const resp = NextResponse.json(responseData, { status: 500 });
    setTimeout(() => {
      logApiCall(request, responseData, statusCode, Date.now() - startTime, errorMessage);
    }, 0);
    return resp;
  }
}
