'use client';

import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  return dark;
};

interface ApiUserRow {
  public_ip: string;
  request_count: string | number;
  bot_count: string | number;
  last_request_time: string;
}

export default function ApiUsersPage() {
  const dark = useDarkMode();
  const [list, setList] = useState<ApiUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/api-users?page=${page}&pageSize=20`);
        const data = await res.json();
        if (data.code === 200) {
          setList(data.data.users || []);
          setTotal(data.data.total || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const handleDelete = async (publicIp: string) => {
    if (!confirm(`确定要删除 IP 为 ${publicIp} 的所有API请求日志吗？`)) return;
    try {
      const res = await fetch(`/api/admin/api-users?public_ip=${encodeURIComponent(publicIp)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 200) {
        alert('删除成功');
        window.location.reload();
      } else {
        alert(data.msg || '删除失败');
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: dark ? '#f9fafb' : '#111827' }}>API用户列表</h1>
      <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 10 }}>
        按请求来源<strong>公网IP</strong>聚合，展示该 IP 的请求次数、关联机器人数及最后请求时间。
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
                <th style={th(dark)}>公网IP</th>
                <th style={th(dark)}>请求次数</th>
                <th style={th(dark)}>关联机器人数</th>
                <th style={th(dark)}>最后请求时间</th>
                <th style={th(dark)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={idx}>
                  <td style={td(dark)}>
                    <code style={code(dark)}>{row.public_ip}</code>
                  </td>
                  <td style={td(dark)}>{row.request_count}</td>
                  <td style={td(dark)}>{row.bot_count}</td>
                  <td style={td(dark)}>{new Date(row.last_request_time).toLocaleString('zh-CN')}</td>
                  <td style={td(dark)}>
                    <button
                      onClick={() => handleDelete(row.public_ip)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        borderRadius: 4,
                        border: '1px solid #dc2626',
                        background: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td style={td(dark)} colSpan={4}>
                    暂无数据（有 API 请求后会按公网IP自动出现）
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280' }}>共 {total} 条</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={btn(page === 1, dark)}>
              上一页
            </button>
            <span style={{ fontSize: 13, color: dark ? '#d1d5db' : '#111827' }}>第 {page} 页</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total} style={btn(page * 20 >= total, dark)}>
              下一页
            </button>
          </div>
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
  borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
  fontSize: 13,
  whiteSpace: 'nowrap',
  color: dark ? '#d1d5db' : '#374151',
});

const code = (dark: boolean): React.CSSProperties => ({
  background: dark ? '#374151' : 'rgba(255,255,255,0.06)',
  color: dark ? '#e5e7eb' : '#111827',
  padding: '2px 6px',
  borderRadius: 6,
});

function btn(disabled: boolean, dark: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
    background: disabled ? (dark ? '#374151' : '#f3f4f6') : '#2563eb',
    color: disabled ? '#9ca3af' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

