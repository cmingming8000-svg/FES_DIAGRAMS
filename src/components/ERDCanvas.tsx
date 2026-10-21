import { useState, useRef, useCallback, useEffect, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { ERDEntity, ERDRelationship, attributeTypeColors } from '../data/erdData';

interface ERDCanvasProps {
  entities: ERDEntity[];
  relationships: ERDRelationship[];
  selectedEntity: string | null;
  onSelectEntity: (id: string) => void;
}

export interface ERDCanvasHandle {
  getEntityPositions: () => Record<string, { x: number; y: number }>;
  getLabelPositions: () => Record<string, { t: number; scale: number }>;
  getZoom: () => { x: number; y: number; width: number; height: number };
  getSavedZooms: () => Record<string, { x: number; y: number; width: number; height: number }>;
  saveZoomForEntity: (entityId: string) => void;
}

const ENTITY_WIDTH = 320;
const ENTITY_HEADER_HEIGHT = 60;
const ATTRIBUTE_HEIGHT = 36;
const BASE_VIEWBOX_WIDTH = 2698.1860928977217;

const ERDCanvas = memo(forwardRef<ERDCanvasHandle, ERDCanvasProps>(function ERDCanvas({
  entities,
  relationships,
  selectedEntity,
  onSelectEntity,
}, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({
    x: -1267.5791392420338,
    y: -231.00340884071545,
    width: 2835.3329298171025,
    height: 1260.1479688076024
  });
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
  const [draggedLabelId, setDraggedLabelId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [entityPositions, setEntityPositions] = useState<Record<string, { x: number; y: number }>>({});
  // t: 0-1 parameter along the curve, scale: label size multiplier
  const [labelPositions, setLabelPositions] = useState<Record<string, { t: number; scale: number }>>({});
  // Saved zoom levels per entity
  const [savedZooms, setSavedZooms] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({
    "users": { x: -1213.6384947376102, y: -200.82613784515377, width: 2142.0386736157366, height: 952.0171882736618 },
    "academic_terms": { x: -1181.1746330202216, y: -255.45062279995585, width: 2251.6734254763974, height: 1000.7437446561779 },
    "sessions": { x: -1015.7597734733204, y: -323.7318424739222, width: 1227.285034764355, height: 545.4600154508249 },
    "evaluation_ratings": { x: -729.956067123643, y: 144.2591566831623, width: 1805.6169198895234, height: 802.4964088397892 },
    "evaluation_criteria": { x: -172.9130663232717, y: 151.57861164728413, width: 1404.919411155837, height: 624.4086271803727 },
    "evaluations": { x: -1265.24150134656, y: -252.1635084566542, width: 2251.6734254763974, height: 1000.7437446561779 },
    "audit_logs": { x: -1107.2546117195434, y: -285.847485282751, width: 1440.9084647556515, height: 640.4037621136234 },
    "tna_snapshots": { x: -935.1554154181415, y: -244.49357498895034, width: 2251.6734254763974, height: 1000.7437446561779 },
    "release_signatures": { x: -984.6065144336351, y: -249.9720988944531, width: 2251.6734254763974, height: 1000.7437446561779 }
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastAutoFollowTime = useRef<number>(0);
  
  // Initialize entity positions from data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    entities.forEach(entity => {
      positions[entity.id] = { x: entity.x, y: entity.y };
    });
    setEntityPositions(positions);
    
    // Initialize label positions from saved data
    const labelPos: Record<string, { t: number; scale: number }> = {
      "r1": { t: 0.5800000000000002, scale: 1 },
      "r2": { t: 0.5000000000000001, scale: 1 },
      "r3": { t: 0.7400000000000003, scale: 1 },
      "r4": { t: 0.5, scale: 1 },
      "r5": { t: 0.5600000000000002, scale: 1 },
      "r6": { t: 0.5000000000000001, scale: 1 },
      "r7": { t: 0.48000000000000015, scale: 1 },
      "r8": { t: 0.5200000000000001, scale: 1 },
      "r9": { t: 0.5200000000000001, scale: 1 },
      "r10": { t: 0.36000000000000004, scale: 1 },
      "r11": { t: 0.6400000000000002, scale: 1 }
    };
    setLabelPositions(labelPos);
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getEntityPositions: () => entityPositions,
    getLabelPositions: () => labelPositions, // Now returns { t, scale } instead of { x, y, scale }
    getZoom: () => viewBox,
    getSavedZooms: () => savedZooms,
    saveZoomForEntity: (entityId: string) => {
      setSavedZooms(prev => ({
        ...prev,
        [entityId]: { ...viewBox }
      }));
    }
  }), [entityPositions, labelPositions, viewBox, savedZooms]);
  
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

  // Calculate a point on the relationship curve at parameter t (0-1)
  const getPointOnCurve = useCallback((rel: ERDRelationship, t: number) => {
    const from = getEntityCenter(rel.from);
    const to = getEntityCenter(rel.to);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Calculate control points (same as in getRelationshipPath)
    let cx1: number, cy1: number, cx2: number, cy2: number;
    if (Math.abs(dx) > Math.abs(dy)) {
      cx1 = from.x + dx * 0.4;
      cy1 = from.y + dy * 0.1;
      cx2 = to.x - dx * 0.4;
      cy2 = to.y - dy * 0.1;
    } else {
      cx1 = from.x + dx * 0.1;
      cy1 = from.y + dy * 0.4;
      cx2 = to.x - dx * 0.1;
      cy2 = to.y - dy * 0.4;
    }
    
    // Cubic bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    const x = mt3 * from.x + 3 * mt2 * t * cx1 + 3 * mt * t2 * cx2 + t3 * to.x;
    const y = mt3 * from.y + 3 * mt2 * t * cy1 + 3 * mt * t2 * cy2 + t3 * to.y;
    
    return { x, y };
  }, [getEntityCenter]);

  // Find the closest point on a curve to a given mouse position
  const findClosestT = useCallback((rel: ERDRelationship, mouseX: number, mouseY: number) => {
    let bestT = 0.5;
    let bestDist = Infinity;
    
    // Sample the curve at multiple points to find closest
    for (let t = 0; t <= 1; t += 0.02) {
      const point = getPointOnCurve(rel, t);
      const dist = Math.sqrt((point.x - mouseX) ** 2 + (point.y - mouseY) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestT = t;
      }
    }
    
    return bestT;
  }, [getPointOnCurve]);

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
    setViewBox({
      x: -1267.5791392420338,
      y: -231.00340884071545,
      width: 2835.3329298171025,
      height: 1260.1479688076024
    });
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

  const handleLabelMouseDown = useCallback((e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    
    setIsDragging(true);
    setDraggedLabelId(labelId);
    setManualControl(true);
  }, []);

  const handleLabelResize = useCallback((labelId: string, delta: number) => {
    setLabelPositions(prev => ({
      ...prev,
      [labelId]: {
        ...prev[labelId],
        scale: Math.max(0.5, Math.min(3, prev[labelId].scale + delta))
      }
    }));
  }, []);

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
    } else if (isDragging && draggedLabelId && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgX = viewBox.x + (e.clientX - rect.left) * (viewBox.width / rect.width);
      const svgY = viewBox.y + (e.clientY - rect.top) * (viewBox.height / rect.height);
      
      // Find the relationship for this label
      const rel = relationships.find(r => r.id === draggedLabelId);
      if (rel) {
        // Find closest point on the curve
        const t = findClosestT(rel, svgX, svgY);
        
        setLabelPositions(prev => ({
          ...prev,
          [draggedLabelId]: {
            ...prev[draggedLabelId],
            t: t
          }
        }));
      }
    }
  }, [isPanning, isDragging, draggedEntityId, draggedLabelId, viewBox, panStart, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedEntityId(null);
    setDraggedLabelId(null);
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

  // Auto-zoom to entity when selected
  useEffect(() => {
    if (!selectedEntity || manualControl) return;
    
    // Debounce: prevent rapid successive auto-follows
    const now = Date.now();
    if (now - lastAutoFollowTime.current < 100) return;
    lastAutoFollowTime.current = now;
    
    const savedZoom = savedZooms[selectedEntity];
    if (!savedZoom) return;
    
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Animate to saved zoom - optimized for performance
    const duration = 400; // ms - faster for better responsiveness
    const startTime = performance.now();
    const startViewBox = { ...viewBoxRef.current };
    
    // Pre-calculate deltas for faster interpolation
    const deltaX = savedZoom.x - startViewBox.x;
    const deltaY = savedZoom.y - startViewBox.y;
    const deltaWidth = savedZoom.width - startViewBox.width;
    const deltaHeight = savedZoom.height - startViewBox.height;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simplified easing: ease-out-quad (faster than cubic)
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
    
    // Cleanup: cancel animation on unmount or dependency change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [selectedEntity, manualControl, savedZooms]);

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
              {/* Relationship label with background - draggable along curve and resizable */}
              {!isZoomedOutFar && (() => {
                const labelPos = labelPositions[rel.id];
                const t = labelPos?.t ?? 0.5;
                const pointOnCurve = getPointOnCurve(rel, t);
                const labelX = pointOnCurve.x;
                const labelY = pointOnCurve.y - 10;
                const labelScale = labelPos?.scale ?? 1;
                const fontSize = 18 * zoomScale * labelScale;
                const labelWidth = Math.max(100, rel.label.length * 10) * zoomScale * labelScale;
                const labelHeight = 28 * zoomScale * labelScale;
                
                return (
                  <g>
                    {/* Background rectangle - draggable */}
                    <rect
                      x={labelX - labelWidth / 2}
                      y={labelY - labelHeight / 2}
                      width={labelWidth}
                      height={labelHeight}
                      rx={6 * zoomScale}
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke={isHighlighted ? '#06b6d4' : '#475569'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      className="cursor-move"
                      onMouseDown={(e) => handleLabelMouseDown(e, rel.id)}
                    />
                    {/* Label text */}
                    <text
                      x={labelX}
                      y={labelY + 5}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fill={isHighlighted ? '#67e8f9' : '#e2e8f0'}
                      fontWeight={isHighlighted ? '700' : '500'}
                      className="pointer-events-none"
                    >
                      {rel.label}
                    </text>
                    {/* Resize handle (top-right corner) */}
                    <g
                      className="cursor-nesw-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startScale = labelScale;
                        
                        const handleMove = (moveEvent: MouseEvent) => {
                          const delta = (startY - moveEvent.clientY) / 100;
                          handleLabelResize(rel.id, delta * 0.1);
                        };
                        
                        const handleUp = () => {
                          window.removeEventListener('mousemove', handleMove);
                          window.removeEventListener('mouseup', handleUp);
                        };
                        
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', handleUp);
                      }}
                    >
                      <circle
                        cx={labelX + labelWidth / 2 - 5}
                        cy={labelY - labelHeight / 2 + 5}
                        r={4 * zoomScale}
                        fill="#06b6d4"
                        opacity={0.6}
                      />
                    </g>
                  </g>
                );
              })()}
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
}));

export default ERDCanvas;
