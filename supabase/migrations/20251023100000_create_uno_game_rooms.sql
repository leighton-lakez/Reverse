-- Create UNO game rooms table for multiplayer functionality
CREATE TABLE IF NOT EXISTS uno_game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES profiles(id) NOT NULL,
  guest_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  current_turn uuid, -- player whose turn it is
  game_state jsonb NOT NULL DEFAULT '{}'::jsonb, -- stores entire game state
  winner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE uno_game_rooms ENABLE ROW LEVEL SECURITY;

-- Policies: Players can see games they're part of
CREATE POLICY "Users can view their own games"
  ON uno_game_rooms
  FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Policies: Host can create games
CREATE POLICY "Users can create games"
  ON uno_game_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Policies: Players can update games they're part of
CREATE POLICY "Players can update their games"
  ON uno_game_rooms
  FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Create index for faster lookups
CREATE INDEX idx_uno_game_rooms_room_code ON uno_game_rooms(room_code);
CREATE INDEX idx_uno_game_rooms_status ON uno_game_rooms(status);
CREATE INDEX idx_uno_game_rooms_host_id ON uno_game_rooms(host_id);
CREATE INDEX idx_uno_game_rooms_guest_id ON uno_game_rooms(guest_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uno_game_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_uno_game_rooms_updated_at
  BEFORE UPDATE ON uno_game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_uno_game_rooms_updated_at();
