import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DFDCanvas, { DFDCanvasHandle } from './components/DFDCanvas';
import ERDCanvas, { ERDCanvasHandle } from './components/ERDCanvas';
import SADCanvas, { SADCanvasHandle } from './components/SADCanvas';
import InfoPanel from './components/InfoPanel';
import RolePopup from './components/RolePopup';
import ClientPopup from './components/ClientPopup';
import Legend from './components/Legend';
import ModeSwitcher, { ViewMode } from './components/ModeSwitcher';
import { nodes, flows, UserRole, roleDescriptions } from './data/dfdData';
import { entities, relationships } from './data/erdData';
import { components as sadComponents, SADClientType, sadFlowSequences, sadClientTypes } from './data/sadData';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dfd');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(true);
  
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedSADClient, setSelectedSADClient] = useState<SADClientType | null>(null);
  const [sadCurrentStep, setSadCurrentStep] = useState(1);
  const [showClientPopup, setShowClientPopup] = useState(false);
  
  const erdCanvasRef = useRef<ERDCanvasHandle>(null);
  const sadCanvasRef = useRef<SADCanvasHandle>(null);

  const roleFlows = useMemo(() => {
    if (!selectedRole) return [];
    return flows.filter((f) => f.stepOrder[selectedRole] !== null);
  }, [selectedRole]);

  const activeFlowIds = useMemo(() => {
    if (!selectedRole) return [];
    return roleFlows
      .filter((f) => {
        const step = f.stepOrder[selectedRole];
        return step !== null && step <= currentStep;
      })
      .map((f) => f.id);
  }, [selectedRole, currentStep, roleFlows]);

  const highlightedNodeIds = useMemo(() => {
    if (!selectedRole) return [];
    const nodeIds = new Set<string>();
    roleFlows
      .filter((f) => {
        const step = f.stepOrder[selectedRole];
        return step !== null && step <= currentStep;
      })
      .forEach((f) => {
        nodeIds.add(f.from);
        nodeIds.add(f.to);
      });
    return Array.from(nodeIds);
  }, [selectedRole, currentStep, roleFlows]);

  const totalSteps = useMemo(() => {
    if (!selectedRole) return 0;
    return roleDescriptions[selectedRole].steps;
  }, [selectedRole]);

  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode) || null;
  }, [selectedNode]);

  const erdTourSequence = useMemo(() => {
    return [...entities]
      .filter(e => e.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
      .map(e => e.id);
  }, []);

  const sadTourSequence = useMemo(() => {
    return [...sadComponents]
      .filter(c => c.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
      .map(c => c.id);
  }, []);

  const [tourIndex, setTourIndex] = useState<number>(-1);

  const handleSelectRole = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep(1);
    setSelectedNode(null);
  }, []);

  const handleSelectEntity = useCallback((id: string) => {
    setSelectedEntity((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectComponent = useCallback((id: string) => {
    if (id === 'client-entry') {
      setShowClientPopup(true);
      return;
    }
    setSelectedComponent((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectSADClient = useCallback((client: SADClientType) => {
    setSelectedSADClient(client);
    setSadCurrentStep(1);
    setShowClientPopup(false);
    const firstStep = sadFlowSequences[client][0];
    if (firstStep) {
      setSelectedComponent(firstStep.componentId);
    }
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSADNextStep = useCallback(() => {
    if (!selectedSADClient) return;
    const flow = sadFlowSequences[selectedSADClient];
    setSadCurrentStep((prev) => {
      const nextStep = Math.min(prev + 1, flow.length);
      const step = flow[nextStep - 1];
      if (step) {
        setSelectedComponent(step.componentId);
      }
      return nextStep;
    });
  }, [selectedSADClient]);

  const handleSADPrevStep = useCallback(() => {
    if (!selectedSADClient) return;
    const flow = sadFlowSequences[selectedSADClient];
    setSadCurrentStep((prev) => {
      const prevStep = Math.max(prev - 1, 1);
      const step = flow[prevStep - 1];
      if (step) {
        setSelectedComponent(step.componentId);
      }
      return prevStep;
    });
  }, [selectedSADClient]);

  const handleReset = useCallback(() => {
    setSelectedRole(null);
    setCurrentStep(1);
    setSelectedNode(null);
    setSelectedEntity(null);
    setSelectedComponent(null);
    setSelectedSADClient(null);
    setSadCurrentStep(1);
    setTourIndex(-1);
  }, []);

  const handleModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setTourIndex(-1);
    if (mode === 'dfd') {
      setSelectedEntity(null);
      setSelectedComponent(null);
      setSelectedSADClient(null);
      setSadCurrentStep(1);
    } else if (mode === 'erd') {
      setSelectedRole(null);
      setSelectedNode(null);
      setCurrentStep(1);
      setSelectedComponent(null);
      setSelectedSADClient(null);
      setSadCurrentStep(1);
    } else if (mode === 'sad') {
      setSelectedRole(null);
      setSelectedNode(null);
      setCurrentStep(1);
      setSelectedEntity(null);
      setSelectedSADClient(null);
      setSadCurrentStep(1);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (viewMode === 'dfd') {
          setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        } else if (viewMode === 'erd' && erdTourSequence.length > 0) {
          setTourIndex((prev) => {
            const nextIndex = prev < erdTourSequence.length - 1 ? prev + 1 : 0;
            setSelectedEntity(erdTourSequence[nextIndex]);
            return nextIndex;
          });
        } else if (viewMode === 'sad') {
          if (selectedSADClient) {
            handleSADNextStep();
          } else if (sadTourSequence.length > 0) {
            setTourIndex((prev) => {
              const nextIndex = prev < sadTourSequence.length - 1 ? prev + 1 : 0;
              setSelectedComponent(sadTourSequence[nextIndex]);
              return nextIndex;
            });
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (viewMode === 'dfd') {
          setCurrentStep((prev) => Math.max(prev - 1, 1));
        } else if (viewMode === 'erd' && erdTourSequence.length > 0) {
          setTourIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : erdTourSequence.length - 1;
            setSelectedEntity(erdTourSequence[nextIndex]);
            return nextIndex;
          });
        } else if (viewMode === 'sad') {
          if (selectedSADClient) {
            handleSADPrevStep();
          } else if (sadTourSequence.length > 0) {
            setTourIndex((prev) => {
              const nextIndex = prev > 0 ? prev - 1 : sadTourSequence.length - 1;
              setSelectedComponent(sadTourSequence[nextIndex]);
              return nextIndex;
            });
          }
        }
      } else if (e.key === 'Escape') {
        handleReset();
      } else if (viewMode === 'erd' && e.ctrlKey && e.altKey && e.code === 'Space') {
        e.preventDefault();
        
        if (selectedEntity) {
          erdCanvasRef.current?.saveZoomForEntity(selectedEntity);
          
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(6, 182, 212, 0.95);
            border: 2px solid #22d3ee;
            border-radius: 12px;
            padding: 16px 24px;
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ✅ Zoom saved for <strong>${selectedEntity}</strong>
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => document.body.removeChild(toast), 2000);
        }
      } else if (viewMode === 'sad' && e.ctrlKey && e.altKey && e.code === 'Space') {
        e.preventDefault();
        
        if (selectedComponent) {
          sadCanvasRef.current?.saveZoomForComponent(selectedComponent);
          
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(6, 182, 212, 0.95);
            border: 2px solid #22d3ee;
            border-radius: 12px;
            padding: 16px 24px;
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ✅ Zoom saved for <strong>${selectedComponent}</strong>
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => document.body.removeChild(toast), 2000);
        }
      } else if (viewMode === 'erd' && e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        
        const entityPositions = erdCanvasRef.current?.getEntityPositions() || {};
        const labelPositions = erdCanvasRef.current?.getLabelPositions() || {};
        const zoom = erdCanvasRef.current?.getZoom() || { x: 0, y: 0, width: 2700, height: 1200 };
        const savedZooms = erdCanvasRef.current?.getSavedZooms() || {};
        
        const dataToSave = {
          mode: 'erd',
          entityPositions,
          labelPositions,
          zoom,
          savedZooms,
          selectedEntity
        };
        
        const positionsJson = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([positionsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'erd-positions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
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
            ✅ ERD Positions Saved
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
            "
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
            "
          >
            Close
          </button>
        `;
        
        document.body.appendChild(modal);
      } else if (viewMode === 'sad' && e.ctrlKey && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        
        const componentPositions = sadCanvasRef.current?.getComponentPositions() || {};
        const zoom = sadCanvasRef.current?.getZoom() || { x: 0, y: 0, width: 2200, height: 1000 };
        const savedZooms = sadCanvasRef.current?.getSavedZooms() || {};
        
        const dataToSave = {
          mode: 'sad',
          componentPositions,
          zoom,
          savedZooms,
          selectedComponent
        };
        
        const positionsJson = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([positionsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sad-positions.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
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
            ✅ SAD Positions Saved
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
            "
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
            "
          >
            Close
          </button>
        `;
        
        document.body.appendChild(modal);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSteps, handleReset, viewMode, selectedRole, currentStep, selectedEntity, selectedComponent, selectedSADClient, erdTourSequence, sadTourSequence, handleSADNextStep, handleSADPrevStep]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden select-none">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-screen">
        <header className="flex-shrink-0 px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-cyan-500/20">
                {viewMode === 'dfd' ? 'DF' : viewMode === 'erd' ? 'ER' : 'SA'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {viewMode === 'dfd' ? 'FES Data Flow Diagram' : viewMode === 'erd' ? 'FES Entity Relationship Diagram' : 'FES System Architecture Diagram'}
                </h1>
                <p className="text-xs text-slate-400">Faculty Evaluation System — Interactive Visualization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ModeSwitcher mode={viewMode} onModeChange={handleModeChange} />
              {(selectedRole || selectedEntity || selectedComponent) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors border border-white/5"
                >
                  ↺ Reset View
                </motion.button>
              )}
              {viewMode === 'dfd' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-900/30 backdrop-blur border border-cyan-500/30 text-xs text-cyan-300">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                  <span className="ml-1">Save Positions</span>
                </div>
              )}
              {viewMode === 'erd' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-900/30 backdrop-blur border border-cyan-500/30 text-xs text-cyan-300">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">←</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">→</kbd>
                  <span className="ml-1">Tour</span>
                  <span className="mx-2 text-cyan-500">|</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Alt</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                  <span className="ml-1">Save Zoom</span>
                  <span className="mx-2 text-cyan-500">|</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                  <span className="ml-1">Export All</span>
                </div>
              )}
              {viewMode === 'sad' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-900/30 backdrop-blur border border-cyan-500/30 text-xs text-cyan-300">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">←</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">→</kbd>
                  <span className="ml-1">Tour</span>
                  <span className="mx-2 text-cyan-500">|</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Alt</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                  <span className="ml-1">Save Zoom</span>
                  <span className="mx-2 text-cyan-500">|</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                  <span className="ml-1">Export All</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Interactive Mode
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'dfd' && (
            <>
              {!selectedRole && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-sm text-slate-300">
                    Click the <span className="text-cyan-400 font-semibold">AUTH</span> node to login
                  </div>
                </motion.div>
              )}

              <DFDCanvas
                selectedNode={selectedNode}
                activeFlowIds={activeFlowIds}
                highlightedNodeIds={highlightedNodeIds}
                currentStep={currentStep}
                role={selectedRole}
                onSelectNode={setSelectedNode}
                onAuthNodeClick={() => {
                  setShowRolePopup(true);
                }}
              />

              {showRolePopup && (
                <RolePopup
                  onSelectRole={handleSelectRole}
                  onClose={() => setShowRolePopup(false)}
                />
              )}

              {selectedRole && (
                <div className="absolute top-4 right-4 z-30">
                  <InfoPanel
                    selectedNode={selectedNodeData}
                    currentStep={currentStep}
                    role={selectedRole}
                    flows={roleFlows}
                    allFlows={flows}
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    totalSteps={totalSteps}
                  />
                </div>
              )}
            </>
          )}

          {viewMode === 'erd' && (
            <>
              {!selectedEntity && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-sm text-slate-300">
                    Click any entity to view relationships
                  </div>
                </motion.div>
              )}

              <ERDCanvas
                ref={erdCanvasRef}
                selectedEntity={selectedEntity}
                onSelectEntity={handleSelectEntity}
              />
            </>
          )}

          {viewMode === 'sad' && (
            <>
              {!selectedSADClient && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-sm text-slate-300">
                    Click the <span className="text-cyan-400 font-semibold">Client</span> node to start
                  </div>
                </motion.div>
              )}

              <SADCanvas
                ref={sadCanvasRef}
                selectedComponent={selectedComponent}
                onSelectComponent={handleSelectComponent}
                activeFlow={selectedSADClient ? sadFlowSequences[selectedSADClient] : null}
                currentStep={sadCurrentStep}
              />

              {showClientPopup && (
                <ClientPopup
                  onSelectClient={handleSelectSADClient}
                  onClose={() => setShowClientPopup(false)}
                />
              )}
            </>
          )}

          {viewMode === 'dfd' && (
            <Legend isExpanded={legendExpanded} onToggle={() => setLegendExpanded(!legendExpanded)} />
          )}
        </div>

        <footer className="flex-shrink-0 px-6 py-2 border-t border-white/5">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between text-xs text-slate-500">
            <span>FES V0.0.2 — Account Manager Update Branch</span>
            <div className="flex items-center gap-4">
              <span>React 18 + TypeScript</span>
              <span>•</span>
              <span>PostgreSQL 16 + RLS</span>
              <span>•</span>
              <span>RA 8792 / RA 10173 Compliant</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
