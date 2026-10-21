import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, UserCog, Shield, Building2, Lock, FileEdit, EyeOff, 
  Settings, CheckCircle, BarChart3, ClipboardCheck, Brain, FileText,
  Database, HardDrive, Key, FileOutput
} from 'lucide-react';
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
  onAuthNodeClick?: () => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;
const BASE_VIEWBOX_WIDTH = 1400;

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap,
  UserCog,
  Shield,
  Building2,
  Lock,
  FileEdit,
  EyeOff,
  Settings,
  CheckCircle,
  BarChart3,
  ClipboardCheck,
  Brain,
  FileText,
  Database,
  HardDrive,
  Key,
  FileOutput
};

export default function DFDCanvas({
  nodes,
  flows,
  selectedNode,
  activeFlowIds,
  highlightedNodeIds,
  currentStep,
  role,
  onSelectNode,
  onAuthNodeClick,
}: DFDCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -20, y: 20, width: 1400, height: 880 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

  // Calculate zoom scale for text elements
  // When zoomed IN (small viewBox): text shrinks naturally (you're closer)
  // When zoomed OUT (large viewBox): text grows to stay readable
  const rawZoomScale = viewBox.width / BASE_VIEWBOX_WIDTH;
  const zoomScale = Math.max(0.7, Math.min(2.0, rawZoomScale));
  
  // Hide secondary text when zoomed out too far to prevent overlaps
  const isZoomedOutFar = rawZoomScale > 1.8;

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
    setViewBox((vb) => {
      const newWidth = Math.max(400, vb.width * 0.8);
      const newHeight = Math.max(250, vb.height * 0.8);
      return {
        x: vb.x + (vb.width - newWidth) * 0.5,
        y: vb.y + (vb.height - newHeight) * 0.5,
        width: newWidth,
        height: newHeight,
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox((vb) => {
      const newWidth = Math.min(3500, vb.width * 1.25);
      const newHeight = Math.min(2200, vb.height * 1.25);
      return {
        x: vb.x - (newWidth - vb.width) * 0.5,
        y: vb.y - (newHeight - vb.height) * 0.5,
        width: newWidth,
        height: newHeight,
      };
    });
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
        const newWidth = Math.max(400, Math.min(3500, vb.width * factor));
        const newHeight = Math.max(250, Math.min(2200, vb.height * factor));
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
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 items-center">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-sm hover:bg-slate-700 transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
        <div className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/60 backdrop-blur border border-white/5 font-mono">
          {Math.round((BASE_VIEWBOX_WIDTH / viewBox.width) * 100)}%
        </div>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-sm hover:bg-slate-700 transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-white text-xs hover:bg-slate-700 transition-colors flex items-center justify-center mt-1"
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
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        style={{ minHeight: '500px', userSelect: 'none' }}
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
          <marker id="arrowhead-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(71,85,105,0.15)" />
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
                  'rgba(71,85,105,0.06)'
                }
                strokeWidth={isCurrent ? 3 : isHovered ? 2 : active ? 1.8 : 0.5}
                strokeDasharray={active ? 'none' : '4 4'}
                markerEnd={isCurrent ? 'url(#arrowhead-current)' : active ? 'url(#arrowhead-active)' : 'url(#arrowhead-dim)'}
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
              {/* Flow label on hover or when current - counter-scaled */}
              {(isCurrent || isHovered) && (() => {
                const labelX = (getNodeCenter(flow.from).x + getNodeCenter(flow.to).x) / 2;
                const labelY = (getNodeCenter(flow.from).y + getNodeCenter(flow.to).y) / 2 - 8;
                const flowLabelSize = 11 * zoomScale;
                const padding = 8 * zoomScale;
                const boxHeight = 20 * zoomScale;
                // Estimate text width based on character count
                const estimatedWidth = Math.max(80, flow.label.length * 6) * zoomScale;
                return (
                  <g>
                    <rect
                      x={labelX - estimatedWidth / 2}
                      y={labelY - boxHeight / 2 - 2 * zoomScale}
                      width={estimatedWidth}
                      height={boxHeight}
                      rx={5 * zoomScale}
                      fill="rgba(15,23,42,0.95)"
                      stroke={isCurrent ? '#22d3ee55' : '#47556955'}
                      strokeWidth={1 * zoomScale}
                    />
                    <text
                      x={labelX}
                      y={labelY + flowLabelSize * 0.35}
                      textAnchor="middle"
                      className="font-semibold pointer-events-none"
                      fontSize={flowLabelSize}
                      fill={isCurrent ? '#67e8f9' : '#cbd5e1'}
                    >
                      {flow.label}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id;
          const isHighlighted = highlightedNodeIds.includes(node.id);
          const isCurrentSource = currentFlow?.from === node.id;
          const isCurrentTarget = currentFlow?.to === node.id;
          const isCurrent = isCurrentSource || isCurrentTarget;
          const isDimmed = role && !isHighlighted && !isSelected;
          const isHovered = hoveredNode === node.id;

          // Check if this is the auth node and no role is selected (entry point)
          const isAuthEntry = node.id === 'auth' && !role;

          // Three tiers of visual prominence
          // current > highlighted > dimmed
          const nodeScale = isDimmed
            ? 0.55
            : isCurrent
            ? 1.35
            : isHighlighted
            ? 1.0
            : 1.0;

          const nodeOpacity = isDimmed
            ? 0.08
            : isCurrent
            ? 1
            : isHighlighted
            ? 0.9
            : 1;

          // Font sizes per tier - larger base sizes for readability
          const iconSize = isDimmed ? 16 : isCurrent ? 32 : 24;
          const labelSize = isDimmed ? 11 : isCurrent ? 20 : 16;
          const typeSize = isDimmed ? 7 : isCurrent ? 11 : 9;

          // Anchor point for scaling (center of the node)
          const cx = node.x + NODE_WIDTH / 2;
          const cy = node.y + NODE_HEIGHT / 2;

          // Combined scale: node tier scale × zoom counter-scale
          const totalScale = nodeScale * zoomScale;

          return (
            <g
              key={node.id}
              onClick={() => {
                if (node.id === 'auth' && onAuthNodeClick) {
                  onAuthNodeClick();
                } else {
                  onSelectNode(node.id);
                }
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{
                opacity: nodeOpacity,
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transformOrigin: `${cx}px ${cy}px`,
                transform: `scale(${nodeScale})`,
              }}
            >
              {/* Outer glow for current-step nodes */}
              {isCurrent && (
                <>
                  <rect
                    x={node.x - 8}
                    y={node.y - 8}
                    width={NODE_WIDTH + 16}
                    height={NODE_HEIGHT + 16}
                    rx={node.type === 'process' ? (NODE_WIDTH + 16) / 2 : 18}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.6"
                    filter="url(#glow-strong)"
                  />
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={NODE_WIDTH + 8}
                    height={NODE_HEIGHT + 8}
                    rx={node.type === 'process' ? (NODE_WIDTH + 8) / 2 : 16}
                    fill={`${node.color}20`}
                    stroke={node.color}
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Pulsing glow for auth entry point */}
              {isAuthEntry && (
                <>
                  <motion.rect
                    x={node.x - 10}
                    y={node.y - 10}
                    width={NODE_WIDTH + 20}
                    height={NODE_HEIGHT + 20}
                    rx={node.type === 'process' ? (NODE_WIDTH + 20) / 2 : 20}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    filter="url(#glow-strong)"
                  />
                  <rect
                    x={node.x - 5}
                    y={node.y - 5}
                    width={NODE_WIDTH + 10}
                    height={NODE_HEIGHT + 10}
                    rx={node.type === 'process' ? (NODE_WIDTH + 10) / 2 : 17}
                    fill="#06b6d415"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                </>
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
                    fill={isAuthEntry ? '#06b6d430' : isCurrent ? `${node.color}30` : isHovered ? `${node.color}25` : `${node.color}15`}
                    stroke={isAuthEntry ? '#06b6d4' : isCurrent ? node.color : isHovered ? `${node.color}aa` : `${node.color}66`}
                    strokeWidth={isAuthEntry ? 2.5 : isCurrent ? 2.5 : isHovered ? 1.8 : 1.2}
                    className="transition-all duration-300"
                  />
                  <line x1={node.x} y1={node.y + 10} x2={node.x + NODE_WIDTH} y2={node.y + 10} stroke={`${node.color}44`} strokeWidth="0.8" />
                  <line x1={node.x} y1={node.y + NODE_HEIGHT - 10} x2={node.x + NODE_WIDTH} y2={node.y + NODE_HEIGHT - 10} stroke={`${node.color}44`} strokeWidth="0.8" />
                </>
              ) : node.type === 'process' ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={NODE_WIDTH / 2 - 2}
                  fill={isAuthEntry ? '#06b6d430' : isCurrent ? `${node.color}30` : isHovered ? `${node.color}25` : `${node.color}15`}
                  stroke={isAuthEntry ? '#06b6d4' : isCurrent ? node.color : isHovered ? `${node.color}aa` : `${node.color}66`}
                  strokeWidth={isAuthEntry ? 2.5 : isCurrent ? 2.5 : isHovered ? 1.8 : 1.2}
                  className="transition-all duration-300"
                />
              ) : (
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill={isAuthEntry ? '#06b6d430' : isCurrent ? `${node.color}30` : isHovered ? `${node.color}25` : `${node.color}15`}
                  stroke={isAuthEntry ? '#06b6d4' : isCurrent ? node.color : isHovered ? `${node.color}aa` : `${node.color}66`}
                  strokeWidth={isAuthEntry ? 2.5 : isCurrent ? 2.5 : isHovered ? 1.8 : 1.2}
                  className="transition-all duration-300"
                />
              )}

              {/* Icon - Lucide icon, sized by tier */}
              {(() => {
                const IconComponent = iconMap[node.icon];
                if (!IconComponent) return null;
                const iconSizePx = iconSize * zoomScale;
                return (
                  <foreignObject
                    x={cx - iconSizePx / 2}
                    y={node.y + 24 - iconSizePx / 2}
                    width={iconSizePx}
                    height={iconSizePx}
                    className="pointer-events-none select-none"
                  >
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComponent 
                        className="w-full h-full" 
                        style={{ 
                          color: isAuthEntry ? '#06b6d4' : isCurrent ? 'white' : node.color,
                          width: iconSizePx,
                          height: iconSizePx
                        }} 
                      />
                    </div>
                  </foreignObject>
                );
              })()}

              {/* Label - counter-scaled for zoom, sized by tier */}
              <text
                x={cx}
                y={node.y + 40}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize={labelSize * zoomScale}
                fontWeight={isCurrent ? '700' : '600'}
                fill={isCurrent ? 'white' : isDimmed ? '#94a3b8' : 'white'}
                transform={`translate(${cx}, ${node.y + 40}) scale(${zoomScale}) translate(${-cx}, ${-node.y - 40})`}
                style={{
                  textShadow: isCurrent ? `0 0 8px ${node.color}` : 'none',
                }}
              >
                {node.label}
              </text>

              {/* Type badge - counter-scaled for zoom, sized by tier */}
              {!isZoomedOutFar && (
                <text
                  x={cx}
                  y={node.y + 52}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={typeSize * zoomScale}
                  fill={isCurrent ? '#cbd5e1' : '#64748b'}
                  transform={`translate(${cx}, ${node.y + 52}) scale(${zoomScale}) translate(${-cx}, ${-node.y - 52})`}
                >
                  {node.type === 'external' ? 'External Entity' : node.type === 'process' ? 'Process' : 'Data Store'}
                </text>
              )}

              {/* "Click to login" hint for auth entry point */}
              {isAuthEntry && !isZoomedOutFar && (
                <text
                  x={cx}
                  y={node.y + NODE_HEIGHT + 18}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={9 * zoomScale}
                  fontWeight="600"
                  fill="#06b6d4"
                  transform={`translate(${cx}, ${node.y + NODE_HEIGHT + 18}) scale(${zoomScale}) translate(${-cx}, ${-node.y - NODE_HEIGHT - 18})`}
                >
                  Click to login →
                </text>
              )}

              {/* Pulse ring for current step nodes */}
              {isCurrent && (
                <motion.rect
                  x={node.x - 12}
                  y={node.y - 12}
                  width={NODE_WIDTH + 24}
                  height={NODE_HEIGHT + 24}
                  rx={node.type === 'process' ? (NODE_WIDTH + 24) / 2 : 22}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0] }}
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
