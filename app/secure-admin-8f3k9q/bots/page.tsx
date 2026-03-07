'use client';

import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  return dark;
};

interface BotDetail {
  id: number;
  bot_id: string;
  bot_name: string | null;
  admin_username: string | null;
  process_name: string | null;
  source_ip: string;
  public_ip: string | null;
  source_host: string | null;
  last_request_time: string;
  request_count: number;
  status: string;
  runtime_status: 'online' | 'offline';
}

interface BotGroup {
  server_ip: string;
  bots: BotDetail[];
  bot_count: number;
  online_count: number;
  total_requests: number;
  last_activity: string;
}

export default function BotsPage() {
  const dark = useDarkMode();
  const [groups, setGroups] = useState<BotGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [runtimeStatus, setRuntimeStatus] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page), pageSize: '20' });
        if (runtimeStatus !== 'all') qs.set('runtimeStatus', runtimeStatus);

        const res = await fetch(`/api/admin/bots?${qs.toString()}`);
        const data = await res.json();
        if (data.code === 200) {
          setGroups(data.data.groups || []);
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
  }, [page, runtimeStatus]);

  const toggleGroup = (serverIp: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(serverIp)) {
        next.delete(serverIp);
      } else {
        next.add(serverIp);
      }
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条机器人记录吗？')) return;
    try {
      const res = await fetch(`/api/admin/bots?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === 200) {
        alert('删除成功');
        // 刷新数据
        setPage(1);
        window.location.reload();
      } else {
        alert(data.msg || '删除失败');
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: dark ? '#f9fafb' : '#111827' }}>机器人列表</h1>
      <div style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 12 }}>
        展示已配置的 <strong>TG 机器人</strong> 及其 <strong>管理员用户名</strong>，按服务器公网IP分组，可展开查看该服务器下所有机器人详情。
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button style={filterBtn(runtimeStatus === 'all', dark)} onClick={() => { setPage(1); setRuntimeStatus('all'); }}>
          全部
        </button>
        <button style={filterBtn(runtimeStatus === 'online', dark)} onClick={() => { setPage(1); setRuntimeStatus('online'); }}>
          在线
        </button>
        <button style={filterBtn(runtimeStatus === 'offline', dark)} onClick={() => { setPage(1); setRuntimeStatus('offline'); }}>
          离线
        </button>
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
        {groups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: dark ? '#9ca3af' : '#6b7280' }}>
            暂无数据（机器人调用 /api/bot/heartbeat 后会自动出现）
          </div>
        ) : (
          <>
            {/* 分组列表 */}
            {groups.map((group) => (
              <div key={group.server_ip} style={{ marginBottom: 8 }}>
                {/* 分组标题行 - 可点击折叠 */}
                <div
                  onClick={() => toggleGroup(group.server_ip)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: expandedGroups.has(group.server_ip) ? (dark ? '#1e3a8a' : '#f0f9ff') : (dark ? '#374151' : '#f9fafb'),
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ marginRight: 8, fontSize: 14, color: dark ? '#9ca3af' : '#6b7280' }}>
                    {expandedGroups.has(group.server_ip) ? '▼' : '▶'}
                  </span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ minWidth: 140 }}>
                      <span style={{ fontWeight: 600, color: dark ? '#f9fafb' : '#111827', fontSize: 14 }}>{group.server_ip}</span>
                    </div>
                    <div style={{ minWidth: 80, color: dark ? '#d1d5db' : '#374151', fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{group.bot_count}</span> 个机器人
                    </div>
                    <div style={{ minWidth: 60 }}>
                      <span style={{ 
                        color: group.online_count > 0 ? '#16a34a' : '#9ca3af',
                        fontWeight: 500,
                        fontSize: 13 
                      }}>
                        {group.online_count} 在线
                      </span>
                    </div>
                    <div style={{ minWidth: 80, color: dark ? '#9ca3af' : '#6b7280', fontSize: 13 }}>
                      {group.total_requests} 请求
                    </div>
                    <div style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: 13 }}>
                      {formatTime(group.last_activity)}
                    </div>
                  </div>
                </div>

                {/* 折叠的详情表格 */}
                {expandedGroups.has(group.server_ip) && (
                  <div style={{ padding: '8px 0 8px 32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={th(dark)}>TG机器人</th>
                          <th style={th(dark)}>管理员用户名</th>
                          <th style={th(dark)}>进程</th>
                          <th style={th(dark)}>公网IP</th>
                          <th style={th(dark)}>来源IP</th>
                          <th style={th(dark)}>请求数</th>
                          <th style={th(dark)}>最后活动</th>
                          <th style={th(dark)}>状态</th>
                          <th style={th(dark)}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.bots.map((bot) => (
                          <tr key={bot.id}>
                            <td style={td(dark)}>
                              <span style={{ fontWeight: 500 }}>{bot.bot_name || bot.bot_id}</span>
                              {bot.bot_name && bot.bot_id !== bot.bot_name && (
                                <span style={{ fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', marginLeft: 6 }}>({bot.bot_id})</span>
                              )}
                            </td>
                            <td style={td(dark)}>{bot.admin_username || '-'}</td>
                            <td style={td(dark)}>{bot.process_name || '-'}</td>
                            <td style={td(dark)}>{bot.public_ip || '-'}</td>
                            <td style={td(dark)}>{bot.source_ip}</td>
                            <td style={td(dark)}>{bot.request_count}</td>
                            <td style={td(dark)}>{formatTime(bot.last_request_time)}</td>
                            <td style={td(dark)}>
                              <span style={{ 
                                color: bot.runtime_status === 'online' ? '#16a34a' : '#9ca3af',
                                fontWeight: 700 
                              }}>
                                {bot.runtime_status === 'online' ? '在线' : '离线'}
                              </span>
                            </td>
                            <td style={td(dark)}>
                              <button
                                onClick={() => handleDelete(bot.id)}
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
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* 分页 */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          </>
        )}
      </div>
    </div>
  );
}

const th = (dark: boolean): React.CSSProperties => ({
  textAlign: 'left',
  fontSize: 11,
  color: dark ? '#9ca3af' : '#6b7280',
  padding: '8px 10px',
  borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
  background: dark ? '#111827' : '#f9fafb',
  whiteSpace: 'nowrap',
});

const td = (dark: boolean): React.CSSProperties => ({
  padding: '8px 10px',
  borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
  fontSize: 12,
  whiteSpace: 'nowrap',
  color: dark ? '#d1d5db' : '#374151',
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

function filterBtn(active: boolean, dark: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: active ? '1px solid #2563eb' : `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
    background: active ? '#2563eb' : (dark ? '#1f2937' : '#ffffff'),
    color: active ? '#ffffff' : (dark ? '#d1d5db' : '#374151'),
    cursor: 'pointer',
    fontSize: 13,
  };
}
