-- Migration: create message_reactions table
-- This table stores emoji reactions on messages

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- هر کاربر فقط یک بار می‌تونه یک emoji خاص بده
  UNIQUE(message_id, user_id, emoji)
);

-- Index برای سرعت
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_created_at ON message_reactions(created_at);

-- RLS Policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all reactions in conversations they're part of
CREATE POLICY "Users can see reactions in their conversations"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
      AND m.id = message_reactions.message_id
    )
  );

-- Policy: Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
      AND m.id = message_reactions.message_id
    )
  );

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;


