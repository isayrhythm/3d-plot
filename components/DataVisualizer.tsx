
import React, { useRef, useMemo, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Text, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { DataPoint, CategoryStyle, PointShape } from '../types';

interface DataVisualizerProps {
  points: DataPoint[];
  categoryStyles: Record<string, CategoryStyle>;
  showAxes: boolean;
}

export interface DataVisualizerHandle {
  takeScreenshot: () => void;
}

const createShapeTexture = (shape: PointShape) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'square') {
    ctx.fillRect(8, 8, 48, 48);
  } else if (shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(56, 32);
    ctx.lineTo(32, 56);
    ctx.lineTo(8, 32);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'cross') {
    ctx.fillRect(24, 8, 16, 48);
    ctx.fillRect(8, 24, 48, 16);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const CategoryPoints: React.FC<{ 
  points: DataPoint[], 
  style: CategoryStyle, 
  onHover: (point: DataPoint | null) => void,
  onSelect: (point: DataPoint | null) => void
}> = ({ points, style, onHover, onSelect }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const { raycaster, mouse, camera } = useThree();

  const [positions] = useMemo(() => {
    const posArr = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
    });
    return [posArr];
  }, [points]);

  const texture = useMemo(() => createShapeTexture(style.shape), [style.shape]);

  useFrame(() => {
    if (!style.visible) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshRef.current);
    
    if (intersects.length > 0) {
      const idx = intersects[0].index;
      if (idx !== undefined) {
        onHover(points[idx]);
      }
    } else {
      onHover(null);
    }
  });

  if (!style.visible) return null;

  return (
    <points 
      ref={meshRef} 
      onClick={(e) => {
        e.stopPropagation();
        if (e.index !== undefined) {
          onSelect(points[e.index]);
        }
      }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color={style.color}
        map={texture}
        transparent
        alphaTest={0.5}
        sizeAttenuation={true}
      />
    </points>
  );
};

const SelectionHighlight: React.FC<{ point: DataPoint, color: string }> = ({ point, color }) => {
  const ringRef = useRef<THREE.Mesh>(null!);
  
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.2;
    ringRef.current.scale.set(s, s, s);
  });

  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <pointLight distance={5} intensity={2} color={color} />
    </group>
  );
};

const SceneCapture: React.FC<{ onCapture: (gl: THREE.WebGLRenderer) => void, trigger: boolean }> = ({ onCapture, trigger }) => {
  const { gl } = useThree();
  React.useEffect(() => {
    if (trigger) {
      onCapture(gl);
    }
  }, [trigger, gl, onCapture]);
  return null;
};

const DataVisualizer = forwardRef<DataVisualizerHandle, DataVisualizerProps>(({ points, categoryStyles, showAxes }, ref) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [screenshotTrigger, setScreenshotTrigger] = useState(false);
  const hoverTimeout = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      setScreenshotTrigger(true);
      // Reset trigger shortly after
      setTimeout(() => setScreenshotTrigger(false), 100);
    }
  }));

  const handleCapture = useCallback((gl: THREE.WebGLRenderer) => {
    const link = document.createElement('a');
    link.setAttribute('download', `VoxNavigator-3D-${new Date().getTime()}.png`);
    link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
    link.click();
  }, []);

  const handleHover = useCallback((point: DataPoint | null) => {
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    
    if (point) {
      setHoveredPoint(point);
    } else {
      hoverTimeout.current = window.setTimeout(() => setHoveredPoint(null), 50);
    }
  }, []);

  const pointsByCategory = useMemo(() => {
    const groups: Record<string, DataPoint[]> = {};
    points.forEach(p => {
      if (!groups[p.label]) groups[p.label] = [];
      groups[p.label].push(p);
    });
    return groups;
  }, [points]);

  return (
    <div className="w-full h-full cursor-crosshair relative">
      <Canvas 
        ref={canvasRef}
        shadows 
        dpr={[2, 2]} // High definition
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={() => setSelectedPoint(null)}
      >
        <color attach="background" args={['#020617']} />
        <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={45} />
        <OrbitControls enableDamping dampingFactor={0.05} />

        <ambientLight intensity={0.6} />
        <pointLight position={[20, 20, 20]} intensity={1} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={50} 
          fadeStrength={5} 
          sectionSize={5} 
          cellSize={1} 
          sectionColor="#1e293b" 
          cellColor="#0f172a" 
        />

        <group>
          {Object.entries(pointsByCategory).map(([cat, pts]) => (
            <CategoryPoints 
              key={cat} 
              points={pts} 
              style={categoryStyles[cat]} 
              onHover={handleHover} 
              onSelect={setSelectedPoint}
            />
          ))}
        </group>

        {selectedPoint && (
          <SelectionHighlight 
            point={selectedPoint} 
            color={categoryStyles[selectedPoint.label]?.color || '#fff'} 
          />
        )}

        {showAxes && (
          <group>
            <axesHelper args={[15]} />
            <Text position={[16, 0, 0]} fontSize={0.6} color="#ef4444">X</Text>
            <Text position={[0, 16, 0]} fontSize={0.6} color="#22c55e">Y</Text>
            <Text position={[0, 0, 16]} fontSize={0.6} color="#3b82f6" rotation={[0, -Math.PI / 2, 0]}>Z</Text>
          </group>
        )}

        {hoveredPoint && !selectedPoint && !screenshotTrigger && (
          <Html position={[hoveredPoint.x, hoveredPoint.y + 0.5, hoveredPoint.z]} center distanceFactor={15}>
            <div className="bg-slate-900/90 border border-blue-500/30 backdrop-blur-md p-2 rounded shadow-xl pointer-events-none whitespace-nowrap min-w-[100px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{hoveredPoint.label}</div>
              <div className="text-white text-[11px] truncate max-w-[150px]">{hoveredPoint.metadata}</div>
            </div>
          </Html>
        )}

        <SceneCapture onCapture={handleCapture} trigger={screenshotTrigger} />
      </Canvas>

      {/* Selected Point Overlay Panel */}
      {selectedPoint && !screenshotTrigger && (
        <div className="absolute top-6 right-6 z-40 w-72 animate-in slide-in-from-right duration-300">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/40 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                  style={{ backgroundColor: categoryStyles[selectedPoint.label]?.color }} 
                />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Point Details</h3>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Category</label>
                <div className="text-blue-400 font-medium">{selectedPoint.label}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Metadata (Col 5)</label>
                <div className="text-slate-200 text-sm leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-white/5">
                  {selectedPoint.metadata || 'No additional information'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/30 p-2 rounded border border-white/5">
                  <label className="text-[9px] text-slate-600 block mb-1">X Coord</label>
                  <div className="text-xs font-mono text-slate-300">{selectedPoint.x.toFixed(3)}</div>
                </div>
                <div className="bg-slate-800/30 p-2 rounded border border-white/5">
                  <label className="text-[9px] text-slate-600 block mb-1">Y Coord</label>
                  <div className="text-xs font-mono text-slate-300">{selectedPoint.y.toFixed(3)}</div>
                </div>
                <div className="bg-slate-800/30 p-2 rounded border border-white/5">
                  <label className="text-[9px] text-slate-600 block mb-1">Z Coord</label>
                  <div className="text-xs font-mono text-slate-300">{selectedPoint.z.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DataVisualizer;
