'use client';

import { useEffect, useState } from 'react';

export default function TrxWalletPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>TRC20 钱包管理</h1>
      
      <div style={{ 
        padding: 40, 
        background: '#fff', 
        borderRadius: 12, 
        border: '1px solid #e5e7eb', 
        textAlign: 'center',
        color: '#6b7280' 
      }}>
        <div style={{ marginBottom: 16, fontSize: 48 }}>🚧</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#374151' }}>功能开发中</h2>
        <p>TRC20 钱包管理模块正在紧张开发中，敬请期待。</p>
        <button 
          style={{
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer'
          }}
          onClick={() => window.history.back()}
        >
          返回上一页
        </button>
      </div>
    </div>
  );
}
