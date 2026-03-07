import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'api-web-postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'apiwebpassword',
      database: process.env.DB_NAME || 'apiweb',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query(sql: string, params?: any[]): Promise<any> {
  const pool = getDbPool();
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function logApiRequest(data: {
  apiPath: string;
  method: string;
  sourceIp: string;
  publicIp?: string;
  sourceHost?: string;
  botId?: string;
  adminUsername?: string;
  botProcess?: string;
  requestData?: any;
  responseData?: any;
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
}) {
  try {
    await query(
      `INSERT INTO api_logs 
       (api_path, method, source_ip, source_host, bot_id, request_data, response_data, status_code, response_time, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.apiPath,
        data.method,
        data.sourceIp,
        data.sourceHost || null,
        data.botId || null,
        data.requestData ? JSON.stringify(data.requestData) : null,
        data.responseData ? JSON.stringify(data.responseData) : null,
        data.statusCode || null,
        data.responseTime || null,
        data.errorMessage || null,
      ]
    );

    if (data.botId) {
      await query(
        `INSERT INTO bot_connections 
         (bot_id, source_ip, public_ip, source_host, admin_username, process_name, last_request_time, request_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1, 'active')
         ON CONFLICT (bot_id) DO UPDATE SET
         source_ip = EXCLUDED.source_ip,
         public_ip = COALESCE(NULLIF(EXCLUDED.public_ip, ''), bot_connections.public_ip),
         source_host = EXCLUDED.source_host,
         admin_username = COALESCE(NULLIF(EXCLUDED.admin_username, ''), bot_connections.admin_username),
         process_name = COALESCE(NULLIF(EXCLUDED.process_name, ''), bot_connections.process_name),
         last_request_time = NOW(),
         request_count = bot_connections.request_count + 1,
         status = 'active'`,
        [
          data.botId,
          data.sourceIp,
          data.publicIp || null,
          data.sourceHost || null,
          data.adminUsername || null,
          data.botProcess || null,
        ]
      );
    }
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

export async function getApiLogs(params: {
  page?: number;
  pageSize?: number;
  apiPath?: string;
  sourceIp?: string;
  botId?: string;
  startTime?: string;
  endTime?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClause = '1=1';
  const queryParams: any[] = [];

  let paramIndex = 1;
  if (params.apiPath) {
    whereClause += ` AND api_path LIKE $${paramIndex}`;
    queryParams.push(`%${params.apiPath}%`);
    paramIndex++;
  }
  if (params.sourceIp) {
    whereClause += ` AND source_ip = $${paramIndex}`;
    queryParams.push(params.sourceIp);
    paramIndex++;
  }
  if (params.botId) {
    whereClause += ` AND bot_id = $${paramIndex}`;
    queryParams.push(params.botId);
    paramIndex++;
  }
  if (params.startTime) {
    whereClause += ` AND created_at >= $${paramIndex}`;
    queryParams.push(params.startTime);
    paramIndex++;
  }
  if (params.endTime) {
    whereClause += ` AND created_at <= $${paramIndex}`;
    queryParams.push(params.endTime);
    paramIndex++;
  }

  const logs = await query(
    `SELECT * FROM api_logs 
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, pageSize, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM api_logs WHERE ${whereClause}`,
    queryParams
  );

  return {
    logs,
    total: parseInt(countResult[0]?.total || '0'),
    page,
    pageSize,
  };
}

export async function getBotConnections(params: {
  page?: number;
  pageSize?: number;
  botId?: string;
  sourceIp?: string;
  status?: string;
  runtimeStatus?: 'online' | 'offline';
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClause = '1=1';
  const queryParams: any[] = [];

  let paramIndex = 1;
  if (params.botId) {
    whereClause += ` AND bot_id LIKE $${paramIndex}`;
    queryParams.push(`%${params.botId}%`);
    paramIndex++;
  }
  if (params.sourceIp) {
    whereClause += ` AND source_ip = $${paramIndex}`;
    queryParams.push(params.sourceIp);
    paramIndex++;
  }
  if (params.status) {
    whereClause += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }
  if (params.runtimeStatus === 'online') {
    whereClause += ` AND last_request_time >= NOW() - INTERVAL '90 seconds'`;
  }
  if (params.runtimeStatus === 'offline') {
    whereClause += ` AND last_request_time < NOW() - INTERVAL '90 seconds'`;
  }

  const connections = await query(
    `SELECT *,
      REPLACE(COALESCE(NULLIF(public_ip, ''), source_ip), '::ffff:', '') as server_ip,
      CASE
        WHEN last_request_time >= NOW() - INTERVAL '90 seconds' THEN 'online'
        ELSE 'offline'
      END as runtime_status
     FROM bot_connections 
     WHERE ${whereClause}
     ORDER BY last_request_time DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, pageSize, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) as total FROM bot_connections WHERE ${whereClause}`,
    queryParams
  );

  return {
    connections,
    total: parseInt(countResult[0]?.total || '0'),
    page,
    pageSize,
  };
}

export async function getStatistics() {
  const todayCount = await query(
    `SELECT COUNT(*) as count FROM api_logs 
     WHERE DATE(created_at) = CURRENT_DATE`
  );

  const totalCount = await query(`SELECT COUNT(*) as count FROM api_logs`);

  const activeBots = await query(
    `SELECT COUNT(*) as count FROM bot_connections 
     WHERE status = 'active' AND last_request_time >= NOW() - INTERVAL '1 hour'`
  );

  const topApis = await query(
    `SELECT api_path, COUNT(*) as count 
     FROM api_logs 
     WHERE created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY api_path 
     ORDER BY count DESC 
     LIMIT 10`
  );

  return {
    todayRequests: parseInt(todayCount[0]?.count || '0'),
    totalRequests: parseInt(totalCount[0]?.count || '0'),
    activeBots: parseInt(activeBots[0]?.count || '0'),
    topApis,
  };
}

export async function getServers(params: { page?: number; pageSize?: number }) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // 分组键：优先公网IP/来源IP，否则用来源主机名，避免第一列为空
  const groupByExpr = `COALESCE(
      NULLIF(TRIM(REPLACE(COALESCE(NULLIF(TRIM(public_ip), ''), TRIM(source_ip)), '::ffff:', '')), ''),
      COALESCE(NULLIF(TRIM(source_host), ''), '未知')
    )`;

  const rows = await query(
    `SELECT
      ${groupByExpr} as server_ip,
      COALESCE(NULLIF(MAX(source_host), ''), '-') as source_host,
      COUNT(*)::bigint as bot_count,
      SUM(request_count)::bigint as request_count,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(admin_username, '')), NULL),
        ARRAY[]::text[]
      ) as admin_usernames,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(process_name, '')), NULL),
        ARRAY[]::text[]
      ) as process_names,
      MAX(last_request_time) as last_request_time,
      BOOL_OR(last_request_time >= NOW() - INTERVAL '90 seconds') as is_online
    FROM bot_connections
    GROUP BY ${groupByExpr}
    ORDER BY last_request_time DESC
    LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const totalResult = await query(
    `SELECT COUNT(*) as total FROM (
      SELECT 1 FROM bot_connections GROUP BY ${groupByExpr}
    ) t`
  );

  return {
    servers: rows,
    total: parseInt(totalResult[0]?.total || '0'),
    page,
    pageSize,
  };
}

