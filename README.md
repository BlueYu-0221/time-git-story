# 光阴的故事 · 第 ∞ 号当铺

> 一间只属于你的「光阴当铺」——把平凡的日子存进来，用 AI 帮你读懂时间、金钱与心情。

「光阴的故事」是一款 **AI 个人记录工具**。它把「时间 / 金钱 / 心情 / 白日梦想家」四本账本放进一间温柔的当铺，本地记录 + AI 生成报告，让每一天都被认真收藏。项目为 **上海开源软件应用创新大赛（开源 AI 工具赛道）** 参赛作品。

本仓库为 **Next.js 工程化版本**，由原单文件应用（`index.html`）迁移而来。

## ✨ 功能特性

| 模块 | 路由 | 说明 |
| --- | --- | --- |
| 🕰 时间当铺 | `/time` | 记录每天做了什么、计划了什么，AI 生成「时间体检报告」：完成率、计划外时间、与上期对比 |
| 🪙 金钱当铺 | `/money` | 记一笔支出，AI 生成「铜钱分析报告」：必要 / 可优化 / 非必要支出、隐形浪费、环比上周 |
| 🌤 心情当铺 | `/mood` | 记录今日心情，生成心情词云、情绪曲线与 AI 解读 |
| 🌱 白日梦想家 | `/dream` | 写下想做的事，AI 帮你把它拆解成可执行的第一步 |
| 🌙 月光宝盒 / 我们的纪念 | `/`（首页内） | 收藏瞬间与信件；「我们的纪念」为二人情侣纪念册，可按年生成年度故事 |
| 🎫 分享卡片 | 各模块内 | 一键生成适合发朋友圈的竖版分享卡（Canvas 绘制，可下载） |
| 🤖 AI 智能体 | — | 前端请求服务端 `/api/ai` 代理转发 DeepSeek；**服务端未配置 Key 时自动使用内置模拟文案**，无网也能完整演示 |

## 🧠 技术架构

- **框架**：Next.js 16（App Router）+ React 19 + TypeScript，全部页面静态预渲染
- **路由**：`/` 首页（大门 / 招牌 / 四张卡片 / 纪念册 / 月光宝盒 / 设置）；`/time` `/money` `/mood` `/dream` 四个模块独立页面
- **样式**：`app/globals.css`，原单文件应用的完整视觉（深蓝星空 · 星河版）
- **逻辑层**：`lib/pawnshop.js` 承载原应用的业务逻辑（数据层 / AI 调用 / Canvas 分享卡 / 报告生成），以 `initPawnShop({ mode, kind, onGo, onBack })` 双模式接入：
  - `mode: 'home'`：首页完整启动（星空、开门、引导、纪念册、设置）
  - `mode: 'sheet'`：模块页启动（仅数据层 + 指定模块渲染）
  - 导航通过 `onGo` / `onBack` 回调桥接到 Next.js Router
- **数据存储**：浏览器 `localStorage`（键名 `gsdg_story_v5`），数据只保存在本机，不上传服务器
- **AI 逻辑**：`AI.call(system, user, fallback, style)` —— 携带 System Prompt 与写作风格，请求服务端 `/api/ai`，30s 超时自动降级；服务端未配置 Key 或请求失败时回落到 `MOCK` 内置文案库，界面完全可用
- **轻后端**：三个 Next.js Route Handler —— `/api/ai` 代理大模型（Key 只存服务端环境变量）、`/api/asr/sign` 生成腾讯云实时语音识别签名、`/api/parse-audio` 接收外部硬件上传的 wav 并返回识别文本 / 结构化结果 / 洞察文案；无数据库

## 📁 目录结构

```
time-story2/
├── app/
│   ├── layout.tsx            # 根布局（title / viewport / 全局样式）
│   ├── page.tsx              # 首页 /
│   ├── globals.css           # 完整视觉样式（星河版）
│   ├── time/page.tsx         # /time  时间都去哪儿了
│   ├── money/page.tsx        # /money 我的钱都去哪儿了
│   ├── mood/page.tsx         # /mood  心情树洞
│   └── dream/page.tsx        # /dream 白日梦想家
├── components/
│   ├── PawnShopApp.tsx       # 首页骨架（大门 / 招牌 / 卡片 / 纪念册容器）
│   └── SheetPage.tsx         # 模块页骨架（头部 + 返回 + 内容容器）
├── lib/
│   └── pawnshop.js           # 原应用业务逻辑（数据层 / AI / 分享卡 / 各模块渲染器）
├── next.config.ts
├── tsconfig.json
└── package.json
```

