require('dotenv').config();
const { pool } = require('./pool');

// Each step runs as its own query so FK dependencies are properly resolved
const steps = [
  // 1. Drop any existing conflicting tables (from prior schema)
  { name: 'Drop old tables (if any)',
    sql: `
      DROP TABLE IF EXISTS visits CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS urls CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `
  },

  // 2. pgcrypto for gen_random_uuid()
  { name: 'Enable pgcrypto extension',
    sql: `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` },

  // 3. Users
  { name: 'Create users table',
    sql: `
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name          VARCHAR(255),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
  },

  // 4. URLs
  { name: 'Create urls table',
    sql: `
      CREATE TABLE urls (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL,
        original_url TEXT NOT NULL,
        short_code   VARCHAR(20) UNIQUE NOT NULL,
        custom_alias VARCHAR(50) UNIQUE,
        title        VARCHAR(500),
        expires_at   TIMESTAMPTZ,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_urls_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `
  },

  // 5. Analytics
  { name: 'Create analytics table',
    sql: `
      CREATE TABLE analytics (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url_id      UUID NOT NULL,
        visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address  VARCHAR(45),
        user_agent  TEXT,
        referrer    TEXT,
        country     VARCHAR(100),
        city        VARCHAR(100),
        device_type VARCHAR(50),
        browser     VARCHAR(100),
        os          VARCHAR(100),
        CONSTRAINT fk_analytics_url FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
      )
    `
  },

  // 6. Indexes
  { name: 'Index: urls.user_id',          sql: `CREATE INDEX idx_urls_user_id       ON urls(user_id)` },
  { name: 'Index: urls.short_code',       sql: `CREATE INDEX idx_urls_short_code    ON urls(short_code)` },
  { name: 'Index: urls.custom_alias',     sql: `CREATE INDEX idx_urls_custom_alias  ON urls(custom_alias) WHERE custom_alias IS NOT NULL` },
  { name: 'Index: analytics.url_id',      sql: `CREATE INDEX idx_analytics_url_id   ON analytics(url_id)` },
  { name: 'Index: analytics.visited_at',  sql: `CREATE INDEX idx_analytics_visited  ON analytics(visited_at)` },
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...\n');
    for (const step of steps) {
      process.stdout.write(`  → ${step.name}... `);
      await client.query(step.sql);
      console.log('✅');
    }
    console.log('\n✅ All migrations completed successfully!');
    console.log('   Tables created: users, urls, analytics');
  } catch (err) {
    console.error(`\n❌ Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
