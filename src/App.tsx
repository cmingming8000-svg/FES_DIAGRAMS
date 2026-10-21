import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DFDCanvas from './components/DFDCanvas';
import ERDCanvas, { ERDCanvasHandle } from './components/ERDCanvas';
import SADCanvas, { SADCanvasHandle } from './components/SADCanvas';
import RolePopup from './components/RolePopup';
import ClientPopup from './components/ClientPopup';
import Legend from './components/Legend';
import ModeSwitcher, { ViewMode } from './components/ModeSwitcher';
import { nodes, flows, UserRole, roleDescriptions } from './data/dfdData';
import { entities, relationships } from './data/erdData';
import { components as sadComponents, SADClientType, sadFlowSequences, sadClientTypes, SADFlowStep } from './data/sadData';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dfd');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(true);
  
  // ERD state
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  
  // SAD state
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedSADClient, setSelectedSADClient] = useState<SADClientType | null>(null);
  const [sadCurrentStep, setSadCurrentStep] = useState(1);
  const [showClientPopup, setShowClientPopup] = useState(false);
  
  // Ref to access ERD canvas state
  const erdCanvasRef = useRef<ERDCanvasHandle>(null);
  
  // Ref to access SAD canvas state
  const sadCanvasRef = useRef<SADCanvasHandle>(null);

  // Get flows relevant to the selected role
  const roleFlows = useMemo(() => {
    if (!selectedRole) return [];
    return flows.filter((f) => f.stepOrder[selectedRole] !== null);
  }, [selectedRole]);

  // Get active flow IDs for the current step and role
  const activeFlowIds = useMemo(() => {
    if (!selectedRole) return [];
    return roleFlows
      .filter((f) => {
        const step = f.stepOrder[selectedRole];
        return step !== null && step <= currentStep;
      })
      .map((f) => f.id);
  }, [selectedRole, currentStep, roleFlows]);

  // Get highlighted node IDs based on active flows
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

  // Total steps for the role
  const totalSteps = useMemo(() => {
    if (!selectedRole) return 0;
    return roleDescriptions[selectedRole].steps;
  }, [selectedRole]);

  // ERD tour sequence - sorted by tourOrder
  const erdTourSequence = useMemo(() => {
    return [...entities]
      .filter(e => e.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
      .map(e => e.id);
  }, []);

  // SAD tour sequence - sorted by tourOrder
  const sadTourSequence = useMemo(() => {
    return [...sadComponents]
      .filter(c => c.tourOrder !== undefined)
      .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
      .map(c => c.id);
  }, []);

  // Current tour index for ERD/SAD mode
  const [tourIndex, setTourIndex] = useState<number>(-1);

  const handleSelectRole = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep(1);
    setSelectedNode(null);
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectEntity = useCallback((id: string) => {
    setSelectedEntity((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectComponent = useCallback((id: string) => {
    // If clicking the client entry point, show the client popup
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
    // Set the first component in the flow as selected
    const firstStep = sadFlowSequences[client][0];
    if (firstStep) {
      setSelectedComponent(firstStep.componentId);
    }
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
    // Reset selections when switching modes
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

  // Keyboard navigation and save positions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow key navigation - different behavior for DFD vs ERD mode
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (viewMode === 'dfd') {
          // DFD mode: navigate through steps
          setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      } else if (viewMode === 'erd' && erdTourSequence.length > 0) {
        // ERD mode: navigate through tour sequence
        setTourIndex((prev) => {
          const nextIndex = prev < erdTourSequence.length - 1 ? prev + 1 : 0;
          setSelectedEntity(erdTourSequence[nextIndex]);
          return nextIndex;
        });
      } else if (viewMode === 'sad') {
        // SAD mode: navigate through flow sequence if client selected, otherwise tour
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
        // DFD mode: navigate through steps
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      } else if (viewMode === 'erd' && erdTourSequence.length > 0) {
        // ERD mode: navigate through tour sequence (backwards)
        setTourIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : erdTourSequence.length - 1;
          setSelectedEntity(erdTourSequence[nextIndex]);
          return nextIndex;
        });
      } else if (viewMode === 'sad') {
        // SAD mode: navigate through flow sequence if client selected, otherwise tour
        if (selectedSADClient) {
          handleSADPrevStep();
        } else if (sadTourSequence.length > 0) {
          setTourIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : sadTourSequence.length - 1;
            setSelectedComponent(sadTourSequence[nextIndex]);
            return nextIndex;
          });
        }
      }      } else if (e.key === 'Escape') {
        handleReset();
      } else if (viewMode === 'erd' && e.ctrlKey && e.altKey && e.code === 'Space') {
        // Ctrl+Alt+Space: Save current zoom for selected entity (ERD mode only)
        e.preventDefault();
        
        if (selectedEntity) {
          erdCanvasRef.current?.saveZoomForEntity(selectedEntity);
          
          // Show feedback
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
            animation: slideDown 0.3s ease-out;
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ✅ Zoom saved for <strong>${selectedEntity}</strong>
            </div>
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-align: center; margin-top: 4px;">
              Press Ctrl+Shift+Space to export all data
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => document.body.removeChild(toast), 300);
          }, 2000);
        } else {
          // Show warning if no entity selected
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.95);
            border: 2px solid #f87171;
            border-radius: 12px;
            padding: 16px 24px;
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ⚠️ Select an entity first
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => document.body.removeChild(toast), 2000);
        }
      } else if (viewMode === 'erd' && e.ctrlKey && e.shiftKey && e.code === 'Space') {
        // Ctrl+Shift+Space: Export all ERD data (ERD mode only)
        e.preventDefault();
        
        // ERD mode - save entity positions, label positions, zoom, saved zooms, and selected entity
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
        const fileName = 'erd-positions.json';
        const title = 'ERD Positions Saved';
        
        // Create a downloadable JSON file
        const positionsJson = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([positionsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Also log to console
        console.log(`=== ${title.toUpperCase()} ===`);
        console.log(positionsJson);
        console.log('======================');
        
        // Show modal with the JSON
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
            ✅ ${title}
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
      } else if (viewMode === 'sad' && e.ctrlKey && e.altKey && e.code === 'Space') {
        // Ctrl+Alt+Space: Save current zoom for selected component (SAD mode only)
        e.preventDefault();
        
        if (selectedComponent) {
          sadCanvasRef.current?.saveZoomForComponent(selectedComponent);
          
          // Show feedback
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
            animation: slideDown 0.3s ease-out;
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ✅ Zoom saved for <strong>${selectedComponent}</strong>
            </div>
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-align: center; margin-top: 4px;">
              Press Ctrl+Shift+Space to export all data
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => document.body.removeChild(toast), 300);
          }, 2000);
        } else {
          // Show warning if no component selected
          const toast = document.createElement('div');
          toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.95);
            border: 2px solid #f87171;
            border-radius: 12px;
            padding: 16px 24px;
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(239, 68, 68, 0.4);
          `;
          toast.innerHTML = `
            <div style="color: white; font-size: 14px; font-weight: 600; text-align: center;">
              ⚠️ Select a component first
            </div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => document.body.removeChild(toast), 2000);
        }
      } else if (viewMode === 'sad' && e.ctrlKey && e.shiftKey && e.code === 'Space') {
        // Ctrl+Shift+Space: Export all SAD data (SAD mode only)
        e.preventDefault();
        
        // SAD mode - save component positions, zoom, and saved zooms
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
        const fileName = 'sad-positions.json';
        const title = 'SAD Positions Saved';
        
        // Create a downloadable JSON file
        const positionsJson = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([positionsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Also log to console
        console.log(`=== ${title.toUpperCase()} ===`);
        console.log(positionsJson);
        console.log('======================');
        
        // Show modal with the JSON
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
            ✅ ${title}
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
  }, [totalSteps, handleReset, viewMode, selectedRole, currentStep, selectedEntity, selectedComponent, erdTourSequence, sadTourSequence]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden select-none">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
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

        {/* Main Content - Full width canvas */}
        <div className="flex-1 relative overflow-hidden">
            {/* DFD Mode */}
            {viewMode === 'dfd' && (
              <>
                {/* Instructions overlay when no role selected */}
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

                {/* DFD Canvas */}
                <DFDCanvas
                  selectedNode={selectedNode}
                  activeFlowIds={activeFlowIds}
                  highlightedNodeIds={highlightedNodeIds}
                  currentStep={currentStep}
                  role={selectedRole}
                  onSelectNode={handleSelectNode}
                  onAuthNodeClick={() => {
                    setShowRolePopup(true);
                  }}
                />

                {/* Role Selection Popup */}
                {showRolePopup && (
                  <RolePopup
                    onSelectRole={(role) => {
                      handleSelectRole(role);
                      setShowRolePopup(false);
                    }}
                    onClose={() => setShowRolePopup(false)}
                  />
                )}
              </>
            )}

            {/* ERD Mode */}
            {viewMode === 'erd' && (
              <>
                {/* Instructions overlay */}
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

                {/* ERD Canvas */}
                <ERDCanvas
                  ref={erdCanvasRef}
                  selectedEntity={selectedEntity}
                  onSelectEntity={handleSelectEntity}
                />
              </>
            )}

            {/* SAD Mode */}
            {viewMode === 'sad' && (
              <>
                {/* Step indicator overlay */}
                {selectedSADClient && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md"
                        style={{
                          backgroundColor: `${sadClientTypes.find(c => c.id === selectedSADClient)?.color}15`,
                          borderColor: `${sadClientTypes.find(c => c.id === selectedSADClient)?.color}40`,
                          color: sadClientTypes.find(c => c.id === selectedSADClient)?.color
                        }}
                      >
                        {sadClientTypes.find(c => c.id === selectedSADClient)?.label} Flow — Step {sadCurrentStep} of {sadFlowSequences[selectedSADClient].length}
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur border border-white/5 text-[10px] text-slate-400">
                        ← → to navigate
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Instructions overlay */}
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

                {/* SAD Canvas */}
                <SADCanvas
                  ref={sadCanvasRef}
                  selectedComponent={selectedComponent}
                  onSelectComponent={handleSelectComponent}
                  activeFlow={selectedSADClient ? sadFlowSequences[selectedSADClient] : null}
                  currentStep={sadCurrentStep}
                />

                {/* Client Selection Popup */}
                {showClientPopup && (
                  <ClientPopup
                    onSelectClient={handleSelectSADClient}
                    onClose={() => setShowClientPopup(false)}
                  />
                )}
              </>
            )}

          {/* Legend - only show in DFD mode */}
          {viewMode === 'dfd' && (
            <Legend isExpanded={legendExpanded} onToggle={() => setLegendExpanded(!legendExpanded)} />
          )}
        </div>

        {/* Footer */}
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
