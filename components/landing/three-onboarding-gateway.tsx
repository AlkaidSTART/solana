"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface GatewayProps {
  className?: string;
}

export const ThreeOnboardingGateway: React.FC<GatewayProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [isActivated, setIsActivated] = useState(false);
  const triggerBoostRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (useFallback) return;

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let rootGroup: THREE.Group;
    let coreMesh: THREE.Mesh;
    let wireframeMesh: THREE.LineSegments;
    let outerRing: THREE.Mesh;
    let innerRing: THREE.Mesh;
    let particles: THREE.Points;
    let pulseWave: THREE.Mesh;
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const disposables: { dispose: () => void }[] = [];

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 360;
      const height = container.clientHeight || 240;

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(0, 0, 48);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // 灯光配置 (深黑夜景下的翡翠聚光质感)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const spotLight = new THREE.DirectionalLight(0x10b981, 3.0);
      spotLight.position.set(15, 25, 30);
      scene.add(spotLight);

      const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
      backLight.position.set(-15, -20, -20);
      scene.add(backLight);

      rootGroup = new THREE.Group();
      scene.add(rootGroup);

      // 1. 核心多面体晶体 (Octahedron / Icosahedron Core)
      const coreGeo = new THREE.OctahedronGeometry(6.5, 0);
      disposables.push(coreGeo);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.95,
        roughness: 0.12,
      });
      disposables.push(coreMat);
      coreMesh = new THREE.Mesh(coreGeo, coreMat);
      rootGroup.add(coreMesh);

      // 2. 核心翡翠发丝线外框 (Emerald Precision Wireframe)
      const wireGeo = new THREE.WireframeGeometry(coreGeo);
      disposables.push(wireGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.85,
        linewidth: 1,
      });
      disposables.push(wireMat);
      wireframeMesh = new THREE.LineSegments(wireGeo, wireMat);
      rootGroup.add(wireframeMesh);

      // 3. 双层嵌套几何运转轨道环 (Dual Orbital Rings)
      const outerRingGeo = new THREE.TorusGeometry(12.5, 0.22, 16, 64);
      disposables.push(outerRingGeo);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0x27272a,
        transparent: true,
        opacity: 0.7,
      });
      disposables.push(outerRingMat);
      outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.rotation.x = Math.PI / 3;
      rootGroup.add(outerRing);

      const innerRingGeo = new THREE.TorusGeometry(9.8, 0.28, 16, 64);
      disposables.push(innerRingGeo);
      const innerRingMat = new THREE.MeshBasicMaterial({
        color: 0x059669,
        transparent: true,
        opacity: 0.9,
      });
      disposables.push(innerRingMat);
      innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.rotation.y = Math.PI / 4;
      rootGroup.add(innerRing);

      // 4. 环绕数据粒子群 (100 Credits Cloud Swarm)
      const particleCount = 56;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const radius = 10 + Math.random() * 7;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * 0.8;
        particlePositions[i * 3] = radius * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.sin(phi) * 4;
        particlePositions[i * 3 + 2] = radius * Math.sin(theta);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      disposables.push(particleGeo);

      const particleMat = new THREE.PointsMaterial({
        color: 0x34d399,
        size: 0.7,
        transparent: true,
        opacity: 0.8,
      });
      disposables.push(particleMat);
      particles = new THREE.Points(particleGeo, particleMat);
      rootGroup.add(particles);

      // 5. 点击激活时扩散的脉冲能量环 (Energy Wave)
      const pulseGeo = new THREE.RingGeometry(7, 8, 48);
      disposables.push(pulseGeo);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      disposables.push(pulseMat);
      pulseWave = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulseWave);

      // 鼠标阻尼倾斜与加速
      let targetRotX = 0.1;
      let targetRotY = 0.2;
      let speedBoost = 0;
      let pulseProgress = 1;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotX = normY * 0.35;
        targetRotY = normX * 0.45;
      };

      const handleMouseLeave = () => {
        targetRotX = 0.08;
        targetRotY = 0.15;
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      // 点击触发加速自转与能量环
      triggerBoostRef.current = () => {
        speedBoost += Math.PI * 2.5;
        pulseProgress = 0;
        setIsActivated(true);
        setTimeout(() => setIsActivated(false), 2200);
      };

      // 主渲染动画循环
      const render = () => {
        if (!isVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const elapsed = clock.getElapsedTime();

        // 核心浮动
        rootGroup.position.y = Math.sin(elapsed * 2.0) * 0.6;

        // 旋转与阻尼逼近
        const currentSpin = elapsed * 0.5 + speedBoost;
        speedBoost *= 0.94; // 衰减加速

        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;
        rootGroup.rotation.y += (targetRotY + currentSpin - rootGroup.rotation.y) * 0.08;

        // 轨道环反向微转
        outerRing.rotation.z += 0.008;
        innerRing.rotation.x += 0.012;

        // 粒子自转
        particles.rotation.y = -elapsed * 0.25;

        // 脉冲波动画
        if (pulseProgress < 1) {
          pulseProgress += 0.025;
          const s = 1 + pulseProgress * 2.2;
          pulseWave.scale.set(s, s, 1);
          (pulseWave.material as THREE.MeshBasicMaterial).opacity = (1 - pulseProgress) * 0.7;
          pulseWave.position.y = rootGroup.position.y;
        } else {
          (pulseWave.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        // 晶体核心微脉动
        const coreScale = 1 + Math.sin(elapsed * 3.5) * 0.04;
        coreMesh.scale.set(coreScale, coreScale, coreScale);
        wireframeMesh.scale.set(coreScale, coreScale, coreScale);

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      };

      render();

      // ResizeObserver
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

      // IntersectionObserver 离屏节能
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.1 }
      );
      intersectionObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();

        scene.remove(pulseWave);
        disposables.forEach((d) => d.dispose());
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch {
      queueMicrotask(() => {
        setUseFallback(true);
      });
    }
  }, [useFallback]);

  if (useFallback) {
    return (
      <div className={`relative w-full p-4 border border-zinc-800 rounded-xl bg-zinc-900/60 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="w-16 h-16 rounded-full border border-emerald-500/40 flex items-center justify-center bg-zinc-900 mb-2">
          <Sparkles className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-xs font-mono font-bold text-white">ONBOARDING 100 CREDITS GATEWAY</div>
        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">META BAA · SOLANA ZERO-SLIPPAGE</div>
      </div>
    );
  }

  return (
    <div
      onClick={() => triggerBoostRef.current()}
      className={`relative w-full flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
      title="点击激活 100 免费 Credits 空间传送门"
    >
      {/* 3D WebGL 视窗 */}
      <div className="relative w-full h-[190px] sm:h-[220px] flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full" />

        {/* 顶部微发光胶囊 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 bg-zinc-900/80 backdrop-blur-xs px-3 py-0.5 rounded-full border border-zinc-800/80 pointer-events-none shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>ONBOARDING GATEWAY · 100 CREDITS</span>
        </div>

        {/* 右上角交互提示 */}
        <div className="absolute top-2 right-3 text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors pointer-events-none hidden sm:block">
          CLICK TO CHARGE
        </div>

        {/* 点击激活状态反馈 */}
        {isActivated && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 bg-emerald-950/90 text-emerald-300 rounded-xl border border-emerald-600/80 shadow-2xl flex items-center gap-2 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100 ONBOARDING CREDITS ALLOCATED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
