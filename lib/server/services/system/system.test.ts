import { describe, expect, it } from "vitest";

import { serializeOperationInput, validateOperationType } from "@/lib/server/operations/service";
import { getOperationScope, projectCapability } from "@/lib/server/services/system/status";

describe("system status projection", () => {
  it("does not call a configured but unverified capability verified", () => {
    expect(projectCapability({ implemented: true, configured: true, verified: false })).toEqual({
      status: "implemented",
      blockingReasons: ["verification_pending"],
    });
  });

  it("marks a capability unavailable when its integration is not implemented", () => {
    expect(projectCapability({ implemented: false, configured: true, verified: false })).toEqual({
      status: "unavailable",
      blockingReasons: ["integration_not_implemented"],
    });
  });

  it("scopes no-tenant operations to their initiating user", () => {
    expect(getOperationScope({ userId: "user-1", tenantId: null })).toEqual({
      tenantId: null,
      requestedByUserId: "user-1",
    });
  });

  it("limits non-owner tenant members to operations they initiated", () => {
    expect(getOperationScope({ userId: "agent-1", tenantId: "tenant-1", role: "Agent" })).toEqual({
      tenantId: "tenant-1",
      requestedByUserId: "agent-1",
    });
  });

  it("accepts a canonical operation type", () => {
    expect(validateOperationType("woocommerce.sync")).toBe("woocommerce.sync");
  });

  it("rejects operation input larger than 64 KiB", () => {
    expect(() => serializeOperationInput({ value: "x".repeat(65_536) })).toThrow(
      "Operation input must be valid JSON no larger than 64 KiB",
    );
  });
});
