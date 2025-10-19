-- Create profiles table to extend Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to instances table to associate instances with users
ALTER TABLE instances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_instances_user ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for instances
CREATE POLICY "Users can view their own instances" ON instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own instances" ON instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances" ON instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances" ON instances
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for ai_agents
CREATE POLICY "Users can view ai_agents of their instances" ON ai_agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = ai_agents.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ai_agents for their instances" ON ai_agents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = ai_agents.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ai_agents of their instances" ON ai_agents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = ai_agents.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ai_agents of their instances" ON ai_agents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = ai_agents.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

-- Create policies for conversations
CREATE POLICY "Users can view conversations of their instances" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = conversations.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations for their instances" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = conversations.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations of their instances" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = conversations.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete conversations of their instances" ON conversations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = conversations.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

-- Create policies for messages
CREATE POLICY "Users can view messages of their instances" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = messages.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their instances" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM instances 
      WHERE instances.id = messages.instance_id 
      AND instances.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
