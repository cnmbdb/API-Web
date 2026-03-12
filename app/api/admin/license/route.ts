'use strict';

import { NextRequest, NextResponse } from 'next/server';
import {
  getLicense,
  createLicense,
  updateLicense,
  listRobotAuthCodes,
  createRobotAuthCode,
  revokeRobotAuthCode,
  updateRobotAuthCode,
  deleteRobotAuthCode,
} from '@/lib/db';

const CURRENT_VERSION = 'v1.0.0';

/** 生成随机授权码（大写字母+数字，避免易混淆字符） */
function generateAuthCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 24; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check_update') {
      return NextResponse.json({
        hasUpdate: false,
        latestVersion: CURRENT_VERSION,
        currentVersion: CURRENT_VERSION,
        releaseNotes: '当前已是最新版本',
        downloadUrl: null,
      });
    }

    const license = await getLicense();
    const authCodes = await listRobotAuthCodes(100);

    if (!license) {
      return NextResponse.json({
        version: CURRENT_VERSION,
        licenseType: 'trial',
        maxBots: null,
        expiresAt: null,
        lastCheck: new Date().toISOString(),
        authCodes,
      });
    }

    return NextResponse.json({
      version: CURRENT_VERSION,
      licenseKey: license.license_key,
      licenseType: license.license_type,
      maxBots: license.max_bots,
      expiresAt: license.expires_at,
      lastCheck: new Date().toISOString(),
      authCodes,
    });
  } catch (error) {
    console.error('License API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      license_key,
      license_type,
      max_bots,
      max_domains,
      expires_at,
      count,
      memo,
      id: revokeId,
    } = body;

    if (action === 'generate') {
      // 生成机器人授权码
      const num = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);
      const maxBotsVal = max_bots === '' || max_bots === undefined ? null : parseInt(max_bots, 10);
      const expiresAtVal =
        expires_at && String(expires_at).trim() ? String(expires_at).trim() : null;
      const memoVal = memo && String(memo).trim() ? String(memo).trim() : null;

      const created: { code: string; id: number }[] = [];
      for (let i = 0; i < num; i++) {
        let code = generateAuthCode();
        let retries = 5;
        while (retries--) {
          try {
            const row = await createRobotAuthCode({
              code,
              max_bots: maxBotsVal,
              expires_at: expiresAtVal,
              memo: memoVal,
            });
            created.push({ code: row.code, id: row.id });
            break;
          } catch (e: any) {
            if (e?.code === '23505') {
              code = generateAuthCode();
              continue;
            }
            throw e;
          }
        }
      }
      return NextResponse.json({ success: true, created });
    }

    if (action === 'revoke') {
      const id = parseInt(revokeId, 10);
      if (!id) {
        return NextResponse.json({ error: '缺少授权码 id' }, { status: 400 });
      }
      const updated = await revokeRobotAuthCode(id);
      if (!updated) {
        return NextResponse.json({ error: '未找到该授权码' }, { status: 404 });
      }
      return NextResponse.json({ success: true, license: updated });
    }

    if (action === 'update_code') {
      const id = parseInt(body.id, 10);
      if (!id) {
        return NextResponse.json({ error: '缺少授权码 id' }, { status: 400 });
      }
      const maxBotsVal = max_bots === '' || max_bots === undefined ? null : parseInt(max_bots, 10);
      const maxDomainsVal = max_domains === '' || max_domains === undefined ? 4 : parseInt(max_domains, 10);
      const expiresAtVal = expires_at && String(expires_at).trim() ? String(expires_at).trim() : null;
      const memoVal = memo !== undefined ? (String(memo).trim() || null) : undefined;

      const updated = await updateRobotAuthCode(id, {
        max_bots: maxBotsVal,
        max_domains: maxDomainsVal,
        expires_at: expiresAtVal,
        memo: memoVal,
      });
      if (!updated) {
        return NextResponse.json({ error: '未找到该授权码' }, { status: 404 });
      }
      return NextResponse.json({ success: true, license: updated });
    }

    if (action === 'delete_code') {
      const id = parseInt(body.id, 10);
      if (!id) {
        return NextResponse.json({ error: '缺少授权码 id' }, { status: 400 });
      }
      const deleted = await deleteRobotAuthCode(id);
      if (!deleted) {
        return NextResponse.json({ error: '未找到该授权码' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'activate') {
      if (!license_key) {
        return NextResponse.json({ error: '授权密钥不能为空' }, { status: 400 });
      }
      const license = await createLicense({
        license_key,
        license_type: license_type || 'permanent',
        max_bots: max_bots ? parseInt(max_bots) : undefined,
        expires_at: expires_at || null,
      });
      return NextResponse.json({ success: true, license });
    }

    if (action === 'update') {
      const existing = await getLicense();
      if (!existing) {
        return NextResponse.json({ error: '请先激活授权' }, { status: 400 });
      }
      const updated = await updateLicense(existing.id, {
        license_type,
        max_bots: max_bots ? parseInt(max_bots) : undefined,
        expires_at: expires_at || undefined,
      });
      return NextResponse.json({ success: true, license: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('License API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
