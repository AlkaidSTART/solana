"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { clsx } from "clsx";

interface CityNode {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  market: string;
  tag: string;
  metric: string;
}

const SEA_NODES: CityNode[] = [
  {
    id: "cgk",
    code: "CGK",
    name: "雅加达 (Jakarta)",
    lat: -6.2,
    lon: 106.85,
    market: "印尼 · +62",
    tag: "COD 地标校验 · Bahasa Gaul 俚语",
    metric: "99.4% 发货核验率",
  },
  {
    id: "sin",
    code: "SIN",
    name: "新加坡 (Singapore)",
    lat: 1.35,
    lon: 103.82,
    market: "区域枢纽 · +65",
    tag: "Solana Pay 结算 · Singlish 召回",
    metric: "418ms 原生结算",
  },
  {
    id: "bkk",
    code: "BKK",
    name: "曼谷 (Bangkok)",
    lat: 13.75,
    lon: 100.5,
    market: "泰国 · +66",
    tag: "PromptPay 扫码 · 15min 弃购挽回",
    metric: "18.4% 挽回转化",
  },
  {
    id: "mnl",
    code: "MNL",
    name: "马尼拉 (Manila)",
    lat: 14.6,
    lon: 120.98,
    market: "菲律宾 · +63",
    tag: "GCash 预检 · COD 防拒签保护",
    metric: "-6.2% 运费损耗",
  },
  {
    id: "sgn",
    code: "SGN",
    name: "胡志明市 (HCMC)",
    lat: 10.82,
    lon: 106.63,
    market: "越南 · +84",
    tag: "MoMo 直连 · 02:00 夜间咨询促单",
    metric: "< 3.2s 平均应答",
  },
  {
    id: "szx",
    code: "SZX",
    name: "深圳 (Shenzhen)",
    lat: 22.54,
    lon: 114.05,
    market: "跨境供应链发货港",
    tag: "Shopify/WooCommerce 毫秒同步",
    metric: "150ms Webhook 接入",
  },
];

