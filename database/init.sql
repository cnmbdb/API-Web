-- API-Web PostgreSQL 数据库初始化脚本

-- API 请求日志表
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  api_path VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  source_ip VARCHAR(45) NOT NULL,
  source_host VARCHAR(255),
  bot_id VARCHAR(100),
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_api_path ON api_logs(api_path);
CREATE INDEX idx_api_logs_source_ip ON api_logs(source_ip);
CREATE INDEX idx_api_logs_bot_id ON api_logs(bot_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

-- 机器人连接表
CREATE TABLE IF NOT EXISTS bot_connections (
  id BIGSERIAL PRIMARY KEY,
  bot_id VARCHAR(100) NOT NULL UNIQUE,
  bot_name VARCHAR(255),
  -- Telegram 机器人管理员用户名（例如 @xxxx）
  admin_username VARCHAR(255),
  -- 机器人进程标识或名称（例如 job-worker-1、tg-bot-main 等）
  process_name VARCHAR(255),
  -- 机器人服务器公网IP（建议由机器人显式上报；否则可能只能拿到内网/NAT IP）
  public_ip VARCHAR(45),
  source_ip VARCHAR(45) NOT NULL,
  source_host VARCHAR(255),
  last_request_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_count BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_connections_source_ip ON bot_connections(source_ip);
CREATE INDEX idx_bot_connections_public_ip ON bot_connections(public_ip);
CREATE INDEX idx_bot_connections_last_request_time ON bot_connections(last_request_time);

-- =============================================
-- 能量池管理相关表
-- =============================================

-- 能量池表
CREATE TABLE IF NOT EXISTS energy_pools (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  capacity DECIMAL(20, 2) NOT NULL DEFAULT 0,
  current_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 机器人能量分配表
CREATE TABLE IF NOT EXISTS bot_energy_allocations (
  id BIGSERIAL PRIMARY KEY,
  bot_id VARCHAR(100) NOT NULL,
  pool_id BIGINT NOT NULL,
  allocated_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES energy_pools(id) ON DELETE CASCADE
);

-- 能量充值/消耗记录表
CREATE TABLE IF NOT EXISTS energy_transactions (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT,
  bot_id VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  operator VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES energy_pools(id) ON DELETE SET NULL
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 授权信息表
CREATE TABLE IF NOT EXISTS licenses (
  id BIGSERIAL PRIMARY KEY,
  license_key VARCHAR(255) NOT NULL UNIQUE,
  license_type VARCHAR(50) DEFAULT 'permanent',
  max_bots INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 兑币交易对表
CREATE TABLE IF NOT EXISTS swap_pairs (
  id BIGSERIAL PRIMARY KEY,
  from_token VARCHAR(20) NOT NULL,
  to_token VARCHAR(20) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_token, to_token)
);

-- 资金池表
CREATE TABLE IF NOT EXISTS swap_pools (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(20) NOT NULL UNIQUE,
  balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 兑币记录表
CREATE TABLE IF NOT EXISTS swap_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  from_token VARCHAR(20) NOT NULL,
  to_token VARCHAR(20) NOT NULL,
  from_amount DECIMAL(20, 2) NOT NULL,
  to_amount DECIMAL(20, 2) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
