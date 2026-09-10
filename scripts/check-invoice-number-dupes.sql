-- Run against Railway / staging BEFORE applying the partial unique index
-- invoices_business_supplier_number_idx (drizzle-kit push).
-- Must return 0 rows. Agent could not query DATABASE_URL in CI.
--
-- Duplicate groups under (business_id, supplier_id, invoice_number)
-- where both invoice_number and supplier_id are set:

SELECT
  business_id,
  supplier_id,
  invoice_number,
  COUNT(*) AS dup_count,
  ARRAY_AGG(id::text) AS invoice_ids
FROM invoices
WHERE invoice_number IS NOT NULL
  AND supplier_id IS NOT NULL
GROUP BY business_id, supplier_id, invoice_number
HAVING COUNT(*) > 1;
