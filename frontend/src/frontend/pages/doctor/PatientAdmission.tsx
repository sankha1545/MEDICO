import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Users, Clock } from 'lucide-react';
import { useThreeSeatsScene } from '../../hooks/useThreeSeatsScene';

/**
 * PatientAdmission Component
 * 
 * A production-ready component featuring 3D seat visualization using Three.js.
 * Manages patient seating with configurable slot sizes and interactive 3D chairs.
 * 
 * Features:
 * - 3D chair meshes with PBR materials
 * - Animated chair fly-in effects with easing curves
 * - Interactive hover and click animations
 * - Responsive grid layout grouped by time slots
 * - Real-time controls for patient count and slot size
 */
const PatientAdmission: React.FC = () => {
  // State management for patient admission settings
  const [numPatients, setNumPatients] = useState<number>(12);
  const [slotSize, setSlotSize] = useState<number>(4);
  
  // Refs for Three.js canvas and scene management
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  /**
   * Handle chair click interactions
   * Logs chair information and could trigger additional actions
   */
  const handleChairClick = (chairId: number) => {
    console.log(`Chair ${chairId} clicked - Patient ID: ${chairId + 1}`);
    // Additional chair interaction logic can be added here
    // e.g., patient selection, booking confirmation, etc.
  };

  // Initialize Three.js scene hook
  const {
    initScene,
    createChairs,
    animate,
    handleMouseMove,
    handleClick,
    resetAnimation,
    handleResize,
    cleanup,
    chairs,
  } = useThreeSeatsScene({
    numPatients,
    slotSize,
    onChairClick: handleChairClick,
  });

  /**
   * Initialize Three.js scene and event listeners
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    isInitializedRef.current = true;

    // Initialize the Three.js scene
    initScene(canvas);
    createChairs();
    animate();

    // Mouse event handlers for chair interactions
    const mouseMoveHandler = (event: MouseEvent) => handleMouseMove(event, canvas);
    const clickHandler = (event: MouseEvent) => handleClick(event, canvas);
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('click', clickHandler);

    // Window resize handler for responsive canvas
    const resizeHandler = () => {
      if (containerRef.current && canvas) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        handleResize(canvas);
      }
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler(); // Initial resize

    // Cleanup function
    return () => {
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('click', clickHandler);
      window.removeEventListener('resize', resizeHandler);
      cleanup();
    };
  }, [initScene, createChairs, animate, handleMouseMove, handleClick, handleResize, cleanup]);

  /**
   * Update chairs when patient count or slot size changes
   */
  useEffect(() => {
    if (isInitializedRef.current) {
      createChairs();
    }
  }, [numPatients, slotSize, createChairs]);

  /**
   * Calculate slot information for display
   */
  const slotInfo = React.useMemo(() => {
    const slotNames = ['Morning', 'Afternoon', 'Evening'];
    const totalSlots = Math.ceil(numPatients / slotSize);
    
    return Array.from({ length: totalSlots }, (_, index) => {
      const startPatient = index * slotSize + 1;
      const endPatient = Math.min((index + 1) * slotSize, numPatients);
      const slotName = slotNames[index % slotNames.length];
      
      return {
        name: slotName,
        range: `Patients ${startPatient}-${endPatient}`,
        count: endPatient - startPatient + 1,
      };
    });
  }, [numPatients, slotSize]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Patient Admission</h1>
                <p className="text-slate-400 mt-1">3D Seat Management System</p>
              </div>
            </div>
            
            {/* Slot Information Display */}
            <div className="hidden md:flex items-center space-x-6">
              {slotInfo.map((slot, index) => (
                <motion.div
                  key={slot.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-sm font-medium text-slate-300">{slot.name}</div>
                  <div className="text-xs text-slate-500">{slot.range}</div>
                  <div className="text-lg font-bold text-blue-400">{slot.count}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* 3D Canvas Section */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative bg-slate-900 rounded-tl-2xl lg:rounded-none overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
          
          {/* Canvas Overlay Info */}
          <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Live 3D View</span>
            </div>
            <div className="text-xs text-slate-400">
              Hover over chairs to highlight • Click to select
            </div>
          </div>

          {/* Loading Indicator */}
          {chairs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </motion.div>

        {/* Controls Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full lg:w-80 bg-slate-800 p-6 space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Admission Controls</h2>
            
            {/* Number of Patients Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Number of Patients
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numPatients}
                  onChange={(e) => setNumPatients(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="Enter number of patients"
                />
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Slot Size Dropdown */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Patients per Slot
              </label>
              <select
                value={slotSize}
                onChange={(e) => setSlotSize(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value={2}>2 patients per slot</option>
                <option value={3}>3 patients per slot</option>
                <option value={4}>4 patients per slot</option>
                <option value={5}>5 patients per slot</option>
                <option value={6}>6 patients per slot</option>
                <option value={8}>8 patients per slot</option>
              </select>
            </div>

            {/* Reset Animation Button */}
            <motion.button
              onClick={resetAnimation}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset Animation</span>
            </motion.button>
          </div>

          {/* Statistics Panel */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{numPatients}</div>
                <div className="text-xs text-slate-400">Total Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{Math.ceil(numPatients / slotSize)}</div>
                <div className="text-xs text-slate-400">Total Slots</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-600">
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{slotSize}</div>
                <div className="text-xs text-slate-400">Patients per Slot</div>
              </div>
            </div>
          </div>

          {/* Slot Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Slot Details</h3>
            <div className="space-y-2">
              {slotInfo.map((slot, index) => (
                <motion.div
                  key={slot.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-white">{slot.name}</div>
                    <div className="text-xs text-slate-400">{slot.range}</div>
                  </div>
                  <div className="text-lg font-bold text-blue-400">{slot.count}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientAdmission;