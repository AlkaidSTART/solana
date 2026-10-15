import type { Transition, Variants } from "motion/react";

/**
 * SolaFlow AI — Motion.dev 动效与物理阻尼规范
 * 深度对齐 docs/UI_DESIGN.md 第 10 节 (动效编排：物理阻尼与克制微交互)
 */

// 1. 瑞士国际主义建筑学精准物理阻尼缓动曲线 (Ease Curves)
export const MOTION_EASE = [0.16, 1, 0.3, 1] as const;
export const MOTION_EASE_IN = [0.7, 0, 0.84, 0] as const;
export const MOTION_EASE_OUT = [0.16, 1, 0.3, 1] as const;

// 2. 核心物理时间与弹簧规范 (Transitions)
export const transitions = {
  /** 极简微位移进场过渡 (≤ 240ms) */
  entrance: {
    duration: 0.24,
    ease: MOTION_EASE,
  } satisfies Transition,

  /** 快速反馈退出 */
  exit: {
    duration: 0.18,
    ease: MOTION_EASE_IN,
  } satisfies Transition,

  /** 高敏度无振荡弹簧 (用于 Tabs 浮动滑块、按压等，零多余晃动) */
  springTab: {
    type: "spring",
    stiffness: 450,
    damping: 35,
    mass: 0.8,
  } satisfies Transition,

  /** 模态框浮层弹簧 (微量阻尼，沉稳扎实) */
  springModal: {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 1,
  } satisfies Transition,

  /** 侧边抽屉滑入弹簧 */
  springDrawer: {
    type: "spring",
    stiffness: 320,
    damping: 32,
    mass: 1,
  } satisfies Transition,

  /** 触感按压弹簧 */
  springPress: {
    type: "spring",
    stiffness: 600,
    damping: 30,
  } satisfies Transition,
} as const;

// 3. 通用动画变体 (Variants)

/** 单元素淡入微位移 (Y: 12px -> 0) */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.entrance,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.exit,
  },
};

/** 单纯透明度过渡 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: MOTION_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: MOTION_EASE_IN },
  },
};

/** 级联交错容器变体 (Stagger Container) */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

/** 级联项变体 (Stagger Item) */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.entrance,
  },
};

/** 模态框遮罩与面板变体 */
export const modalVariants = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
  } satisfies Variants,
  panel: {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: transitions.springModal,
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: 4,
      transition: transitions.exit,
    },
  } satisfies Variants,
};

/** 抽屉遮罩与侧边面板变体 */
export const drawerVariants = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.24, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
  } satisfies Variants,
  panel: {
    hidden: { x: "100%", opacity: 0.8 },
    visible: {
      x: 0,
      opacity: 1,
      transition: transitions.springDrawer,
    },
    exit: {
      x: "100%",
      opacity: 0.8,
      transition: { duration: 0.2, ease: MOTION_EASE_IN },
    },
  } satisfies Variants,
};

/** 内容平滑切换变体 (mode="wait") */
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: MOTION_EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14, ease: MOTION_EASE_IN },
  },
};
