type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { requestId: string };
};

export async function fetchApi<T>(
  input: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return payload;
}
