'use client';

import { useState, useEffect } from 'react';

interface LicenseInfo {
  version: string;
  licenseType: string;
  maxBots: number | null;
  expiresAt: string | null;
  lastCheck: string;
}

export default function LicensePage() {
  const [loading, setLoading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<{hasUpdate: boolean; latestVersion: string; releaseNotes: string} | null>(null);
  const [activating, setActivating] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');

  const fetchLicense = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/license');
      const data = await res.json();
      setLicense(data);
    } catch (error) {
      console.error('Failed to fetch license:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicense();
  }, []);

  const checkUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('/api/admin/license?action=check_update');
      const data = await res.json();
      setUpdateInfo(data);
    } catch (error) {
      console.error('Failed to check update:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey) return;
    setActivating(true);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', license_key: licenseKey }),
      });
      const data = await res.json();
      if (data.success) {
        alert('激活成功！');
        setLicenseKey('');
        fetchLicense();
      } else {
        alert(data.error || '激活失败');
      }
    } catch (error) {
      console.error('Failed to activate:', error);
      alert('激活失败');
    } finally {
      setActivating(false);
    }
  };

  const getLicenseTypeLabel = (type: string) => {
    switch (type) {
      case 'trial': return '试用版';
      case 'permanent': return '永久授权';
      case 'subscription': return '订阅授权';
      default: return type;
    }
  };

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>授权与更新</h1>

      <div style={{ display: 'grid', gap: 16, maxWidth: 800 }}>
        {/* 授权信息卡片 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>软件授权</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>API-Web 商业授权信息</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>加载中...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>当前版本</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{license?.version || 'v1.0.0'} (正式版)</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>授权类型</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{getLicenseTypeLabel(license?.licenseType || 'trial')}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>最大机器人数量</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{license?.maxBots || '无限制'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>到期时间</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString('zh-CN') : '永久'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>最后检查更新</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{license?.lastCheck ? new Date(license.lastCheck).toLocaleString('zh-CN') : '-'}</div>
              </div>
            </div>
          )}
        </div>

        {/* 激活授权卡片 */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>激活授权</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="请输入授权密钥"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            />
            <button
              onClick={handleActivate}
              disabled={activating || !licenseKey}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: activating || !licenseKey ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                fontWeight: 500,
                cursor: activating || !licenseKey ? 'not-allowed' : 'pointer',
              }}
            >
              {activating ? '激活中...' : '激活'}
            </button>
          </div>
        </div>

        {/* 检查更新卡片 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>检查更新</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>获取最新版本功能与安全补丁</p>
            </div>
            <button
              onClick={checkUpdate}
              disabled={checkingUpdate}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: checkingUpdate ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                fontWeight: 500,
                cursor: checkingUpdate ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {checkingUpdate ? '检查中...' : '检查更新'}
            </button>
          </div>
          {updateInfo && (
            <div style={{ marginTop: 16, padding: 12, background: updateInfo.hasUpdate ? '#fef3c7' : '#d1fae5', borderRadius: 8 }}>
              <div style={{ fontWeight: 500, color: updateInfo.hasUpdate ? '#92400e' : '#065f46' }}>
                {updateInfo.hasUpdate ? `发现新版本: ${updateInfo.latestVersion}` : '当前已是最新版本'}
              </div>
              {updateInfo.hasUpdate && <div style={{ marginTop: 8, fontSize: 13, color: '#92400e' }}>{updateInfo.releaseNotes}</div>}
            </div>
          )}
        </div>

        {/* 备案信息 */}
        <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 8 }}>
          © 2023 API-Web Team. All rights reserved.
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  background: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
};
