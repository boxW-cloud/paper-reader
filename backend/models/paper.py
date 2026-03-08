from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class PaperImage(BaseModel):
    image_id: str = Field(..., description="图片 ID")
    image_base64: str = Field(..., description="Base64 编码的图片数据")
    width: int = Field(default=0, description="图片宽度")
    height: int = Field(default=0, description="图片高度")
    ext: str = Field(default="png", description="图片格式")
    caption: str = Field(default="", description="图片说明")


class PaperSection(BaseModel):
    name: str = Field(..., description="章节名称")
    content: str = Field(..., description="章节完整内容")
    summary: str = Field(default="", description="章节摘要")
    page_numbers: List[int] = Field(default=[], description="章节所在页码")
    images: List[PaperImage] = Field(default=[], description="章节相关图片")


class PaperPage(BaseModel):
    page_number: int = Field(..., description="页码")
    text: str = Field(..., description="页面文本")
    image_base64: str = Field(..., description="页面截图 Base64")
    width: float = Field(default=0, description="页面宽度")
    height: float = Field(default=0, description="页面高度")


class PaperData(BaseModel):
    title: str = Field(..., description="论文标题")
    abstract: str = Field(default="", description="论文摘要")
    sections: List[PaperSection] = Field(..., description="论文章节列表")
    all_images: List[PaperImage] = Field(default=[], description="论文中所有图片")
    pages: List[PaperPage] = Field(default=[], description="论文所有页面（用于原文查看）")


class AnalysisResponse(PaperData):
    pass


class AnalyzeRequest(BaseModel):
    file_name: str
    include_pages: bool = True


class ErrorResponse(BaseModel):
    detail: str
