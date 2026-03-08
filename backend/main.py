import os
import tempfile
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.paper import PaperData, PaperPage
from pydantic import BaseModel
from services.pdf_parser import PDFParser
from services.llm_analyzer import LLMAnalyzer

app = FastAPI(
    title="Paper Reader AI API",
    description="论文智能解析 API",
    version="0.1.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
pdf_parser = PDFParser()
llm_analyzer = None

try:
    llm_analyzer = LLMAnalyzer()
except ValueError as e:
    print(f"警告：{e}")


@app.get("/")
async def root():
    return {
        "name": "Paper Reader AI API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "llm_configured": llm_analyzer is not None
    }


class AskRequest(BaseModel):
    question: str
    context: str


class AskResponse(BaseModel):
    answer: str


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    向大模型提问关于论文内容的问题

    Args:
        request: 包含问题和上下文

    Returns:
        AskResponse: 大模型的回答
    """
    if llm_analyzer is None:
        raise HTTPException(status_code=503, detail="大模型未配置")

    try:
        # 构建提问 prompt
        prompt = f"""用户正在阅读论文，对以下内容有疑问：

选中的内容：
{request.context}

用户的问题：
{request.question}

请用简洁清晰的语言回答用户的问题，帮助用户理解这段内容。回答要专业但易于理解。"""

        response = llm_analyzer.client.chat.completions.create(
            model=llm_analyzer.model,
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的学术论文助手，负责解答用户在阅读论文时遇到的问题。请用简洁清晰的语言回答，帮助用户理解论文内容。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=800
        )

        answer = response.choices[0].message.content.strip()
        return AskResponse(answer=answer)

    except Exception as e:
        print(f"提问处理失败：{e}")
        raise HTTPException(status_code=500, detail=f"提问失败：{str(e)}")


@app.post("/api/analyze", response_model=PaperData)
async def analyze_paper(file: UploadFile = File(...)):
    """
    分析上传的 PDF 论文文件

    Args:
        file: PDF 文件

    Returns:
        PaperData: 结构化的论文数据
    """
    # 验证文件类型
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="只支持 PDF 文件")

    try:
        # 读取文件内容
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="文件内容为空")

        # 提取 PDF 文本和页面信息
        pages_info = pdf_parser.extract_pages_info(content)
        text = "\n\n".join([p["text"] for p in pages_info])

        if not text.strip():
            raise HTTPException(status_code=400, detail="无法从 PDF 中提取文本")

        print(f"提取到 {len(pages_info)} 页")

        # 提取 PDF 图片
        images_by_page = pdf_parser.extract_images_by_page(content)
        print(f"提取到 {sum(len(imgs) for imgs in images_by_page.values())} 张图片")

        # 使用大模型分析
        if llm_analyzer is None:
            raise HTTPException(
                status_code=503,
                detail="大模型未配置，请检查.env 文件中的 API Key 设置"
            )

        paper_data = llm_analyzer.analyze_paper(text, images_by_page, pages_info)

        # 添加页面信息（用于原文查看）
        paper_data.pages = [
            PaperPage(
                page_number=p["page_number"],
                text=p["text"],
                image_base64=p["image_base64"],
                width=p["width"],
                height=p["height"]
            )
            for p in pages_info
        ]

        return paper_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"分析失败：{e}")
        raise HTTPException(status_code=500, detail=f"分析失败：{str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)
