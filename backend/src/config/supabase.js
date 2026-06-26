const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    WebSocket,
  },
};

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  options
);

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      WebSocket,
    },
  }
);

module.exports = { supabase, supabaseAdmin };