export function getFinalPrice(p: { regularPrice: number; salePrice?: number | null }) {
  return p.salePrice != null ? p.salePrice : p.regularPrice;
}

export function getDiscountPercent(p: { regularPrice: number; salePrice?: number | null }) {
  if (p.salePrice == null) return 0;
  const off = Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100);
  return Math.max(0, off);
}
