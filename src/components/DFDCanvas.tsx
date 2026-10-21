import { memo, forwardRef, useImperativeHandle, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DFDNode, DFDFlow, UserRole, nodes, flows } from '../data/dfdData';

export interface DFDCanvasHandle {
  getPositions: () => Record<string, { x: number; y: number }>;
  getZoom: () => { x: number; y: number; width: number; height: number };
}

interface DFDCanvasProps {
  selectedNode: string | null;
  activeFlowIds: string[];
  highlightedNodeIds: string[];
  currentStep: number;
  role: UserRole | null;
  onSelectNode: (id: string) => void;
  onAuthNodeClick?: () => void;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;
const BASE_VIEWBOX_WIDTH = 2700;

const DFDCanvas = memo(forwardRef<DFDCanvasHandle, DFDCanvasProps>(({
  selectedNode,
  activeFlowIds,
  highlightedNodeIds,
  currentStep,
  role,
  onSelectNode,
  onAuthNodeClick
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -50, y: 0, width: 2700, height: 1200 });
  const viewBoxRef = useRef(viewBox);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [manualControl, setManualControl] = useState(false);
  const manualControlTimer = useRef<number | null>(null);
  const lastMouseMove = useRef<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastAutoFollowTime = useRef<number>(0);

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(node => {
      positions[node.id] = { x: node.x, y: node.y };
    });
    setNodePositions(positions);
  }, []);

  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  useEffect(() => {
    if (manualControl) {
      if (manualControlTimer.current) {
        clearTimeout(manualControlTimer.current);
      }
      manualControlTimer.current = window.setTimeout(() => {
        setManualControl(false);
      }, 2000);
    }

    return () => {
      if (manualControlTimer.current) {
        clearTimeout(manualControlTimer.current);
      }
    };
  }, [manualControl, viewBox]);

  useImperativeHandle(ref, () => ({
    getPositions: () => nodePositions,
    getZoom: () => viewBox
  }), [nodePositions, viewBox]);

  const rawZoomScale = useMemo(() => viewBox.width / BASE_VIEWBOX_WIDTH, [viewBox.width]);
  const zoomScale = useMemo(() => Math.max(0.5, Math.min(7.0, rawZoomScale * 1.15)), [rawZoomScale]);
  const isZoomedOutFar = useMemo(() => rawZoomScale > 1.4, [rawZoomScale]);
  const isZoomedOutMedium = useMemo(() => rawZoomScale > 1.1, [rawZoomScale]);

  const maxSafeScale = 10.0;

