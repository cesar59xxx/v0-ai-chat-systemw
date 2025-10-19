-- Insert sample instances
INSERT INTO instances (name, phone_number, status) VALUES
  ('Atendimento Principal', '+55 11 98765-4321', 'disconnected'),
  ('Suporte Técnico', '+55 11 98765-4322', 'disconnected'),
  ('Vendas', '+55 11 98765-4323', 'disconnected')
ON CONFLICT DO NOTHING;

-- Insert sample AI agents for each instance
INSERT INTO ai_agents (instance_id, name, system_prompt, model, temperature)
SELECT 
  id,
  'Assistente ' || name,
  'Você é um assistente virtual prestativo e profissional. Responda de forma clara, objetiva e amigável. Sempre mantenha um tom cordial e ajude o cliente da melhor forma possível.',
  'openai/gpt-4o-mini',
  0.7
FROM instances
ON CONFLICT (instance_id) DO NOTHING;
