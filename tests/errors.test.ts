import { describe, it, expect } from "vitest";
import { z } from "zod";
import { PublicError, publicFailure } from "../src/lib/errors";
import { sumMoney, money } from "../src/lib/domain";
describe("safe HTTP error messages", () => {
  it.each([
    new Error("EACCES: permission denied, mkdir '/synthetic/private/path'"),
    new Error("SQLITE_CONSTRAINT synthetic private content"),
    new SyntaxError("malformed JSON containing synthetic private text"),
    new Error("synthetic-secret=never-return-this"),
    "untrusted thrown value",
  ])("suppresses unexpected internal details", (error) => {
    expect(publicFailure(error)).toEqual({
      error: "Request could not be completed",
      status: 400,
    });
  });
  it("keeps intentionally public messages and authentication status", () => {
    expect(publicFailure(new PublicError("Sign in required", 401))).toEqual({
      error: "Sign in required",
      status: 401,
    });
  });
  it("does not serialize Zod validation internals", () => {
    const result = z.string().min(8).safeParse("short");
    if (!result.success)
      expect(publicFailure(result.error)).toEqual({
        error: "Invalid input. Check the form fields.",
        status: 400,
      });
    else throw new Error("Invalid fixture");
  });
});
describe("aggregate arithmetic", () => {
  it("uses exact accumulation even with large intermediate cancellation", () => {
    expect(sumMoney([Number.MAX_SAFE_INTEGER, 1, -1])).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(sumMoney([29, 1, -30])).toBe(0);
    expect(money(-0)).toBe("$0.00");
  });
  it.each([
    [Number.MAX_SAFE_INTEGER, 1],
    [NaN],
    [1.5],
    [-Number.MAX_SAFE_INTEGER, -1],
  ])("rejects unsupported aggregate %j", (...values) =>
    expect(() => sumMoney(values)).toThrow(),
  );
});
