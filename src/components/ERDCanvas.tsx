import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { ERDEntity, ERDRelationship, attributeTypeColors } from '../data/erdData';

interface ERDCanvasProps {
  entities: ERDEntity[];
  relationships: ERDRelationship[];
  selectedEntity: string | null;
  onSelectEntity: (id: string) => void;
}

const ENTITY_WIDTH = 320;
const ENTITY_HEADER_HEIGHT = 60;
const ATTRIBUTE_HEIGHT = 36;
const BASE_VIEWBOX_WIDTH = 2700;

const ERDCanvas = memo(function ERDCanvas({
  entities,
  relationships,
  selectedEntity,
  onSelectEntity,
}: ERDCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -50, y: 0, width: 2700, height: 1200 });
  const viewBoxRef = useRef(viewBox);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [manualControl, setManualControl] = useState(false);
  const manualControlTimer = useRef<number | null>(null);
  const lastMouseMove = useRef<number>(0);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEntityId, setDraggedEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [entityPositions, setEntityPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Initialize entity positions from data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    entities.forEach(entity => {
      positions[entity.id] = { x: entity.x, y: entity.y };
    });
    setEntityPositions(positions);
  }, []);
  
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

  // Calculate zoom scale
  const rawZoomScale = useMemo(() => viewBox.width / BASE_VIEWBOX_WIDTH, [viewBox.width]);
  const zoomScale = useMemo(() => Math.max(0.5, Math.min(7.0, rawZoomScale * 1.15)), [rawZoomScale]);
  
  const isZoomedOutFar = useMemo(() => rawZoomScale > 1.4, [rawZoomScale]);

  // Get entity center
  const getEntityCenter = useCallback((entityId: string) => {
    const pos = entityPositions[entityId];
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x + ENTITY_WIDTH / 2, y: pos.y + ENTITY_HEADER_HEIGHT / 2 };
  }, [entityPositions]);

  // Get relationship path
  const getRelationshipPath = useCallback((rel: ERDRelationship) => {
    const from = getEntityCenter(rel.from);
    const to = getEntityCenter(rel.to);
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
  }, [getEntityCenter]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setManualControl(true);
    setViewBox((vb) => {
      const newWidth = Math.max(600, vb.width * 0.8);
      const newHeight = Math.max(360, vb.height * 0.8);
      return {
        x: vb.x + (vb.width - newWidth) * 0.5,
        y: vb.y + (vb.height - newHeight) * 0.5,
        width: newWidth,
        height: newHeight,
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setManualControl(true);
    setViewBox((vb) => {
      const newWidth = Math.min(4000, vb.width * 1.25);
      const newHeight = Math.min(2400, vb.height * 1.25);
      return {
        x: vb.x - (newWidth - vb.width) * 0.5,
        y: vb.y - (newHeight - vb.height) * 0.5,
        width: newWidth,
        height: newHeight,
      };
    });
  }, []);

  const resetView = useCallback(() => {
    setManualControl(true);
    setViewBox({ x: -50, y: 0, width: 2700, height: 1200 });
  }, []);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect')) {
      setIsPanning(true);
      setManualControl(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleEntityMouseDown = useCallback((e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    const pos = entityPositions[entityId];
    if (!pos || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
    const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    setIsDragging(true);
    setDraggedEntityId(entityId);
    setDragOffset({ x: svgX - pos.x, y: svgY - pos.y });
    setManualControl(true);
  }, [entityPositions, viewBox]);

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
    } else if (isDragging && draggedEntityId && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
      const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
      
      setEntityPositions(prev => ({
        ...prev,
        [draggedEntityId]: {
          x: svgX - dragOffset.x,
          y: svgY - dragOffset.y
        }
      }));
    }
  }, [isPanning, isDragging, draggedEntityId, viewBox, panStart, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedEntityId(null);
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

  // Get related entities for highlighting
  const getRelatedEntities = useCallback((entityId: string) => {
    const related = new Set<string>();
    relationships.forEach(rel => {
      if (rel.from === entityId) related.add(rel.to);
      if (rel.to === entityId) related.add(rel.from);
    });
    return related;
  }, [relationships]);

  const relatedEntities = useMemo(() => {
    if (!selectedEntity) return new Set<string>();
    return getRelatedEntities(selectedEntity);
  }, [selectedEntity, getRelatedEntities]);

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
          {Math.round((1 / rawZoomScale) * 100)}%
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

      {/* SVG Canvas */}
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
          {/* Cardinality markers */}
          <marker id="one" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <line x1="5" y1="0" x2="5" y2="10" stroke="#64748b" strokeWidth="2" />
          </marker>
          <marker id="many" markerWidth="15" markerHeight="15" refX="7" refY="7" orient="auto">
            <path d="M 0 0 L 15 7 L 0 14" fill="none" stroke="#64748b" strokeWidth="2" />
          </marker>
        </defs>

        {/* Background */}
        <rect x={viewBox.x - 200} y={viewBox.y - 200} width={viewBox.width + 400} height={viewBox.height + 400} fill="url(#grid)" />

        {/* Relationships */}
        {relationships.map((rel) => {
          const isHighlighted = selectedEntity && (rel.from === selectedEntity || rel.to === selectedEntity);
          const isDimmed = selectedEntity && !isHighlighted;
          
          return (
            <g key={rel.id} style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 0.3s' }}>
              <path
                d={getRelationshipPath(rel)}
                fill="none"
                stroke={isHighlighted ? '#06b6d4' : '#475569'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                markerStart={rel.fromCardinality === '1' ? 'url(#one)' : 'url(#many)'}
                markerEnd={rel.toCardinality === '1' ? 'url(#one)' : 'url(#many)'}
              />
              {/* Relationship label */}
              {!isZoomedOutFar && (
                <text
                  x={(getEntityCenter(rel.from).x + getEntityCenter(rel.to).x) / 2}
                  y={(getEntityCenter(rel.from).y + getEntityCenter(rel.to).y) / 2 - 10}
                  textAnchor="middle"
                  fontSize={16 * zoomScale}
                  fill={isHighlighted ? '#67e8f9' : '#94a3b8'}
                  fontWeight={isHighlighted ? '600' : '400'}
                >
                  {rel.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Entities */}
        {entities.map((entity) => {
          const pos = entityPositions[entity.id] || { x: entity.x, y: entity.y };
          const isSelected = selectedEntity === entity.id;
          const isRelated = relatedEntities.has(entity.id);
          const isDimmed = selectedEntity && !isSelected && !isRelated;
          const isHovered = hoveredEntity === entity.id;
          const isDraggingThis = draggedEntityId === entity.id;
          
          const entityHeight = ENTITY_HEADER_HEIGHT + (entity.attributes.length * ATTRIBUTE_HEIGHT) + 10;
          
          return (
            <g
              key={entity.id}
              onClick={() => !isDragging && onSelectEntity(entity.id)}
              onMouseDown={(e) => handleEntityMouseDown(e, entity.id)}
              onMouseEnter={() => setHoveredEntity(entity.id)}
              onMouseLeave={() => setHoveredEntity(null)}
              className={isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}
              style={{
                opacity: isDimmed ? 0.3 : 1,
                transition: isDraggingThis ? 'none' : 'opacity 0.3s',
              }}
            >
              {/* Entity box */}
              <rect
                x={pos.x}
                y={pos.y}
                width={ENTITY_WIDTH}
                height={entityHeight}
                rx={8}
                fill={isSelected ? `${entity.color}30` : isHovered ? `${entity.color}20` : `${entity.color}10`}
                stroke={isSelected ? entity.color : isHovered ? `${entity.color}aa` : `${entity.color}66`}
                strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
              />
              
              {/* Entity header */}
              <rect
                x={pos.x}
                y={pos.y}
                width={ENTITY_WIDTH}
                height={ENTITY_HEADER_HEIGHT}
                rx={8}
                fill={entity.color}
                opacity={0.9}
              />
              <rect
                x={pos.x}
                y={pos.y + ENTITY_HEADER_HEIGHT - 8}
                width={ENTITY_WIDTH}
                height={8}
                fill={entity.color}
                opacity={0.9}
              />
              
              {/* Entity name */}
              <text
                x={pos.x + ENTITY_WIDTH / 2}
                y={pos.y + ENTITY_HEADER_HEIGHT / 2 + 5}
                textAnchor="middle"
                fontSize={24 * zoomScale}
                fontWeight="700"
                fill="white"
                className="pointer-events-none select-none"
              >
                {entity.label}
              </text>
              
              {/* Attributes */}
              {entity.attributes.map((attr, idx) => {
                const attrY = pos.y + ENTITY_HEADER_HEIGHT + (idx * ATTRIBUTE_HEIGHT) + 5;
                const typeColor = attributeTypeColors[attr.type];
                
                return (
                  <g key={attr.name}>
                    {/* PK/FK indicator */}
                    {attr.isPrimaryKey && (
                      <text
                        x={pos.x + 10}
                        y={attrY + ATTRIBUTE_HEIGHT / 2 + 4}
                        fontSize={14 * zoomScale}
                        fontWeight="700"
                        fill="#f59e0b"
                        className="pointer-events-none select-none"
                      >
                        PK
                      </text>
                    )}
                    {attr.isForeignKey && !attr.isPrimaryKey && (
                      <text
                        x={pos.x + 10}
                        y={attrY + ATTRIBUTE_HEIGHT / 2 + 4}
                        fontSize={14 * zoomScale}
                        fontWeight="700"
                        fill="#06b6d4"
                        className="pointer-events-none select-none"
                      >
                        FK
                      </text>
                    )}
                    
                    {/* Attribute name */}
                    <text
                      x={pos.x + (attr.isPrimaryKey || attr.isForeignKey ? 45 : 15)}
                      y={attrY + ATTRIBUTE_HEIGHT / 2 + 4}
                      fontSize={16 * zoomScale}
                      fill="white"
                      className="pointer-events-none select-none"
                    >
                      {attr.name}
                    </text>
                    
                    {/* Attribute type */}
                    <text
                      x={pos.x + ENTITY_WIDTH - 15}
                      y={attrY + ATTRIBUTE_HEIGHT / 2 + 4}
                      textAnchor="end"
                      fontSize={14 * zoomScale}
                      fill={typeColor}
                      className="pointer-events-none select-none"
                    >
                      {attr.type}
                    </text>
                    
                    {/* Separator line */}
                    {idx < entity.attributes.length - 1 && (
                      <line
                        x1={pos.x + 10}
                        y1={attrY + ATTRIBUTE_HEIGHT}
                        x2={pos.x + ENTITY_WIDTH - 10}
                        y2={attrY + ATTRIBUTE_HEIGHT}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={1}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default ERDCanvas;
