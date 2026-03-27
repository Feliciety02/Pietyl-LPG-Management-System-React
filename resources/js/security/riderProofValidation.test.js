import { describe, expect, it } from "vitest";
import {
  PROOF_IMAGE_MAX_BYTES,
  formatBytes,
  validateProofImageFile,
} from "@/security/riderProofValidation";

describe("rider proof validation", () => {
  it("formats byte values for UI messages", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("rejects unsupported proof image types", () => {
    const result = validateProofImageFile({
      type: "image/gif",
      size: 1024,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Use a JPG, PNG, or WebP image for proof of delivery.");
  });

  it("rejects proof images larger than the configured size limit", () => {
    const result = validateProofImageFile({
      type: "image/jpeg",
      size: PROOF_IMAGE_MAX_BYTES + 1,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Proof image is too large. Maximum size is 5.0 MB.");
  });

  it("accepts supported proof image types within the size limit", () => {
    const result = validateProofImageFile({
      type: "image/webp",
      size: PROOF_IMAGE_MAX_BYTES,
    });

    expect(result).toEqual({
      valid: true,
      error: "",
    });
  });
});
