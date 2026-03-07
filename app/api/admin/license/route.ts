'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getLicense, createLicense, updateLicense } from '@/lib/db';

const CURRENT_VERSION = 'v1.0.0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check_update') {
      // 检查更新 - 模拟从远程服务器获取最新版本信息
      // 实际项目中这里可以连接外部更新服务器
      return NextResponse.json({
        hasUpdate: false,
        latestVersion: CURRENT_VERSION,
        currentVersion: CURRENT_VERSION,
        releaseNotes: '当前已是最新版本',
        downloadUrl: null,
      });
    }

    // 获取授权信息
    const license = await getLicense();

    if (!license) {
      // 返回默认授权信息
      return NextResponse.json({
        version: CURRENT_VERSION,
        licenseType: 'trial',
        maxBots: null,
        expiresAt: null,
        lastCheck: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      version: CURRENT_VERSION,
      licenseKey: license.license_key,
      licenseType: license.license_type,
      maxBots: license.max_bots,
      expiresAt: license.expires_at,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error('License API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, license_key, license_type, max_bots, expires_at } = body;

    if (action === 'activate') {
      // 激活授权
      if (!license_key) {
        return NextResponse.json({ error: '授权密钥不能为空' }, { status: 400 });
      }

      const license = await createLicense({
        license_key,
        license_type: license_type || 'permanent',
        max_bots: max_bots ? parseInt(max_bots) : null,
        expires_at: expires_at || null,
      });

      return NextResponse.json({
        success: true,
        license,
      });
    }

    if (action === 'update') {
      // 更新授权
      const existing = await getLicense();
      if (!existing) {
        return NextResponse.json({ error: '请先激活授权' }, { status: 400 });
      }

      const updated = await updateLicense(existing.id, {
        license_type,
        max_bots: max_bots ? parseInt(max_bots) : undefined,
        expires_at: expires_at || undefined,
      });

      return NextResponse.json({
        success: true,
        license: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('License API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
