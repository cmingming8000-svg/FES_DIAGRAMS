import { memo, forwardRef, useImperativeHandle, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SADComponent, SADConnection, components, connections, SADFlowStep } from '../data/sadData';

export interface SADCanvasHandle {
  getComponentPositions: () => Record<string, { x: number; y: number }>;
  getZoom: () => { x: number; y: number; width: number; height: number };
  getSavedZooms: () => Record<string, { x: number; y: number; width: number; height: number }>;
  saveZoomForComponent: (componentId: string) => void;
}

interface SADCanvasProps {
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  activeFlow?: SADFlowStep[] | null;
  currentStep?: number;
}

const COMPONENT_WIDTH = 180;
const COMPONENT_HEIGHT = 100;

const SADCanvas = memo(forwardRef<SADCanvasHandle, SADCanvasProps>(({
  selectedComponent,
  onSelectComponent,
  activeFlow,
  currentStep = 1
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({
    x: -1000,
    y: -400,
    width: 2200,
    height: 1000
  });
  const viewBoxRef = useRef(viewBox);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [manualControl, setManualControl] = useState(false);
  const manualControlTimer = useRef<number | null>(null);
  const lastMouseMove = useRef<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [componentPositions, setComponentPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [savedZooms, setSavedZooms] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastAutoFollowTime = useRef<number>(0);

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    components.forEach(component => {
      positions[component.id] = { x: component.x, y: component.y };
    });
    setComponentPositions(positions);
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
    getComponentPositions: () => componentPositions,
    getZoom: () => viewBox,
    getSavedZooms: () => savedZooms,
    saveZoomForComponent: (componentId: string) => {
      setSavedZooms(prev => ({
        ...prev,
        [componentId]: { ...viewBox }
      }));
    }
  }), [componentPositions, viewBox, savedZooms]);

  const getComponentCenter = useCallback((componentId: string) => {
    const pos = componentPositions[componentId];
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x + COMPONENT_WIDTH / 2, y: pos.y + COMPONENT_HEIGHT / 2 };
  }, [componentPositions]);

  const getConnectionPath = useCallback((conn: SADConnection) => {
    const from = getComponentCenter(conn.from);
    const to = getComponentCenter(conn.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const cx1 = from.x + dx * 0.3;
    const cy1 = from.y;
    const cx2 = to.x - dx * 0.3;
    const cy2 = to.y;

    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  }, [getComponentCenter]);

  const resetView = useCallback(() => {
    setManualControl(true);
    setViewBox({
      x: -1000,
      y: -400,
      width: 2200,
      height: 1000
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect')) {
      setIsPanning(true);
      setManualControl(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleComponentMouseDown = useCallback((e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    const pos = componentPositions[componentId];
    if (!pos || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
    const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);

    setIsDragging(true);
    setDraggedComponentId(componentId);
    setDragOffset({ x: svgX - pos.x, y: svgY - pos.y });
    setManualControl(true);
  }, [componentPositions, viewBox]);

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
    } else if (isDragging && draggedComponentId && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
      const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);

      setComponentPositions(prev => ({
        ...prev,
        [draggedComponentId]: {
          x: svgX - dragOffset.x,
          y: svgY - dragOffset.y
        }
      }));
    }
  }, [isPanning, isDragging, draggedComponentId, viewBox, panStart, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedComponentId(null);
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

  useEffect(() => {
    if (!selectedComponent || manualControl) return;

    const now = Date.now();
    if (now - lastAutoFollowTime.current < 100) return;
    lastAutoFollowTime.current = now;

    const pos = componentPositions[selectedComponent];
    if (!pos) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const padding = 300;
    const targetWidth = 1200;
    const targetHeight = 600;
    
    const targetViewBox = {
      x: pos.x + COMPONENT_WIDTH / 2 - targetWidth / 2,
      y: pos.y + COMPONENT_HEIGHT / 2 - targetHeight / 2,
      width: targetWidth,
      height: targetHeight
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
  }, [selectedComponent, manualControl, componentPositions]);

  const getRelatedComponents = useCallback((componentId: string) => {
    const related = new Set<string>();
    connections.forEach(conn => {
      if (conn.from === componentId) related.add(conn.to);
      if (conn.to === componentId) related.add(conn.from);
    });
    return related;
  }, []);

  const relatedComponents = useMemo(() => {
    if (!selectedComponent) return new Set<string>();
    return getRelatedComponents(selectedComponent);
  }, [selectedComponent, getRelatedComponents]);

  const activeFlowComponents = useMemo(() => {
    if (!activeFlow) return new Set<string>();
    const active = new Set<string>();
    for (let i = 0; i < currentStep; i++) {
      if (activeFlow[i]) {
        active.add(activeFlow[i].componentId);
      }
    }
    return active;
  }, [activeFlow, currentStep]);

  const activeFlowConnections = useMemo(() => {
    if (!activeFlow) return new Set<string>();
    const active = new Set<string>();
    for (let i = 0; i < currentStep; i++) {
      const step = activeFlow[i];
      if (step?.connectionId) {
        active.add(step.connectionId);
      }
    }
    return active;
  }, [activeFlow, currentStep]);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'frontend': return '🖥️';
      case 'backend': return '⚙️';
      case 'database': return '🗄️';
      case 'service': return '🔧';
      case 'external': return '🌐';
      default: return '📦';
    }
  };

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
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
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

        {connections.map((conn) => {
          const isActiveInFlow = activeFlow && activeFlowConnections.has(conn.id);
          const isCurrentStep = activeFlow && currentStep > 0 && activeFlow[currentStep - 1]?.connectionId === conn.id;
          const isHighlighted = selectedComponent && (conn.from === selectedComponent || conn.to === selectedComponent);
          const isDimmed = (selectedComponent && !isHighlighted) || (activeFlow && !isActiveInFlow);

          return (
            <g key={conn.id} style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 0.3s' }}>
              <path
                d={getConnectionPath(conn)}
                fill="none"
                stroke={isCurrentStep ? '#22d3ee' : isActiveInFlow ? '#06b6d4' : isHighlighted ? '#06b6d4' : '#475569'}
                strokeWidth={isCurrentStep ? 3 : isActiveInFlow ? 2.5 : isHighlighted ? 2.5 : 1.5}
                markerEnd="url(#arrowhead)"
                filter={isCurrentStep ? 'url(#glow)' : undefined}
              />
              {(() => {
                const from = getComponentCenter(conn.from);
                const to = getComponentCenter(conn.to);
                const labelX = (from.x + to.x) / 2;
                const labelY = (from.y + to.y) / 2 - 10;
                const fontSize = 14;
                const labelWidth = Math.max(80, conn.label.length * 8);
                const labelHeight = 24;
                const labelHighlighted = isCurrentStep || isActiveInFlow || isHighlighted;

                return (
                  <g>
                    <rect
                      x={labelX - labelWidth / 2}
                      y={labelY - labelHeight / 2}
                      width={labelWidth}
                      height={labelHeight}
                      rx={4}
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke={labelHighlighted ? '#06b6d4' : isDimmed ? '#1e293b' : '#475569'}
                      strokeWidth={labelHighlighted ? 2 : 1}
                    />
                    <text
                      x={labelX}
                      y={labelY + 5}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fill={labelHighlighted ? '#67e8f9' : isDimmed ? '#475569' : '#e2e8f0'}
                      fontWeight={labelHighlighted ? '700' : '500'}
                    >
                      {conn.label}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {components.map((component) => {
          const pos = componentPositions[component.id] || { x: component.x, y: component.y };
          const isSelected = selectedComponent === component.id;
          const isRelated = relatedComponents.has(component.id);
          const isActiveInFlow = activeFlow && activeFlowComponents.has(component.id);
          const isCurrentStep = activeFlow && currentStep > 0 && activeFlow[currentStep - 1]?.componentId === component.id;
          const isDimmed = (selectedComponent && !isSelected && !isRelated) || (activeFlow && !isActiveInFlow);
          const isDraggingThis = draggedComponentId === component.id;

          return (
            <g
              key={component.id}
              onClick={() => !isDragging && onSelectComponent(component.id)}
              onMouseDown={(e) => handleComponentMouseDown(e, component.id)}
              className={isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}
              style={{
                opacity: isDimmed ? 0.3 : 1,
                transition: isDraggingThis ? 'none' : 'opacity 0.3s',
              }}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={COMPONENT_WIDTH}
                height={COMPONENT_HEIGHT}
                rx={8}
                fill={isCurrentStep ? `${component.color}40` : isSelected ? `${component.color}30` : isActiveInFlow ? `${component.color}20` : isDimmed ? `${component.color}05` : `${component.color}10`}
                stroke={isCurrentStep ? '#22d3ee' : isSelected ? component.color : isActiveInFlow ? `${component.color}aa` : isDimmed ? `${component.color}33` : `${component.color}66`}
                strokeWidth={isCurrentStep ? 3.5 : isSelected ? 3 : isActiveInFlow ? 2 : isDimmed ? 1 : 1.5}
                filter={isCurrentStep ? 'url(#glow)' : undefined}
              />

              <text
                x={pos.x + COMPONENT_WIDTH / 2}
                y={pos.y + 35}
                textAnchor="middle"
                fontSize={32}
                className="pointer-events-none select-none"
              >
                {getComponentIcon(component.type)}
              </text>

              <text
                x={pos.x + COMPONENT_WIDTH / 2}
                y={pos.y + 65}
                textAnchor="middle"
                fontSize={16}
                fontWeight="600"
                fill="white"
                className="pointer-events-none select-none"
              >
                {component.label}
              </text>

              <text
                x={pos.x + COMPONENT_WIDTH / 2}
                y={pos.y + 85}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
                className="pointer-events-none select-none"
              >
                {component.description}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}));

export default SADCanvas;
