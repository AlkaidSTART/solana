import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs } from "./tabs";
import { Modal } from "./modal";
import { Drawer } from "./drawer";
import { Button } from "./button";

describe("Motion UI Components SSR & Structure", () => {
  describe("Tabs", () => {
    const mockItems = [
      { id: "tab1", label: "Overview", badge: 3 },
      { id: "tab2", label: "Settings" },
    ];

    it("renders capsule variant to static markup correctly", () => {
      const html = renderToStaticMarkup(
        <Tabs
          items={mockItems}
          activeId="tab1"
          onChange={() => {}}
          variant="capsule"
        />
      );

      expect(html).toContain("Overview");
      expect(html).toContain("Settings");
      expect(html).toContain("3");
    });

    it("renders underline variant to static markup cleanly", () => {
      const html = renderToStaticMarkup(
        <Tabs
          items={mockItems}
          activeId="tab2"
          onChange={() => {}}
          variant="underline"
        />
      );

      expect(html).toContain("Overview");
      expect(html).toContain("Settings");
    });
  });

  describe("Modal", () => {
    it("renders nothing when open is false", () => {
      const html = renderToStaticMarkup(
        <Modal open={false} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      expect(html).toBe("");
    });

    it("renders title, subtitle, and body when open is true", () => {
      const html = renderToStaticMarkup(
        <Modal
          open={true}
          onClose={() => {}}
          title="Confirm Action"
          subtitle="Subtitle info"
        >
          <p>Modal body text</p>
        </Modal>
      );

      expect(html).toContain("Confirm Action");
      expect(html).toContain("Subtitle info");
      expect(html).toContain("Modal body text");
    });
  });

  describe("Drawer", () => {
    it("renders nothing when open is false", () => {
      const html = renderToStaticMarkup(
        <Drawer open={false} onClose={() => {}} title="Order Details">
          <p>Order details</p>
        </Drawer>
      );
      expect(html).toBe("");
    });

    it("renders drawer panel and title when open is true", () => {
      const html = renderToStaticMarkup(
        <Drawer open={true} onClose={() => {}} title="Order Details">
          <p>Order content</p>
        </Drawer>
      );

      expect(html).toContain("Order Details");
      expect(html).toContain("Order content");
    });
  });

  describe("Button", () => {
    it("renders button with children and primary variant styles", () => {
      const html = renderToStaticMarkup(
        <Button variant="primary" size="md">
          Submit Order
        </Button>
      );

      expect(html).toContain("Submit Order");
      expect(html).toContain("bg-[#09090B]");
    });

    it("renders button with secondary variant styles", () => {
      const html = renderToStaticMarkup(
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
      );

      expect(html).toContain("Cancel");
      expect(html).toContain("bg-[#F4F4F5]");
    });
  });
});
