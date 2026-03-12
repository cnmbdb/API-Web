'use client';

import { useState, useEffect } from 'react';

interface LicenseInfo {
  version: string;
  licenseType: string;
  maxBots: number | null;
  expiresAt: string | null;
  lastCheck: string;
  authCodes?: AuthCodeItem[];
}

interface AuthCodeItem {
  id: number;
  code: string;
  max_bots: number | null;
  max_domains: number;
  bound_domains: string[];
  expires_at: string | null;
  status: string;
  bound_site_url: string | null;
  bound_robot_site: string | null;
  bound_at: string | null;
  memo: string | null;
  created_at: string;
}

export default function LicensePage() {
  const [loading, setLoading] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [authCodes, setAuthCodes] = useState<AuthCodeItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(1);
  const [genMaxBots, setGenMaxBots] = useState('');
  const [genMaxDomains, setGenMaxDomains] = useState(4);
  const [genExpiresAt, setGenExpiresAt] = useState('');
  const [genMemo, setGenMemo] = useState('');
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 编辑弹窗状态
  const [editingItem, setEditingItem] = useState<AuthCodeItem | null>(null);
  const [editMaxBots, setEditMaxBots] = useState('');
  const [editMaxDomains, setEditMaxDomains] = useState(4);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLicense = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/license');
      const data = await res.json();
      setLicense(data);
      setAuthCodes(data.authCodes || []);
    } catch (error) {
      console.error('Failed to fetch license:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicense();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          count: genCount,
          max_bots: genMaxBots === '' ? undefined : genMaxBots,
          max_domains: genMaxDomains,
          expires_at: genExpiresAt.trim() || undefined,
          memo: genMemo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const created = data.created || [];
        if (created.length === 1) {
          const code = created[0].code;
          await navigator.clipboard.writeText(code);
          setCopyFeedback('已生成并已复制到剪贴板');
        } else {
          setCopyFeedback(`已生成 ${created.length} 个授权码`);
        }
        setTimeout(() => setCopyFeedback(null), 3000);
        fetchLicense();
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('确定要撤销该授权码？撤销后机器人端将无法通过验证。')) return;
    setRevokingId(id);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLicense();
      } else {
        alert(data.error || '撤销失败');
      }
    } catch (error) {
      console.error('Failed to revoke:', error);
      alert('撤销失败');
    } finally {
      setRevokingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该授权码？此操作不可恢复。')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_code', id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLicense();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (item: AuthCodeItem) => {
    setEditingItem(item);
    setEditMaxBots(item.max_bots === null ? '' : String(item.max_bots));
    setEditMaxDomains(item.max_domains || 4);
    setEditExpiresAt(item.expires_at ? item.expires_at.slice(0, 16) : '');
    setEditMemo(item.memo || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_code',
          id: editingItem.id,
          max_bots: editMaxBots === '' ? null : editMaxBots,
          max_domains: editMaxDomains,
          expires_at: editExpiresAt.trim() || null,
          memo: editMemo.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchLicense();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
    } finally {
      setSavingEdit(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyFeedback(code);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: '未使用', color: '#059669' };
      case 'used': return { text: '已激活', color: '#2563eb' };
      case 'revoked': return { text: '已撤销', color: '#6b7280' };
      default: return { text: status, color: '#6b7280' };
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>授权与更新</h1>

      <div style={{ width: '100%', display: 'grid', gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>生成授权码</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#6b7280' }}>
            生成后提供给机器人系统：在机器人后台填写本 API 站点地址与授权码即可激活；未激活时机器人将跳转到系统设置页要求填写激活码。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px 24px', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生成数量</label>
              <input
                type="number"
                min={1}
                max={50}
                value={genCount}
                onChange={(e) => setGenCount(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>最大机器人数（可选）</label>
              <input
                type="text"
                placeholder="不填为不限制"
                value={genMaxBots}
                onChange={(e) => setGenMaxBots(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>可绑定域名数</label>
              <input
                type="number"
                min={1}
                max={10}
                value={genMaxDomains}
                onChange={(e) => setGenMaxDomains(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>到期时间（可选）</label>
              <input
                type="datetime-local"
                value={genExpiresAt}
                onChange={(e) => setGenExpiresAt(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>备注（可选）</label>
              <input
                type="text"
                placeholder="例如：某客户 / 某环境"
                value={genMemo}
                onChange={(e) => setGenMemo(e.target.value)}
                style={{ ...inputStyle, width: '100%', maxWidth: 400 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: generating ? '#9ca3af' : '#2563eb',
                color: '#fff',
                fontWeight: 500,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? '生成中...' : '生成授权码'}
            </button>
            {copyFeedback && (
              <span style={{ fontSize: 13, color: '#059669' }}>{copyFeedback}</span>
            )}
          </div>

          {/* 授权码列表 */}
          {authCodes.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>已生成的授权码</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '8px 8px 8px 0', color: '#6b7280', fontWeight: 500 }}>授权码</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>状态</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>可绑定域名</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>绑定的 API 地址</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>激活来源</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>到期时间</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>备注</th>
                      <th style={{ padding: 8, color: '#6b7280', fontWeight: 500 }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authCodes.map((row) => {
                      const status = getStatusLabel(row.status);
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 8px 8px 0' }}>
                            <code style={{ fontSize: 12, background: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>{row.code}</code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(row.code)}
                              style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                            >
                              复制
                            </button>
                          </td>
                          <td style={{ padding: 8 }}>
                            <span style={{ color: status.color, fontWeight: 500 }}>{status.text}</span>
                          </td>
                          <td style={{ padding: 8, color: '#6b7280' }}>
                            {row.max_domains || 4}
                          </td>
                          <td style={{ padding: 8, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.bound_site_url || ''}>
                            {row.bound_site_url || '-'}
                          </td>
                          <td style={{ padding: 8, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.bound_robot_site || ''}>
                            {row.bound_robot_site || '-'}
                          </td>
                          <td style={{ padding: 8, color: '#6b7280' }}>
                            {row.expires_at ? new Date(row.expires_at).toLocaleString('zh-CN') : '永久'}
                          </td>
                          <td style={{ padding: 8, color: '#6b7280' }}>{row.memo || '-'}</td>
                          <td style={{ padding: 8 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(row)}
                                style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #2563eb', color: '#2563eb', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                title="编辑"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row.id)}
                                disabled={deletingId === row.id}
                                style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #dc2626', color: '#dc2626', borderRadius: 4, background: '#fff', cursor: deletingId === row.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                title="删除"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setEditingItem(null)}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 480,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: '#111827' }}>编辑授权码</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>授权码</label>
              <code style={{ fontSize: 13, background: '#f3f4f6', padding: '8px 12px', borderRadius: 6, display: 'block' }}>{editingItem.code}</code>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>最大机器人数（留空为不限制）</label>
                <input
                  type="text"
                  placeholder="不填为不限制"
                  value={editMaxBots}
                  onChange={(e) => setEditMaxBots(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>可绑定域名数</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editMaxDomains}
                  onChange={(e) => setEditMaxDomains(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>到期时间</label>
                <input
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>备注</label>
                <input
                  type="text"
                  placeholder="可选"
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setEditingItem(null)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 500, cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 500, cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.7 : 1 }}
              >
                {savingEdit ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 24,
  background: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  width: '100%',
};
