"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CheckCircle2, Zap } from "lucide-react";

interface SolanaCoinProps {
  className?: string;
}

export const SolanaSettlementCoin3D: React.FC<SolanaCoinProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [isSettled, setIsSettled] = useState(false);
  const [txCount, setTxCount] = useState(248);

  const triggerSpinRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (useFallback) return;

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let coinGroup: THREE.Group;
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const disposables: { dispose: () => void }[] = [];

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 320;
      const height = container.clientHeight || 240;

      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
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

      // 灯光系统 (极简单色高反光质感)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
      mainLight.position.set(20, 30, 40);
      scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0x059669, 1.2);
      rimLight.position.set(-20, -10, -20);
      scene.add(rimLight);

      coinGroup = new THREE.Group();
      scene.add(coinGroup);

      const COIN_RADIUS = 11.5;
      const COIN_THICKNESS = 1.8;

      // 1. 硬币圆柱主体 (Cylinder Body)
      const cylinderGeo = new THREE.CylinderGeometry(
        COIN_RADIUS,
        COIN_RADIUS,
        COIN_THICKNESS,
        56,
        1
      );
      cylinderGeo.rotateX(Math.PI / 2);
      disposables.push(cylinderGeo);

      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xf4f4f5,
        metalness: 0.85,
        roughness: 0.18,
      });
      disposables.push(coinMat);

      const coinMesh = new THREE.Mesh(cylinderGeo, coinMat);
      coinGroup.add(coinMesh);

      // 2. 发丝线刻度线框 (Wireframe Rim Precision Ticks)
      const wireframeGeo = new THREE.WireframeGeometry(cylinderGeo);
      disposables.push(wireframeGeo);

      const wireframeMat = new THREE.LineBasicMaterial({
        color: 0x18181b,
        transparent: true,
        opacity: 0.22,
      });
      disposables.push(wireframeMat);

      const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
      coinGroup.add(wireframe);

      // 3. 硬币外边缘倒角圆环 (Torus Edge Rings)
      const frontRingGeo = new THREE.TorusGeometry(COIN_RADIUS - 0.2, 0.35, 16, 56);
      disposables.push(frontRingGeo);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.9,
        roughness: 0.2,
      });
      disposables.push(ringMat);

      const frontRing = new THREE.Mesh(frontRingGeo, ringMat);
      frontRing.position.z = COIN_THICKNESS / 2 + 0.05;
      coinGroup.add(frontRing);

      const backRing = new THREE.Mesh(frontRingGeo, ringMat);
      backRing.position.z = -COIN_THICKNESS / 2 - 0.05;
      coinGroup.add(backRing);

      // 4. Solana 标志性 3 阶几何折线斜角平行块 (Icon Geometry)
      const createSolanaSlashShape = (slantLeft: boolean) => {
        const shape = new THREE.Shape();
        const w = 9.2;
        const h = 1.9;
        const skew = 2.2 * (slantLeft ? -1 : 1);

        if (slantLeft) {
          shape.moveTo(-w / 2 + skew, -h / 2);
          shape.lineTo(w / 2, -h / 2);
          shape.lineTo(w / 2 - skew, h / 2);
          shape.lineTo(-w / 2, h / 2);
        } else {
          shape.moveTo(-w / 2, -h / 2);
          shape.lineTo(w / 2 - skew, -h / 2);
          shape.lineTo(w / 2, h / 2);
          shape.lineTo(-w / 2 + skew, h / 2);
        }
        shape.closePath();
        return shape;
      };

      const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1,
      };

      const slashMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.95,
        roughness: 0.15,
      });
      disposables.push(slashMat);

      const addSlashesToFace = (zPos: number, isReversed: boolean) => {
        const yOffsets = [3.2, 0, -3.2];
        const slantConfigs = [false, true, false];

        yOffsets.forEach((y, i) => {
          const slant = isReversed ? !slantConfigs[i] : slantConfigs[i];
          const shape = createSolanaSlashShape(slant);
          const slashGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          disposables.push(slashGeo);

          const slashMesh = new THREE.Mesh(slashGeo, slashMat);
          slashMesh.position.set(0, y, zPos);
          if (isReversed) {
            slashMesh.rotation.y = Math.PI;
          }
          coinGroup.add(slashMesh);
        });
      };

      // 正面与背面均雕刻 Solana 标识
      addSlashesToFace(COIN_THICKNESS / 2 + 0.05, false);
      addSlashesToFace(-COIN_THICKNESS / 2 - 0.35, true);

      // 5. 418ms 结算脉冲波动光环 (Expanding Wave Rings)
      interface PulseRing {
        mesh: THREE.Mesh;
        progress: number;
        speed: number;
      }
      const pulseRings: PulseRing[] = [];

      for (let i = 0; i < 3; i++) {
        const pulseGeo = new THREE.RingGeometry(COIN_RADIUS + 0.4, COIN_RADIUS + 0.9, 48);
        disposables.push(pulseGeo);

        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0x059669,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        });
        disposables.push(pulseMat);

        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        pulseMesh.position.z = 0;
        scene.add(pulseMesh);

        pulseRings.push({
          mesh: pulseMesh,
          progress: i * 0.33,
          speed: 0.015,
        });
      }

      // 交互倾斜物理阻尼变量
      let targetRotX = 0.15;
      let targetRotY = 0.35;
      let spinBoost = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotX = normY * 0.45;
        targetRotY = normX * 0.55;
      };

      const handleMouseLeave = () => {
        targetRotX = 0.12;
        targetRotY = 0.32;
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      // 点击触发极速 360 度飞旋结算
      triggerSpinRef.current = () => {
        spinBoost += Math.PI * 2;
        setIsSettled(true);
        setTxCount((c) => c + 1);
        setTimeout(() => setIsSettled(false), 2400);
      };

      // 动画主渲染循环
      const render = () => {
        if (!isVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const elapsed = clock.getElapsedTime();

        // 浮动悬垂呼吸动效
        const floatY = Math.sin(elapsed * 2.2) * 0.7;
        coinGroup.position.y = floatY;

        // 自转与旋转阻尼
        const baseAutoRotation = elapsed * 0.45 + spinBoost;
        spinBoost *= 0.93; // 快速阻尼衰减点击冲击力

        coinGroup.rotation.y +=
          (targetRotY + baseAutoRotation - coinGroup.rotation.y) * 0.08;
        coinGroup.rotation.x += (targetRotX - coinGroup.rotation.x) * 0.08;

        // 更新 418ms 结算脉冲光圈
        pulseRings.forEach((pr) => {
          pr.progress = (pr.progress + pr.speed) % 1;
          const currentScale = 1 + pr.progress * 0.65;
          pr.mesh.scale.set(currentScale, currentScale, 1);
          pr.mesh.position.y = floatY;

          // 保持光圈与硬币同轴向微倾斜
          pr.mesh.rotation.x = coinGroup.rotation.x * 0.5;
          pr.mesh.rotation.y = coinGroup.rotation.y * 0.5;

          const alpha = (1 - pr.progress) * 0.55;
          (pr.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
        });

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

        pulseRings.forEach((pr) => {
          scene.remove(pr.mesh);
          (pr.mesh.geometry as THREE.BufferGeometry).dispose();
          (pr.mesh.material as THREE.Material).dispose();
        });

        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
      };
    } catch {
      setUseFallback(true);
    }
  }, []);

  if (useFallback) {
    return (
      <div className={`relative w-full p-4 border border-zinc-200/80 rounded-xl bg-zinc-50/50 flex flex-col items-center justify-center text-center ${className}`}>
        <div className="w-20 h-20 rounded-full border-2 border-zinc-900 flex items-center justify-center bg-white shadow-xs mb-3">
          <Zap className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="text-xs font-mono font-bold text-zinc-900">SOLANA PAY 418MS SETTLEMENT</div>
        <div className="text-[11px] text-zinc-500 font-mono mt-1">$0.00025 ON-CHAIN GAS FEE</div>
      </div>
    );
  }

  return (
    <div
      onClick={() => triggerSpinRef.current()}
      className={`relative w-full flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      title="点击体验 418ms 毫秒极速结算触感飞旋"
    >
      {/* 3D WebGL 视窗 */}
      <div className="relative w-full h-[180px] sm:h-[200px] flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full" />

        {/* 顶部极简状态标签 */}
        <div className="absolute top-1 left-2 flex items-center gap-1.5 pointer-events-none text-[10px] font-mono text-zinc-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-zinc-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>SOLANA PAY ENGINE</span>
        </div>

        {/* 右上角点击提示 */}
        <div className="absolute top-1 right-2 text-[9px] font-mono text-zinc-400 group-hover:text-zinc-700 transition-colors pointer-events-none">
          CLICK TO TEST FINALITY
        </div>

        {/* 结算触发反馈浮层 */}
        {isSettled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-1.5 bg-zinc-950/90 text-white rounded-xl shadow-lg border border-zinc-800 flex items-center gap-2 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>418ms FINALITY CONFIRMED</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部实时微遥测条 */}
      <div className="w-full pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-zinc-100">
        <div className="flex items-center gap-1.5 text-zinc-700">
          <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600/20" />
          <span className="font-semibold">Tx #{txCount}</span>
          <span className="text-zinc-400">· Finalized</span>
        </div>
        <div className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
          0.00025 SOL / USDC
        </div>
      </div>
    </div>
  );
};
