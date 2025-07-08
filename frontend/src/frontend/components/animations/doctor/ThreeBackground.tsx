// File: frontend/src/components/animations/doctor/ThreeBackground.tsx

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Curve, Vector3, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points } from 'three';

interface ThreeBackgroundProps {
  activeTab: string;
}

// Helix (DNA) curve definition
class HelixCurve extends Curve<Vector3> {
  private radius: number;
  private turns: number;
  private height: number;

  constructor(radius: number, turns: number, height: number) {
    super();
    this.radius = radius;
    this.turns = turns;
    this.height = height;
  }

  getPoint(t: number): Vector3 {
    const theta = 2 * Math.PI * this.turns * t;
    const x = this.radius * Math.cos(theta);
    const y = this.height * (t - 0.5);
    const z = this.radius * Math.sin(theta);
    return new Vector3(x, y, z);
  }
}

const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ activeTab }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const helix1Ref = useRef<THREE.Mesh>();
  const helix2Ref = useRef<THREE.Mesh>();
  const starsRef = useRef<Points>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 80;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // HELIX (DNA) CREATION
    const radius = 10;
    const turns = 6;
    const height = 60;
    const segments = 200;

    const curve1 = new HelixCurve(radius, turns, height);
    const geo1 = new THREE.TubeGeometry(curve1, segments, 0.6, 8, false);
    const mat1 = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const helix1 = new THREE.Mesh(geo1, mat1);
    helix1Ref.current = helix1;

    const curve2 = new HelixCurve(radius, turns, height);
    const geo2 = new THREE.TubeGeometry(curve2, segments, 0.6, 8, false);
    geo2.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI)); // offset
    const mat2 = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const helix2 = new THREE.Mesh(geo2, mat2);
    helix2Ref.current = helix2;

    scene.add(helix1, helix2);

    // STARS FIELD CREATION
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    const starGeo = new BufferGeometry();
    starGeo.setAttribute('position', new Float32BufferAttribute(starPositions, 3));
    const starMat = new PointsMaterial({ color: 0xffffff, size: 1, transparent: true, opacity: 0.7 });
    const stars = new Points(starGeo, starMat);
    starsRef.current = stars;
    scene.add(stars);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.0005;

      // Rotate helices
      helix1.rotation.y += 0.005;
      helix2.rotation.y -= 0.005;

      // Bobbing motion
      helix1.position.y = Math.sin(time * 2) * 2;
      helix2.position.y = Math.cos(time * 2) * 2;

      // Move stars slowly to simulate motion
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeTab]);

  return <div ref={mountRef} className="fixed inset-0 -z-10" />;
};

export default ThreeBackground;
