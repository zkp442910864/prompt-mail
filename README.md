# Prompt-Mail

AI 驱动的智能邮件客户端，支持多邮箱管理、AI 自动回复与翻译、富文本编辑。

## 功能特性

- **多邮箱管理** — 支持阿里个人/阿里企业/QQ/Gmail 等邮箱，IMAP 收信 + SMTP 发信
- **Gmail 风格邮件列表** — 虚拟滚动、未读标记、筛选（全部/未读/已读）、批量选择
- **富文本回复** — TipTap 编辑器，支持加粗/斜体/代码/列表，拖拽附件上传
- **AI 智能回复** — 一键生成专业回复，支持自定义 System Prompt
- **AI 中文翻译** — 一键翻译外文邮件为中文，原文/译文切换查看
- **系统邮件识别** — 自动从邮件正文提取真实客户邮箱（如 Shopify 通知邮件），避免回复到系统地址
- **已读状态同步** — 点击邮件自动标记已读，乐观更新 UI 无延迟

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| UI 组件 | Ant Design 5 |
| 富文本 | TipTap |
| 样式 | UnoCSS (preset-wind4) |
| 数据请求 | TanStack React Query 5 |
| 虚拟列表 | TanStack Virtual |
| 后端框架 | Express 5 |
| 邮件协议 | imapflow + nodemailer + mailparser |
| AI 接口 | OpenAI 兼容 API |
| 构建工具 | Vite 7 |

## 快速开始

### 环境要求

- Node.js >= 22
- npm

### 安装与启动

```bash
# 安装依赖
npm install

# 同时启动前端 dev server + 后端 API server
npm start
```

前端默认运行在 `http://localhost:5173`，后端 API 在 `http://localhost:3001`。

也可以分别启动：

```bash
# 仅启动前端
npm run dev

# 仅启动后端
npm run server
```

### 首次配置

1. 打开设置页面，修改默认邮箱配置 — 填入真实邮箱账号和授权码
2. 配置 AI 服务（API Base URL、API Key、模型名称）以启用智能回复和翻译功能

## 项目结构

```
prompt-mail/
├── server/                    # 后端
│   ├── controllers/           # 路由控制器
│   ├── services/              # 业务逻辑（IMAP/SMTP/AI）
│   ├── stores/                # JSON 文件数据存储
│   ├── routes/                # Express 路由注册
│   ├── middlewares/           # 中间件（错误处理、日志）
│   └── index.ts               # 入口
├── src/                       # 前端
│   ├── features/
│   │   ├── mail/              # 邮件模块
│   │   │   ├── components/    # 邮件列表/详情/回复编辑器/筛选栏
│   │   │   ├── hooks/         # useMailList/useMailDetail/useMarkRead/useMailReply
│   │   │   └── context/       # MailContext（选中/筛选/邮箱配置状态）
│   │   ├── config/            # 设置模块
│   │   └── ai/                # AI 模块（生成回复/翻译）
│   ├── services/              # API 请求封装
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数（邮件提取/HTML 净化/存储）
│   └── components/            # 通用组件
├── vite.config.ts
├── uno.config.ts
└── tsconfig.json
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mail/list` | 获取邮件列表 |
| GET | `/api/mail/:id` | 获取邮件详情 |
| PATCH | `/api/mail/:id/read` | 标记邮件已读 |
| POST | `/api/mail/reply` | 发送回复邮件 |
| GET | `/api/attachment/:id/download` | 下载附件 |
| GET | `/api/email-config` | 获取邮箱配置 |
| POST | `/api/email-config` | 保存邮箱配置 |
| POST | `/api/ai/generate` | AI 生成回复 |
| POST | `/api/ai/translate` | AI 翻译中文 |
| GET | `/api/ai-config` | 获取 AI 配置 |
| POST | `/api/ai-config` | 保存 AI 配置 |

## License

MIT
