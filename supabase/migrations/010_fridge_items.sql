-- Fridge/Pantry Items Table
-- Track ingredients with expiry dates to reduce food waste

CREATE TABLE IF NOT EXISTS fridge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2),
  unit TEXT DEFAULT 'piece',
  expiry_date DATE,
  category TEXT DEFAULT 'other',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own fridge items
CREATE POLICY "Users can manage their own fridge items"
  ON fridge_items
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.fridge_items TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_fridge_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fridge_items_updated_at ON fridge_items;
CREATE TRIGGER fridge_items_updated_at
  BEFORE UPDATE ON fridge_items
  FOR EACH ROW
  EXECUTE FUNCTION update_fridge_items_updated_at();

-- Create index on expiry_date for performance
CREATE INDEX IF NOT EXISTS idx_fridge_items_expiry ON fridge_items(user_id, expiry_date);

SELECT 'Fridge items table created successfully' as status;
