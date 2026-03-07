'use client';

import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  return dark;
};

interface Statistics {
  todayRequests: number;
  totalRequests: number;
  activeBots: number;
  topApis: Array<{ api_path: string; count: number }>;
}

export default function DashboardPage() {
  const dark = useDarkMode();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/statistics');
        const data = await res.json();
        if (data.code === 200) setStats(data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: dark ? '#f9fafb' : '#111827' }}>仪表台</h1>
      {loading && <div style={{ color: dark ? '#9ca3af' : '#6b7280' }}>加载中…</div>}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Card title="今日请求数" value={stats.todayRequests} dark={dark} />
            <Card title="总请求数" value={stats.totalRequests} dark={dark} />
            <Card title="活跃机器人(1小时)" value={stats.activeBots} dark={dark} />
          </div>

          <div style={{ marginTop: 18, padding: 14, border: `1px solid ${dark ? '#374151' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, background: dark ? '#1f2937' : 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: dark ? '#f9fafb' : '#111827' }}>热门 API（24小时）</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th(dark)}>API 路径</th>
                    <th style={th(dark)}>请求次数</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topApis.map((api, idx) => (
                    <tr key={idx}>
                      <td style={td(dark)}>
                        <code style={code(dark)}>{api.api_path}</code>
                      </td>
                      <td style={td(dark)}>{api.count}</td>
                    </tr>
                  ))}
                  {stats.topApis.length === 0 && (
                    <tr>
                      <td style={td(dark)} colSpan={2}>
                        暂无数据（等待机器人调用 API 后自动产生）
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value, dark }: { title: string; value: number; dark: boolean }) {
  return (
    <div
      style={{
        padding: 16,
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 12,
        background: dark ? '#1f2937' : '#ffffff',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ fontSize: 12, color: dark ? '#9ca3af' : '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6, color: dark ? '#60a5fa' : '#2563eb' }}>{value}</div>
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
});

const td = (dark: boolean): React.CSSProperties => ({
  padding: '10px 10px',
  borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
  fontSize: 13,
  color: dark ? '#d1d5db' : '#374151',
});

const code = (dark: boolean): React.CSSProperties => ({
  background: dark ? '#374151' : '#f3f4f6',
  color: dark ? '#e5e7eb' : '#111827',
  padding: '2px 6px',
  borderRadius: 6,
});