export async function registerBotHeartbeat(data: {
  botId: string;
  botName?: string;
  adminUsername?: string;
  processName?: string;
  sourceIp: string;
  publicIp?: string;
  sourceHost?: string;
  status?: string;
}) {
  const rows = await query(
    `INSERT INTO bot_connections
      (bot_id, bot_name, admin_username, process_name, source_ip, public_ip, source_host, last_request_time, request_count, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 1, COALESCE($8, 'active'))
     ON CONFLICT (bot_id) DO UPDATE SET
      bot_name = COALESCE(NULLIF(EXCLUDED.bot_name, ''), bot_connections.bot_name),
      admin_username = COALESCE(NULLIF(EXCLUDED.admin_username, ''), bot_connections.admin_username),
      process_name = COALESCE(NULLIF(EXCLUDED.process_name, ''), bot_connections.process_name),
      source_ip = EXCLUDED.source_ip,
      public_ip = COALESCE(NULLIF(EXCLUDED.public_ip, ''), bot_connections.public_ip),
      source_host = EXCLUDED.source_host,
      last_request_time = NOW(),
      request_count = bot_connections.request_count + 1,
      status = COALESCE(NULLIF(EXCLUDED.status, ''), 'active')
     RETURNING *`,
    [
      data.botId,
      data.botName || null,
      data.adminUsername || null,
      data.processName || null,
      data.sourceIp,
      data.publicIp || null,
      data.sourceHost || null,
      data.status || 'active',
    ]
  );

  return rows[0] || null;
}

