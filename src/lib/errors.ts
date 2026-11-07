import { ZodError } from "zod";

// Only intentionally public application messages may cross an HTTP boundary.
export class PublicError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "PublicError";
  }
}
export function publicFailure(error: unknown): {
  error: string;
  status: number;
} {
  if (error instanceof PublicError)
    return { error: error.message, status: error.status };
  if (error instanceof ZodError)
    return { error: "Invalid input. Check the form fields.", status: 400 };
  return { error: "Request could not be completed", status: 400 };
}
