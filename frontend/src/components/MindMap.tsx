import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PaperData } from '@/types/paper';

interface MindMapNodeData {
  label: string;
  type: 'root' | 'section';
  content?: string;
  summary?: string;
  color?: string;
}

// 美观的配色方案
const colors = [
  { bg: 'from-emerald-500 to-teal-500', border: 'border-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-900' },
  { bg: 'from-violet-500 to-purple-500', border: 'border-violet-600', light: 'bg-violet-50', text: 'text-violet-900' },
  { bg: 'from-amber-500 to-orange-500', border: 'border-amber-600', light: 'bg-amber-50', text: 'text-amber-900' },
  { bg: 'from-rose-500 to-pink-500', border: 'border-rose-600', light: 'bg-rose-50', text: 'text-rose-900' },
  { bg: 'from-cyan-500 to-blue-500', border: 'border-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-900' },
  { bg: 'from-indigo-500 to-blue-500', border: 'border-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-900' },
];

const CustomNode = ({ data, selected }: NodeProps<Node<MindMapNodeData>>) => {
  const colorScheme = colors[parseInt(data.label.substring(0, 1)) % colors.length] || colors[0];

  return (
    <div
      className={`px-5 py-3 rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
        data.type === 'root'
          ? `bg-gradient-to-br ${colorScheme.bg} ${colorScheme.border} text-white min-w-[180px] max-w-[250px]`
          : selected
          ? `${colorScheme.light} ${colorScheme.border} ${colorScheme.text} min-w-[140px] max-w-[200px] ring-2 ring-offset-2 ring-blue-400`
          : `bg-white border-gray-200 text-gray-800 hover:border-${colorScheme.border.split('-')[1]}-400 hover:shadow-md min-w-[140px] max-w-[200px]`
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-2.5 !h-2.5 !border-2 !border-white"
      />
      <div className="text-center">
        {data.type === 'root' && (
          <p className="text-xs opacity-80 mb-1.5 font-medium">📄 论文标题</p>
        )}
        <p className={`font-semibold leading-tight ${data.type === 'root' ? 'text-base' : 'text-sm'}`}>
          {data.label}
        </p>
        {data.summary && data.type !== 'root' && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 font-normal">
            {data.summary}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-2.5 !h-2.5 !border-2 !border-white"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

interface MindMapProps {
  paperData: PaperData | null;
  onNodeClick: (sectionIndex: number) => void;
}

export function MindMap({ paperData, onNodeClick }: MindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!paperData) return;

    const rootId = 'root';
    const sectionCount = paperData.sections.length;

    // 根据章节数量动态调整布局
    const isVertical = sectionCount > 6;
    const radiusX = isVertical ? 200 : 280;
    const radiusY = isVertical ? 350 : 280;
    const centerX = 400;
    const centerY = isVertical ? 400 : 350;
    const rootY = 80;

    const rootNode: Node = {
      id: rootId,
      type: 'custom',
      position: { x: centerX, y: rootY },
      data: {
        label: paperData.title || '论文标题',
        type: 'root',
      },
    };

    const sectionNodes: Node[] = paperData.sections.map((section, index) => {
      // 改进的圆形布局算法
      const angle = (2 * Math.PI * index) / sectionCount - Math.PI / 2;
      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);

      return {
        id: `section-${index}`,
        type: 'custom',
        position: { x, y },
        data: {
          label: section.name,
          type: 'section',
          content: section.content,
          summary: section.summary,
        },
      };
    });

    const sectionEdges: Edge[] = paperData.sections.map((_, index) => ({
      id: `edge-${index}`,
      source: rootId,
      target: `section-${index}`,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
      },
      style: {
        stroke: '#cbd5e1',
        strokeWidth: 2,
        strokeLinecap: 'round',
      },
      animated: false,
    }));

    setNodes([rootNode, ...sectionNodes]);
    setEdges(sectionEdges);
  }, [paperData, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('section-')) {
        const index = parseInt(node.id.replace('section-', ''), 10);
        onNodeClick(index);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        }}
      >
        <Controls
          className="bg-white rounded-lg shadow-md border border-gray-200"
          showInteractive={false}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e2e8f0"
        />
      </ReactFlow>
    </div>
  );
}
