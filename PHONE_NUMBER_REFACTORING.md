# Refatoração: Sistema de Roteamento por Número de Telefone

## Resumo das Mudanças

Este documento descreve a refatoração do sistema de mensagens WhatsApp SaaS para usar o **número de telefone da instância** (`phone_number`) como identificador primário ao invés de `instance_id`.

## Motivação

- **Problema**: Múltiplas instâncias podem compartilhar o mesmo `instance_id` mas ter números de telefone diferentes
- **Solução**: Usar `phone_number` como identificador único e primário para roteamento de mensagens
- **Benefício**: Separação clara de mensagens por número de telefone conectado, melhor rastreabilidade

## Mudanças no Banco de Dados

### Script: `017_refactor_to_phone_number.sql`

1. **Índice único em `instances.phone_number`**
   - Garante que cada número de telefone seja único
   - Permite busca rápida por número

2. **Novos campos de cache**
   - `conversations.instance_phone_number` (TEXT)
   - `messages.instance_phone_number` (TEXT)
   - Armazenam o número de telefone para queries rápidas sem JOIN

3. **Função `find_instance_by_identifier()`**
   - Busca instância por: `phone_number` (prioridade 1), `whatsapp_instance_id` (prioridade 2), `name` (prioridade 3)
   - Mantém compatibilidade retroativa

4. **Trigger `auto_populate_message_ids()` atualizado**
   - Prioriza `instance_phone_number` sobre `instance_name`
   - Preenche automaticamente `instance_phone_number` em conversas e mensagens

5. **Função `insert_message_by_phone_number()`**
   - Nova função para inserir mensagens usando apenas o número de telefone
   - Simplifica integração com n8n

## Mudanças na API

### Webhook (`/api/webhook/messages`)

**Aceita múltiplos identificadores (ordem de prioridade):**
1. `instance_phone_number` (novo, prioridade máxima)
2. `phone_number`
3. `instance` (compatibilidade retroativa)
4. `instanceName`

**Exemplo de payload:**
\`\`\`json
{
  "instance_phone_number": "5511987654321",
  "Numero": "5511999999999@s.whatsapp.net",
  "Mensagem": "Olá!",
  "Direção": "RECEIVED",
  "nome_contato": "João"
}
\`\`\`

### API de Conversas (`/api/conversations`)

**Novos query parameters:**
- `?instance_id=<uuid>` - Filtrar por UUID da instância
- `?phone_number=<number>` - Filtrar por número de telefone da instância

**Exemplo:**
\`\`\`
GET /api/conversations?phone_number=5511987654321
\`\`\`

## Mudanças no Frontend

### InstanceSelector

- Mostra `phone_number` como label principal
- Mostra `name` como label secundário entre parênteses
- Exemplo: "5511987654321 (Atendimento Principal)"

### ConversationList

- Filtra conversas por `instance_id` via API
- Mostra `instance_phone_number` abaixo de cada conversa
- Formato: "via 5511987654321"

### ChatWindow

- Mantém compatibilidade com `instanceId`
- Usa `instance_phone_number` quando disponível

## Compatibilidade Retroativa

✅ **Mantida em todos os níveis:**

1. **Banco de Dados**
   - Triggers aceitam `instance_name` como fallback
   - Função `find_instance_by_identifier()` busca por múltiplos campos

2. **API**
   - Webhook aceita `instance`, `instanceName`, `phone_number`, `instance_phone_number`
   - Conversas podem ser filtradas por `instance_id` ou `phone_number`

3. **Frontend**
   - Componentes funcionam com ou sem `phone_number`
   - Fallback para `name` quando `phone_number` não disponível

## Fluxo de Mensagens (Novo)

### Mensagem Recebida (n8n → Sistema)

\`\`\`
1. n8n envia webhook com instance_phone_number
   ↓
2. API busca instância por phone_number
   ↓
3. Trigger cria/atualiza conversa com instance_phone_number
   ↓
4. Mensagem salva com instance_phone_number
   ↓
5. Frontend filtra conversas por phone_number
\`\`\`

### Mensagem Enviada (Sistema → n8n)

\`\`\`
1. Usuário envia mensagem no chat
   ↓
2. API salva mensagem com instance_phone_number
   ↓
3. Webhook enviado para n8n com dados da conversa
   ↓
4. n8n roteia mensagem pelo phone_number
\`\`\`

## Casos de Uso

### Caso 1: Múltiplas Instâncias, Mesmo Usuário

**Antes:**
- Instância A (ID: uuid-1, Nome: "Vendas")
- Instância B (ID: uuid-1, Nome: "Suporte") ❌ Conflito!

**Depois:**
- Instância A (ID: uuid-1, Phone: "5511987654321", Nome: "Vendas")
- Instância B (ID: uuid-2, Phone: "5511987654322", Nome: "Suporte") ✅ Separado!

### Caso 2: Roteamento de Mensagens

**Antes:**
\`\`\`json
{
  "instance": "Vendas"  // Ambíguo se houver múltiplas "Vendas"
}
\`\`\`

**Depois:**
\`\`\`json
{
  "instance_phone_number": "5511987654321"  // Único e específico
}
\`\`\`

## Migração de Dados Existentes

O script `017_refactor_to_phone_number.sql` atualiza automaticamente:

\`\`\`sql
-- Preenche instance_phone_number em conversas existentes
UPDATE conversations c
SET instance_phone_number = i.phone_number
FROM instances i
WHERE c.instance_id = i.id;

-- Preenche instance_phone_number em mensagens existentes
UPDATE messages m
SET instance_phone_number = i.phone_number
FROM instances i
WHERE m.instance_id = i.id;
\`\`\`

## Testes Recomendados

1. ✅ Criar instância com `phone_number`
2. ✅ Enviar mensagem via webhook com `instance_phone_number`
3. ✅ Verificar que conversa foi criada com `instance_phone_number`
4. ✅ Filtrar conversas por `phone_number` no frontend
5. ✅ Enviar mensagem do chat e verificar webhook
6. ✅ Testar compatibilidade retroativa com `instance_name`

## Próximos Passos (Opcional)

1. **WebSocket Events**: Adicionar `phone_number` aos eventos em tempo real
2. **Analytics**: Rastrear métricas por `phone_number`
3. **Rate Limiting**: Limitar requisições por `phone_number`
4. **Logs**: Incluir `phone_number` em todos os logs para debugging

## Conclusão

A refatoração foi concluída com sucesso mantendo 100% de compatibilidade retroativa. O sistema agora usa `phone_number` como identificador primário, proporcionando melhor separação de mensagens e rastreabilidade, enquanto ainda suporta os métodos antigos de identificação.
