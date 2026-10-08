import { ApiError } from "@/lib/server/http/errors";

export interface OtpDeliveryConfig {
  endpoint?: string;
  bearerToken?: string;
  fetcher?: typeof fetch;
}

export interface OtpDeliveryProvider {
  readonly available: boolean;
  deliver(input: { email: string; code: string; locale: string }): Promise<void>;
}

export function createHttpOtpDeliveryProvider(config: OtpDeliveryConfig): OtpDeliveryProvider {
  const endpoint = normalizeEndpoint(config.endpoint);
  const bearerToken = config.bearerToken?.trim();
  const fetcher = config.fetcher ?? fetch;

  return {
    get available() {
      return endpoint !== null && Boolean(bearerToken);
    },
    async deliver(input) {
      if (!endpoint || !bearerToken) {
        throw unavailable();
      }

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new ApiError(503, "OTP_DELIVERY_UNAVAILABLE", "OTP delivery provider could not be reached", {
          retryable: true,
        });
      }

      if (!response.ok) {
        throw new ApiError(503, "OTP_DELIVERY_UNAVAILABLE", "OTP delivery provider did not accept the request", {
          retryable: true,
        });
      }
    },
  };
}

function normalizeEndpoint(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" || endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1"
      ? endpoint.toString()
      : null;
  } catch {
    return null;
  }
}

function unavailable(): ApiError {
  return new ApiError(503, "CAPABILITY_UNAVAILABLE", "OTP email delivery is not configured", {
    retryable: true,
  });
}
