import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

/**
 * Custom hook for managing Three.js seat visualization scene
 * Handles chair creation, animations, and interactions
 */
export interface ChairData {
  id: number;
  position: THREE.Vector3;
  mesh?: THREE.Group;
  originalY: number;
  targetY: number;
  animationProgress: number;
  isHovered: boolean;
  slotGroup: string;
}

export interface UseThreeSeatsSceneProps {
  numPatients: number;
  slotSize: number;
  onChairClick?: (chairId: number) => void;
}

export const useThreeSeatsScene = ({
  numPatients,
  slotSize,
  onChairClick
}: UseThreeSeatsSceneProps) => {
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const chairsRef = useRef<ChairData[]>([]);
  const animationIdRef = useRef<number>();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredChairRef = useRef<ChairData | null>(null);

  /**
   * Creates a stylized 3D chair mesh with PBR materials
   */
  const createChairMesh = useCallback((chairId: number): THREE.Group => {
    const chairGroup = new THREE.Group();
    chairGroup.userData = { chairId };

    // Chair seat
    const seatGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.3,
      metalness: 0.1,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = 0.4;
    chairGroup.add(seat);

    // Chair backrest
    const backrestGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const backrestMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      roughness: 0.3,
      metalness: 0.1,
    });
    const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
    backrest.position.set(0, 0.8, -0.35);
    chairGroup.add(backrest);

    // Chair legs (4 legs)
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.8,
      metalness: 0.2,
    });

    const legPositions = [
      [-0.3, 0.2, -0.3],
      [0.3, 0.2, -0.3],
      [-0.3, 0.2, 0.3],
      [0.3, 0.2, 0.3],
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, y, z);
      chairGroup.add(leg);
    });

    return chairGroup;
  }, []);

  /**
   * Initializes the Three.js scene with lighting and camera
   */
  const initScene = useCallback((canvas: HTMLCanvasElement) => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Floor plane
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    return { scene, camera, renderer };
  }, []);

  /**
   * Creates and positions chairs based on numPatients and slotSize
   */
  const createChairs = useCallback(() => {
    if (!sceneRef.current) return;

    // Clear existing chairs
    chairsRef.current.forEach(chair => {
      if (chair.mesh) {
        sceneRef.current!.remove(chair.mesh);
      }
    });

    const chairs: ChairData[] = [];
    const slotNames = ['Morning', 'Afternoon', 'Evening'];
    
    let chairIndex = 0;
    for (let slot = 0; slot < Math.ceil(numPatients / slotSize); slot++) {
      const remainingChairs = Math.min(slotSize, numPatients - slot * slotSize);
      const slotName = slotNames[slot % slotNames.length];
      
      // Calculate grid layout for this slot
      const cols = Math.ceil(Math.sqrt(remainingChairs));
      const rows = Math.ceil(remainingChairs / cols);
      
      for (let i = 0; i < remainingChairs; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Position chairs with spacing
        const x = (col - (cols - 1) / 2) * 1.5;
        const z = (row - (rows - 1) / 2) * 1.5 + slot * 4;
        const y = -2; // Start below ground for animation
        
        const position = new THREE.Vector3(x, y, z);
        const chairMesh = createChairMesh(chairIndex);
        chairMesh.position.copy(position);
        chairMesh.castShadow = true;
        chairMesh.receiveShadow = true;
        
        // Enable shadow casting for all children
        chairMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        sceneRef.current.add(chairMesh);
        
        chairs.push({
          id: chairIndex,
          position,
          mesh: chairMesh,
          originalY: y,
          targetY: 0,
          animationProgress: 0,
          isHovered: false,
          slotGroup: slotName,
        });
        
        chairIndex++;
      }
    }
    
    chairsRef.current = chairs;
  }, [numPatients, slotSize, createChairMesh]);

  /**
   * Animation loop with easing curves for chair fly-in effect
   */
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Animate chairs rising from below
    chairsRef.current.forEach((chair, index) => {
      if (chair.mesh && chair.animationProgress < 1) {
        chair.animationProgress = Math.min(chair.animationProgress + 0.02, 1);
        
        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - chair.animationProgress, 3);
        
        // Add staggered delay
        const delay = index * 0.1;
        const adjustedProgress = Math.max(0, chair.animationProgress - delay);
        const easedWithDelay = adjustedProgress > 0 ? 1 - Math.pow(1 - adjustedProgress, 3) : 0;
        
        chair.mesh.position.y = chair.originalY + (chair.targetY - chair.originalY) * easedWithDelay;
        
        // Add slight bounce at the end
        if (easedWithDelay > 0.8) {
          const bounceProgress = (easedWithDelay - 0.8) / 0.2;
          const bounce = Math.sin(bounceProgress * Math.PI * 2) * 0.1 * (1 - bounceProgress);
          chair.mesh.position.y += bounce;
        }
      }
      
      // Handle hover scaling
      if (chair.mesh) {
        const targetScale = chair.isHovered ? 1.1 : 1.0;
        const currentScale = chair.mesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.1;
        chair.mesh.scale.setScalar(newScale);
        
        // Update emissive intensity for hover effect
        chair.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const targetEmissive = chair.isHovered ? 0.2 : 0;
            const currentEmissive = child.material.emissiveIntensity || 0;
            child.material.emissiveIntensity = currentEmissive + (targetEmissive - currentEmissive) * 0.1;
            child.material.emissive.setHex(chair.isHovered ? 0x4a90e2 : 0x000000);
          }
        });
      }
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  /**
   * Handles mouse interactions for chair hover and click
   */
  const handleMouseMove = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const chairMeshes = chairsRef.current.map(chair => chair.mesh).filter(Boolean) as THREE.Group[];
    const intersects = raycasterRef.current.intersectObjects(chairMeshes, true);

    // Reset all hover states
    chairsRef.current.forEach(chair => {
      chair.isHovered = false;
    });

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      let chairGroup = intersectedObject;
      
      // Find the chair group
      while (chairGroup.parent && !chairGroup.userData.chairId) {
        chairGroup = chairGroup.parent;
      }
      
      if (chairGroup.userData.chairId !== undefined) {
        const chair = chairsRef.current.find(c => c.id === chairGroup.userData.chairId);
        if (chair) {
          chair.isHovered = true;
          hoveredChairRef.current = chair;
          canvas.style.cursor = 'pointer';
        }
      }
    } else {
      hoveredChairRef.current = null;
      canvas.style.cursor = 'default';
    }
  }, []);

  const handleClick = useCallback((event: MouseEvent, canvas: HTMLCanvasElement) => {
    if (hoveredChairRef.current && onChairClick) {
      // Trigger pop animation
      const chair = hoveredChairRef.current;
      if (chair.mesh) {
        const originalScale = chair.mesh.scale.x;
        chair.mesh.scale.setScalar(1.3);
        
        setTimeout(() => {
          if (chair.mesh) {
            chair.mesh.scale.setScalar(originalScale);
          }
        }, 150);
      }
      
      onChairClick(hoveredChairRef.current.id);
    }
  }, [onChairClick]);

  /**
   * Resets animation to replay chair fly-in effect
   */
  const resetAnimation = useCallback(() => {
    chairsRef.current.forEach(chair => {
      chair.animationProgress = 0;
      if (chair.mesh) {
        chair.mesh.position.y = chair.originalY;
        chair.mesh.scale.setScalar(1);
      }
    });
  }, []);

  /**
   * Handles window resize
   */
  const handleResize = useCallback((canvas: HTMLCanvasElement) => {
    if (!cameraRef.current || !rendererRef.current) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    
    chairsRef.current.forEach(chair => {
      if (chair.mesh) {
        chair.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    });
  }, []);

  return {
    initScene,
    createChairs,
    animate,
    handleMouseMove,
    handleClick,
    resetAnimation,
    handleResize,
    cleanup,
    chairs: chairsRef.current,
  };
};