'use client';

import { useState, useEffect } from 'react';

interface SwapPool {
  token: string;
  balance: string;
}

interface SwapStats {
  pools: SwapPool[];
  todayVolume: number;
  totalFees: number;
}

export default function SwapPage() {
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('TON');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SwapStats | null>(null);
  const [swapping, setSwapping] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pairsRes] = await Promise.all([
        fetch('/api/swap?action=stats'),
        fetch('/api/swap'),
      ]);

      const statsData = await statsRes.json();
      const pairsData = await pairsRes.json();

      setStats(statsData);

      // 查找当前交易对的汇率
      const pair = pairsData.pairs?.find((p: any) => p.from_token === fromToken && p.to_token === toToken);
      if (pair) {
        setRate(parseFloat(pair.rate));
      }
    } catch (error) {
      console.error('Failed to fetch swap data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // 计算兑换金额
    if (fromAmount && rate) {
      setToAmount((parseFloat(fromAmount) * rate).toFixed(2));
    } else {
      setToAmount('');
    }
  }, [fromAmount, rate]);

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;

    setSwapping(true);
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          from_token: fromToken,
          to_token: toToken,
          from_amount: fromAmount,
        }),
      });

      const data = await res.json();
      if (data.transaction) {
        alert('兑换成功！');
        setFromAmount('');
        setToAmount('');
        fetchData();
      } else {
        alert(data.error || '兑换失败');
      }
    } catch (error) {
      console.error('Swap error:', error);
      alert('兑换失败');
    } finally {
      setSwapping(false);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const usdtPool = stats?.pools?.find(p => p.token === 'USDT');
  const tonPool = stats?.pools?.find(p => p.token === 'TON');

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>兑币功能</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* 兑换面板 */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>快速兑换</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>支付</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={fromToken}
                onChange={(e) => {
                  setFromToken(e.target.value);
                  setRate(null);
                }}
                style={{ ...inputStyle, width: 100 }}
              >
                <option value="USDT">USDT</option>
                <option value="TON">TON</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0' }}>
            <button style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
              ↓
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>收到</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="0.00"
                value={toAmount}
                readOnly
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={toToken}
                onChange={(e) => {
                  setToToken(e.target.value);
                  setRate(null);
                }}
                style={{ ...inputStyle, width: 100 }}
              >
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            {loading ? '加载中...' : rate ? `汇率: 1 ${fromToken} ≈ ${rate.toFixed(4)} ${toToken}` : '暂无汇率信息'}
          </div>

          <button
            style={{ ...primaryBtnStyle, opacity: swapping ? 0.7 : 1 }}
            onClick={handleSwap}
            disabled={swapping || !fromAmount || !toAmount}
          >
            {swapping ? '兑换中...' : '立即兑换'}
          </button>
        </div>

        {/* 资金池概览 */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>资金池状态</h3>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={poolItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#4b5563', fontSize: 13 }}>USDT 池子总量</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{loading ? '...' : formatNumber(parseFloat(usdtPool?.balance || '0'))}</span>
              </div>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: '#10b981' }} />
              </div>
            </div>

            <div style={poolItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#4b5563', fontSize: 13 }}>TON 池子总量</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{loading ? '...' : formatNumber(parseFloat(tonPool?.balance || '0'))}</span>
              </div>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: '#3b82f6' }} />
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#6b7280' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>24h 交易量</span>
                <span style={{ fontWeight: 600 }}>${loading ? '...' : formatNumber(stats?.todayVolume || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>累计手续费收益</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>${loading ? '...' : formatNumber(stats?.totalFees || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 24,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#4b5563',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
};

const poolItemStyle: React.CSSProperties = {
  padding: 12,
  border: '1px solid #f3f4f6',
  borderRadius: 8,
  background: '#fafafa',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer',
};
