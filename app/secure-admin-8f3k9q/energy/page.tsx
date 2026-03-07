'use client';

import { useState, useEffect } from 'react';

interface EnergyStats {
  totalCapacity: number;
  totalCurrent: number;
  todayConsume: number;
  activeBots: number;
  todayRecharge: number;
}

interface EnergyPool {
  id: number;
  name: string;
  name_en: string;
  capacity: string;
  current_amount: string;
  status: string;
}

interface EnergyTransaction {
  id: number;
  type: string;
  amount: string;
  operator: string;
  note: string;
  created_at: string;
}

export default function EnergyPage() {
  const [activeTab, setActiveTab] = useState('pools');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [pools, setPools] = useState<EnergyPool[]>([]);
  const [transactions, setTransactions] = useState<EnergyTransaction[]>([]);
  const [rechargeModal, setRechargeModal] = useState<{show: boolean; poolId?: number; poolName?: string}>({ show: false });
  const [rechargeAmount, setRechargeAmount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, poolsRes, txRes] = await Promise.all([
        fetch('/api/admin/energy?action=stats'),
        fetch('/api/admin/energy'),
        fetch('/api/admin/energy?action=transactions'),
      ]);

      const statsData = await statsRes.json();
      const poolsData = await poolsRes.json();
      const txData = await txRes.json();

      setStats(statsData);
      setPools(poolsData.pools || []);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecharge = async () => {
    if (!rechargeModal.poolId || !rechargeAmount) return;

    try {
      await fetch('/api/admin/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recharge',
          pool_id: rechargeModal.poolId,
          amount: rechargeAmount,
        }),
      });
      setRechargeModal({ show: false });
      setRechargeAmount('');
      fetchData();
    } catch (error) {
      console.error('Failed to recharge:', error);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>能量池管理</h1>

      {/* 顶部统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>当前总能量 (TC)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{loading ? '...' : formatNumber(stats?.totalCurrent || 0)}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>今日消耗 (TC)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>-{loading ? '...' : formatNumber(stats?.todayConsume || 0)}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>在线机器人</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{loading ? '...' : stats?.activeBots || 0}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>今日 recharge</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>+{loading ? '...' : formatNumber(stats?.todayRecharge || 0)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧 Tab */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={tabListStyle}>
            <button onClick={() => setActiveTab('pools')} style={tabItemStyle(activeTab === 'pools')}>
              能量池列表
            </button>
            <button onClick={() => setActiveTab('bots')} style={tabItemStyle(activeTab === 'bots')}>
              机器人分配
            </button>
            <button onClick={() => setActiveTab('history')} style={tabItemStyle(activeTab === 'history')}>
              充值记录
            </button>
          </div>
        </div>

        {/* 右侧内容 */}
        <div style={{ flex: 1 }}>
          {activeTab === 'pools' && (
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>池子名称</th>
                    <th style={th}>容量 (TC)</th>
                    <th style={th}>当前剩余</th>
                    <th style={th}>使用率</th>
                    <th style={th}>状态</th>
                    <th style={th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ ...td, textAlign: 'center' }}>加载中...</td></tr>
                  ) : pools.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...td, textAlign: 'center' }}>暂无数据</td></tr>
                  ) : (
                    pools.map((pool) => {
                      const usage = pool.capacity > 0 ? (parseFloat(pool.current_amount) / parseFloat(pool.capacity)) * 100 : 0;
                      return (
                        <tr key={pool.id}>
                          <td style={td}>{pool.name} ({pool.name_en})</td>
                          <td style={td}>{formatNumber(parseFloat(pool.capacity))}</td>
                          <td style={td}>{formatNumber(parseFloat(pool.current_amount))}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${usage}%`, height: '100%', background: usage > 80 ? '#ef4444' : usage > 50 ? '#f59e0b' : '#10b981' }} />
                              </div>
                              <span style={{ fontSize: 12 }}>{usage.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td style={td}><span style={statusBadgeStyle(pool.status)}>{pool.status === 'active' ? '正常' : '禁用'}</span></td>
                          <td style={td}><button style={actionBtnStyle} onClick={() => setRechargeModal({ show: true, poolId: pool.id, poolName: pool.name })}>充值</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bots' && (
            <div style={placeholderStyle}>
              机器人分配管理界面（模拟数据）
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>Bot A - 占用 12.5 TC</div>
                <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>Bot B - 占用 8.2 TC</div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={tableContainerStyle}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>时间</th>
                    <th style={th}>类型</th>
                    <th style={th}>数量 (TC)</th>
                    <th style={th}>操作人</th>
                    <th style={th}>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ ...td, textAlign: 'center' }}>加载中...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ ...td, textAlign: 'center' }}>暂无记录</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={td}>{new Date(tx.created_at).toLocaleString('zh-CN')}</td>
                        <td style={td}>{tx.type === 'recharge' ? '充值' : '消耗'}</td>
                        <td style={{ ...td, color: tx.type === 'recharge' ? '#10b981' : '#ef4444' }}>
                          {tx.type === 'recharge' ? '+' : '-'}{formatNumber(parseFloat(tx.amount))}
                        </td>
                        <td style={td}>{tx.operator || '-'}</td>
                        <td style={td}>{tx.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 充值弹窗 */}
      {rechargeModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400 }}>
            <h3 style={{ margin: '0 0 16px' }}>为 {rechargeModal.poolName} 充值</h3>
            <input
              type="number"
              placeholder="请输入充值数量"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRechargeModal({ show: false })} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>取消</button>
              <button onClick={handleRecharge} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>确认充值</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const statCardStyle: React.CSSProperties = {
  padding: 16,
  background: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
};

const tabListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  background: '#ffffff',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
};

const tabItemStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: active ? '#eff6ff' : 'transparent',
  color: active ? '#2563eb' : '#4b5563',
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s',
});

const tableContainerStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  color: '#6b7280',
  padding: '10px 10px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
};

const td: React.CSSProperties = {
  padding: '10px 10px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: 13,
  color: '#374151',
};

const statusBadgeStyle = (status: string): React.CSSProperties => ({
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  background: status === '正常' ? '#d1fae5' : '#fee2e2',
  color: status === '正常' ? '#065f46' : '#991b1b',
});

const actionBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  fontSize: 12,
  cursor: 'pointer',
};

const placeholderStyle: React.CSSProperties = {
  padding: 40,
  background: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  textAlign: 'center',
  color: '#6b7280',
};