export async function getApiUsers(params: { page?: number; pageSize?: number }) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // 按公网IP（来源 IP）聚合展示
  const rows = await query(
    `SELECT 
       REPLACE(source_ip, '::ffff:', '') as public_ip,
       COUNT(*)::bigint as request_count,
       COUNT(DISTINCT COALESCE(NULLIF(bot_id, ''), 'unknown'))::bigint as bot_count,
       MAX(created_at) as last_request_time
     FROM api_logs
     GROUP BY REPLACE(source_ip, '::ffff:', '')
     ORDER BY last_request_time DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const totalResult = await query(
    `SELECT COUNT(*) as total FROM (
      SELECT 1 FROM api_logs GROUP BY REPLACE(source_ip, '::ffff:', '')
    ) t`
  );

  return {
    users: rows,
    total: parseInt(totalResult[0]?.total || '0'),
    page,
    pageSize,
  };
}

// 按服务器 IP 分组的机器人列表（支持折叠展开）
export async function getBotConnectionsGrouped(params: {
  page?: number;
  pageSize?: number;
  runtimeStatus?: 'online' | 'offline';
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // 先找出所有不重复的服务器 IP（公网 IP 优先，否则用 source_ip）
  const serverIpQuery = `
    SELECT DISTINCT
      REPLACE(COALESCE(NULLIF(public_ip, ''), source_ip), '::ffff:', '') as server_ip
    FROM bot_connections
  `;
  const serverIps = await query(serverIpQuery);

  // 为每个服务器 IP 获取其下的所有机器人
  const groups: any[] = [];

  for (const ipRow of serverIps) {
    const serverIp = ipRow.server_ip;
    if (!serverIp) continue;

    // 获取该服务器下的所有机器人
    let botWhereClause = `REPLACE(COALESCE(NULLIF(public_ip, ''), source_ip), '::ffff:', '') = $1`;
    const botParams: any[] = [serverIp];

    if (params.runtimeStatus === 'online') {
      botWhereClause += ` AND last_request_time >= NOW() - INTERVAL '90 seconds'`;
    }
    if (params.runtimeStatus === 'offline') {
      botWhereClause += ` AND last_request_time < NOW() - INTERVAL '90 seconds'`;
    }

    const bots = await query(
      `SELECT 
        id, bot_id, bot_name, admin_username, process_name,
        source_ip, public_ip, source_host, last_request_time, request_count, status,
        CASE
          WHEN last_request_time >= NOW() - INTERVAL '90 seconds' THEN 'online'
          ELSE 'offline'
        END as runtime_status
       FROM bot_connections
       WHERE ${botWhereClause}
       ORDER BY last_request_time DESC`,
      botParams
    );

    if (bots.length > 0) {
      const totalRequests = bots.reduce((sum: number, b: any) => sum + (parseInt(b.request_count) || 0), 0);
      const lastActivity = bots.reduce((latest: string, b: any) => {
        if (!latest) return b.last_request_time;
        return b.last_request_time > latest ? b.last_request_time : latest;
      }, '' as string);

      // 统计在线数量
      const onlineCount = bots.filter((b: any) => b.runtime_status === 'online').length;

      groups.push({
        server_ip: serverIp,
        bots: bots,
        bot_count: bots.length,
        online_count: onlineCount,
        total_requests: totalRequests,
        last_activity: lastActivity,
      });
    }
  }

  // 按最后活动时间排序
  groups.sort((a, b) => {
    if (!a.last_activity) return 1;
    if (!b.last_activity) return -1;
    return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
  });

  // 分页
  const paginatedGroups = groups.slice(offset, offset + pageSize);

  return {
    groups: paginatedGroups,
    total: groups.length,
    page,
    pageSize,
  };
}

// 删除机器人连接（按 ID）
export async function deleteBotConnection(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM bot_connections WHERE id = $1 RETURNING id',
    [id]
  );
  return result.length > 0;
}

// 删除 API 用户（按公网 IP，删除该 IP 的所有日志）
export async function deleteApiUser(publicIp: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM api_logs WHERE source_ip = $1 OR source_ip = $2 RETURNING id',
    [publicIp, `::ffff:${publicIp}`]
  );
  return true;
}

// 删除服务器记录（按 source_host 删除所有关联的 bot_connections）
export async function deleteServer(sourceHost: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM bot_connections WHERE source_host = $1 RETURNING id',
    [sourceHost]
  );
  return result.length > 0;
}

// =============================================
// 能量池管理相关函数
// =============================================

export async function getEnergyPools() {
  return query('SELECT * FROM energy_pools ORDER BY id');
}

export async function getEnergyPoolById(id: number) {
  const rows = await query('SELECT * FROM energy_pools WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function createEnergyPool(data: {
  name: string;
  name_en?: string;
  capacity: number;
  status?: string;
}) {
  const rows = await query(
    `INSERT INTO energy_pools (name, name_en, capacity, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.name_en || null, data.capacity, data.status || 'active']
  );
  return rows[0];
}

