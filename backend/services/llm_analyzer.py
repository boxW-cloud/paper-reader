import os
import json
from typing import Optional, Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv
from models.paper import PaperData, PaperSection, PaperImage
import httpx
import re

load_dotenv()

# 延迟导入，避免循环引用
PDFParser = None


class LLMAnalyzer:
    """大模型论文分析器"""

    def __init__(self):
        # 支持多种大模型配置
        self.api_key = (
            os.getenv("OPENAI_API_KEY") or
            os.getenv("DEEPSEEK_API_KEY") or
            os.getenv("ZHIPU_API_KEY") or
            os.getenv("DASHSCOPE_API_KEY")
        )
        self.base_url = (
            os.getenv("OPENAI_BASE_URL") or
            os.getenv("DEEPSEEK_BASE_URL") or
            os.getenv("ZHIPU_BASE_URL") or
            os.getenv("DASHSCOPE_BASE_URL") or
            "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 通义千问默认地址
        )
        self.model = (
            os.getenv("OPENAI_MODEL") or
            os.getenv("DEEPSEEK_MODEL") or
            os.getenv("ZHIPU_MODEL") or
            os.getenv("DASHSCOPE_MODEL") or
            "gpt-4o"
        )

        if not self.api_key:
            raise ValueError("请配置大模型 API Key，复制.env.example 为.env 并填写")

        # 创建自定义 httpx 客户端，避免 proxies 参数问题
        http_client = httpx.Client(
            timeout=60.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )

        client_kwargs = {
            "api_key": self.api_key,
            "http_client": http_client
        }
        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        self.client = OpenAI(**client_kwargs)

    def analyze_paper(self, text: str, images_by_page: Dict[int, List[Dict]] = None, pages_info: List[Dict] = None) -> PaperData:
        """
        使用大模型分析论文内容，提取结构

        Args:
            text: 论文文本内容
            images_by_page: 按页面组织的图片数据
            pages_info: 页面信息列表（用于准确定位章节所在页面）

        Returns:
            PaperData: 结构化的论文数据
        """
        # 如果文本太长，截取前部分（实际使用可以分段处理）
        max_text_length = 25000
        truncated_text = text[:max_text_length] if len(text) > max_text_length else text

        prompt = self._build_prompt(truncated_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的学术论文分析助手。你的任务是分析论文内容，提取关键结构和信息。请严格按照 JSON 格式返回结果。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content
            print(f"大模型返回结果：{result_text[:500]}...")  # 打印前 500 字符用于调试
            result = json.loads(result_text)
            return self._parse_result(result, text, images_by_page, pages_info)

        except Exception as e:
            # 如果大模型调用失败，返回基础解析结果
            print(f"大模型分析失败：{e}")
            return self._basic_parse(text, images_by_page, pages_info)

    def _build_prompt(self, text: str) -> str:
        """构建分析提示词"""
        return f"""
请分析以下论文内容，提取结构信息。

要求：
1. 提取论文标题（title）
2. 提取论文摘要（abstract），如果没有明确摘要可以留空
3. 识别主要章节（sections），每个章节包含：
   - name: 章节名称（如 Introduction, Methods, Experiments, Results, Discussion, Conclusion 等）
   - content: 该章节的完整内容（**必须是该章节独有的内容，不能与其他章节重复**，保留原文详细内容）
   - summary: **简洁的章节总结**（50-100 字，1-2 句话概括该章节的核心要点和主要贡献）

重要注意：
- **每个章节的 content 必须不同**，必须对应各自章节的实际内容
- **summary 必须简洁**，用 1-2 句话概括，不要超过 100 字
- Abstract/摘要 只包含论文开头的摘要部分
- Introduction 只包含引言部分的内容
- Experiments 只包含实验部分的内容
- 确保 JSON 格式正确，特殊字符需要转义
- 如果论文中没有某个章节，不要包含该章节

请返回 JSON 格式，结构如下：
{{
  "title": "论文标题",
  "abstract": "论文摘要（仅限 Abstract 部分）",
  "sections": [
    {{
      "name": "Introduction",
      "content": "引言部分的完整内容...",
      "summary": "用 1-2 句话简洁概括引言的核心内容"
    }},
    {{
      "name": "Methods",
      "content": "方法部分的完整内容...",
      "summary": "用 1-2 句话简洁概括方法的核心内容"
    }},
    ...
  ]
}}

论文内容：
{text}
"""

    def _parse_result(self, result: Dict[str, Any], original_text: str, images_by_page: Dict[int, List[Dict]] = None, pages_info: List[Dict] = None) -> PaperData:
        """解析大模型返回的结果"""
        sections = []
        for sec in result.get("sections", []):
            sections.append(PaperSection(
                name=sec.get("name", "Unknown"),
                content=sec.get("content", ""),
                summary=sec.get("summary", ""),
                images=[]
            ))

        # 如果没有识别到章节，尝试基础解析
        if not sections:
            return self._basic_parse(original_text, images_by_page, pages_info)

        return PaperData(
            title=result.get("title", "未识别标题"),
            abstract=result.get("abstract", ""),
            sections=sections,
            all_images=[]
        )

    def _generate_summary_by_llm(self, content: str, section_name: str) -> str:
        """调用大模型生成章节总结（详细版，不限制字数）"""
        if not content:
            return f"{section_name}章节内容"

        # 限制内容长度，避免 token 超限
        max_content_length = 5000
        truncated_content = content[:max_content_length] if len(content) > max_content_length else content

        try:
            prompt = f"""请为以下论文章节内容生成非常详细的总结：

章节：{section_name}

内容：
{truncated_content}

请生成详细的总结，要求：
1. 全面概括该章节的核心内容、主要观点和方法
2. 详细提取关键实验设置、结果和重要发现
3. 不限制字数，尽可能详细完整地总结（可以 300-500 字或更多）
4. 使用清晰的中文表达，保持逻辑连贯

请直接返回总结内容，不要其他说明："""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的学术论文总结助手。请用详细完整的语言概括章节的所有要点，不限制字数，让读者能够全面理解该章节的内容。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1000
            )

            summary = response.choices[0].message.content.strip()
            return summary if summary else f"{section_name}章节内容"

        except Exception as e:
            print(f"生成总结失败：{e}")
            # 降级处理：取前 1-2 句话
            return self._generate_summary_fallback(content, section_name)

    def _generate_summary_fallback(self, content: str, section_name: str) -> str:
        """降级方案：从内容中提取前 1-2 个完整句子作为总结"""
        if not content:
            return f"{section_name}章节内容"

        # 尝试按句子分割（中英文句号）
        sentences = re.split(r'(?<=[.!?。！？])\s+', content.strip())

        # 取前 1-2 个完整句子作为总结
        if len(sentences) >= 2:
            summary = sentences[0].strip() + " " + sentences[1].strip()
        elif len(sentences) == 1:
            summary = sentences[0].strip()
        else:
            # 如果没有句子，取前 150 字
            summary = content[:150].strip() + "..." if len(content) > 150 else content.strip()

        # 限制总结长度在 200 字以内
        if len(summary) > 200:
            summary = summary[:197] + "..."

        return summary

    def _basic_parse(self, text: str, images_by_page: Dict[int, List[Dict]] = None, pages_info: List[Dict] = None) -> PaperData:
        """基础解析，用于大模型失败时的降级处理"""
        # 尝试按常见章节标题分割，并提取每个章节的实际内容
        section_patterns = [
            (r'(?:^|\n)(Abstract|摘要)\s*', 'Abstract'),
            (r'(?:^|\n)(Introduction|引言 | 简介)\s*', 'Introduction'),
            (r'(?:^|\n)(Methods?|Methodology|方法)\s*', 'Methods'),
            (r'(?:^|\n)(Experiments?|Experimental|实验)\s*', 'Experiments'),
            (r'(?:^|\n)(Results?|结果)\s*', 'Results'),
            (r'(?:^|\n)(Discussion|讨论)\s*', 'Discussion'),
            (r'(?:^|\n)(Conclusion|Conclusions|结论)\s*', 'Conclusion'),
            (r'(?:^|\n)(References|参考文献)\s*', 'References'),
        ]

        # 找到所有章节的位置
        section_positions = []
        for pattern, name in section_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                section_positions.append((match.start(), name, match.group(0).strip()))

        # 按位置排序
        section_positions.sort(key=lambda x: x[0])

        sections = []
        for i, (pos, name, _) in enumerate(section_positions):
            # 获取下一章节的位置，如果没有则为文本末尾
            next_pos = section_positions[i + 1][0] if i + 1 < len(section_positions) else len(text)
            # 提取章节内容（从当前章节标题后到下一章节标题前）- 完整内容，不限制长度
            content = text[pos:next_pos].strip()
            # 移除章节标题本身
            content = re.sub(r'^' + re.escape(name) + r'\s*', '', content, flags=re.IGNORECASE)
            content = content.strip()  # 不限制长度，完整显示

            # 通过 pages_info 准确定位章节所在的页面
            page_numbers = []
            if pages_info:
                # 查找包含该章节开头的页面
                for page_info in pages_info:
                    page_text = page_info.get('text', '')
                    # 如果页面包含章节标题或章节内容的一部分，则该页面属于此章节
                    if name in page_text[:200] or (page_info.get('page_number', 0) > 0 and
                          text.find(page_text[:100]) >= pos and text.find(page_text[:100]) < next_pos):
                        page_numbers.append(page_info['page_number'])

                # 如果没有找到，使用位置估算
                if not page_numbers:
                    estimated_page = min(len(pages_info), max(1, (pos // 2000) + 1))
                    page_numbers = [estimated_page]
            else:
                # 估算章节所在页码（每页约 2000 字符）
                estimated_page = (pos // 2000) + 1
                page_numbers = [estimated_page]

            # 获取该章节相关的图片
            section_images = []
            if images_by_page:
                for page_num in page_numbers:
                    if page_num in images_by_page:
                        for img in images_by_page[page_num]:
                            section_images.append(PaperImage(**img))

            # 调用大模型生成该章节的总结
            short_summary = self._generate_summary_by_llm(content, name)

            sections.append(PaperSection(
                name=name,
                content=content,
                summary=short_summary,
                page_numbers=page_numbers,
                images=section_images
            ))

        # 如果仍然没有章节，创建一个默认章节
        if not sections:
            # 尝试按双换行符分割段落
            paragraphs = re.split(r'\n\s*\n', text)
            if len(paragraphs) > 1:
                # 第一段可能是标题或摘要
                sections.append(PaperSection(
                    name="Abstract",
                    content=paragraphs[0],
                    summary="摘要",
                    page_numbers=[1]
                ))
                # 其余内容作为正文 - 完整内容
                main_content = '\n\n'.join(paragraphs[1:])
                sections.append(PaperSection(
                    name="Content",
                    content=main_content,
                    summary="正文内容",
                    page_numbers=list(range(2, min(10, len(paragraphs) // 5 + 2)))
                ))
            else:
                sections.append(PaperSection(
                    name="Content",
                    content=text,  # 完整内容
                    summary="论文主要内容"
                ))

        # 提取第一行作为标题
        lines = text.strip().split('\n')
        title = lines[0].strip() if lines else "未识别标题"

        # 收集所有图片
        all_images = []
        if images_by_page:
            for page_imgs in images_by_page.values():
                for img in page_imgs:
                    all_images.append(PaperImage(**img))

        return PaperData(
            title=title,
            abstract="",
            sections=sections,
            all_images=all_images
        )
