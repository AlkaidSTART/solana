export type ApiRole = "Owner" | "Admin" | "Agent" | "Finance";

export type EvidenceStatus = "implemented" | "verified" | "unavailable";

export type OperationStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface ApiMeta {
  requestId: string;
  serverTime: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiProblem {
  error: {
    code: string;
    message: string;
    details?: unknown;
    retryable: boolean;
    requestId: string;
  };
}

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ListData<T> {
  items: T[];
  pageInfo: PageInfo;
}
