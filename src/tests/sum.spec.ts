// src/tests/sum.spec.ts
import { describe, expect, it } from "vitest";

import { sum } from "@/utils/sum.js";

describe("sum function", () => {
  it("should add two positive numbers correctly", () => {
    const result: number = sum(1, 2);
    expect(result).toBe(3);
  });
});
