'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SIDEBAR_WIDTH = 260;
const BREAKPOINT = 900;

// 简单 SVG 图标（无额外依赖）
const Icons = {
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  key: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  server: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
      <line x1="10" y1="6" x2="10" y2="6" />
      <line x1="10" y1="18" x2="10" y2="18" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  bot: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  ),
  exchange: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  battery: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="10" x2="23" y2="14" />
    </svg>
  ),
  wallet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  ),
};

const BASE = '/secure-admin-8f3k9q';

const NAV_GROUPS: {
  title: string;
  children: { name: string; href: string; icon: keyof typeof Icons }[];
}[] = [
  {
    title: '系统管理',
    children: [
      { name: '仪表台', href: `${BASE}/dashboard`, icon: 'dashboard' },
      { name: '系统设置', href: `${BASE}/settings`, icon: 'settings' },
      { name: '授权与更新', href: `${BASE}/license`, icon: 'key' },
    ],
  },
  {
    title: 'API服务管理',
    children: [
      { name: '服务器列表', href: `${BASE}/servers`, icon: 'server' },
      { name: 'API用户管理', href: `${BASE}/api-users`, icon: 'users' },
      { name: '机器人列表', href: `${BASE}/bots`, icon: 'bot' },
    ],
  },
  {
    title: 'API功能管理',
    children: [
      { name: '兑币功能', href: `${BASE}/swap`, icon: 'exchange' },
      { name: '能量池管理', href: `${BASE}/energy`, icon: 'battery' },
      { name: 'TON配置', href: `${BASE}/ton-wallets`, icon: 'wallet' },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // 暗色模式切换
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggle = (i: number) => {
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const showHamburger = !isDesktop;
  const sidebarVisible = isDesktop || open;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: darkMode ? '#111827' : '#f3f4f6',
        color: darkMode ? '#f9fafb' : '#111827',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        transition: 'background 0.3s ease, color 0.3s ease',
      }}
    >
      {/* 顶部通栏 Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
          background: darkMode ? '#1f2937' : '#ffffff',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showHamburger && (
            <button
              onClick={() => setOpen(!open)}
              aria-label="打开菜单"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 8,
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                background: darkMode ? '#374151' : '#ffffff',
                color: darkMode ? '#d1d5db' : '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <Link
            href={`${BASE}/dashboard`}
            style={{ color: darkMode ? '#f9fafb' : '#111827', textDecoration: 'none', fontWeight: 700, fontSize: 16, transition: 'opacity 0.2s ease' }}
          >
            API-Web 后台
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 暗色模式切换 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "切换到亮色模式" : "切换到暗色模式"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              background: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#fbbf24' : '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {darkMode ? Icons.sun : Icons.moon}
          </button>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            aria-label="退出登录"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              background: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#f87171' : '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {Icons.logout}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {showHamburger && open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 40,
              opacity: open ? 1 : 0,
              transition: 'opacity 200ms ease',
              pointerEvents: open ? 'auto' : 'none',
            }}
          />
        )}

        {/* 侧边栏：Sticky 定位 */}
        <aside
          style={{
            position: 'sticky',
            top: 56, // Header height
            left: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            height: 'calc(100vh - 56px)', // 确保 sticky 有效
            flexShrink: 0,
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRight: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 45,
            padding: 16,
            overflowY: 'auto',
            boxShadow: sidebarVisible ? (darkMode ? 'none' : '4px 0 24px rgba(0,0,0,0.08)') : 'none',
            transitionProperty: 'transform, box-shadow, background, border-color',
          }}
        >
          <div style={{ fontSize: 13, color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: 12 }}>导航菜单</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NAV_GROUPS.map((group, groupIndex) => (
              <div key={groupIndex}>
                {groupIndex > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: darkMode ? '#374151' : '#e5e7eb',
                      margin: '8px 0 12px 0',
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => toggle(groupIndex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 0',
                    border: 'none',
                    background: 'transparent',
                    color: darkMode ? '#d1d5db' : '#374151',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <span>{group.title}</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      transform: expanded[groupIndex] !== false ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                      color: darkMode ? '#6b7280' : '#9ca3af',
                    }}
                    aria-hidden
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>

                {expanded[groupIndex] !== false && (
                  <div
                    style={{
                      paddingLeft: 14,
                      borderLeft: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      marginLeft: 6,
                    }}
                  >
                    {group.children.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            textDecoration: 'none',
                            color: active ? 'rgb(0, 112, 243)' : (darkMode ? '#d1d5db' : '#374151'),
                            background: active ? (darkMode ? '#1f2937' : '#ffffff') : 'transparent',
                            borderLeft: active ? '1px solid rgb(0, 112, 243)' : '1px solid transparent',
                            marginLeft: -15,
                            paddingLeft: active ? 18 : 14,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                            paddingTop: 10,
                            paddingBottom: 10,
                            paddingRight: 12,
                            fontSize: 13,
                            fontWeight: active ? 600 : 500,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: active ? 'rgb(0, 112, 243)' : (darkMode ? '#9ca3af' : '#6b7280') }}>
                            {Icons[item.icon]}
                          </span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main
          style={{
            flex: 1,
            padding: 16,
            paddingBottom: 48,
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
