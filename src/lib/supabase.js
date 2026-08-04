import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Without credentials the app keeps working exactly as before: local-only storage.
export const isCloudEnabled = Boolean(url && anonKey);

export const supabase = isCloudEnabled ? createClient(url, anonKey) : null;

// Identifies this browser tab so realtime echoes of our own writes can be ignored
export const CLIENT_ID =
  globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// One row per collection: { key, data (jsonb), client_id, updated_at }
export const STATE_TABLE = 'store_state';

export const fetchAllState = async () => {
  const { data, error } = await supabase.from(STATE_TABLE).select('key, data');
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.key, row.data]));
};

export const pushState = async (key, value) => {
  const { error } = await supabase.from(STATE_TABLE).upsert(
    {
      key,
      data: value,
      client_id: CLIENT_ID,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (error) throw error;
};
