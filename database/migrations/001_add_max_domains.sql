-- 添加 max_domains 字段和绑定域名列表
ALTER TABLE robot_auth_codes ADD COLUMN IF NOT EXISTS max_domains INTEGER NOT NULL DEFAULT 4;
ALTER TABLE robot_auth_codes ADD COLUMN IF NOT EXISTS bound_domains TEXT[] DEFAULT '{}';
