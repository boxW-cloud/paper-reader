import { X, FileText, ChevronRight, BookOpen, FileBadge } from 'lucide-react';
import { PaperSection, PaperPage } from '@/types/paper';
import { useState } from 'react';

interface ContentPanelProps {
  section: PaperSection | null;
  pages: PaperPage[];
  onClose: () => void;
}

type ViewMode = 'summary' | 'pdf';

export function ContentPanel({ section, pages, onClose }: ContentPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [currentPage, setCurrentPage] = useState<number>(section?.page_numbers?.[0] || 1);

  if (!section) return null;

  // 获取当前页的内容
  const currentPageContent = pages.find(p => p.page_number === currentPage);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full md:w-[560px] bg-white border-l shadow-2xl transform transition-transform duration-300 flex flex-col z-10" style={{ maxHeight: '100vh' }}>
      {/* Header - 固定高度 */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-gray-900">{section.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'summary'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileBadge className="w-4 h-4" />
              总结
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'pdf'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              原文
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="关闭面板"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Area - 可滚动 */}
      {viewMode === 'summary' ? (
        /* Summary View - 大模型总结 */
        <div className="flex-1 overflow-y-auto">
          {/* Summary Section */}
          {section.summary && (
            <div className="px-6 py-4 border-b bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">章节总结</p>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">
                {section.summary || '暂无总结'}
              </p>
            </div>
          )}

          {/* Key Points */}
          <div className="px-6 py-4">
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">核心要点</p>
            </div>
            <div className="text-gray-700 leading-loose text-[15px]">
              {section.summary ? (
                <div className="space-y-3">
                  <p className="bg-blue-50 p-4 rounded-lg border border-blue-100 whitespace-pre-wrap">
                    {section.summary}
                  </p>
                  <p className="text-xs text-gray-400">
                    💡 切换到"原文"模式查看 PDF 原始页面
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">暂无总结内容</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PDF View - PDF 页面截图 */
        <div className="flex-1 overflow-y-auto">
          {/* Page Navigation */}
          {pages.length > 0 && (
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
                  disabled={currentPage >= pages.length}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <p className="text-sm text-gray-600">
                第 <span className="font-semibold text-blue-600">{currentPage}</span> 页 / 共 {pages.length} 页
              </p>
            </div>
          )}

          {/* PDF Page Image */}
          <div className="p-6 bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {currentPageContent ? (
                <img
                  src={currentPageContent.image_base64}
                  alt={`Page ${currentPage}`}
                  className="w-full h-auto"
                />
              ) : (
                <p className="text-gray-400 text-center py-8">暂无页面内容</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer hint - 固定高度 */}
      <div className="flex-shrink-0 px-6 py-3 border-t bg-gray-50 text-xs text-gray-400 text-center">
        {viewMode === 'summary' ? (
          <span>💡 总结由 AI 生成，切换到"原文"查看 PDF</span>
        ) : (
          <span>使用上下按钮翻阅 PDF 页面</span>
        )}
      </div>
    </div>
  );
}
