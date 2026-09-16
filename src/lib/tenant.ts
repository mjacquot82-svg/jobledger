export function requireBusinessId(businessId: string | null | undefined) {
  if (!businessId) {
    throw new Error("business_id is required on every query");
  }
  return businessId;
}