## 🖥 运行环境

- Node.js 18.18+（推荐 20+）
- 任意现代浏览器：Chrome / Edge / Safari / Firefox（最新版即可）
- 可选：如需启用真实 AI 报告，在 `.env.local` 中配置 `DEEPSEEK_API_KEY`（Key 只在服务端使用）

## 🚀 安装与启动

```bash
npm install      # 安装依赖
npm run dev      # 开发模式 http://localhost:3000
```

生产构建：

```bash
npm run build    # 构建
npm run start    # 启动 http://localhost:3000
```

首次进入会载入一份**内置的示例数据**，无需注册、无需联网，即可体验全部功能与报告。

### （可选）启用真实 AI 报告

1. 在项目根目录的 `.env.local` 中填写：

   ```bash
   DEEPSEEK_API_KEY=sk-xxxx          # 必填，换成你的真实 Key
   DEEPSEEK_BASE_URL=https://api.deepseek.com   # 可选
   DEEPSEEK_MODEL=deepseek-chat      # 可选
   ```

2. 重启 `npm run dev`（环境变量只在服务端启动时读取）；
3. 进入首页右上角 **设置（当铺后台）**，点 **测试 AI 连接** 确认服务端已接通；
4. 各模块生成报告时，前端请求 `/api/ai`，由服务端携带 Key 调用 DeepSeek，再把结果返回前端；若未配置或调用失败，会自动回落到内置模拟文案。

> 提示：API Key 只存在于**服务端环境变量**，不会下发到浏览器，`.env.local` 已被 `.gitignore` 忽略。

## 🔐 隐私与安全

- 仓库中**不含任何密钥、Token 或账号信息**（密钥统一放在未提交的 `.env.local`）。
- 所有个人记录数据仅存储在使用者浏览器的本地存储中，项目本身不收集、不上传任何用户数据。
- AI 请求经服务端转发，前端不接触模型 Key。
- 分享卡片在本地通过 Canvas 生成，不经过服务器。

## 🔌 硬件语音接口

供外部硬件（录音笔 / 语音按钮等）直接上传 wav 给后端，返回识别文本、结构化解析结果和一句洞察文案。

- 路径：`POST /api/parse-audio`
- 请求：`multipart/form-data`
  - `audio`：wav 音频文件（≤ 60 秒 / 5MB）
  - `mode`：业务类型，可选，默认 `money`；支持 `money` / `time` / `mood` / `dream`
- 返回：

```json
{
  "ok": true,
  "mode": "money",
  "text": "早上咖啡28，中午外卖35",
  "parsed": {
    "kind": "money",
    "items": [
      { "note": "咖啡", "amt": 28, "cat": "drink", "catName": "饮品" },
      { "note": "外卖", "amt": 35, "cat": "food", "catName": "餐饮" }
    ],
    "count": 2,
    "total": 63
  },
  "insight": "已记下 2 笔，共 ¥63；最贵的是「外卖」¥35。",
  "meta": {
    "audioFormat": "wav",
    "audioBytes": 12345,
    "durationSec": 2.1,
    "insightSource": "ai",
    "elapsedMs": 1830
  }
}
```

服务端使用腾讯云「一句话识别」转写，需要配置：

```bash
TENCENT_SECRET_ID=xxx
TENCENT_SECRET_KEY=xxx
TENCENT_ASR_REGION=ap-guangzhou   # 可选
```

`insight` 由 DeepSeek 生成；未配置 `DEEPSEEK_API_KEY` 或调用失败时自动回落到内置文案（`meta.insightSource` 为 `fallback`）。

## 🗺 迁移路线

- [x] 第一步：Next.js 工程脚手架 + 原单文件应用整体迁移（功能对齐）
- [x] 第二步：四张卡片及模块页拆分为独立路由（/time /money /mood /dream）
- [ ] 第三步：模块内部逐步重构为 `useState` 驱动的 React 组件（建议从「心情树洞」开始）
- [ ] 第四步：数据层抽为独立 hook，AI 调用层抽象为可配置适配器

## 📄 开源协议

本项目基于 **MIT License** 开源。

## ⚠️ 免责声明

本项目为个人记录与创意演示工具，AI 生成的报告内容仅供自我回顾与娱乐参考，不构成任何专业建议。

---

_把今天过好，就是最好的光阴。_
