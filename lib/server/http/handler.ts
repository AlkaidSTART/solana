import { createRequestContext } from "@/lib/server/http/request";
import { problem } from "@/lib/server/http/responses";
import type { RequestContext } from "@/lib/server/http/request";

export function withApiHandler<TArguments extends unknown[]>(
  handler: (request: Request, context: RequestContext, ...arguments_: TArguments) => Promise<Response>,
): (request: Request, ...arguments_: TArguments) => Promise<Response> {
  return async (request, ...arguments_) => {
    const context = createRequestContext(request);
    try {
      return await handler(request, context, ...arguments_);
    } catch (error) {
      return problem(context, error);
    }
  };
}
