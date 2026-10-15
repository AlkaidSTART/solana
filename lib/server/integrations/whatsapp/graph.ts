const GRAPH_API_HOST = "https://graph.facebook.com";
const GRAPH_API_VERSION_PATTERN = /^v\d{1,2}\.\d$/;
const GRAPH_API_ASSET_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;

export type GraphFailureClass = "retryable" | "terminal" | "unknown";

export interface GraphFailure {
  classification: GraphFailureClass;
  code: number | null;
  details: string | null;
}

export interface WhatsAppTextMessage {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters?: string[];
}

export interface WhatsAppSendResult {
  messageId: string;
  messageStatus: string | null;
}

/**
 * Transient provider conditions: rate limits, maintenance windows, and conditions the platform
 * documents as retryable. Retrying these later is expected to succeed.
 */
const RETRYABLE_ERROR_CODES = new Set([
  1,        // Invalid request or possible server error; check platform status before retrying
  2,        // Temporary downtime or overload
  4,        // App has reached its API call rate limit
  80007,    // WhatsApp Business Account rate limit
  130429,   // Cloud API message throughput reached
  131000,   // Message failed to send due to an unknown error; platform advises retrying
  131016,   // Service temporarily unavailable
  131048,   // Sending restrictions from too many blocked or spam-flagged messages
  131056,   // Too many messages to the same recipient in a short period; wait and retry
  131057,   // WhatsApp Business Account is in maintenance mode
  132069,   // Flow throttled; 10 flow messages already sent in the last hour
  133004,   // Server temporarily unavailable
  133008,   // Too many two-step verification PIN guesses for this number
  133015,   // Phone number recently deleted and deletion has not completed
  134101,   // Template still syncing; may take up to 10 minutes
  2494100,  // Business phone number is in maintenance mode
]);

/**
 * Permanent provider rejections. These must never be retried automatically, otherwise the platform
 * keeps charging for messages that cannot be delivered and quality signals degrade further.
 */
const TERMINAL_ERROR_CODES = new Set([
  0,        // Access token expired, was invalidated, or the app user revoked access
  3,        // Capability or permission issue
  10,       // Permission is not granted or has been removed
  33,       // The business phone number has been deleted
  100,      // One or more unsupported or misspelled parameters
  190,      // Access token has expired
  200,      // No access token was provided
  368,      // WhatsApp Business Account restricted or disabled for policy violations
  130403,   // This business has been blocked by the end user; platform says do not retry
  130472,   // Message was not sent as part of a marketing experiment
  130497,   // Account is restricted from messaging users in certain countries
  131005,   // Permission is not granted or has been removed
  131008,   // The request is missing a required parameter
  131009,   // One or more parameter values are invalid
  131021,   // Sender and recipient phone number are the same
  131026,   // Unable to deliver the message
  131031,   // Account restricted, disabled, or verification data mismatch
  131037,   // 555 business phone number has no approved display name
  131042,   // Payment method error
  131045,   // Phone number registration error
  131047,   // More than 24 hours since the recipient last replied; send a template instead
  131049,   // Not delivered to maintain healthy ecosystem engagement
  131050,   // Recipient opted out of marketing messages; platform says do not retry
  131051,   // Unsupported message type
  131052,   // Unable to download the media sent by the user
  131053,   // Unable to upload the media used in the message
  131063,   // Marketing templates are disabled for this Cloud API configuration
  131064,   // Messaging limit reached due to template classification violations
  132000,   // Parameter count does not match the template definition
  132001,   // Template does not exist in the specified language or is not approved
  132005,   // Translated text is too long
  132007,   // Template content violates WhatsApp policy
  132012,   // Variable parameter values formatted incorrectly
  132015,   // Template paused due to low quality
  132016,   // Template permanently disabled after repeated pausing
  132018,   // Template validation error
  132068,   // Flow is in a blocked state
  133000,   // A previous deregistration attempt failed
  133005,   // Two-step verification PIN incorrect
  133006,   // Phone number needs to be verified before registering
  133009,   // Two-step verification PIN was entered too quickly
  133010,   // Phone number not registered on the WhatsApp Business Platform
  134011,   // WhatsApp Payments terms of service acceptance is pending
  135000,   // Message failed to send due to an unknown error with request parameters
  134100,   // Only marketing messages are supported on this API
  134102,   // Template unavailable for use
  1752041,  // Duplicate onboarding request
  200005,   // Template insights unavailable
  200006,   // Cannot disable template insights
  200007,   // Template insights not enabled
  2388019,  // Message template limit exceeded
  2388039,  // Message template status cannot be changed
  2388040,  // Character limit exceeded
  2388047,  // Message header format is incorrect
  2388072,  // Message body format is incorrect
  2388073,  // Message footer format is incorrect
  2388293,  // Parameters words ratio exceeds the limit
  2388299,  // Leading or trailing parameters are not allowed
  2593079,  // WhatsApp Business Account already marked for migration to a different solution
  2593085,  // WhatsApp Business Account is not eligible for ownership transfer
  2593107,  // Synchronization API call limit reached
  2593108,  // Synchronization is only allowed within 24 hours of onboarding
]);

