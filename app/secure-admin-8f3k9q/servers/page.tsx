'use client';

import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  return dark;
};

interface ServerRow {
  source_host: string;
  server_ip: string;
  bot_count: string | number;
  request_count: string | number;
  admin_usernames: string[];
  process_names: string[];
  last_request_time: string;
  is_online?: boolean;
}

export default function ServersPage() {
  const dark = useDarkMode();
  const [list, setList] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/servers?page=${page}&pageSize=20`);
        const data = await res.json();
        if (data.code === 200) {
          setList(data.data.servers || []);
          setTotal(data.data.total || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();

    // 每 30 秒自动刷新在线状态
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [page]);

  const handleDelete = async (sourceHost: string) => {
    if (!confirm(`确定要删除服务器 ${sourceHost} 的所有机器人记录吗？`)) return;
    try {
      const res = await fetch(`/api/admin/servers?source_host=${encodeURIComponent(sourceHost)}`, { method: 'DELETE' });
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
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: dark ? '#f9fafb' : '#111827' }}>服务器总览</h1>
      <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 10 }}>
        每台服务器按公网IP或主机名聚合；<strong>在线</strong>表示该服务器在 90 秒内有心跳（机器人需定期调用 <code style={code(dark)}>POST /api/bot/heartbeat</code>）。
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
                <th style={th(dark)}>服务器公网IP / 主机</th>
                <th style={th(dark)}>来源主机</th>
                <th style={th(dark)}>状态</th>
                <th style={th(dark)}>机器人数量</th>
                <th style={th(dark)}>机器人进程</th>
                <th style={th(dark)}>管理员用户名</th>
                <th style={th(dark)}>总请求次数</th>
                <th style={th(dark)}>最后请求时间</th>
                <th style={th(dark)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={idx}>
                  <td style={td(dark)}><code style={code(dark)}>{row.server_ip || '未知'}</code></td>
                  <td style={td(dark)}>{row.source_host || '-'}</td>
                  <td style={td(dark)}>
                    <span style={{
                      fontWeight: 600,
                      color: row.is_online ? '#16a34a' : (dark ? '#9ca3af' : '#6b7280'),
                    }}>
                      {row.is_online ? '在线' : '离线'}
                    </span>
                  </td>
                  <td style={td(dark)}>{row.bot_count}</td>
                  <td style={td(dark)}>{(row.process_names || []).length ? row.process_names.join(', ') : '-'}</td>
                  <td style={td(dark)}>{(row.admin_usernames || []).length ? row.admin_usernames.join(', ') : '-'}</td>
                  <td style={td(dark)}>{row.request_count}</td>
                  <td style={td(dark)}>{new Date(row.last_request_time).toLocaleString('zh-CN')}</td>
                  <td style={td(dark)}>
                    <button
                      onClick={() => handleDelete(row.source_host)}
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
                  <td style={td(dark)} colSpan={8}>
                    暂无数据（等待机器人调用心跳 API 后自动产生）
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280' }}>共 {total} 台服务器</div>
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
  background: dark ? '#374151' : '#f3f4f6',
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
