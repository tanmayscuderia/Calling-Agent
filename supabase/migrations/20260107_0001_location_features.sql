-- ─────────────────────────────────────────────────────────────
-- Location Features: GPS Coordinates + Location Aliases
-- Adds lat/lng/maps_url to property tables and creates
-- location_aliases table for synonym resolution (GK 2 = Greater Kailash 2)
-- ─────────────────────────────────────────────────────────────

-- 1. Add coordinates to real_estate_projects
ALTER TABLE public.real_estate_projects
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS maps_url text;

-- 2. Add coordinates to inventory_items (IF the table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    ALTER TABLE public.inventory_items
      ADD COLUMN IF NOT EXISTS latitude numeric,
      ADD COLUMN IF NOT EXISTS longitude numeric,
      ADD COLUMN IF NOT EXISTS maps_url text;
  END IF;
END $$;

-- 3. Location aliases table — per-org synonym resolution
CREATE TABLE IF NOT EXISTS public.location_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  scope text NOT NULL DEFAULT 'project'
    CHECK (scope IN ('project', 'city', 'sector', 'location', 'general')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_aliases_org
ON public.location_aliases(org_id);
CREATE INDEX IF NOT EXISTS idx_location_aliases_canonical
ON public.location_aliases(org_id, canonical_name);

-- 4. Seed common NCR + Mumbai + Bangalore aliases (org_id NULL = global/system-level)
INSERT INTO public.location_aliases (org_id, canonical_name, aliases, scope) VALUES
-- NCR Cities
(NULL, 'Gurugram', ARRAY['gurgaon', 'gurugram', 'gurgoan', 'gurugram city'], 'city'),
(NULL, 'Noida', ARRAY['noida', 'new okhla industrial development authority', 'gautam buddh nagar', 'gautam Buddh nagar'], 'city'),
(NULL, 'Greater Noida', ARRAY['greater noida', 'gr noida', 'greater noida city', 'greater noida west', 'noida extension', 'noida ext'], 'city'),
(NULL, 'Faridabad', ARRAY['faridabad', 'faridabaad'], 'city'),
(NULL, 'Ghaziabad', ARRAY['ghaziabad', 'ghaziabaad', 'gzb'], 'city'),
(NULL, 'Dwarka', ARRAY['dwarka', 'dwarka sub city'], 'city'),
(NULL, 'New Delhi', ARRAY['new delhi', 'delhi', 'central delhi', 'south delhi', 'north delhi', 'west delhi', 'east delhi'], 'city'),
-- NCR Sectors / Areas
(NULL, 'Greater Kailash 2', ARRAY['gk 2', 'gk2', 'gk ii', 'gk-2', 'greater kailash ii', 'greater kailash two'], 'sector'),
(NULL, 'Greater Kailash 1', ARRAY['gk 1', 'gk1', 'gk i', 'gk-1', 'greater kailash i', 'greater kailash one', 'gk'], 'sector'),
(NULL, 'Lajpat Nagar', ARRAY['lajpat nagar', 'lajpatnagar', 'lpn'], 'sector'),
(NULL, 'Vasant Kunj', ARRAY['vasant kunj', 'vasant kjun', 'vkunj'], 'sector'),
(NULL, 'Saket', ARRAY['saket', 'sakkt'], 'sector'),
(NULL, 'Sector 150', ARRAY['sector 150', 'sec 150', 'sector-150', 'sector150', 'noida sector 150', 'sec 150 noida'], 'sector'),
(NULL, 'Sector 146', ARRAY['sector 146', 'sec 146', 'sector-146', 'sector146', 'noida sector 146', 'sec 146 noida'], 'sector'),
(NULL, 'Sector 124', ARRAY['sector 124', 'sec 124', 'sector-124', 'sector124', 'noida sector 124', 'sec 124 noida'], 'sector'),
(NULL, 'Sector 76', ARRAY['sector 76', 'sec 76', 'sector-76', 'sector76', 'noida sector 76', 'sec 76 noida'], 'sector'),
(NULL, 'Sohna Road', ARRAY['sohna road', 'sohna rd', 'sohna'], 'sector'),
(NULL, 'MG Road', ARRAY['mg road', 'm g road', 'm.g. road', 'mahatma gandhi road', 'mg rd'], 'sector'),
(NULL, 'Golf Course Road', ARRAY['golf course road', 'golf course rd', 'golf course', 'gcr'], 'sector'),
(NULL, 'Cyber City', ARRAY['cyber city', 'dlf cyber city', 'dlf cybercity', 'cybercity'], 'sector'),
(NULL, 'Dwarka Expressway', ARRAY['dwarka expressway', 'dwarka expwy', 'northern peripheral road', 'npr', 'dwarka ew'], 'sector'),
(NULL, 'Yamuna Expressway', ARRAY['yamuna expressway', 'yamuna expwy', 'yamuna ew', 'yexp'], 'sector'),
-- Mumbai
(NULL, 'Mumbai', ARRAY['mumbai', 'bombay', 'mumbai city'], 'city'),
(NULL, 'Navi Mumbai', ARRAY['navi mumbai', 'new mumbai', 'navi bombay', 'vashi'], 'city'),
(NULL, 'Thane', ARRAY['thane', 'thana'], 'city'),
(NULL, 'Pune', ARRAY['pune', 'poona'], 'city'),
(NULL, 'Bandra West', ARRAY['bandra west', 'bandra w', 'bandra', 'bandra(w)'], 'sector'),
(NULL, 'Andheri West', ARRAY['andheri west', 'andheri w', 'andheri(w)', 'andheri'], 'sector'),
(NULL, 'Worli', ARRAY['worli', 'worly'], 'sector'),
(NULL, 'Lower Parel', ARRAY['lower parel', 'lowerparl'], 'sector'),
(NULL, 'Powai', ARRAY['powai', 'powayi'], 'sector'),
(NULL, 'Goregaon', ARRAY['goregaon', 'goregaon east', 'goregaon west'], 'sector'),
-- Bangalore
(NULL, 'Bengaluru', ARRAY['bengaluru', 'bangalore', 'bangaluru', 'bengalooru'], 'city'),
(NULL, 'Whitefield', ARRAY['whitefield', 'white field', 'whitefields'], 'sector'),
(NULL, 'Koramangala', ARRAY['koramangala', 'koramangla', 'koran'], 'sector'),
(NULL, 'Indiranagar', ARRAY['indiranagar', 'indira nagar', 'indiranagar 100 feet road'], 'sector'),
(NULL, 'Electronic City', ARRAY['electronic city', 'elec city', 'ecity', 'electronic city phase 1', 'electronic city phase 2'], 'sector'),
(NULL, 'HSR Layout', ARRAY['hsr layout', 'hsr', 'hsr layout sector 2', 'hsr layout sector 6'], 'sector'),
(NULL, 'Sarjapur Road', ARRAY['sarjapur road', 'sarjapur rd', 'sarjapur', 'sarjapura road'], 'sector'),
(NULL, 'Hebbal', ARRAY['hebbal', 'hebal'], 'sector'),
(NULL, 'Marathahalli', ARRAY['marathahalli', 'marathahalli', 'marthahalli', 'marathalli'], 'sector'),
(NULL, 'Devanahalli', ARRAY['devanahalli', 'devanahalli airport', 'kempegowda international airport area', 'bengaluru airport'], 'sector')
ON CONFLICT DO NOTHING;