export function isGraphApiVersion(value: string): boolean {
  return GRAPH_API_VERSION_PATTERN.test(value);
}

export function graphMessagesUrl(version: string, phoneNumberId: string): string {
  if (!isGraphApiVersion(version) || !GRAPH_API_ASSET_ID_PATTERN.test(phoneNumberId)) {
    throw new Error("Graph API version or WhatsApp phone number ID is malformed.");
  }

  return `${GRAPH_API_HOST}/${version}/${phoneNumberId}/messages`;
}

export function graphPhoneNumberUrl(version: string, phoneNumberId: string): string {
  if (!isGraphApiVersion(version) || !GRAPH_API_ASSET_ID_PATTERN.test(phoneNumberId)) {
    throw new Error("Graph API version or WhatsApp phone number ID is malformed.");
  }

  return `${GRAPH_API_HOST}/${version}/${phoneNumberId}`;
}

export function graphTemplatesUrl(version: string, businessAccountId: string): string {
  if (!isGraphApiVersion(version) || !GRAPH_API_ASSET_ID_PATTERN.test(businessAccountId)) {
    throw new Error("Graph API version or WhatsApp Business account ID is malformed.");
  }

  return `${GRAPH_API_HOST}/${version}/${businessAccountId}/message_templates`;
}

export function buildTextMessagePayload(message: WhatsAppTextMessage): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: message.to,
    type: "text",
    text: {
      preview_url: message.previewUrl ?? false,
      body: message.body,
    },
  };
}

export function buildTemplateMessagePayload(message: WhatsAppTemplateMessage): Record<string, unknown> {
  const parameters = message.bodyParameters?.filter((value) => value.length > 0) ?? [];

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: message.to,
    type: "template",
    template: {
      name: message.templateName,
      language: { code: message.languageCode },
      ...(parameters.length > 0
        ? { components: [{ type: "body", parameters: parameters.map((text) => ({ type: "text", text })) }] }
        : {}),
    },
  };
}

/**
 * A send response only means the platform accepted the request. Delivery is reported later through
 * `messages` status webhooks, so callers must never treat this as a delivered message.
 */
export function parseGraphSendResponse(body: unknown): WhatsAppSendResult | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  const first = messages[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }

  const id = (first as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0 || id.length > 512) {
    return null;
  }

  const status = (first as { message_status?: unknown }).message_status;

  return {
    messageId: id,
    messageStatus: typeof status === "string" && status.length > 0 && status.length <= 64 ? status : null,
  };
}

export function classifyGraphFailure(status: number, body: unknown): GraphFailure {
  const error = readGraphError(body);

  if (error.code !== null) {
    if (RETRYABLE_ERROR_CODES.has(error.code)) {
      return { classification: "retryable", code: error.code, details: error.details };
    }
    if (TERMINAL_ERROR_CODES.has(error.code)) {
      return { classification: "terminal", code: error.code, details: error.details };
    }
  }

  if (status === 429 || status === 408 || status === 425 || status >= 500) {
    return { classification: "retryable", code: error.code, details: error.details };
  }

  if (status >= 400) {
    return { classification: "terminal", code: error.code, details: error.details };
  }

  return { classification: "unknown", code: error.code, details: error.details };
}

/**
 * Network failures, timeouts, and non-JSON responses leave the provider outcome undetermined: the
 * message may have been accepted before the connection broke. Never auto-resend without review.
 */
export function undeterminedGraphFailure(details: string): GraphFailure {
  return {
    classification: "unknown",
    code: null,
    details: details.slice(0, 512),
  };
}

export function isRetryableGraphFailure(failure: GraphFailure): boolean {
  return failure.classification === "retryable";
}

function readGraphError(body: unknown): { code: number | null; details: string | null } {
  if (typeof body !== "object" || body === null) {
    return { code: null, details: null };
  }

  const error = (body as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) {
    return { code: null, details: null };
  }

  const rawCode = (error as { code?: unknown }).code;
  const code = typeof rawCode === "number" && Number.isSafeInteger(rawCode) ? rawCode : null;
  const errorData = (error as { error_data?: unknown }).error_data;
  const rawDetails = typeof errorData === "object" && errorData !== null
    ? (errorData as { details?: unknown }).details
    : undefined;
  const message = (error as { message?: unknown }).message;
  const details = typeof rawDetails === "string" && rawDetails.length > 0
    ? rawDetails
    : typeof message === "string" && message.length > 0
      ? message
      : null;

  return { code, details: details === null ? null : details.slice(0, 512) };
}
