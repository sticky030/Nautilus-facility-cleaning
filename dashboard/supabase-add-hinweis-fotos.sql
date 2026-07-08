-- ============================================================
-- Nautilus Portal: Mehrere Fotos je Hinweis (Schadensmeldung)
-- Einmal ausfuehren: Supabase -> SQL Editor -> Run
-- ============================================================

ALTER TABLE schadensmeldungen ADD COLUMN IF NOT EXISTS foto_urls TEXT[];

-- Bestehende Einzelfotos in das neue Array uebernehmen
UPDATE schadensmeldungen
SET foto_urls = ARRAY[foto_url]
WHERE foto_url IS NOT NULL
  AND (foto_urls IS NULL OR array_length(foto_urls, 1) IS NULL);
