export const PROOF_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROOF_IMAGE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function validateProofImageFile(file) {
  if (!file) {
    return {
      valid: false,
      error: "No proof image selected.",
    };
  }

  if (!PROOF_IMAGE_ALLOWED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Use a JPG, PNG, or WebP image for proof of delivery.",
    };
  }

  if (file.size > PROOF_IMAGE_MAX_BYTES) {
    return {
      valid: false,
      error: `Proof image is too large. Maximum size is ${formatBytes(PROOF_IMAGE_MAX_BYTES)}.`,
    };
  }

  return {
    valid: true,
    error: "",
  };
}
