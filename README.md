# Paper Reader AI - 论文智能解析工具

一个基于 AI Agent 的论文解析与可视化工具，支持拖拽上传 PDF 论文，自动解析论文结构并以思维导图形式展示。

## 功能特点

- 📄 **拖拽上传** - 简洁的拖拽式文件上传界面
- 🤖 **AI 解析** - 使用大模型自动分析论文结构
- 🧠 **思维导图** - 可视化展示论文结构
- 📖 **内容查看** - 点击节点查看章节详细内容
- 🎨 **简洁美观** - 现代化 UI 设计

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- React Flow (思维导图)
- Tailwind CSS (样式)
- react-dropzone (拖拽上传)

### 后端
- Python FastAPI
- PyMuPDF (PDF 解析)
- OpenAI SDK (大模型调用)

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.9+
- 大模型 API Key (OpenAI/DeepSeek/智谱等)

### 1. 配置后端

```bash
cd backend

# 复制环境配置模板
cp .env.example .env

# 编辑.env 文件，填入你的 API Key
# 例如：OPENAI_API_KEY=sk-xxx
```

### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 启动后端服务

```bash
cd backend
python main.py
# 或
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动

### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 5. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

## 配置大模型

在 `backend/.env` 文件中配置以下任一服务：

### OpenAI
```env
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

### DeepSeek
```env
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 智谱 AI
```env
ZHIPU_API_KEY=xxx
ZHIPU_MODEL=glm-4
```

## 项目结构

```
paperreader/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── types/           # TypeScript 类型
│   │   ├── lib/             # 工具函数
│   │   └── App.tsx          # 主应用
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── services/            # 业务服务
│   ├── models/              # 数据模型
│   ├── main.py              # FastAPI 入口
│   └── requirements.txt
│
└── README.md
```

## API 接口

### POST /api/analyze

上传并分析 PDF 论文

**请求**
- Content-Type: multipart/form-data
- Body: file (PDF 文件)

**响应**
```json
{
  "title": "论文标题",
  "abstract": "论文摘要",
  "sections": [
    {
      "name": "Introduction",
      "content": "章节内容...",
      "summary": "章节摘要"
    }
  ]
}
```

## 使用流程

1. 打开 http://localhost:5173
2. 拖拽 PDF 论文文件到上传区域
3. 等待 AI 解析完成
4. 在思维导图中查看论文结构
5. 点击节点查看详细内容

## 注意事项

- 首次使用需要配置大模型 API Key
- PDF 文件建议不超过 10MB
- 复杂论文可能需要更长的解析时间

## License

MIT
