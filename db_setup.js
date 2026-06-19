import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2',
  'ca-central-1', 'sa-east-1', 'me-central-1'
];

const ddlQueries = [
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_label TEXT,
    duration INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS experiences (
    id TEXT PRIMARY KEY DEFAULT 'exp_' || gen_random_uuid(),
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    date_range TEXT,
    category TEXT,
    description TEXT,
    budget_usd NUMERIC DEFAULT 0,
    details JSONB DEFAULT '[]'::jsonb,
    impact_metrics JSONB DEFAULT '{}'::jsonb,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );`
];

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error('Error loading .env file:', e);
  }
}

async function findActiveHost() {
  console.log('Testing regional connection poolers...');
  const prefixes = ['aws-1', 'aws-0'];
  for (const region of regions) {
    for (const prefix of prefixes) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      console.log(`Connecting to: ${host}`);
      const client = new Client({
        host,
        user: 'postgres.boquzwjvtuodzftrrcvq',
        password: 'amrsamirsite',
        database: 'postgres',
        port: 5432,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
      });
      try {
        await client.connect();
        await client.end();
        console.log(`\n\n🎉 SUCCESS! Active pooler host found: ${host}\n\n`);
        return host;
      } catch (err) {
        console.log(`- ${prefix}-${region} failed: ${err.message}`);
      }
    }
  }
  throw new Error('Could not resolve active pooler. Check credentials or password.');
}

async function setup() {
  const activeHost = await findActiveHost();
  
  console.log('Initializing connection to active host...');
  const client = new Client({
    host: activeHost,
    user: 'postgres.boquzwjvtuodzftrrcvq',
    password: 'amrsamirsite',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('Database connected. Executing SQL migrations...');

  for (const query of ddlQueries) {
    console.log('Running query:', query.substring(0, 45) + '...');
    await client.query(query);
  }

  await client.end();
  console.log('Database tables successfully created!');

  console.log('Initializing Supabase Storage Client...');
  const supabaseUrl = 'https://boquzwjvtuodzftrrcvq.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcXV6d2p2dHVvZHpmdHJyY3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg3NDY5OSwiZXhwIjoyMDk3NDUwNjk5fQ.Ezshlf0a638ltMh3ikk70a0mvdDuNKMkMvKskpKOQuc';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Verifying Storage buckets...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Failed to list buckets:', listError);
  } else {
    const assetsBucket = buckets.find(b => b.name === 'assets');
    if (!assetsBucket) {
      console.log('Creating "assets" public bucket...');
      const { error: createError } = await supabase.storage.createBucket('assets', { public: true });
      if (createError) {
        console.error('Bucket creation failed:', createError);
      } else {
        console.log('Bucket "assets" created successfully.');
      }
    } else {
      console.log('Bucket "assets" already exists.');
    }
  }

  // Load environment variables
  loadEnv();
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
  if (adminEmail) {
    console.log(`Checking if initial superadmin is already seeded for: ${adminEmail}`);
    const { data: existingContent, error: fetchError } = await supabase
      .from('site_content')
      .select('*')
      .eq('key', 'invited_admins')
      .single();
      
    let invites = [];
    if (!fetchError && existingContent && existingContent.value) {
      invites = existingContent.value;
    }
    
    const emailLower = adminEmail.trim().toLowerCase();
    const hasAdmin = invites.some(inv => inv.email.toLowerCase() === emailLower);
    
    if (!hasAdmin) {
      console.log(`Seeding initial superadmin in invited_admins: ${emailLower}`);
      invites.push({
        email: emailLower,
        role: 'superadmin',
        status: 'accepted',
        token: 'seeded'
      });
      const { error: seedError } = await supabase
        .from('site_content')
        .upsert({ key: 'invited_admins', value: invites }, { onConflict: 'key' });
        
      if (seedError) {
        console.error('Failed to seed initial admin:', seedError);
      } else {
        console.log('Initial admin seeded successfully!');
      }
    } else {
      console.log('Initial admin already exists in database.');
    }
  } else {
    console.log('No ADMIN_EMAIL or VITE_ADMIN_EMAIL found in environment. Skipping admin seeding.');
  }

  console.log('Database setup complete.');
}

setup().catch(console.error);
