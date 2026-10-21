import { motion, AnimatePresence } from 'framer-motion';
import { ERDEntity, ERDRelationship, attributeTypeColors } from '../data/erdData';

interface ERDInfoPanelProps {
  selectedEntity: ERDEntity | null;
  relationships: ERDRelationship[];
  entities: ERDEntity[];
}

export default function ERDInfoPanel({ selectedEntity, relationships, entities }: ERDInfoPanelProps) {
  if (!selectedEntity) {
    return (
      <div className="w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 h-fit">
        <div className="text-center py-4 text-slate-500 text-sm">
          Click an entity to view details
        </div>
      </div>
    );
  }

  // Get relationships for this entity
  const entityRelationships = relationships.filter(
    rel => rel.from === selectedEntity.id || rel.to === selectedEntity.id
  );

  return (
    <div className="w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Entity Header */}
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: selectedEntity.color }}
        >
          {selectedEntity.label.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{selectedEntity.label}</div>
          <div className="text-xs text-slate-400">{selectedEntity.description}</div>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Attributes ({selectedEntity.attributes.length})
        </div>
        <div className="space-y-1">
          {selectedEntity.attributes.map((attr) => (
            <div 
              key={attr.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-white/5"
            >
              <div className="flex items-center gap-2">
                {attr.isPrimaryKey && (
                  <span className="text-[10px] font-bold text-amber-400">PK</span>
                )}
                {attr.isForeignKey && !attr.isPrimaryKey && (
                  <span className="text-[10px] font-bold text-cyan-400">FK</span>
                )}
                <span className="text-xs text-white font-medium">{attr.name}</span>
              </div>
              <span 
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ 
                  color: attributeTypeColors[attr.type],
                  backgroundColor: `${attributeTypeColors[attr.type]}20`
                }}
              >
                {attr.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationships */}
      {entityRelationships.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Relationships ({entityRelationships.length})
          </div>
          <div className="space-y-1.5">
            {entityRelationships.map((rel) => {
              const isFrom = rel.from === selectedEntity.id;
              const relatedEntity = entities.find(e => e.id === (isFrom ? rel.to : rel.from));
              
              return (
                <div 
                  key={rel.id}
                  className="px-3 py-2 rounded-lg bg-slate-800/50 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{rel.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rel.fromCardinality}:{rel.toCardinality}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{isFrom ? '→' : '←'}</span>
                    <span>{relatedEntity?.label}</span>
                    {rel.isOptional && (
                      <span className="text-amber-400">(optional)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
