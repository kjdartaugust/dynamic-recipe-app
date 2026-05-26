-- Meal Planner Schema
-- Stores weekly meal plans as JSONB for flexibility

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  meals JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own meal plans
CREATE POLICY "Users can manage their own meal plans"
  ON meal_plans
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.meal_plans TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_meal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meal_plans_updated_at ON meal_plans;
CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_plans_updated_at();
