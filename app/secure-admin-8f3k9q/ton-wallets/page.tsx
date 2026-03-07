'use client';

import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  return dark;
};

interface ApiLog {
  id: number;
  api_path: string;
  source_ip: string;
  bot_id: string | null;
  status_code: number | null;
  created_at: string;
}

export default function TonWalletSecretsPage() {
  const dark = useDarkMode();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/logs?page=1&pageSize=20&apiPath=/api/ton/premium`);
        const data = await res.json();
        if (data.code === 200) setLogs(data.data.logs || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: dark ? '#f9fafb' : '#111827' }}>TON钱包助记词信息</h1>
      <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 10, lineHeight: 1.6 }}>
        为了安全，API-web <b>不会在后台明文展示/存储助记词</b>。机器人调用 TON Premium 接口时，助记词字段会在日志里自动脱敏（显示为{' '}
        <code style={code(dark)}>***HIDDEN***</code>）。
        <br />
        下面展示的是 <code style={code(dark)}>/api/ton/premium</code> 的最近调用记录，用于审计与排错。
      </div>

      {loading && <div style={{ color: dark ? '#9ca3af' : '#6b7280' }}>加载中…</div>}

      <div
        style={{
          padding: 16,
          border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          borderRadius: 12,
          background: dark ? '#1f2937' : '#ffffff',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th(dark)}>时间</th>
                <th style={th(dark)}>API</th>
                <th style={th(dark)}>来源IP</th>
                <th style={th(dark)}>bot_id</th>
                <th style={th(dark)}>状态码</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={td(dark)}>{new Date(l.created_at).toLocaleString('zh-CN')}</td>
                  <td style={td(dark)}>
                    <code style={code(dark)}>{l.api_path}</code>
                  </td>
                  <td style={td(dark)}>{l.source_ip}</td>
                  <td style={td(dark)}>{l.bot_id || '-'}</td>
                  <td style={td(dark)}>{l.status_code ?? '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td style={td(dark)} colSpan={5}>
                    暂无数据（触发一次 Premium 开通调用后会出现）
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: dark ? '#6b7280' : 'rgba(230,230,230,0.65)' }}>
          如果你确实需要“查看机器人后台保存的助记词明文”，建议在机器人后台单独做强审计、强权限的查看能力（不建议在 API-web 侧重复保存明文）。
        </div>
      </div>
    </div>
  );
}

const th = (dark: boolean): React.CSSProperties => ({
  textAlign: 'left',
  fontSize: 12,
  color: dark ? '#9ca3af' : '#6b7280',
  padding: '10px 10px',
  borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
  background: dark ? '#111827' : '#f9fafb',
  whiteSpace: 'nowrap',
});

const td = (dark: boolean): React.CSSProperties => ({
  padding: '10px 10px',
  borderBottom: `1px solid ${dark ? '#374151' : '#f3f4f6'}`,
  fontSize: 13,
  whiteSpace: 'nowrap',
  color: dark ? '#d1d5db' : '#374151',
});

const code = (dark: boolean): React.CSSProperties => ({
  background: dark ? '#374151' : '#f3f4f6',
  color: dark ? '#e5e7eb' : '#111827',
  padding: '2px 6px',
  borderRadius: 6,
});

