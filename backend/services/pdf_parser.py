import fitz  # PyMuPDF
from typing import List, Dict, Tuple
import re
import base64
import os


class PDFParser:
    """PDF 解析器，用于提取 PDF 文本内容和图片"""

    def __init__(self):
        pass

    def extract_text(self, file_path: str) -> str:
        """从 PDF 文件中提取全部文本"""
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    def extract_text_from_bytes(self, file_bytes: bytes) -> str:
        """从 PDF 字节数据提取文本"""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    def extract_pages_info(self, file_bytes: bytes) -> List[Dict]:
        """
        提取每一页的信息（包括文本和页面截图）

        Returns:
            列表，每项包含：page_number, text, image_base64, width, height
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []

        for page_num in range(len(doc)):
            page = doc[page_num]

            # 提取文本（按块提取，保持更好的格式）
            text = page.get_text("text", sort=True)

            # 生成页面截图（PNG 格式）
            mat = fitz.Matrix(2, 2)  # 2 倍缩放，提高清晰度
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            img_base64 = base64.b64encode(img_data).decode('utf-8')

            pages.append({
                "page_number": page_num + 1,
                "text": text,
                "image_base64": f"data:image/png;base64,{img_base64}",
                "width": page.rect.width,
                "height": page.rect.height
            })

        doc.close()
        return pages

    def extract_images_from_bytes(self, file_bytes: bytes) -> List[Dict]:
        """从 PDF 中提取所有嵌入的图片"""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        images = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            for img_index, img_info in enumerate(image_list):
                try:
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)

                    if base_image:
                        image_bytes_data = base_image["image"]
                        image_ext = base_image["ext"]
                        image_base64 = base64.b64encode(image_bytes_data).decode('utf-8')

                        images.append({
                            "page_number": page_num + 1,
                            "image_id": f"img_{page_num + 1}_{img_index + 1}",
                            "image_base64": f"data:image/{image_ext};base64,{image_base64}",
                            "width": base_image.get("width", 0),
                            "height": base_image.get("height", 0),
                            "ext": image_ext
                        })
                except Exception as e:
                    print(f"提取图片失败：{e}")
                    continue

        doc.close()
        return images

    def extract_images_by_page(self, file_bytes: bytes) -> Dict[int, List[Dict]]:
        """按页面提取 PDF 中的图片"""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        images_by_page = {}

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            page_images = []

            for img_index, img_info in enumerate(image_list):
                try:
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)

                    if base_image:
                        image_bytes_data = base_image["image"]
                        image_ext = base_image["ext"]
                        image_base64 = base64.b64encode(image_bytes_data).decode('utf-8')

                        page_images.append({
                            "image_id": f"img_p{page_num + 1}_{img_index + 1}",
                            "image_base64": f"data:image/{image_ext};base64,{image_base64}",
                            "width": base_image.get("width", 0),
                            "height": base_image.get("height", 0),
                            "ext": image_ext
                        })
                except Exception as e:
                    print(f"提取图片失败：{e}")
                    continue

            if page_images:
                images_by_page[page_num + 1] = page_images

        doc.close()
        return images_by_page

    def extract_text_by_sections(self, file_bytes: bytes) -> Tuple[str, Dict[str, Dict]]:
        """
        提取文本并按章节组织（基于页面范围）

        Returns:
            (完整文本，章节信息字典)
            章节信息包含：name, start_page, end_page, content
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        # 首先提取所有页面的文本和标题
        page_texts = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text", sort=True)

            # 尝试从页面开头提取可能的章节标题
            lines = text.strip().split('\n')
            potential_title = ""
            for line in lines[:5]:  # 检查前 5 行
                line = line.strip()
                if len(line) > 3 and len(line) < 100:
                    # 可能是章节标题
                    if any(kw in line for kw in ['Abstract', 'Introduction', 'Method', 'Experiment',
                                                   'Results', 'Discussion', 'Conclusion', 'References',
                                                   '摘要', '引言', '方法', '实验', '结果', '讨论', '结论']):
                        potential_title = line
                        break

            page_texts.append({
                "page": page_num + 1,
                "text": text,
                "potential_title": potential_title
            })

        doc.close()

        # 合并所有文本
        full_text = "\n\n".join([p["text"] for p in page_texts])

        # 组织章节信息
        sections = {}
        current_section = "Abstract"
        current_start = 1

        for i, page_info in enumerate(page_texts):
            if page_info["potential_title"]:
                # 保存当前章节
                sections[current_section] = {
                    "name": current_section,
                    "start_page": current_start,
                    "end_page": i + 1,
                    "content": "\n\n".join([p["text"] for p in page_texts[current_start-1:i+1]])
                }
                current_section = page_info["potential_title"]
                current_start = i + 1

        # 保存最后一个章节
        if current_section not in sections:
            sections[current_section] = {
                "name": current_section,
                "start_page": current_start,
                "end_page": len(page_texts),
                "content": "\n\n".join([p["text"] for p in page_texts[current_start-1:]])
            }

        return full_text, sections

    def split_into_chunks(self, text: str, max_chunk_size: int = 4000) -> List[str]:
        """将长文本分割成多个 chunk"""
        chunks = []
        paragraphs = re.split(r'\n\s*\n', text)
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) < max_chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks
