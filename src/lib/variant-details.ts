/** Parses `variant_details` strings like `"Color: Navy, Size: M"` from cart payloads. */
export function parseVariantAttributePairs(details: string | undefined) {
  if (!details?.trim()) {
    return [];
  }
  return details.split(",").map((raw) => {
    const part = raw.trim();
    const i = part.indexOf(":");
    if (i === -1) {
      return { label: "" as string, value: part };
    }
    return {
      label: part.slice(0, i).trim(),
      value: part.slice(i + 1).trim(),
    };
  });
}