export async function updateEnergyPool(id: number, data: {
  name?: string;
  name_en?: string;
  capacity?: number;
  current_amount?: number;
  status?: string;
}) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.name_en !== undefined) {
    fields.push(`name_en = $${paramIndex++}`);
    values.push(data.name_en);
  }
  if (data.capacity !== undefined) {
    fields.push(`capacity = $${paramIndex++}`);
    values.push(data.capacity);
  }
  if (data.current_amount !== undefined) {
    fields.push(`current_amount = $${paramIndex++}`);
    values.push(data.current_amount);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const rows = await query(
    `UPDATE energy_pools SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return rows[0] || null;
}

export async function getBotEnergyAllocations(poolId?: number) {
  let sql = 'SELECT * FROM bot_energy_allocations';
  const params: any[] = [];

  if (poolId) {
    sql += ' WHERE pool_id = $1';
    params.push(poolId);
  }
  sql += ' ORDER BY id';

  return query(sql, params);
}

export async function createEnergyTransaction(data: {
  pool_id?: number;
  bot_id?: string;
  type: string;
  amount: number;
  operator?: string;
  note?: string;
}) {
  const rows = await query(
    `INSERT INTO energy_transactions (pool_id, bot_id, type, amount, operator, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.pool_id || null, data.bot_id || null, data.type, data.amount, data.operator || null, data.note || null]
  );

  // 更新池子当前余额
  if (data.pool_id) {
    const sign = data.type === 'recharge' ? 1 : -1;
    await query(
      `UPDATE energy_pools SET current_amount = current_amount + $1 * $2, updated_at = NOW() WHERE id = $3`,
      [data.amount, sign, data.pool_id]
    );
  }

  return rows[0];
}

export async function getEnergyTransactions(poolId?: number, limit = 50) {
  let sql = 'SELECT * FROM energy_transactions';
  const params: any[] = [];

  if (poolId) {
    sql += ' WHERE pool_id = $1';
    params.push(poolId);
  }
  sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  return query(sql, params);
}

// 能量池统计数据
export async function getEnergyStats() {
  const pools = await query('SELECT SUM(capacity) as total_capacity, SUM(current_amount) as total_current FROM energy_pools WHERE status = $1', ['active']);
  const todayTx = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM energy_transactions WHERE type = $1 AND DATE(created_at) = CURRENT_DATE`,
    ['consume']
  );
  const activeBots = await query('SELECT COUNT(DISTINCT bot_id) as count FROM bot_energy_allocations');
  const todayRecharge = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM energy_transactions WHERE type = $1 AND DATE(created_at) = CURRENT_DATE`,
    ['recharge']
  );

  return {
    totalCapacity: parseFloat(pools[0]?.total_capacity || '0'),
    totalCurrent: parseFloat(pools[0]?.total_current || '0'),
    todayConsume: parseFloat(todayTx[0]?.total || '0'),
    activeBots: parseInt(activeBots[0]?.count || '0'),
    todayRecharge: parseFloat(todayRecharge[0]?.total || '0'),
  };
}

// =============================================
// 系统设置相关函数
// =============================================

