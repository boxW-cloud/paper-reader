# Paper Reader AI - 快速启动指南

## 项目已完成创建！

所有代码文件已经创建完毕。由于当前环境限制，请按照以下步骤手动安装依赖并启动项目。

## 第一步：安装后端依赖

打开命令提示符（cmd）或 PowerShell，执行：

```bash
cd C:\Users\Lenovo\Desktop\paperreader\backend
pip install -r requirements.txt
```

## 第二步：配置大模型 API Key

编辑 `backend\.env` 文件，填入你的 API Key：

### 阿里云通义千问（推荐）

```env
DASHSCOPE_API_KEY=sk-your-dashscope-key
DASHSCOPE_MODEL=qwen-plus
```

获取 API Key：https://dashscope.console.aliyun.com/apiKey

### 或使用 OpenAI

```env
OPENAI_API_KEY=sk-your-actual-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

### 或使用 DeepSeek（性价比高）

```env
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 或使用 智谱 AI

```env
ZHIPU_API_KEY=your-zhipu-key
ZHIPU_MODEL=glm-4
```

## 第三步：安装前端依赖

```bash
cd C:\Users\Lenovo\Desktop\paperreader\frontend
npm install
```

## 第四步：启动后端服务

打开一个新的命令提示符窗口：

```bash
cd C:\Users\Lenovo\Desktop\paperreader\backend
python main.py
```

后端将在 http://localhost:8000 启动

## 第五步：启动前端服务

打开另一个新的命令提示符窗口：

```bash
cd C:\Users\Lenovo\Desktop\paperreader\frontend
npm run dev
```

前端将在 http://localhost:5173 启动

## 第六步：使用应用

1. 浏览器打开 http://localhost:5173
2. 拖拽 PDF 论文文件到上传区域
3. 等待 AI 解析完成
4. 在思维导图中查看论文结构
5. 点击节点查看详细内容

## 常见问题

### Q: 没有 API Key 怎么办？

你可以申请以下任一平台的 API Key：

1. **阿里云通义千问**（推荐，中文支持好）: https://dashscope.console.aliyun.com/apiKey
   - 免费额度：新用户有免费体验额度
   - 模型：qwen-plus、qwen-max 等

2. **DeepSeek**（性价比高）: https://platform.deepseek.com
   - 价格便宜，效果不错

3. **智谱 AI**: https://open.bigmodel.cn
   - 国产大模型，支持 GLM-4

4. **OpenAI**: https://platform.openai.com
   - 需要国际支付方式

### Q: 解析失败怎么办？

- 检查 API Key 是否正确配置
- 确保 PDF 文件是文本格式（不是扫描图片）
- 检查网络连接

### Q: 前端样式有问题？

确保执行了 `npm install` 安装所有依赖

## 项目文件清单

```
paperreader/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaperUploader.tsx    # 拖拽上传组件
│   │   │   ├── MindMap.tsx          # 思维导图组件
│   │   │   └── ContentPanel.tsx     # 内容面板组件
│   │   ├── types/
│   │   │   └── paper.ts             # 类型定义
│   │   ├── lib/
│   │   │   └── utils.ts             # 工具函数
│   │   ├── App.tsx                  # 主应用
│   │   └── main.tsx                 # 入口文件
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── services/
│   │   ├── pdf_parser.py            # PDF 解析服务
│   │   └── llm_analyzer.py          # 大模型分析服务
│   ├── models/
│   │   └── paper.py                 # 数据模型
│   ├── main.py                      # FastAPI 入口
│   ├── requirements.txt             # Python 依赖
│   └── .env                         # 环境配置
│
├── install.bat                      # 一键安装脚本
├── start.bat                        # 一键启动脚本
└── README.md                        # 项目文档
```

祝你使用愉快！
