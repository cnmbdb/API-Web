'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getSwapPairs, getSwapPair, getSwapPools, createSwapTransaction, getSwapStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pools') {
      const pools = await getSwapPools();
      return NextResponse.json({ pools });
    }

    if (action === 'stats') {
      const stats = await getSwapStats();
      return NextResponse.json(stats);
    }

    // 获取交易对列表
    const pairs = await getSwapPairs();
    return NextResponse.json({ pairs });
  } catch (error) {
    console.error('Swap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, from_token, to_token, from_amount, user_id } = body;

    if (action === 'execute') {
      // 获取汇率
      const pair = await getSwapPair(from_token, to_token);
      if (!pair) {
        return NextResponse.json({ error: '交易对不存在或已禁用' }, { status: 400 });
      }

      const rate = parseFloat(pair.rate);
      const toAmount = parseFloat(from_amount) * rate;

      // 创建交易记录
      const transaction = await createSwapTransaction({
        user_id,
        from_token,
        to_token,
        from_amount: parseFloat(from_amount),
        to_amount: toAmount,
        rate,
        status: 'completed',
      });

      return NextResponse.json({
        transaction,
        rate,
        to_amount: toAmount,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Swap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