export async function getSystemSettings() {
  return query('SELECT * FROM system_settings ORDER BY id');
}

export async function getSystemSetting(key: string) {
  const rows = await query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
  return rows[0] || null;
}

export async function setSystemSetting(key: string, value: string, description?: string) {
  const rows = await query(
    `INSERT INTO system_settings (setting_key, setting_value, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, description = COALESCE($3, system_settings.description), updated_at = NOW()
     RETURNING *`,
    [key, value, description || null]
  );
  return rows[0];
}

export async function deleteSystemSetting(key: string): Promise<boolean> {
  const result = await query('DELETE FROM system_settings WHERE setting_key = $1 RETURNING id', [key]);
  return result.length > 0;
}

// =============================================
// 授权相关函数
// =============================================

export async function getLicense() {
  const rows = await query('SELECT * FROM licenses ORDER BY id DESC LIMIT 1');
  return rows[0] || null;
}

export async function createLicense(data: {
  license_key: string;
  license_type?: string;
  max_bots?: number;
  expires_at?: string;
}) {
  const rows = await query(
    `INSERT INTO licenses (license_key, license_type, max_bots, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.license_key, data.license_type || 'permanent', data.max_bots || null, data.expires_at || null]
  );
  return rows[0];
}

export async function updateLicense(id: number, data: {
  license_key?: string;
  license_type?: string;
  max_bots?: number;
  expires_at?: string;
}) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.license_key !== undefined) {
    fields.push(`license_key = $${paramIndex++}`);
    values.push(data.license_key);
  }
  if (data.license_type !== undefined) {
    fields.push(`license_type = $${paramIndex++}`);
    values.push(data.license_type);
  }
  if (data.max_bots !== undefined) {
    fields.push(`max_bots = $${paramIndex++}`);
    values.push(data.max_bots);
  }
  if (data.expires_at !== undefined) {
    fields.push(`expires_at = $${paramIndex++}`);
    values.push(data.expires_at);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const rows = await query(
    `UPDATE licenses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return rows[0] || null;
}

// =============================================
// 兑币相关函数
// =============================================

export async function getSwapPairs(enabledOnly = true) {
  let sql = 'SELECT * FROM swap_pairs';
  if (enabledOnly) {
    sql += ' WHERE enabled = true';
  }
  sql += ' ORDER BY id';
  return query(sql);
}

export async function getSwapPair(fromToken: string, toToken: string) {
  const rows = await query(
    'SELECT * FROM swap_pairs WHERE from_token = $1 AND to_token = $2 AND enabled = true',
    [fromToken, toToken]
  );
  return rows[0] || null;
}

export async function getSwapPools() {
  return query('SELECT * FROM swap_pools ORDER BY token');
}

export async function updateSwapPoolBalance(token: string, amount: number, isAdd = true) {
  const rows = await query(
    `UPDATE swap_pools SET balance = balance ${isAdd ? '+' : '-'} $1, updated_at = NOW()
     WHERE token = $2 RETURNING *`,
    [amount, token]
  );
  return rows[0] || null;
}

export async function createSwapTransaction(data: {
  user_id?: string;
  from_token: string;
  to_token: string;
  from_amount: number;
  to_amount: number;
  rate: number;
  status?: string;
}) {
  const rows = await query(
    `INSERT INTO swap_transactions (user_id, from_token, to_token, from_amount, to_amount, rate, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.user_id || null, data.from_token, data.to_token, data.from_amount, data.to_amount, data.rate, data.status || 'completed']
  );
  return rows[0];
}

export async function getSwapTransactions(limit = 50) {
  return query('SELECT * FROM swap_transactions ORDER BY created_at DESC LIMIT $1', [limit]);
}

export async function getSwapStats() {
  const pools = await query('SELECT token, balance FROM swap_pools');
  const todayVolume = await query(
    `SELECT COALESCE(SUM(from_amount), 0) as total FROM swap_transactions WHERE DATE(created_at) = CURRENT_DATE`
  );
  const totalFees = await query(
    `SELECT COALESCE(SUM(from_amount * 0.001), 0) as total FROM swap_transactions`
  );

  return {
    pools,
    todayVolume: parseFloat(todayVolume[0]?.total || '0'),
    totalFees: parseFloat(totalFees[0]?.total || '0'),
  };
}
