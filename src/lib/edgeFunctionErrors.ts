import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Edge functions return JSON errors in the response body on non-2xx; `invoke` sets `error` and `data: null`.
 * Read `error` from the parsed body when present.
 */
export async function getEdgeFunctionErrorMessage<T>(
  result: { data: T | null; error: Error | null },
  fallback: string
): Promise<string> {
  const fromData =
    result.data &&
    typeof result.data === "object" &&
    result.data !== null &&
    "error" in result.data &&
    typeof (result.data as { error?: unknown }).error === "string"
      ? (result.data as { error: string }).error
      : null;
  if (fromData) return fromData;

  if (result.error instanceof FunctionsHttpError && result.error.context instanceof Response) {
    try {
      const body: unknown = await result.error.context.clone().json();
      if (
        body &&
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
      ) {
        return (body as { error: string }).error;
      }
    } catch {
      /* not JSON */
    }
  }

  if (
    result.error instanceof FunctionsFetchError ||
    /failed to send a request to the edge function/i.test(result.error?.message ?? "")
  ) {
    return "Could not reach server for registration. Please retry in a moment. If this keeps happening, confirm the edge function is deployed and reachable.";
  }

  return result.error?.message ?? fallback;
}
