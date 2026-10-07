-- v2: the catalogue only contains 3D prints (on demand, no inventory) and overgrips.
-- Remove stock rows of discontinued imported products.
DELETE FROM inventory WHERE variant_sku NOT LIKE 'VP-GRP-%';
