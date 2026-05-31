import { describe, expect, it } from "vitest";
import {
  BadRequestError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
} from "../shared/_core/errors";

describe("HttpError", () => {
  it("sets statusCode and message", () => {
    const err = new HttpError(418, "I'm a teapot");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("HttpError");
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
  });

  it("provides convenience constructors", () => {
    expect(BadRequestError("bad").statusCode).toBe(400);
    expect(UnauthorizedError("nope").statusCode).toBe(401);
    expect(ForbiddenError("stop").statusCode).toBe(403);
    expect(NotFoundError("missing").statusCode).toBe(404);
  });
});

