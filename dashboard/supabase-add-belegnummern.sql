-- ============================================================
-- Nautilus Portal: fortlaufende Belegnummern (atomar, pro Jahr)
-- Protokoll: NFD-2026-001, ...   Schadensbericht: NFS-2026-001, ...
-- Pro Jahr fortlaufend, zum Jahreswechsel wieder ab 001.
-- Durch das Jahr im Beleg ist jede Nummer eindeutig.
-- Einmal ausfuehren: Supabase -> SQL Editor -> Run
-- ============================================================

-- Zaehler-Tabelle: je Praefix und Jahr eine laufende Nummer
CREATE TABLE IF NOT EXISTS belegnummern (
  prefix TEXT NOT NULL,
  jahr   INT  NOT NULL,
  laufnr INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, jahr)
);

-- Direktzugriff sperren; nur die Funktion (SECURITY DEFINER) schreibt
ALTER TABLE belegnummern ENABLE ROW LEVEL SECURITY;

-- Atomar naechste Nummer holen und formatieren, z.B. NFD-2026-001
CREATE OR REPLACE FUNCTION next_beleg(p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y INT := EXTRACT(YEAR FROM now())::int;
  n INT;
BEGIN
  INSERT INTO belegnummern (prefix, jahr, laufnr)
  VALUES (p_prefix, y, 1)
  ON CONFLICT (prefix, jahr)
  DO UPDATE SET laufnr = belegnummern.laufnr + 1
  RETURNING laufnr INTO n;
  RETURN p_prefix || '-' || y::text || '-' || lpad(n::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_beleg(TEXT) TO authenticated;

-- Belegnummer je Dokument fest speichern
ALTER TABLE protokolle        ADD COLUMN IF NOT EXISTS nummer TEXT;
ALTER TABLE schadensmeldungen ADD COLUMN IF NOT EXISTS nummer TEXT;

-- Optional: Startwerte setzen, falls schon Belege existieren
-- INSERT INTO belegnummern (prefix, jahr, laufnr) VALUES ('NFD', 2026, 0), ('NFS', 2026, 0)
--   ON CONFLICT (prefix, jahr) DO NOTHING;
