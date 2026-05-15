-- Create campaign_copies table for multiple copy options
CREATE TABLE IF NOT EXISTS campaign_copies (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    label VARCHAR(100),
    copy_text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_copies_campaign_id ON campaign_copies(campaign_id);
