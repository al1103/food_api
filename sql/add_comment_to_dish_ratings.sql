-- Add comment column to dish_ratings table
ALTER TABLE dish_ratings 
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Add index for better performance on comment search
CREATE INDEX IF NOT EXISTS idx_dish_ratings_comment 
ON dish_ratings USING gin(to_tsvector('english', comment));

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_dish_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_dish_ratings_timestamp ON dish_ratings;
CREATE TRIGGER update_dish_ratings_timestamp 
  BEFORE UPDATE ON dish_ratings 
  FOR EACH ROW EXECUTE FUNCTION update_dish_ratings_timestamp();

-- Add some sample data with comments
INSERT INTO dish_ratings (dish_id, user_id, rating, comment, created_at, updated_at)
VALUES 
  (1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 5, 'Phở rất ngon, nước dùng đậm đà!', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  (2, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 4, 'Bún chả ngon nhưng hơi ít thịt', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (7, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 5, 'Cá kho tộ tuyệt vời!', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
  (13, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 4, 'Cà phê sữa đá ngon đúng chuẩn Việt Nam', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  (9, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 3, 'Gà nướng hơi khô, cần cải thiện', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (dish_id, user_id) DO NOTHING; 