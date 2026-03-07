'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getEnergyPools, getEnergyPoolById, createEnergyPool, updateEnergyPool, getBotEnergyAllocations, createEnergyTransaction, getEnergyTransactions, getEnergyStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const poolId = searchParams.get('pool_id');

    if (action === 'stats') {
      const stats = await getEnergyStats();
      return NextResponse.json(stats);
    }

    if (action === 'allocations') {
      const allocations = await getBotEnergyAllocations(poolId ? parseInt(poolId) : undefined);
      return NextResponse.json({ allocations });
    }

    if (action === 'transactions') {
      const transactions = await getEnergyTransactions(poolId ? parseInt(poolId) : undefined);
      return NextResponse.json({ transactions });
    }

    // 获取能量池列表
    const pools = await getEnergyPools();
    return NextResponse.json({ pools });
  } catch (error) {
    console.error('Energy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create_pool') {
      const pool = await createEnergyPool({
        name: data.name,
        name_en: data.name_en,
        capacity: parseFloat(data.capacity),
        status: data.status,
      });
      return NextResponse.json({ pool });
    }

    if (action === 'recharge') {
      const transaction = await createEnergyTransaction({
        pool_id: data.pool_id,
        bot_id: data.bot_id,
        type: 'recharge',
        amount: parseFloat(data.amount),
        operator: data.operator || 'Admin',
        note: data.note,
      });
      return NextResponse.json({ transaction });
    }

    if (action === 'consume') {
      const transaction = await createEnergyTransaction({
        pool_id: data.pool_id,
        bot_id: data.bot_id,
        type: 'consume',
        amount: parseFloat(data.amount),
        operator: 'System',
        note: data.note,
      });
      return NextResponse.json({ transaction });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Energy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
