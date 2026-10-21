import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DFDNode, DFDFlow, UserRole } from '../data/dfdData';

interface DFDCanvasProps {
  nodes: DFDNode[];
  flows: DFDFlow[];
  selectedNode: string | null;
  activeFlowIds: string[];
  highlightedNodeIds: string[];
  currentStep: number;
  role: UserRole | null;
  onSelectNode: (id: string) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;

export default function DFDCanvas({
  nodes,
  flows,
  selectedNode,
  activeFlowIds,
  highlightedNodeIds,
  currentStep,
  role,
  onSelectNode,
}: DFDCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -20, y: 20, width: 1400, height: 880 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 };
  };

  const getFlowPath = (flow: DFDFlow) => {
    const from = getNodeCenter(flow.from);
    const to = getNodeCenter(flow.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Use different curve control points based on direction
    if (Math.abs(dx) > Math.abs(dy)) {
      const cx1 = from.x + dx * 0.4;
      const cy1 = from.y + dy * 0.1;
      const cx2 = to.x - dx * 0.4;
      const cy2 = to.y - dy * 0.1;
      return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
    } else {
      const cx1 = from.x + dx * 0.1;
      const cy1 = from.y + dy * 0.4;
      const cx2 = to.x - dx * 0.1;
      const cy2 = to.y - dy * 0.4;
      return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
    }
  };

  const isFlowActive = (flow: DFDFlow) => {
    if (!role) return false;
    return activeFlowIds.includes(flow.id);
  };

  const getCurrentFlow = () => {
    if (!role) return null;
    return flows.find((f) => f.stepOrder[role] === currentStep);
  };

  const currentFlow = getCurrentFlow();

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewBox((vb) => ({
      x: vb.x + vb.width * 0.1,
      y: vb.y + vb.height * 0.1,
      width: vb.width * 0.8,
      height: vb.height * 0.8,
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox((vb) => ({
      x: vb.x - vb.width * 0.125,
      y: vb.y - vb.height * 0.125,
      width: vb.width * 1.25,
      height: vb.height * 1.25,
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewBox({ x: -20, y: 20, width: 1400, height: 880 });
  }, []);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    const dx = (e.clientX - panStart.x) * scaleX;
    const dy = (e.clientY - panStart.y) * scaleY;
    setViewBox((vb) => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox.width, viewBox.height]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) => {
        const newWidth = vb.width * factor;
        const newHeight = vb.height * factor;
        const mouseXRatio = e.offsetX / svg.clientWidth;
        const mouseYRatio = e.offsetY / svg.clientHeight;
        return {
          x: vb.x + (vb.width - newWidth) * mouseXRatio,
          y: vb.y + (vb.height - newHeight) * mouseYRatio,
          width: newWidth,
          height: newHeight,
        };
      });
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-sm hover:bg-slate-700 transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-sm hover:bg-slate-700 transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-xs hover:bg-slate-700 transition-colors flex items-center justify-center"
          title="Reset View"
        >
          ⟲
        </button>
      </div>

      {/* Tooltip for hovered node */}
      {hoveredNode && !selectedNode && (
        <div className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur border border-white/10 text-xs text-white max-w-[200px]">
          <div className="font-semibold">{nodes.find(n => n.id === hoveredNode)?.label}</div>
          <div className="text-slate-400 mt-0.5">{nodes.find(n => n.id === hoveredNode)?.description}</div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: '500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
          </marker>
          <marker id="arrowhead-current" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
          </marker>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x={viewBox.x - 200} y={viewBox.y - 200} width={viewBox.width + 400} height={viewBox.height + 400} fill="url(#grid)" />

        {/* Flow connections */}
        {flows.map((flow) => {
          const active = isFlowActive(flow);
          const isCurrent = currentFlow?.id === flow.id;
          const dimmed = role && !active;
          const isHovered = hoveredFlow === flow.id;

          return (
            <g key={flow.id}>
              {/* Invisible wider path for hover detection */}
              <path
                d={getFlowPath(flow)}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                onMouseEnter={() => setHoveredFlow(flow.id)}
                onMouseLeave={() => setHoveredFlow(null)}
                className="cursor-pointer"
              />
              {/* Visible path */}
              <path
                d={getFlowPath(flow)}
                fill="none"
                stroke={
                  isCurrent ? '#22d3ee' :
                  active ? '#06b6d4' :
                  isHovered ? '#64748b' :
                  'rgba(71,85,105,0.2)'
                }
                strokeWidth={isCurrent ? 3 : isHovered ? 2 : active ? 1.5 : 0.8}
                strokeDasharray={active ? 'none' : '5 3'}
                markerEnd={isCurrent ? 'url(#arrowhead-current)' : active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                filter={isCurrent ? 'url(#glow)' : undefined}
                className="transition-all duration-500"
              />
              {/* Animated particle for current flow */}
              {isCurrent && (
                <>
                  <circle r="5" fill="#22d3ee" opacity="0.8" filter="url(#glow-strong)">
                    <animateMotion dur="2s" repeatCount="indefinite" path={getFlowPath(flow)} />
                  </circle>
                  <circle r="3" fill="white" opacity="0.9">
                    <animateMotion dur="2s" repeatCount="indefinite" path={getFlowPath(flow)} />
                  </circle>
                </>
              )}
              {/* Flow label on hover or when current */}
              {(isCurrent || isHovered) && (
                <g>
                  <rect
                    x={(getNodeCenter(flow.from).x + getNodeCenter(flow.to).x) / 2 - 50}
                    y={(getNodeCenter(flow.from).y + getNodeCenter(flow.to).y) / 2 - 18}
                    width="100"
                    height="16"
                    rx="4"
                    fill="rgba(15,23,42,0.9)"
                    stroke={isCurrent ? '#22d3ee44' : '#47556944'}
                    strokeWidth="0.5"
                  />
                  <text
                    x={(getNodeCenter(flow.from).x + getNodeCenter(flow.to).x) / 2}
                    y={(getNodeCenter(flow.from).y + getNodeCenter(flow.to).y) / 2 - 8}
                    textAnchor="middle"
                    className="text-[8px] font-medium pointer-events-none"
                    fill={isCurrent ? '#67e8f9' : '#94a3b8'}
                  >
                    {flow.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id;
          const isHighlighted = highlightedNodeIds.includes(node.id);
          const isDimmed = role && !isHighlighted && !isSelected;
          const isHovered = hoveredNode === node.id;
          const isCurrentSource = currentFlow?.from === node.id;
          const isCurrentTarget = currentFlow?.to === node.id;

          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.4s' }}
            >
              {/* Outer glow for selected/current nodes */}
              {(isSelected || isCurrentSource || isCurrentTarget) && (
                <rect
                  x={node.x - 5}
                  y={node.y - 5}
                  width={NODE_WIDTH + 10}
                  height={NODE_HEIGHT + 10}
                  rx={node.type === 'process' ? (NODE_WIDTH + 10) / 2 : 16}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1.5"
                  opacity="0.5"
                  filter="url(#glow)"
                />
              )}

              {/* Node shape */}
              {node.type === 'datastore' ? (
                <>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={4}
                    fill={isSelected || isHovered ? `${node.color}25` : `${node.color}12`}
                    stroke={isSelected ? node.color : isHovered ? `${node.color}aa` : `${node.color}55`}
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="transition-all duration-300"
                  />
                  <line x1={node.x} y1={node.y + 10} x2={node.x + NODE_WIDTH} y2={node.y + 10} stroke={`${node.color}33`} strokeWidth="0.8" />
                  <line x1={node.x} y1={node.y + NODE_HEIGHT - 10} x2={node.x + NODE_WIDTH} y2={node.y + NODE_HEIGHT - 10} stroke={`${node.color}33`} strokeWidth="0.8" />
                </>
              ) : node.type === 'process' ? (
                <circle
                  cx={node.x + NODE_WIDTH / 2}
                  cy={node.y + NODE_HEIGHT / 2}
                  r={NODE_WIDTH / 2 - 2}
                  fill={isSelected || isHovered ? `${node.color}25` : `${node.color}12`}
                  stroke={isSelected ? node.color : isHovered ? `${node.color}aa` : `${node.color}55`}
                  strokeWidth={isSelected ? 2 : 1.2}
                  className="transition-all duration-300"
                />
              ) : (
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill={isSelected || isHovered ? `${node.color}25` : `${node.color}12`}
                  stroke={isSelected ? node.color : isHovered ? `${node.color}aa` : `${node.color}55`}
                  strokeWidth={isSelected ? 2 : 1.2}
                  className="transition-all duration-300"
                />
              )}

              {/* Icon */}
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + 24}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize="16"
              >
                {node.icon}
              </text>

              {/* Label */}
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + 40}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize="9.5"
                fontWeight="600"
                fill="white"
              >
                {node.label}
              </text>

              {/* Type badge */}
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + 52}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize="7"
                fill="#64748b"
              >
                {node.type === 'external' ? 'External Entity' : node.type === 'process' ? 'Process' : 'Data Store'}
              </text>

              {/* Pulse ring for current step nodes */}
              {(isCurrentSource || isCurrentTarget) && (
                <motion.rect
                  x={node.x - 8}
                  y={node.y - 8}
                  width={NODE_WIDTH + 16}
                  height={NODE_HEIGHT + 16}
                  rx={node.type === 'process' ? (NODE_WIDTH + 16) / 2 : 18}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
