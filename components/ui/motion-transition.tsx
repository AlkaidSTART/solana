"use client";

import React from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type MotionProps,
} from "motion/react";
import {
  MOTION_EASE,
  staggerContainerVariants,
  staggerItemVariants,
  tabContentVariants,
  transitions,
} from "@/lib/animations/motion-transitions";
import { twMerge } from "tailwind-merge";

export interface MotionEntranceProps extends MotionProps {
  children?: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  distance?: number;
  duration?: number;
  delay?: number;
}

/**
 * 声明式 Motion.dev 进场过渡容器
 * 严格支持系统 prefers-reduced-motion 无障碍偏好
 */
export const MotionEntrance: React.FC<MotionEntranceProps> = ({
  children,
  className,
  direction = "up",
  distance = 12,
  duration = 0.24,
  delay = 0,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    fade: { x: 0, y: 0 },
    scale: { x: 0, y: 0, scale: 0.96 },
  }[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: MOTION_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface MotionStaggerProps extends MotionProps {
  children?: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * 级联交错容器 (Stagger Container)
 */
export const MotionStagger: React.FC<MotionStaggerProps> = ({
  children,
  className,
  staggerDelay = 0.05,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const customVariants = {
    ...staggerContainerVariants,
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.02,
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface MotionStaggerItemProps extends MotionProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 级联子元素项 (Stagger Item)
 */
export const MotionStaggerItem: React.FC<MotionStaggerItemProps> = ({
  children,
  className,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface MotionCrossFadeProps {
  children: React.ReactNode;
  activeKey: string | number;
  className?: string;
}

/**
 * 内容平滑淡入切换容器 (基于 AnimatePresence mode="wait")
 */
export const MotionCrossFade: React.FC<MotionCrossFadeProps> = ({
  children,
  activeKey,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        variants={tabContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={twMerge("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export interface MotionPressProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * 触感微按压容器 (scale 0.98)
 */
export const MotionPress: React.FC<MotionPressProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={transitions.springPress}
      onClick={onClick}
      className={twMerge("cursor-pointer select-none", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
