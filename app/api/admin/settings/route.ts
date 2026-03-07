'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, setSystemSetting, deleteSystemSetting } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await getSystemSetting(key);
      return NextResponse.json({ setting });
    }

    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, value, description } = body;

    if (action === 'set') {
      const setting = await setSystemSetting(key, value, description);
      return NextResponse.json({ setting });
    }

    if (action === 'delete') {
      const result = await deleteSystemSetting(key);
      return NextResponse.json({ success: result });
    }

    if (action === 'batch') {
      // 批量设置
      const settings = body.settings || [];
      const results = [];
      for (const s of settings) {
        const setting = await setSystemSetting(s.key, s.value, s.description);
        results.push(setting);
      }
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
