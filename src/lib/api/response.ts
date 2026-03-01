import { NextResponse } from "next/server";

type ApiError = {
  code: string;
  message: string;
};

type ApiEnvelope<T> = {
  data: T | null;
  error: ApiError | null;
  meta: {
    requestId: string;
  };
};

export function apiSuccess<T>(data: T, requestId: string, status = 200) {
  const body: ApiEnvelope<T> = {
    data,
    error: null,
    meta: { requestId },
  };
  return NextResponse.json(body, { status });
}

export function apiError(error: ApiError, requestId: string, status = 400) {
  const body: ApiEnvelope<null> = {
    data: null,
    error,
    meta: { requestId },
  };
  return NextResponse.json(body, { status });
}
