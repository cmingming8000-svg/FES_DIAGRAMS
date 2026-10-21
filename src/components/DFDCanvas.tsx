import { useState, useRef, useCallback, useEffect, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { DFDNode, DFDFlow, UserRole, nodes, flows } from '../data/dfdData';

interface DFDCanvasProps {
  selectedNode: string | null;
  activeFlowIds: string[];
  highlightedNodeIds: string[];
  currentStep: number;
  role: UserRole | null;
  onSelectNode: (id: string) => void;
  onAuthNodeClick?: () => void;
}

export interface DFDCanvasHandle {
  getPositions: () => Record<string, { x: number; y: number }>;
  getZoom: () => { x: number; y: number; width: number; height: number };
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;
const BASE_VIEWBOX_WIDTH = 2700;

// Simple text labels instead of icons for performance
const iconLabels: Record<string, string> = {
  GraduationCap: 'STU',
  UserCog: 'FAC',
  Shield: 'HR',
  Building2: 'DEAN',
  Lock: 'AUTH',
  FileEdit: 'EVAL',
  EyeOff: 'PII',
  Settings: 'ADM',
  CheckCircle: 'REL',
  BarChart3: 'DASH',
  ClipboardCheck: 'OVER',
  Brain: 'TNA',
  FileText: 'AUD',
  Database: 'DB',
  HardDrive: 'LOG',
  Key: 'SES',
  FileOutput: 'RPT'
};

const DFDCanvas = memo(forwardRef<DFDCanvasHandle, DFDCanvasProps>(function DFDCanvas({
  selectedNode,
  activeFlowIds,
  highlightedNodeIds,
  currentStep,
  role,
  onSelectNode,
  onAuthNodeClick,
}, ref) {
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
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastAutoFollowTime = useRef<number>(0);
  
  // Initialize node positions from data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(node => {
      positions[node.id] = { x: node.x, y: node.y };
    });
    setNodePositions(positions);
  }, []);

  // Keyboard shortcut to save node positions (Ctrl+Shift+Space) - DFD mode only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        
        // Create a downloadable JSON file with the positions
        const positionsJson = JSON.stringify(nodePositions, null, 2);
        const blob = new Blob([positionsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dfd-positions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Also log to console for easy copying
        console.log('=== DFD NODE POSITIONS ===');
        console.log(positionsJson);
        console.log('==========================');
        
        // Show modal with the JSON for easy copying
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 12px;
          padding: 24px;
          z-index: 9999;
          max-width: 600px;
          max-height: 80vh;
          overflow: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;
        
        modal.innerHTML = `
          <div style="color: #67e8f9; font-size: 16px; font-weight: 600; margin-bottom: 12px;">
            ✅ DFD Node Positions Saved
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
            Copy the JSON below and share it with the assistant to make positions permanent:
          </div>
          <textarea 
            readonly 
            style="
              width: 100%;
              height: 300px;
              background: rgba(30, 41, 59, 0.8);
              border: 1px solid rgba(100, 116, 139, 0.3);
              border-radius: 8px;
              padding: 12px;
              color: #e2e8f0;
              font-family: 'Courier New', monospace;
              font-size: 11px;
              resize: none;
            "
          >${positionsJson}</textarea>
          <button 
            onclick="
              navigator.clipboard.writeText(this.parentElement.querySelector('textarea').value);
              this.textContent = '✓ Copied!';
              setTimeout(() => this.textContent = 'Copy to Clipboard', 2000);
            "
            style="
              margin-top: 12px;
              width: 100%;
              padding: 10px;
              background: linear-gradient(135deg, #06b6d4, #3b82f6);
              border: none;
              border-radius: 8px;
              color: white;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: opacity 0.2s;
            "
            onmouseover="this.style.opacity='0.9'"
            onmouseout="this.style.opacity='1'"
          >
            Copy to Clipboard
          </button>
          <button 
            onclick="this.parentElement.parentElement.remove()"
            style="
              margin-top: 8px;
              width: 100%;
              padding: 8px;
              background: rgba(100, 116, 139, 0.2);
              border: 1px solid rgba(100, 116, 139, 0.3);
              border-radius: 8px;
              color: #94a3b8;
              font-size: 12px;
              cursor: pointer;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='rgba(100, 116, 139, 0.3)'"
            onmouseout="this.style.background='rgba(100, 116, 139, 0.2)'"
          >
            Close
          </button>
        `;
        
        document.body.appendChild(modal);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodePositions]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getPositions: () => nodePositions,
    getZoom: () => viewBox
  }), [nodePositions, viewBox]);
  
  // Keep ref in sync with state
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);
  
  // Reset manual control flag after a delay
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

  // Calculate zoom scale for text elements - memoized for performance
  const rawZoomScale = useMemo(() => viewBox.width / BASE_VIEWBOX_WIDTH, [viewBox.width]);
  const zoomScale = useMemo(() => Math.max(0.5, Math.min(7.0, rawZoomScale * 1.15)), [rawZoomScale]);
  
  // Hide secondary text when zoomed out too far to prevent overlaps
  const isZoomedOutFar = useMemo(() => rawZoomScale > 1.4, [rawZoomScale]);
  const isZoomedOutMedium = useMemo(() => rawZoomScale > 1.1, [rawZoomScale]);

  // Collision detection removed - user has arranged nodes intentionally
  const maxSafeScale = 10.0;

  const getNodeCenter = (nodeId: string) => {
    const pos = nodePositions[nodeId];
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x + NODE_WIDTH / 2, y: pos.y + NODE_HEIGHT / 2 };
  };

  const getFlowPath = (flow: DFDFlow) => {
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
  };

  const getReturnPath = (flow: DFDFlow) => {
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

  // Pan handling
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

  // Wheel zoom
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

  // Auto-follow active nodes when step changes with smooth animation
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
      {hoveredNode && !selectedNode && (
        <div className="absolute top-4 left-4 z-20 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur border border-white/10 text-xs text-white max-w-[200px]">
          <div className="font-semibold">{nodes.find(n => n.id === hoveredNode)?.label}</div>
          <div className="text-slate-400 mt-0.5">{nodes.find(n => n.id === hoveredNode)?.description}</div>
        </div>
      )}

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
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect x={viewBox.x - 200} y={viewBox.y - 200} width={viewBox.width + 400} height={viewBox.height + 400} fill="url(#grid)" />

        {flows.map((flow) => {
          const active = isFlowActive(flow);
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
              {flow.hasReturnFlow && isCurrent && !isZoomedOutFar && (() => {
                const from = getNodeCenter(flow.from);
                const to = getNodeCenter(flow.to);
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const offset = 15;
                const nx = -dy / len * offset;
                const ny = dx / len * offset;
                const midX = (from.x + to.x) / 2 + nx;
                const midY = (from.y + to.y) / 2 + ny;
                
                let returnLabel = 'RESPONSE';
                let returnColor = '#10b981';
                const labelLower = flow.label.toLowerCase();
                
                if (labelLower.includes('credential') || labelLower.includes('login')) {
                  returnLabel = 'AUTH TOKEN';
                  returnColor = '#8b5cf6';
                } else if (labelLower.includes('session')) {
                  returnLabel = 'SESSION ID';
                  returnColor = '#8b5cf6';
                } else if (labelLower.includes('evaluation') || labelLower.includes('query')) {
                  returnLabel = 'DATA';
                  returnColor = '#3b82f6';
                } else if (labelLower.includes('audit') || labelLower.includes('verify')) {
                  returnLabel = 'CONFIRM';
                  returnColor = '#6366f1';
                } else if (labelLower.includes('report')) {
                  returnLabel = 'REPORT';
                  returnColor = '#0ea5e9';
                }
                
                return (
                  <g>
                    <rect
                      x={midX - 35}
                      y={midY - 12}
                      width={70}
                      height={20}
                      rx={4}
                      fill={returnColor}
                      opacity="0.85"
                    />
                    <text
                      x={midX}
                      y={midY + 2}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight="600"
                      fill="white"
                      className="pointer-events-none"
                    >
                      {returnLabel}
                    </text>
                  </g>
                );
              })()}
              {isCurrent && !isZoomedOutMedium && (() => {
                const fromNode = nodes.find(n => n.id === flow.from);
                const toNode = nodes.find(n => n.id === flow.to);
                if (!fromNode || !toNode) return null;
                
                const isSend = fromNode.type === 'external' || fromNode.type === 'process';
                const directionLabel = isSend ? 'SEND' : 'RECEIVE';
                const directionColor = isSend ? '#f59e0b' : '#10b981';
                
                let dataType = 'DATA';
                let dataTypeColor = '#64748b';
                const labelLower = flow.label.toLowerCase();
                if (labelLower.includes('credential') || labelLower.includes('login') || labelLower.includes('password')) {
                  dataType = 'CREDENTIALS';
                  dataTypeColor = '#ef4444';
                } else if (labelLower.includes('session') || labelLower.includes('token')) {
                  dataType = 'SESSION';
                  dataTypeColor = '#8b5cf6';
                } else if (labelLower.includes('evaluation') || labelLower.includes('rating')) {
                  dataType = 'EVALUATION';
                  dataTypeColor = '#3b82f6';
                } else if (labelLower.includes('audit') || labelLower.includes('log')) {
                  dataType = 'AUDIT';
                  dataTypeColor = '#6366f1';
                } else if (labelLower.includes('report') || labelLower.includes('pdf') || labelLower.includes('excel')) {
                  dataType = 'REPORT';
                  dataTypeColor = '#0ea5e9';
                } else if (labelLower.includes('analytics') || labelLower.includes('tna') || labelLower.includes('insight')) {
                  dataType = 'ANALYTICS';
                  dataTypeColor = '#14b8a6';
                }
                
                const midX = (getNodeCenter(flow.from).x + getNodeCenter(flow.to).x) / 2;
                const midY = (getNodeCenter(flow.from).y + getNodeCenter(flow.to).y) / 2;
                const labelOffset = 25;
                
                return (
                  <g>
                    <rect
                      x={midX - 65}
                      y={midY - labelOffset - 14}
                      width={60}
                      height={24}
                      rx={5}
                      fill={directionColor}
                      opacity="0.9"
                    />
                    <text
                      x={midX - 35}
                      y={midY - labelOffset - 1}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight="700"
                      fill="white"
                      className="pointer-events-none"
                    >
                      {directionLabel}
                    </text>
                    
                    <rect
                      x={midX + 5}
                      y={midY - labelOffset - 14}
                      width={70}
                      height={24}
                      rx={5}
                      fill={dataTypeColor}
                      opacity="0.85"
                    />
                    <text
                      x={midX + 40}
                      y={midY - labelOffset - 1}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight="600"
                      fill="white"
                      className="pointer-events-none"
                    >
                      {dataType}
                    </text>
                  </g>
                );
              })()}
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
              {!isZoomedOutFar && (isCurrent || isHovered) && (() => {
                const labelX = (getNodeCenter(flow.from).x + getNodeCenter(flow.to).x) / 2;
                const labelY = (getNodeCenter(flow.from).y + getNodeCenter(flow.to).y) / 2 + 30;
                const flowLabelSize = 18;
                const descSize = 15;
                const boxHeight = 60;
                const estimatedWidth = Math.max(200, Math.max(flow.label.length, flow.description.length) * 9);
                
                return (
                  <g>
                    <rect
                      x={labelX - estimatedWidth / 2}
                      y={labelY - boxHeight / 2}
                      width={estimatedWidth}
                      height={boxHeight}
                      rx={8}
                      fill="rgba(15,23,42,0.95)"
                      stroke={isCurrent ? '#22d3ee55' : '#47556955'}
                      strokeWidth={1.5}
                    />
                    <text
                      x={labelX}
                      y={labelY - 8}
                      textAnchor="middle"
                      className="font-bold pointer-events-none"
                      fontSize={flowLabelSize}
                      fill={isCurrent ? '#67e8f9' : '#cbd5e1'}
                    >
                      {flow.label}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 14}
                      textAnchor="middle"
                      className="pointer-events-none"
                      fontSize={descSize}
                      fill={isCurrent ? '#94a3b8' : '#64748b'}
                    >
                      {flow.description}
                    </text>
                  </g>
                );
              })()}
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
          const isDraggingThis = draggedNodeId === node.id;

          const isAuthEntry = node.id === 'auth' && !role;

          const nodeScale = isDimmed
            ? 0.55
            : isCurrent
            ? 1.5
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
              className={isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}
              style={{
                opacity: nodeOpacity,
                transition: isDraggingThis ? 'none' : 'opacity 0.8s ease-in-out, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
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
                <motion.rect
                  x={pos.x - 5}
                  y={pos.y - 5}
                  width={NODE_WIDTH + 10}
                  height={NODE_HEIGHT + 10}
                  rx={node.type === 'process' ? (NODE_WIDTH + 10) / 2 : 17}
                  fill="#06b6d415"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
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
                {iconLabels[node.icon] || node.icon}
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
