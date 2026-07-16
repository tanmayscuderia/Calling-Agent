-- ============================================================
-- Generic Inventory Items Table + Inventory Schema Config
-- Enables any industry to have inventory without a dedicated table.
-- Real estate keeps its specialized tables; all others use this.
-- ============================================================

-- 0. Ensure set_updated_at() function exists (defensive — defined in migration #1)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Generic inventory table for non-real-estate industries
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  description text,
  category text,
  sub_category text,
  price_min numeric,
  price_max numeric,
  currency text NOT NULL DEFAULT 'INR',
  location text,
  city text,
  area text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'sold_out', 'archived')),
  attributes jsonb NOT NULL DEFAULT '{}',
  media_urls text[] DEFAULT '{}',
  brochure_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.organization_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_org_id
  ON public.inventory_items(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category
  ON public.inventory_items(org_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status
  ON public.inventory_items(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location
  ON public.inventory_items(org_id, city, area);
CREATE INDEX IF NOT EXISTS idx_inventory_items_price
  ON public.inventory_items(org_id, price_min, price_max);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Add inventory_schema JSONB column to agent_configs
-- This drives UI labels, filters, CSV columns, and form fields per industry.
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS inventory_schema jsonb NOT NULL DEFAULT '{}';

-- 3. Update industry templates to include inventory_schema
-- Real Estate: points to real_estate_units (specialized UI)
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{inventory_schema}',
  '{
    "table": "real_estate_units",
    "item_label": "Property",
    "item_label_plural": "Properties",
    "display_fields": ["name", "location", "configuration", "price_range", "possession_status"],
    "csv_columns": ["project_name", "configuration", "price_min", "price_max", "city", "sector", "developer_name", "possession_status"],
    "filter_fields": [
      {"field": "city", "label": "City", "type": "select"},
      {"field": "configuration", "label": "Configuration", "type": "select"}
    ]
  }'::jsonb
)
WHERE industry = 'real_estate';

-- Automotive: generic inventory_items
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{inventory_schema}',
  '{
    "table": "inventory_items",
    "item_label": "Vehicle",
    "item_label_plural": "Vehicles",
    "display_fields": ["title", "subtitle", "price_range", "location", "category"],
    "csv_columns": ["title", "subtitle", "category", "price_min", "price_max", "location", "city", "description"],
    "filter_fields": [
      {"field": "category", "label": "Vehicle Type", "type": "select"},
      {"field": "price_max", "label": "Max Price", "type": "number"}
    ]
  }'::jsonb
)
WHERE industry = 'automotive';

-- Salon/Spa: generic inventory_items
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{inventory_schema}',
  '{
    "table": "inventory_items",
    "item_label": "Service",
    "item_label_plural": "Services",
    "display_fields": ["title", "subtitle", "price_range", "duration"],
    "csv_columns": ["title", "subtitle", "category", "price_min", "price_max", "description"],
    "filter_fields": [
      {"field": "category", "label": "Service Type", "type": "select"}
    ]
  }'::jsonb
)
WHERE industry = 'salon_spa';

-- Insurance: generic inventory_items
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{inventory_schema}',
  '{
    "table": "inventory_items",
    "item_label": "Plan",
    "item_label_plural": "Plans",
    "display_fields": ["title", "subtitle", "price_range", "category", "description"],
    "csv_columns": ["title", "subtitle", "category", "price_min", "price_max", "description"],
    "filter_fields": [
      {"field": "category", "label": "Policy Type", "type": "select"}
    ]
  }'::jsonb
)
WHERE industry = 'insurance';

-- Education: generic inventory_items
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{inventory_schema}',
  '{
    "table": "inventory_items",
    "item_label": "Course",
    "item_label_plural": "Courses",
    "display_fields": ["title", "subtitle", "price_range", "category", "description"],
    "csv_columns": ["title", "subtitle", "category", "price_min", "price_max", "location", "city", "description"],
    "filter_fields": [
      {"field": "category", "label": "Course Type", "type": "select"},
      {"field": "city", "label": "City", "type": "select"}
    ]
  }'::jsonb
)
WHERE industry = 'education';

-- 4. Update inventory_table references for templates that pointed to non-existent tables
-- Now they all use inventory_items (except real_estate)
UPDATE public.agent_templates
SET config = jsonb_set(config, '{inventory_table}', '"inventory_items"'::jsonb)
WHERE industry IN ('automotive', 'salon_spa', 'insurance', 'education');

-- Also update search_fields to use inventory_items columns
UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{search_fields}',
  '[
    {"field": "title", "operator": "ilike", "extract_key": "vehicle_type"},
    {"field": "price_min", "operator": "lte", "extract_key": "budget_max"}
  ]'::jsonb
)
WHERE industry = 'automotive';

UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{search_fields}',
  '[
    {"field": "title", "operator": "ilike", "extract_key": "service_type"}
  ]'::jsonb
)
WHERE industry = 'salon_spa';

UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{search_fields}',
  '[
    {"field": "title", "operator": "ilike", "extract_key": "policy_type"},
    {"field": "price_min", "operator": "lte", "extract_key": "budget_max"}
  ]'::jsonb
)
WHERE industry = 'insurance';

UPDATE public.agent_templates
SET config = jsonb_set(
  config,
  '{search_fields}',
  '[
    {"field": "title", "operator": "ilike", "extract_key": "course_type"},
    {"field": "price_min", "operator": "lte", "extract_key": "budget_max"}
  ]'::jsonb
)
WHERE industry = 'education';