"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const TopoMesh: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // 检查 reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setUseFallback(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let gridLines: THREE.LineSegments;
    let animationFrameId: number;

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 450;

      camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
      camera.position.set(0, 45, 75);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 创建参数化单色地形网格 (Swiss Monochromatic Topo-Mesh)
      const sizeX = 80;
      const sizeZ = 60;
      const segmentsX = 40;
      const segmentsZ = 30;

      const geometry = new THREE.PlaneGeometry(
        sizeX,
        sizeZ,
        segmentsX,
        segmentsZ
      );
      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // 参数化平滑起伏波形
        const y =
          Math.sin(x * 0.1) * Math.cos(z * 0.12) * 4.5 +
          Math.sin(x * 0.05 + z * 0.05) * 3;
        pos.setY(i, y);
      }
      geometry.computeVertexNormals();

      const wireframe = new THREE.WireframeGeometry(geometry);
      const material = new THREE.LineBasicMaterial({
        color: 0x18181b,
        transparent: true,
        opacity: 0.22,
        linewidth: 1,
      });

      gridLines = new THREE.LineSegments(wireframe, material);
      scene.add(gridLines);

      // 鼠标阻尼微牵引
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetX = normX * 0.15;
        targetY = normY * 0.1;
      };

      window.addEventListener("mousemove", handleMouseMove);

      const render = () => {
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        if (gridLines) {
          gridLines.rotation.y = mouseX;
          gridLines.rotation.x = mouseY * 0.5;
        }

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      };

      render();

      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    } catch {
      setUseFallback(true);
    }
  }, []);

  if (useFallback) {
    // 静态高精度单色 SVG 发丝线轮廓平滑降级
    return (
      <div className="relative w-full h-full flex items-center justify-center opacity-30 select-none">
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full stroke-[#18181B] fill-none"
          strokeWidth="0.75"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={i}
              d={`M 0,${80 + i * 18} Q 150,${40 + i * 15 + Math.sin(i) * 20} 300,${
                70 + i * 18
              } T 600,${90 + i * 18}`}
            />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full min-h-[360px]" />
      {/* 东南亚出海经纬度微标签 */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 text-[9px] font-mono text-[#71717A] text-right pointer-events-none select-none">
        <span>CGK // -6.1275, 106.6537</span>
        <span>BKK // 13.6900, 100.7501</span>
        <span>SIN // 1.3644, 103.9915</span>
        <span className="text-[#09090B]">GRID_MESH // 12,000 VERTS</span>
      </div>
    </div>
  );
};
