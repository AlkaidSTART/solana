import { describe, it, expect } from "vitest";
import {
  MOTION_EASE,
  transitions,
  fadeUpVariants,
  fadeVariants,
  staggerContainerVariants,
  staggerItemVariants,
  modalVariants,
  drawerVariants,
  tabContentVariants,
} from "./motion-transitions";

describe("motion-transitions specs", () => {
  it("conforms to UI_DESIGN.md Swiss architectural easing curve", () => {
    expect(MOTION_EASE).toEqual([0.16, 1, 0.3, 1]);
    expect(fadeVariants.hidden).toMatchObject({ opacity: 0 });
    expect(fadeVariants.visible).toMatchObject({ opacity: 1 });
    expect(staggerItemVariants.hidden).toMatchObject({ opacity: 0, y: 12 });
  });

  it("entrance transition duration is within 240ms constraint", () => {
    if (typeof transitions.entrance.duration === "number") {
      expect(transitions.entrance.duration).toBeLessThanOrEqual(0.24);
    }
  });

  it("springTab has proper stiffness and damping for glitch-free navigation", () => {
    expect(transitions.springTab.type).toBe("spring");
    expect(transitions.springTab.stiffness).toBe(450);
    expect(transitions.springTab.damping).toBe(35);
  });

  it("fadeUpVariants starts at y: 12 and transitions to y: 0", () => {
    expect(fadeUpVariants.hidden).toMatchObject({ opacity: 0, y: 12 });
    expect(fadeUpVariants.visible).toMatchObject({ opacity: 1, y: 0 });
    expect(fadeUpVariants.exit).toMatchObject({ opacity: 0, y: -8 });
  });

  it("staggerContainerVariants defines valid stagger children timing", () => {
    const visibleTransition = staggerContainerVariants.visible;
    expect(visibleTransition).toBeDefined();
    if (typeof visibleTransition === "object" && "transition" in visibleTransition) {
      expect(visibleTransition.transition?.staggerChildren).toBe(0.05);
    }
  });

  it("modalVariants defines balanced backdrop fade and panel spring scale", () => {
    expect(modalVariants.backdrop.hidden).toMatchObject({ opacity: 0 });
    expect(modalVariants.backdrop.visible).toMatchObject({ opacity: 1 });
    expect(modalVariants.panel.hidden).toMatchObject({ opacity: 0, scale: 0.95 });
    expect(modalVariants.panel.visible).toMatchObject({ opacity: 1, scale: 1 });
  });

  it("drawerVariants slides from 100% to 0", () => {
    expect(drawerVariants.panel.hidden).toMatchObject({ x: "100%" });
    expect(drawerVariants.panel.visible).toMatchObject({ x: 0 });
    expect(drawerVariants.panel.exit).toMatchObject({ x: "100%" });
  });

  it("tabContentVariants supports smooth mode=wait cross-fading", () => {
    expect(tabContentVariants.hidden).toMatchObject({ opacity: 0, y: 6 });
    expect(tabContentVariants.visible).toMatchObject({ opacity: 1, y: 0 });
    expect(tabContentVariants.exit).toMatchObject({ opacity: 0, y: -4 });
  });
});
