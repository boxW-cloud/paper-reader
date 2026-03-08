import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader } from 'lucide-react';

interface AskQuestionProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAsk: (question: string, selectedText: string) => Promise<string>;
}

export function AskQuestion({ selectedText, position, onClose, onAsk }: AskQuestionProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦到输入框
    inputRef.current?.focus();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      const response = await onAsk(question, selectedText);
      setAnswer(response);
      setHasAsked(true);
    } catch (error) {
      setAnswer('提问失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAsk();
    }
  };

  // 计算弹窗位置，确保不会超出屏幕
  const popupWidth = 500;
  const popupHeight = 400;
  const adjustedX = Math.min(position.x, window.innerWidth - popupWidth - 20);
  const adjustedY = Math.min(position.y, window.innerHeight - popupHeight - 20);

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: popupWidth,
        maxHeight: popupHeight
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">AI 助手</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Text Preview */}
      <div className="px-4 py-3 bg-blue-50 border-b">
        <p className="text-xs text-blue-600 font-medium mb-1">选中的内容：</p>
        <p className="text-sm text-blue-800 line-clamp-3 italic">
          "{selectedText}"
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col h-[280px]">
        {!hasAsked ? (
          /* Ask Mode */
          <div className="flex-1 flex flex-col p-4">
            <label className="text-sm font-medium text-gray-700 mb-2">
              请输入你的问题：
            </label>
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例如：这个方法的具体原理是什么？"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || isLoading}
              className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  思考中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  发送
                </>
              )}
            </button>
          </div>
        ) : (
          /* Answer Mode */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">AI 回答：</p>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {answer || '暂无回答'}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