// 航线连接对
const ROUTES: [string, string][] = [
  ["szx", "sin"],
  ["szx", "cgk"],
  ["szx", "bkk"],
  ["sin", "cgk"],
  ["sin", "mnl"],
  ["bkk", "sgn"],
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export const SeaTopologyGlobe: React.FC<{ className?: string }> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCityId, setActiveCityId] = useState<string>("cgk");
  const [useFallback, setUseFallback] = useState(false);

  // 引用目标旋转角用于程序化平滑聚焦
  const targetRotationRef = useRef<{ y: number; x: number }>({ y: -1.8, x: 0.15 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const activeCity = useMemo(
    () => SEA_NODES.find((n) => n.id === activeCityId) || SEA_NODES[0],
    [activeCityId]
  );

  // 点击枢纽标签时平滑旋转至该枢纽
  const handleSelectCity = (city: CityNode) => {
    setActiveCityId(city.id);
    const lonRad = (city.lon * Math.PI) / 180;
    const latRad = (city.lat * Math.PI) / 180;
    // 将城市旋转至面向摄像机
    targetRotationRef.current = {
      y: -lonRad - Math.PI / 2,
      x: latRad * 0.7,
    };
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (motionQuery.matches) {
        setUseFallback(true);
        return;
      }
    }

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let globeGroup: THREE.Group;
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const disposables: { dispose: () => void }[] = [];

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 400;
      const height = container.clientHeight || 280;

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(0, 0, 52);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const GLOBE_RADIUS = 16.5;

      // 1. 极简单色经纬网球体 (Monochromatic Sphere Wireframe)
      const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 28, 20);
      disposables.push(sphereGeo);

      const sphereWireframe = new THREE.WireframeGeometry(sphereGeo);
      disposables.push(sphereWireframe);

      const sphereMat = new THREE.LineBasicMaterial({
        color: 0x18181b,
        transparent: true,
        opacity: 0.12,
        linewidth: 1,
      });
      disposables.push(sphereMat);

      const wireframeLines = new THREE.LineSegments(sphereWireframe, sphereMat);
      globeGroup.add(wireframeLines);

      // 2. 经纬赤道与关键纬度发丝圈
      const equatorGeo = new THREE.RingGeometry(GLOBE_RADIUS + 0.1, GLOBE_RADIUS + 0.25, 64);
      disposables.push(equatorGeo);
      const equatorMat = new THREE.MeshBasicMaterial({
        color: 0x18181b,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      disposables.push(equatorMat);
      const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
      equatorRing.rotation.x = Math.PI / 2;
      globeGroup.add(equatorRing);

      // 3. 东南亚各枢纽节点 (Solid Dark Dots & Emerald Rings)
      const nodeMeshes: { id: string; mesh: THREE.Mesh; ring: THREE.Mesh }[] = [];

      SEA_NODES.forEach((node) => {
        const pos = latLonToVector3(node.lat, node.lon, GLOBE_RADIUS);

        // 中心实体节点
        const dotGeo = new THREE.SphereGeometry(0.55, 12, 12);
        disposables.push(dotGeo);
        const dotMat = new THREE.MeshBasicMaterial({
          color: node.id === "sin" ? 0x059669 : 0x18181b,
        });
        disposables.push(dotMat);
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        globeGroup.add(dot);

        // 外层脉冲微光环
        const ringGeo = new THREE.RingGeometry(0.8, 1.05, 24);
        disposables.push(ringGeo);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x059669,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        disposables.push(ringMat);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos.clone().multiplyScalar(1.01));
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        globeGroup.add(ring);

        nodeMeshes.push({ id: node.id, mesh: dot, ring });
      });

      // 4. 航线曲线与巡航脉冲粒子 (Bezier Flight Curves & Dynamic Packets)
      interface PulsePacket {
        curve: THREE.CubicBezierCurve3;
        progress: number;
        speed: number;
        mesh: THREE.Mesh;
      }
      const packets: PulsePacket[] = [];

      ROUTES.forEach(([fromId, toId], idx) => {
        const fromNode = SEA_NODES.find((n) => n.id === fromId);
        const toNode = SEA_NODES.find((n) => n.id === toId);
        if (!fromNode || !toNode) return;

        const v1 = latLonToVector3(fromNode.lat, fromNode.lon, GLOBE_RADIUS);
        const v2 = latLonToVector3(toNode.lat, toNode.lon, GLOBE_RADIUS);

        // 计算凸起控制点
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        const distance = v1.distanceTo(v2);
        const elevation = GLOBE_RADIUS + distance * 0.32;
        mid.normalize().multiplyScalar(elevation);

        const curve = new THREE.CubicBezierCurve3(
          v1,
          v1.clone().lerp(mid, 0.5),
          v2.clone().lerp(mid, 0.5),
          v2
        );

        const points = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
        disposables.push(arcGeo);

        const arcMat = new THREE.LineBasicMaterial({
          color: 0x18181b,
          transparent: true,
          opacity: 0.28,
        });
        disposables.push(arcMat);

        const arcLine = new THREE.Line(arcGeo, arcMat);
        globeGroup.add(arcLine);

        // 沿航线飞行的发光数据包粒子
        const packetGeo = new THREE.SphereGeometry(0.35, 8, 8);
        disposables.push(packetGeo);
        const packetMat = new THREE.MeshBasicMaterial({
          color: 0x059669,
        });
        disposables.push(packetMat);
        const packetMesh = new THREE.Mesh(packetGeo, packetMat);
        globeGroup.add(packetMesh);

        packets.push({
          curve,
          progress: (idx * 0.22) % 1,
          speed: 0.006 + (idx % 3) * 0.002,
          mesh: packetMesh,
        });
      });

      // 初始化朝向东南亚核心区域
      globeGroup.rotation.y = targetRotationRef.current.y;
      globeGroup.rotation.x = targetRotationRef.current.x;

      // 拖拽交互事件监听
      const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        targetRotationRef.current.y += deltaX * 0.008;
        targetRotationRef.current.x += deltaY * 0.008;

        // 限制俯仰角度在合理范围
        targetRotationRef.current.x = Math.max(
          -0.6,
          Math.min(0.6, targetRotationRef.current.x)
        );

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // 触摸支持
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          isDraggingRef.current = true;
          previousMousePositionRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }
      };
      const handleTouchMove = (e: TouchEvent) => {
        if (!isDraggingRef.current || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
        targetRotationRef.current.y += deltaX * 0.008;
        targetRotationRef.current.x += deltaY * 0.008;
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      };
      const handleTouchEnd = () => {
        isDraggingRef.current = false;
      };
      domElement.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);

      // 主动画渲染循环
      const render = () => {
        if (!isVisible) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        const delta = clock.getDelta();

        // 自动极缓慢自转巡航 (未拖拽时)
        if (!isDraggingRef.current) {
          targetRotationRef.current.y += 0.0018;
        }

        // 阻尼逼近目标朝向
        globeGroup.rotation.y += (targetRotationRef.current.y - globeGroup.rotation.y) * 0.06;
        globeGroup.rotation.x += (targetRotationRef.current.x - globeGroup.rotation.x) * 0.06;

        // 更新航线数据包粒子
        packets.forEach((pkt) => {
          pkt.progress = (pkt.progress + pkt.speed) % 1;
          const pos = pkt.curve.getPointAt(pkt.progress);
          pkt.mesh.position.copy(pos);
        });

        // 呼吸脉冲环缩放动画
        const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
        nodeMeshes.forEach((nm) => {
          if (nm.id === activeCityId) {
            nm.ring.scale.set(scale * 1.3, scale * 1.3, 1);
            (nm.ring.material as THREE.MeshBasicMaterial).opacity = 0.85;
          } else {
            nm.ring.scale.set(1, 1, 1);
            (nm.ring.material as THREE.MeshBasicMaterial).opacity = 0.25;
          }
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
        domElement.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        domElement.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();

        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
      };
    } catch {
      setUseFallback(true);
    }
  }, [activeCityId]);

  if (useFallback) {
    return (
      <div className={`relative w-full p-4 border border-zinc-200/80 rounded-xl bg-zinc-50/50 ${className}`}>
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-3">
          <span>STATIC GEO-TOPOLOGY FALLBACK</span>
          <span className="text-emerald-700 font-semibold">{activeCity.code}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SEA_NODES.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveCityId(n.id)}
              className={clsx(
                "px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer",
                activeCityId === n.id
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
              )}
            >
              {n.code}
            </button>
          ))}
        </div>
        <div className="p-3 bg-white border border-zinc-200/80 rounded-lg">
          <div className="text-sm font-bold text-zinc-900">{activeCity.name}</div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">{activeCity.tag}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-2">{activeCity.metric}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full flex flex-col justify-between overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas 渲染视窗 */}
      <div className="relative w-full h-[220px] sm:h-[250px] cursor-grab active:cursor-grabbing">
        <div ref={containerRef} className="w-full h-full" />

        {/* 顶部指示徽章 */}
        <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none select-none text-[10px] font-mono text-zinc-500 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-zinc-200/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
          <span>3D GEO-ROUTING · SE ASIA</span>
        </div>

        {/* 右上角拖拽提示 */}
        <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-400 pointer-events-none select-none hidden sm:block">
          DRAG TO ROTATE
        </div>
      </div>

      {/* 底部城市切换胶囊与实时遥测指标 */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {SEA_NODES.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelectCity(city)}
              className={clsx(
                "px-2 py-0.5 text-[11px] font-mono rounded-md border transition-all cursor-pointer select-none",
                activeCityId === city.id
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300"
              )}
            >
              {city.code}
            </button>
          ))}
        </div>

        {/* 选中枢纽的微遥测卡片 (Swiss Minimalist Hairline Box) */}
        <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl flex items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 tracking-tight">
                {activeCity.name}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{activeCity.market}</span>
            </div>
            <div className="text-[11px] font-sans text-zinc-600 truncate mt-0.5">
              {activeCity.tag}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
              {activeCity.metric}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
