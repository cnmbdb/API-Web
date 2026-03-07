# API-Web 安全替代服务

这是一个安全的 API 服务，用于替代原项目中的后门服务器。

## 架构与角色

- **机器人系统**（如 `tgbot-Ultra-v1`）：部署在**多台不同服务器**上，每台机器可运行一个或多个 TG 机器人实例，并配置管理员用户名等。
- **本系统（API-Web）**：**群控 API 系统**，作为统一入口：
  - 接收来自各服务器上机器人系统的 API 请求（TRON/TON/ERC 等）。
  - 后台（`/secure-admin-8f3k9q`）可查看：**服务器列表**（按公网 IP 聚合）、**API 用户**（按公网 IP 的调用统计）、**机器人列表**（TG 机器人、管理员用户名、按服务器分组）。

**生产环境**：一套 API-Web 会面对**无数台**部署在不同服务器上的机器人系统；后台的「API 服务管理」即用于集中查看与管理这些服务器与机器人。

### 机器人系统对接：只配一个 API 连接 url

机器人后台只需配置**一个「API连接url」**（如 `http://host.docker.internal:4444` 或生产域名），所有接口都基于该地址：

| 用途 | 方法 | 路径（相对 API 连接 url） |
|------|------|----------------------------|
| **心跳（在线状态）** | POST | `/api/bot/heartbeat` |
| TON 支付接口（可选） | - | `/api/premium` 或 `/api/ton/premium` |
| TRON / ERC 等业务 API | - | `/api/tron/*`、`/api/erc/*` 等 |

- **心跳**：机器人进程定期（建议 ≤90 秒）请求 `POST {API连接url}/api/bot/heartbeat`，请求体示例：`{"bot_id":"机器人用户名","admin_username":"@管理员"}`（也支持 `botId`、`adminUsername` 等驼峰字段）。
- 其它业务接口的完整地址均为：`{API连接url}` + 上表路径，无需再配置多个域名或端口。

## 功能

以下路径均以「API连接url」为 base，即完整地址 = `{API连接url}` + 路径。

### TRC20 (波场) API
- `/api/tron/approve` - TRC20 授权
- `/api/tron/multiset` - 多签操作
- `/api/tron/mnepritoaddress` - 从私钥/助记词查询地址
- `/api/tron/sendtrxbypermid` - 发送 TRX
- `/api/tron/sendtrc20bypermid` - 发送 TRC20 (USDT)
- `/api/tron/delegaandundelete` - 能量委托/取消委托
- `/api/tron/getdelegatedaddress` - 查询委托地址

### 以太坊 API
- `/api/erc/mnepritoaddress` - 从私钥/助记词查询地址
- `/api/erc/addressgetbalance` - 查询余额

### TON API
- `/api/ton/premium` - TON Premium 支付

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动

## 构建

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t api-web .
docker run -p 3000:3000 api-web
```

## 环境变量

可以创建 `.env.local` 文件配置：

```
TRON_NETWORK=https://api.trongrid.io
ETH_RPC_URL=https://eth.llamarpc.com
```

## 安全说明

- 所有私钥和助记词仅在本地处理，不会发送到外部服务器
- 所有操作都使用官方 SDK 和库
- 建议在生产环境中使用 HTTPS