  const getNodeCenter = useCallback((nodeId: string) => {
    const pos = nodePositions[nodeId];
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x + NODE_WIDTH / 2, y: pos.y + NODE_HEIGHT / 2 };
  }, [nodePositions]);

  const getFlowPath = useCallback((flow: DFDFlow) => {
    const from = getNodeCenter(flow.from);
    const to = getNodeCenter(flow.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
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
  }, [getNodeCenter]);

  const getReturnPath = useCallback((flow: DFDFlow) => {
    const from = getNodeCenter(flow.from);
    const to = getNodeCenter(flow.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    const offset = 15;
    const nx = -dy / len * offset;
    const ny = dx / len * offset;
    
    const rFrom = { x: to.x + nx, y: to.y + ny };
    const rTo = { x: from.x + nx, y: from.y + ny };
    const rdx = rTo.x - rFrom.x;
    const rdy = rTo.y - rFrom.y;
    
    if (Math.abs(rdx) > Math.abs(rdy)) {
      const cx1 = rFrom.x + rdx * 0.4;
      const cy1 = rFrom.y + rdy * 0.1;
      const cx2 = rTo.x - rdx * 0.4;
      const cy2 = rTo.y - rdy * 0.1;
      return `M ${rFrom.x} ${rFrom.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${rTo.x} ${rTo.y}`;
    } else {
      const cx1 = rFrom.x + rdx * 0.1;
      const cy1 = rFrom.y + rdy * 0.4;
      const cx2 = rTo.x - rdx * 0.1;
      const cy2 = rTo.y - rdy * 0.4;
      return `M ${rFrom.x} ${rFrom.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${rTo.x} ${rTo.y}`;
    }
  }, [getNodeCenter]);

  const resetView = useCallback(() => {
    setManualControl(true);
    setViewBox({ x: -50, y: 0, width: 2700, height: 1200 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect')) {
      setIsPanning(true);
      setManualControl(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = nodePositions[nodeId];
    if (!pos || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
    const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    setIsDragging(true);
    setDraggedNodeId(nodeId);
    setDragOffset({ x: svgX - pos.x, y: svgY - pos.y });
    setManualControl(true);
  }, [nodePositions, viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMove.current < 16) return;
    lastMouseMove.current = now;

    if (isPanning && !isDragging && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox((vb) => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isDragging && draggedNodeId && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
      const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNodeId]: {
          x: svgX - dragOffset.x,
          y: svgY - dragOffset.y
        }
      }));
    }
  }, [isPanning, isDragging, draggedNodeId, viewBox, panStart, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNodeId(null);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setManualControl(true);
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) => {
        const newWidth = Math.max(600, Math.min(4000, vb.width * factor));
        const newHeight = Math.max(360, Math.min(2400, vb.height * factor));
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

  const currentFlow = useMemo(() => {
    if (!role) return null;
    return flows.find((f) => f.stepOrder[role] === currentStep);
  }, [currentStep, role]);

  useEffect(() => {
    if (!role || !currentFlow || manualControl) return;
    
    const now = Date.now();
    if (now - lastAutoFollowTime.current < 100) return;
    lastAutoFollowTime.current = now;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const fromNode = nodes.find(n => n.id === currentFlow.from);
    const toNode = nodes.find(n => n.id === currentFlow.to);
    
    if (!fromNode || !toNode) return;
    
    const fromPos = nodePositions[currentFlow.from] || { x: fromNode.x, y: fromNode.y };
    const toPos = nodePositions[currentFlow.to] || { x: toNode.x, y: toNode.y };
    
    const padding = 80;
    const minX = Math.min(fromPos.x, toPos.x) - padding;
    const maxX = Math.max(fromPos.x + NODE_WIDTH, toPos.x + NODE_WIDTH) + padding;
    const minY = Math.min(fromPos.y, toPos.y) - padding;
    const maxY = Math.max(fromPos.y + NODE_HEIGHT, toPos.y + NODE_HEIGHT) + padding;
    
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    
    const targetWidth = bboxWidth * 1.05;
    const targetHeight = bboxHeight * 1.05;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const minViewWidth = 300;
    const minViewHeight = 200;
    
    const finalWidth = Math.max(targetWidth, minViewWidth);
    const finalHeight = Math.max(targetHeight, minViewHeight);
    
    const targetViewBox = {
      x: centerX - finalWidth / 2,
      y: centerY - finalHeight / 2,
      width: finalWidth,
      height: finalHeight
    };
    
    const duration = 400;
    const startTime = performance.now();
    const startViewBox = { ...viewBoxRef.current };
    
    const deltaX = targetViewBox.x - startViewBox.x;
    const deltaY = targetViewBox.y - startViewBox.y;
    const deltaWidth = targetViewBox.width - startViewBox.width;
    const deltaHeight = targetViewBox.height - startViewBox.height;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - (1 - progress) * (1 - progress);
      
      setViewBox({
        x: startViewBox.x + deltaX * eased,
        y: startViewBox.y + deltaY * eased,
        width: startViewBox.width + deltaWidth * eased,
        height: startViewBox.height + deltaHeight * eased
      });
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [currentStep, role, manualControl, nodePositions, currentFlow]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        style={{ 
          minHeight: '500px', 
          userSelect: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          </pattern>
          <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#64748b" />
          </marker>
          <marker id="arrowhead-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(71,85,105,0.15)" />
          </marker>
          <marker id="arrowhead-active" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
            <polygon points="0 0, 12 5, 0 10" fill="#06b6d4" />
          </marker>
          <marker id="arrowhead-current" markerWidth="14" markerHeight="12" refX="13" refY="6" orient="auto">
            <polygon points="0 0, 14 6, 0 12" fill="#22d3ee" />
          </marker>
          <marker id="arrowhead-return" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#10b981" />
          </marker>
          <marker id="arrowhead-return-dim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(16,185,129,0.3)" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={viewBox.x - 200} y={viewBox.y - 200} width={viewBox.width + 400} height={viewBox.height + 400} fill="url(#grid)" />

        {flows.map((flow) => {
          const active = activeFlowIds.includes(flow.id);
          const isCurrent = currentFlow?.id === flow.id;
          const dimmed = role && !active;
          const isHovered = hoveredFlow === flow.id;

          return (
            <g key={flow.id}>
              <path
                d={getFlowPath(flow)}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                onMouseEnter={() => setHoveredFlow(flow.id)}
                onMouseLeave={() => setHoveredFlow(null)}
                className="cursor-pointer"
              />
              <path
                d={getFlowPath(flow)}
                fill="none"
                stroke={
                  isCurrent ? '#22d3ee' :
                  active ? '#06b6d4' :
                  isHovered ? '#64748b' :
                  'rgba(71,85,105,0.06)'
                }
                strokeWidth={isCurrent ? 4 : isHovered ? 2.5 : active ? 2 : 0.5}
                strokeDasharray={active ? 'none' : '4 4'}
                markerEnd={isCurrent ? 'url(#arrowhead-current)' : active ? 'url(#arrowhead-active)' : 'url(#arrowhead-dim)'}
                filter={isCurrent ? 'url(#glow)' : undefined}
                className="transition-all duration-500"
              />
              {flow.hasReturnFlow && (
                <path
                  d={getReturnPath(flow)}
                  fill="none"
                  stroke={
                    isCurrent ? '#10b981' :
                    active ? '#10b981aa' :
                    isHovered ? '#10b98166' :
                    'rgba(16,185,129,0.15)'
                  }
                  strokeWidth={isCurrent ? 3 : isHovered ? 2 : active ? 1.8 : 0.8}
                  strokeDasharray="6 4"
                  markerEnd={isCurrent ? 'url(#arrowhead-return)' : active ? 'url(#arrowhead-return)' : 'url(#arrowhead-return-dim)'}
                  className="transition-all duration-500"
                  opacity={isCurrent ? 0.95 : active ? 0.7 : isHovered ? 0.5 : 0.3}
                />
              )}
              {isCurrent && (
                <>
                  <circle r="5" fill="#22d3ee" opacity="0.9">
                    <animateMotion dur="2s" repeatCount="indefinite" path={getFlowPath(flow)} />
                  </circle>
                  {flow.hasReturnFlow && (
                    <circle r="4" fill="#10b981" opacity="0.8">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path={getReturnPath(flow)} />
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const pos = nodePositions[node.id] || { x: node.x, y: node.y };
          const isSelected = selectedNode === node.id;
          const isHighlighted = highlightedNodeIds.includes(node.id);
          const isCurrentSource = currentFlow?.from === node.id;
          const isCurrentTarget = currentFlow?.to === node.id;
          const isCurrent = isCurrentSource || isCurrentTarget;
          const isDimmed = role && !isHighlighted && !isSelected;
          const isHovered = hoveredNode === node.id;
          const isAuthEntry = node.id === 'auth' && !role;

          const nodeScale = isDimmed ? 0.55 : isCurrent ? 1.5 : isHighlighted ? 1.0 : 1.0;
          const nodeOpacity = isDimmed ? 0.08 : isCurrent ? 1 : isHighlighted ? 0.9 : 1;

          const cx = pos.x + NODE_WIDTH / 2;
          const cy = pos.y + NODE_HEIGHT / 2;

          const baseScale = nodeScale * zoomScale;
          const totalScale = Math.min(baseScale, maxSafeScale);

          return (
            <g
              key={node.id}
              onClick={() => {
                if (!isDragging) {
                  if (node.id === 'auth' && onAuthNodeClick) {
                    onAuthNodeClick();
                  } else {
                    onSelectNode(node.id);
                  }
                }
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              style={{
                opacity: nodeOpacity,
                transition: isDragging ? 'none' : 'opacity 0.8s ease-in-out, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: `${cx}px ${cy}px`,
                transform: `scale(${totalScale})`,
              }}
            >
              {isCurrent && (
                <rect
                  x={pos.x - 4}
                  y={pos.y - 4}
                  width={NODE_WIDTH + 8}
                  height={NODE_HEIGHT + 8}
                  rx={node.type === 'process' ? (NODE_WIDTH + 8) / 2 : 16}
                  fill={`${node.color}20`}
                  stroke={node.color}
                  strokeWidth="2"
                />
              )}

              {isAuthEntry && (
                <rect
                  x={pos.x - 5}
                  y={pos.y - 5}
                  width={NODE_WIDTH + 10}
                  height={NODE_HEIGHT + 10}
                  rx={node.type === 'process' ? (NODE_WIDTH + 10) / 2 : 17}
                  fill="#06b6d415"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
              )}

              {node.type === 'datastore' ? (
                <>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={4}
                    fill={isAuthEntry ? '#06b6d430' : isCurrent ? `${node.color}30` : isHovered ? `${node.color}25` : `${node.color}15`}
                    stroke={isAuthEntry ? '#06b6d4' : isCurrent ? node.color : isHovered ? `${node.color}aa` : `${node.color}66`}
                    strokeWidth={isAuthEntry ? 2.5 : isCurrent ? 2.5 : isHovered ? 1.8 : 1.2}
                    className="transition-all duration-300"
                  />
                  <line x1={pos.x} y1={pos.y + 10} x2={pos.x + NODE_WIDTH} y2={pos.y + 10} stroke={`${node.color}44`} strokeWidth="0.8" />
                  <line x1={pos.x} y1={pos.y + NODE_HEIGHT - 10} x2={pos.x + NODE_WIDTH} y2={pos.y + NODE_HEIGHT - 10} stroke={`${node.color}44`} strokeWidth="0.8" />
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
                  x={pos.x}
                  y={pos.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill={isAuthEntry ? '#06b6d430' : isCurrent ? `${node.color}30` : isHovered ? `${node.color}25` : `${node.color}15`}
                  stroke={isAuthEntry ? '#06b6d4' : isCurrent ? node.color : isHovered ? `${node.color}aa` : `${node.color}66`}
                  strokeWidth={isAuthEntry ? 2.5 : isCurrent ? 2.5 : isHovered ? 1.8 : 1.2}
                  className="transition-all duration-300"
                />
              )}

              <text
                x={cx}
                y={pos.y + 40}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize={28}
                fontWeight="700"
                fill={isAuthEntry ? '#06b6d4' : isCurrent ? 'white' : node.color}
                opacity={0.9}
              >
                {node.icon}
              </text>

              {!isZoomedOutFar && (
                <text
                  x={cx}
                  y={pos.y + 75}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={24}
                  fontWeight={isCurrent ? '700' : '600'}
                  fill={isCurrent ? 'white' : isDimmed ? '#94a3b8' : 'white'}
                  style={{
                    textShadow: isCurrent ? `0 0 8px ${node.color}` : 'none',
                  }}
                >
                  {node.label}
                </text>
              )}

              {!isZoomedOutMedium && (
                <text
                  x={cx}
                  y={pos.y + 98}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={16}
                  fill={isCurrent ? '#cbd5e1' : '#64748b'}
                >
                  {node.type === 'external' ? 'External Entity' : node.type === 'process' ? 'Process' : 'Data Store'}
                </text>
              )}

              {isAuthEntry && !isZoomedOutFar && (
                <text
                  x={cx}
                  y={pos.y + NODE_HEIGHT + 22}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize={14}
                  fontWeight="600"
                  fill="#06b6d4"
                >
                  Click to login →
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}));

export default DFDCanvas;
