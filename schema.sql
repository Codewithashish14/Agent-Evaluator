-- Create evaluation_settings table
CREATE TABLE IF NOT EXISTS evaluation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  run_policy TEXT CHECK (run_policy IN ('always', 'sampled')) DEFAULT 'sampled',
  sample_rate_prt INTEGER CHECK (sample_rate_prt >= 0 AND sample_rate_prt <= 100) DEFAULT 50,
  obfuscate_pii BOOLEAN DEFAULT true,
  max_eval_per_day INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  interaction_id TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  latency_ms INTEGER,
  flags TEXT[] DEFAULT '{}',
  pii_tokens_redacted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE evaluation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evaluation_settings
CREATE POLICY "Users can manage own settings" ON evaluation_settings
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for evaluations
CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations" ON evaluations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evaluations" ON evaluations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_created ON evaluations(user_id, created_at);