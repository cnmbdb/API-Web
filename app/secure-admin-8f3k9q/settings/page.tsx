'use client';

import { useState, useEffect } from 'react';

interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  const [systemName, setSystemName] = useState('API-Web');
  const [language, setLanguage] = useState('zh-CN');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [emailNotify, setEmailNotify] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const settingsList = data.settings || [];

      // 从API获取设置并填充表单
      const findSetting = (key: string) => settingsList.find((s: SystemSetting) => s.key === key)?.value;

      if (findSetting('system_name')) setSystemName(findSetting('system_name')!);
      if (findSetting('language')) setLanguage(findSetting('language')!);
      if (findSetting('timezone')) setTimezone(findSetting('timezone')!);
      if (findSetting('email_notify')) setEmailNotify(findSetting('email_notify') === 'true');
      if (findSetting('webhook_enabled')) setWebhookEnabled(findSetting('webhook_enabled') === 'true');

      setSettings(settingsList);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'system_name', value: systemName, description: '系统名称' },
        { key: 'language', value: language, description: '语言设置' },
        { key: 'timezone', value: timezone, description: '时区设置' },
        { key: 'email_notify', value: emailNotify.toString(), description: '邮件通知' },
        { key: 'webhook_enabled', value: webhookEnabled.toString(), description: 'Webhook启用' },
      ];

      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', settings: settingsToSave }),
      });

      alert('设置已保存');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>系统设置</h1>
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ margin: '8px 0 16px', fontSize: 22, color: '#111827' }}>系统设置</h1>

      <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
        {/* 左侧 Tab 列表 */}
        <div style={tabListStyle}>
          <button
            onClick={() => setActiveTab('general')}
            style={tabItemStyle(activeTab === 'general')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            基础设置
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={tabItemStyle(activeTab === 'security')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            安全设置
          </button>
          <button
            onClick={() => setActiveTab('notification')}
            style={tabItemStyle(activeTab === 'notification')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            通知设置
          </button>
        </div>

        {/* 右侧内容区 */}
        <div style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <div style={contentCardStyle}>
              <h3 style={sectionTitleStyle}>基础设置</h3>
              <div style={formGroupStyle}>
                <label style={labelStyle}>系统名称</label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>语言</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={inputStyle}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>时区</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </select>
              </div>
              <button style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={contentCardStyle}>
              <h3 style={sectionTitleStyle}>安全设置</h3>
              <div style={formGroupStyle}>
                <label style={labelStyle}>当前密码</label>
                <input type="password" placeholder="请输入当前密码" style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>新密码</label>
                <input type="password" placeholder="请输入新密码" style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>确认新密码</label>
                <input type="password" placeholder="请再次输入新密码" style={inputStyle} />
              </div>
              <button style={primaryBtnStyle}>修改密码</button>
            </div>
          )}

          {activeTab === 'notification' && (
            <div style={contentCardStyle}>
              <h3 style={sectionTitleStyle}>通知设置</h3>
              <div style={formGroupStyle}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emailNotify}
                    onChange={(e) => setEmailNotify(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  启用邮件通知
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>当系统发生异常时发送邮件提醒</p>
              </div>
              <div style={formGroupStyle}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={webhookEnabled}
                    onChange={(e) => setWebhookEnabled(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  启用 Webhook
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>推送系统日志到指定 URL</p>
              </div>
              <button style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存偏好'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  display: 'flex',
  alignItems: 'center',
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

const contentCardStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 24,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: 12,
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const primaryBtnStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
};
