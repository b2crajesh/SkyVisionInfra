UPDATE "Commission"
SET
  "percentage" = 20.00,
  "amount" = ROUND("baseAmount" * 0.20, 2),
  "tdsPercentage" = 5.00,
  "tdsAmount" = ROUND(ROUND("baseAmount" * 0.20, 2) * 0.05, 2),
  "netAmount" = ROUND("baseAmount" * 0.20, 2)
    - ROUND(ROUND("baseAmount" * 0.20, 2) * 0.05, 2)
WHERE "type" = 'JOINING';
