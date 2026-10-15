import { describe, expect, it } from "vitest";

import {
  buildTemplateMessagePayload,
  buildTextMessagePayload,
  classifyGraphFailure,
  graphMessagesUrl,
  graphTemplatesUrl,
  parseGraphSendResponse,
  undeterminedGraphFailure,
} from "./graph";

describe("WhatsApp Graph API payloads", () => {
  it("builds the documented text message payload", () => {
    expect(buildTextMessagePayload({ to: "+16505551234", body: "Hello!" })).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+16505551234",
      type: "text",
      text: { preview_url: false, body: "Hello!" },
    });
  });

  it("builds a template payload with positional body parameters in order", () => {
    expect(buildTemplateMessagePayload({
      to: "+16505551234",
      templateName: "order_confirmation",
      languageCode: "en_US",
      bodyParameters: ["Jessica", "SKBUP2-4CPIG9"],
    })).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+16505551234",
      type: "template",
      template: {
        name: "order_confirmation",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Jessica" },
              { type: "text", text: "SKBUP2-4CPIG9" },
            ],
          },
        ],
      },
    });
  });

  it("omits components entirely when a template has no body parameters", () => {
    const payload = buildTemplateMessagePayload({
      to: "+16505551234",
      templateName: "hello_world",
      languageCode: "en_US",
      bodyParameters: [],
    });

    expect(payload).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "+16505551234",
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    });
    expect(JSON.stringify(payload)).not.toContain("components");
  });

  it("builds versioned Graph URLs and rejects malformed identifiers", () => {
    expect(graphMessagesUrl("v25.0", "106540352242922"))
      .toBe("https://graph.facebook.com/v25.0/106540352242922/messages");
    expect(graphTemplatesUrl("v25.0", "102290129340398"))
      .toBe("https://graph.facebook.com/v25.0/102290129340398/message_templates");

    expect(() => graphMessagesUrl("25.0", "106540352242922")).toThrow();
    expect(() => graphMessagesUrl("v25.0", "../../me")).toThrow();
    expect(() => graphTemplatesUrl("v25.0", "")).toThrow();
  });
});

describe("WhatsApp Graph API responses", () => {
  it("extracts the accepted message id without treating it as delivery", () => {
    const result = parseGraphSendResponse({
      messaging_product: "whatsapp",
      contacts: [{ input: "+16505551234", wa_id: "16505551234" }],
      messages: [{ id: "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI4MjZGRDA0OUE2OTQ3RkEyMzcA" }],
    });

    expect(result).toEqual({
      messageId: "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI4MjZGRDA0OUE2OTQ3RkEyMzcA",
      messageStatus: null,
    });
    expect(result).not.toHaveProperty("delivered");
  });

  it("rejects responses without a usable message id", () => {
    expect(parseGraphSendResponse(null)).toBeNull();
    expect(parseGraphSendResponse({ messages: [] })).toBeNull();
    expect(parseGraphSendResponse({ messages: [{ id: "" }] })).toBeNull();
    expect(parseGraphSendResponse({ messages: [{ id: 42 }] })).toBeNull();
  });
});

describe("WhatsApp Graph API failure classification", () => {
  it("treats documented transient codes as retryable", () => {
    for (const code of [2, 4, 80007, 130429, 131016, 131057, 2494100]) {
      const failure = classifyGraphFailure(400, { error: { code, message: `(#${code}) transient` } });
      expect(failure.classification).toBe("retryable");
      expect(failure.code).toBe(code);
    }
  });

  it("treats documented permanent codes as terminal", () => {
    for (const code of [0, 10, 100, 190, 130403, 131047, 131050, 132001, 134100]) {
      const failure = classifyGraphFailure(400, { error: { code, message: `(#${code}) permanent` } });
      expect(failure.classification).toBe("terminal");
      expect(failure.code).toBe(code);
    }
  });

  it("surfaces the provider details string for diagnosis", () => {
    expect(classifyGraphFailure(400, {
      error: {
        message: "(#131047) Re-engagement message",
        code: 131047,
        error_data: { messaging_product: "whatsapp", details: "More than 24 hours have passed since the recipient last replied." },
      },
    })).toEqual({
      classification: "terminal",
      code: 131047,
      details: "More than 24 hours have passed since the recipient last replied.",
    });
  });

  it("falls back to HTTP status when no known code is present", () => {
    expect(classifyGraphFailure(500, {}).classification).toBe("retryable");
    expect(classifyGraphFailure(429, {}).classification).toBe("retryable");
    expect(classifyGraphFailure(503, {}).classification).toBe("retryable");
    expect(classifyGraphFailure(400, {}).classification).toBe("terminal");
    expect(classifyGraphFailure(422, { error: { code: 999999 } }).classification).toBe("terminal");
  });

  it("keeps broken connections undetermined instead of retryable", () => {
    const failure = undeterminedGraphFailure("The operation was aborted due to timeout");

    expect(failure).toEqual({
      classification: "unknown",
      code: null,
      details: "The operation was aborted due to timeout",
    });
    expect(failure.classification).not.toBe("retryable");
  });
});
