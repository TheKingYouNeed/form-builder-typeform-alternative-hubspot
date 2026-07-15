import { describe, expect, it } from "vitest";
import { normalizePlainAnswer } from "../src/heyform-port";

describe("ported HeyForm answer normalization", () => {
  it("normalizes scalar and yes/no answers", () => {
    expect(normalizePlainAnswer("short_text", "  Ada  ")).toBe("Ada");
    expect(normalizePlainAnswer("yes_no", true)).toBe("true");
    expect(normalizePlainAnswer("yes_no", "maybe")).toBeUndefined();
  });

  it("rejects choices that are not part of the form schema", () => {
    expect(normalizePlainAnswer("multiple_choice", "Sales", ["Sales", "Support"])).toBe("Sales");
    expect(normalizePlainAnswer("multiple_choice", "Injected", ["Sales", "Support"])).toBeUndefined();
  });
});
