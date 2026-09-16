# Fictional CloudMailin PDF test pack

These generated invoices contain no real personal, financial, or supplier data.
Each PDF is intentionally tiny so a single attachment plus email headers/body
stays comfortably below CloudMailin's 512 KB total-message limit.

- `01-line-item-single.pdf`: `SMITH-001` only in a product row; total $90.00.
- `02-po-reference.pdf`: `WILSON-002` in a PO/reference field; total $150.00.
- `03-two-product-lines.pdf`: `SMITH-001` and `WILSON-002` on separate rows;
  total $100.00 ($40.00/$60.00 suggested split).
- `04-no-job-code.pdf`: no job code; total $75.00.
- `05-duplicate-of-line-item.pdf`: byte-identical duplicate of invoice 1001.

Regenerate with `node scripts/generate-fictional-invoices.mjs`.
