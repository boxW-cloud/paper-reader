import { useState, useCallback, useEffect } from 'react';
import { PaperUploader } from './components/PaperUploader';
import { MindMap } from './components/MindMap';
import { ContentPanel } from './components/ContentPanel';
import { AskQuestion } from './components/AskQuestion';
import { PaperData, PaperSection } from './types/paper';
import { BookOpen, AlertCircle, Loader, MessageCircle } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzingStage, setAnalyzingStage] = useState('');
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  const [selectedSection, setSelectedSection] = useState<PaperSection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 文本选择和提问相关状态
  const [selectedText, setSelectedText] = useState('');
  const [askPosition, setAskPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAskButton, setShowAskButton] = useState(false);
  const [askButtonPosition, setAskButtonPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 监听文本选择
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length > 0 && text.length < 500) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setAskButtonPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          setShowAskButton(true);
          setSelectedText(text);
        }
      } else {
        setShowAskButton(false);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // 点击其他地方关闭提问按钮
  useEffect(() => {
    const handleClick = () => setShowAskButton(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setAnalyzingStage('正在提取 PDF 内容...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 使用轮询方式获取进度
      const xhr = new XMLHttpRequest();

      const promise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 50);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setProgress(80);
            setAnalyzingStage('正在生成思维导图...');
            setTimeout(() => {
              setProgress(100);
              resolve(JSON.parse(xhr.response));
            }, 500);
          } else {
            reject(new Error(xhr.statusText));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误')));
        xhr.open('POST', 'http://127.0.0.1:8080/api/analyze');
        xhr.send(formData);
      });

      const data = await promise;
      setPaperData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
      setSelectedFile(null);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setAnalyzingStage('');
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setPaperData(null);
    setSelectedSection(null);
    setError(null);
  }, []);

  const handleNodeClick = useCallback((sectionIndex: number) => {
    if (paperData?.sections[sectionIndex]) {
      setSelectedSection(paperData.sections[sectionIndex]);
    }
  }, [paperData]);

  const handleClosePanel = useCallback(() => {
    setSelectedSection(null);
  }, []);

  // 处理提问
  const handleAskQuestion = useCallback(async (question: string, contextText: string): Promise<string> => {
    try {
      const response = await fetch('http://127.0.0.1:8080/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context: contextText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '提问失败');
      }

      const data = await response.json();
      return data.answer;
    } catch (err) {
      console.error('提问失败:', err);
      throw err;
    }
  }, []);

  const handleShowAskPanel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    if (text) {
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setAskPosition({
          x: rect.left,
          y: rect.bottom + 10
        });
        setSelectedText(text);
      }
    }
    setShowAskButton(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Paper Reader AI</h1>
            <p className="text-sm text-gray-500">论文智能解析与可视化</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6" onClick={() => setShowAskButton(false)}>
        {/* Upload Section */}
        <div className="mb-6">
          <PaperUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Mind Map */}
        {paperData && (
          <div className="relative h-[600px] rounded-xl overflow-hidden shadow-lg border bg-white">
            <MindMap paperData={paperData} onNodeClick={handleNodeClick} />
            {selectedSection && (
              <ContentPanel
                section={selectedSection}
                pages={paperData.pages || []}
                onClose={handleClosePanel}
              />
            )}
          </div>
        )}

        {/* Analyzing Progress */}
        {isAnalyzing && (
          <div className="mb-6 p-8 bg-white rounded-xl shadow-md border">
            <div className="flex items-center gap-4 mb-4">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">正在分析论文...</h3>
                <p className="text-sm text-gray-500">{analyzingStage}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-sm text-gray-500 mt-2">{progress}%</p>
          </div>
        )}

        {/* Empty State */}
        {!paperData && !isAnalyzing && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无论文</h3>
            <p className="text-gray-500 mt-1">拖拽论文文件到上方区域开始解析</p>
          </div>
        )}

        {/* 选中文本后显示的提问按钮 */}
        {showAskButton && selectedText && (
          <button
            onClick={handleShowAskPanel}
            className="fixed z-50 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
            style={{
              left: askButtonPosition.x,
              top: askButtonPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <MessageCircle className="w-4 h-4" />
            提问
          </button>
        )}

        {/* 提问弹窗 */}
        {askPosition && selectedText && (
          <AskQuestion
            selectedText={selectedText}
            position={askPosition}
            onClose={() => {
              setAskPosition(null);
              setSelectedText('');
              window.getSelection()?.removeAllRanges();
            }}
            onAsk={handleAskQuestion}
          />
        )}
      </main>
    </div>
  );
}
