"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface TopoMeshProps {
  className?: string;
  showCoordinates?: boolean;
}

export const TopoMesh: React.FC<TopoMeshProps> = ({
  className = "",
  showCoordinates = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (useFallback) return;

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let gridLines: THREE.LineSegments;
    let geometry: THREE.PlaneGeometry;
    let material: THREE.LineBasicMaterial;
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
      camera.position.set(0, 38, 70);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // 创建瑞士极简参数化地形网格 (Swiss Architectural Topo-Mesh)
      const sizeX = 96;
      const sizeZ = 72;
      const segmentsX = 48;
      const segmentsZ = 36;

      geometry = new THREE.PlaneGeometry(sizeX, sizeZ, segmentsX, segmentsZ);
      geometry.rotateX(-Math.PI / 2);

      // 备份原始定点位置以便进行流体起伏计算
      const initialPos = geometry.attributes.position.clone();

      material = new THREE.LineBasicMaterial({
        color: 0x18181b,
        transparent: true,
        opacity: 0.18,
        linewidth: 1,
      });

      const wireframe = new THREE.WireframeGeometry(geometry);
      gridLines = new THREE.LineSegments(wireframe, material);
      scene.add(gridLines);

      // 鼠标阻尼平滑牵引
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetX = normX * 0.12;
        targetY = normY * 0.08;
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // 渲染主循环 (带低功耗动态波动)
      let lastWaveUpdate = 0;
      const render = () => {
        if (!isVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const elapsedTime = clock.getElapsedTime();

        // 鼠标惯性阻尼
        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;

        if (gridLines) {
          gridLines.rotation.y = mouseX;
          gridLines.rotation.x = mouseY * 0.4;

          // 节流波形计算 (每 2 帧更新一次地形起伏顶点，保持高性能 60fps)
          if (elapsedTime - lastWaveUpdate > 0.032) {
            lastWaveUpdate = elapsedTime;
            const posAttr = geometry.attributes.position;
            const count = posAttr.count;

            for (let i = 0; i < count; i++) {
              const x = initialPos.getX(i);
              const z = initialPos.getZ(i);

              // 结合时间周期的极轻微平滑波形 (东南亚水域微波律动)
              const wave =
                Math.sin(x * 0.08 + elapsedTime * 0.6) *
                  Math.cos(z * 0.1 + elapsedTime * 0.4) *
                  3.2 +
                Math.sin(x * 0.04 - z * 0.04 + elapsedTime * 0.3) * 2.0;

              posAttr.setY(i, wave);
            }
            posAttr.needsUpdate = true;
            wireframe.dispose();
            gridLines.geometry = new THREE.WireframeGeometry(geometry);
          }
        }

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      };

      render();

      // ResizeObserver 自适应尺寸
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: newW, height: newH } = entry.contentRect;
          if (newW > 0 && newH > 0) {
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
          }
        }
      });
      resizeObserver.observe(container);

      // IntersectionObserver 离屏节能暂停渲染
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handleMouseMove);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();

        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        geometry.dispose();
        initialPos.dispose();
        wireframe.dispose();
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
      <div
        className={`relative w-full h-full flex items-center justify-center opacity-25 select-none pointer-events-none ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 350"
          className="w-full h-full stroke-[#18181B] fill-none"
          strokeWidth="0.75"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M 0,${60 + i * 20} Q 150,${
                30 + i * 18 + Math.sin(i * 0.8) * 16
              } 300,${60 + i * 20} T 600,${80 + i * 20}`}
            />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div ref={containerRef} className="w-full h-full min-h-[320px]" />
      {showCoordinates && (
        <div className="absolute bottom-3 right-4 flex flex-col gap-0.5 text-[9px] font-mono text-zinc-400 text-right opacity-70">
          <span>CGK · -6.1275, 106.6537</span>
          <span>SIN · 1.3644, 103.9915</span>
          <span className="text-zinc-600 font-semibold">
            TOPOLOGY · SE ASIA 0.18 LINE_MESH
          </span>
        </div>
      )}
    </div>
  );
};

export const HeroTopoCanvas = TopoMesh;
