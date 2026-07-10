-- =====================================================================
-- Demo seed data for Real Estate WhatsApp AI Prototype
-- Uses the default org id: 246ba2f2-7906-47ab-ac43-353dce20e8cc
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- 1) Demo Heights — Sector 150 — 3BHK — 1.65cr-2.1cr — 2027
INSERT INTO public.real_estate_projects
  (org_id, name, developer_name, city, sector, location, project_type, status, possession_date, description, amenities)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc',
  'Demo Heights', 'Demo Realty', 'Noida', 'Sector 150', 'Noida Sector 150',
  'residential', 'active', '2027-12-31',
  'Premium residential project near expressway and sports city.',
  ARRAY['clubhouse','parking','green area','security']
WHERE NOT EXISTS (
  SELECT 1 FROM public.real_estate_projects
  WHERE org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc' AND name = 'Demo Heights'
);

INSERT INTO public.real_estate_units
  (org_id, project_id, title, configuration, unit_type, super_area_sqft, price_min, price_max, possession_status, availability_status, description)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc', p.id,
  '3BHK in Demo Heights', '3BHK', 'apartment', 1650, 16500000, 21000000,
  'under_construction', 'available',
  'Good option for families looking near Sector 150.'
FROM public.real_estate_projects p
WHERE p.name = 'Demo Heights'
  AND p.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
  AND NOT EXISTS (
    SELECT 1 FROM public.real_estate_units u
    WHERE u.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
      AND u.project_id = p.id AND u.configuration = '3BHK'
  );

-- 2) ATS Knightsbridge — Sector 124 — 4BHK — 7.5cr-12cr — ready
INSERT INTO public.real_estate_projects
  (org_id, name, developer_name, city, sector, location, project_type, status, possession_date, description, amenities)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc',
  'ATS Knightsbridge', 'ATS', 'Noida', 'Sector 124', 'Noida Sector 124',
  'residential', 'active', NULL,
  'Luxury ready-to-move apartments in central Noida.',
  ARRAY['clubhouse','pool','gym','security','power_backup']
WHERE NOT EXISTS (
  SELECT 1 FROM public.real_estate_projects
  WHERE org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc' AND name = 'ATS Knightsbridge'
);

INSERT INTO public.real_estate_units
  (org_id, project_id, title, configuration, unit_type, super_area_sqft, price_min, price_max, possession_status, availability_status, description)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc', p.id,
  '4BHK in ATS Knightsbridge', '4BHK', 'apartment', 3200, 75000000, 120000000,
  'ready_to_move', 'available',
  'Spacious luxury 4BHK, ready to move in.'
FROM public.real_estate_projects p
WHERE p.name = 'ATS Knightsbridge'
  AND p.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
  AND NOT EXISTS (
    SELECT 1 FROM public.real_estate_units u
    WHERE u.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
      AND u.project_id = p.id AND u.configuration = '4BHK'
  );

-- 3) Godrej Tropical Isle — Sector 146 — 3BHK — 2.2cr-3.2cr — under construction
INSERT INTO public.real_estate_projects
  (org_id, name, developer_name, city, sector, location, project_type, status, possession_date, description, amenities)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc',
  'Godrej Tropical Isle', 'Godrej Properties', 'Noida', 'Sector 146', 'Noida Sector 146',
  'residential', 'active', '2028-06-30',
  'Tropical-themed premium apartments with lush landscaping.',
  ARRAY['clubhouse','pool','gym','sports_court','security']
WHERE NOT EXISTS (
  SELECT 1 FROM public.real_estate_projects
  WHERE org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc' AND name = 'Godrej Tropical Isle'
);

INSERT INTO public.real_estate_units
  (org_id, project_id, title, configuration, unit_type, super_area_sqft, price_min, price_max, possession_status, availability_status, description)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc', p.id,
  '3BHK in Godrej Tropical Isle', '3BHK', 'apartment', 1900, 22000000, 32000000,
  'under_construction', 'available',
  'Premium 3BHK with modern amenities.'
FROM public.real_estate_projects p
WHERE p.name = 'Godrej Tropical Isle'
  AND p.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
  AND NOT EXISTS (
    SELECT 1 FROM public.real_estate_units u
    WHERE u.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
      AND u.project_id = p.id AND u.configuration = '3BHK'
  );

-- 4) Central Noida Residency — Sector 76 — 2BHK — 95L-1.25cr — ready
INSERT INTO public.real_estate_projects
  (org_id, name, developer_name, city, sector, location, project_type, status, possession_date, description, amenities)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc',
  'Central Noida Residency', 'Demo Realty', 'Noida', 'Sector 76', 'Noida Sector 76',
  'residential', 'active', NULL,
  'Affordable ready-to-move homes in central Noida.',
  ARRAY['parking','security','green area']
WHERE NOT EXISTS (
  SELECT 1 FROM public.real_estate_projects
  WHERE org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc' AND name = 'Central Noida Residency'
);

INSERT INTO public.real_estate_units
  (org_id, project_id, title, configuration, unit_type, super_area_sqft, price_min, price_max, possession_status, availability_status, description)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc', p.id,
  '2BHK in Central Noida Residency', '2BHK', 'apartment', 1050, 9500000, 12500000,
  'ready_to_move', 'available',
  'Compact 2BHK, great for first-time buyers.'
FROM public.real_estate_projects p
WHERE p.name = 'Central Noida Residency'
  AND p.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
  AND NOT EXISTS (
    SELECT 1 FROM public.real_estate_units u
    WHERE u.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
      AND u.project_id = p.id AND u.configuration = '2BHK'
  );

-- 5) Luxury Greens Villa — Greater Noida West — Villa — 2.8cr-4cr — under construction
INSERT INTO public.real_estate_projects
  (org_id, name, developer_name, city, sector, location, project_type, status, possession_date, description, amenities)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc',
  'Luxury Greens Villa', 'Green Homes', 'Greater Noida West', 'Techzone 4', 'Greater Noida West Techzone 4',
  'residential', 'active', '2027-03-31',
  'Spacious independent villas with private gardens.',
  ARRAY['clubhouse','pool','gym','garden','security']
WHERE NOT EXISTS (
  SELECT 1 FROM public.real_estate_projects
  WHERE org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc' AND name = 'Luxury Greens Villa'
);

INSERT INTO public.real_estate_units
  (org_id, project_id, title, configuration, unit_type, super_area_sqft, price_min, price_max, possession_status, availability_status, description)
SELECT
  '246ba2f2-7906-47ab-ac43-353dce20e8cc', p.id,
  'Villa in Luxury Greens', '4BHK Villa', 'villa', 2800, 28000000, 40000000,
  'under_construction', 'available',
  'Independent 4BHK villa with private garden.'
FROM public.real_estate_projects p
WHERE p.name = 'Luxury Greens Villa'
  AND p.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
  AND NOT EXISTS (
    SELECT 1 FROM public.real_estate_units u
    WHERE u.org_id = '246ba2f2-7906-47ab-ac43-353dce20e8cc'
      AND u.project_id = p.id AND u.configuration = '4BHK Villa'
  );