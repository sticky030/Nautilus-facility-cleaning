-- ============================================================
-- Nautilus Portal: Objekt-Felder Groesse + Turnus ergaenzen
-- Einmal ausfuehren: Supabase -> SQL Editor -> Run
-- ============================================================

ALTER TABLE objekte ADD COLUMN IF NOT EXISTS groesse TEXT;
ALTER TABLE objekte ADD COLUMN IF NOT EXISTS turnus  TEXT;

-- Beispiel (optional): vorhandene Objekte befuellen
-- UPDATE objekte SET groesse = '320 m²', turnus = 'Di + Fr' WHERE name = 'Agentur Mitte';
