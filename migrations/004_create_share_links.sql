-- Create share_links table (legacy per-recipient links)
CREATE TABLE IF NOT EXISTS share_links (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_share_links_campaign_id ON share_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
