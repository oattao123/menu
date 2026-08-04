import { supabase, isCloudEnabled, CLIENT_ID } from './supabase';

// Every record lives in its own row of `store_state`, keyed `<prefix>:<id>`.
// Writing one product no longer rewrites the whole product list, so two
// devices editing different records cannot overwrite each other.
export const TABLE = 'store_state';

export const PREFIX = {
  products: 'product',
  orders: 'order',
  cashTransactions: 'cash',
  employees: 'employee',
};

// Small ordered lists and the settings object stay as a single row each
export const SINGLE_KEYS = {
  categories: 'categories',
  sizes: 'sizes',
  settings: 'settings',
};

export const rowKey = (collection, id) => `${PREFIX[collection]}:${id}`;

const collectionOfKey = (key) => {
  const prefix = key.split(':')[0];
  return Object.keys(PREFIX).find((c) => PREFIX[c] === prefix);
};

export const loadEverything = async () => {
  const { data, error } = await supabase.from(TABLE).select('key, data');
  if (error) throw error;

  const result = {
    products: [],
    orders: [],
    cashTransactions: [],
    employees: [],
    categories: null,
    sizes: null,
    settings: null,
  };

  for (const row of data || []) {
    if (row.key === 'categories') result.categories = row.data;
    else if (row.key === 'sizes') result.sizes = row.data;
    else if (row.key === 'settings') result.settings = row.data;
    else {
      const collection = collectionOfKey(row.key);
      if (collection && row.data) result[collection].push(row.data);
    }
  }

  // Newest first, matching how the app renders these lists
  result.orders.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  result.cashTransactions.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  return result;
};

export const applyRealtimeRow = (key, data) => ({
  collection: key.includes(':') ? collectionOfKey(key) : null,
  singleKey: key.includes(':') ? null : key,
  data,
});

export const runOp = async (op) => {
  if (!isCloudEnabled) return;

  if (op.type === 'upsert') {
    const { error } = await supabase.from(TABLE).upsert(
      {
        key: op.key,
        data: op.data,
        client_id: CLIENT_ID,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    if (error) throw error;
    return;
  }

  if (op.type === 'delete') {
    const { error } = await supabase.from(TABLE).delete().eq('key', op.key);
    if (error) throw error;
  }
};
