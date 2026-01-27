-- 5S Assessments table
CREATE TABLE IF NOT EXISTS assessments_5s (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_name TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  scores JSONB NOT NULL,
  findings JSONB NOT NULL,
  recommendations TEXT[] DEFAULT '{}',
  overall_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assessments_5s ENABLE ROW LEVEL SECURITY;

-- Allow public access
CREATE POLICY "Allow all access to assessments_5s" ON assessments_5s FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE assessments_5s;

-- Create storage bucket for 5S images
-- Do this in Dashboard: Storage > New bucket > Name: "5s-images" > Public: Yes
