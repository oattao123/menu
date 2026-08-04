import { supabase, isCloudEnabled } from './supabase';

// Each collection maps to a real table; rows are written individually so two
// devices editing different products never overwrite each other.
export const COLLECTIONS = {
  products: {
    table: 'products',
    idField: 'id',
    toRow: (p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category ?? null,
      price: Number(p.price) || 0,
      wholesale_price: Number(p.wholesalePrice) || 0,
      cost: Number(p.cost) || 0,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      stock_matrix: p.stockMatrix ?? {},
      svg_type: p.svgType ?? null,
      image_url: p.imageUrl || null,
      description: p.description ?? null,
      needs_cost_review: Boolean(p.needsCostReview),
    }),
    fromRow: (r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      price: Number(r.price),
      wholesalePrice: Number(r.wholesale_price),
      cost: Number(r.cost),
      sizes: r.sizes || [],
      colors: r.colors || [],
      stockMatrix: r.stock_matrix || {},
      svgType: r.svg_type,
      imageUrl: r.image_url || '',
      description: r.description || '',
      needsCostReview: r.needs_cost_review,
    }),
  },

  orders: {
    table: 'orders',
    idField: 'id',
    toRow: (o) => ({
      id: o.id,
      timestamp: o.timestamp ?? null,
      date_str: o.dateStr ?? null,
      items: o.items ?? [],
      subtotal: Number(o.subtotal) || 0,
      item_discount: Number(o.itemDiscount) || 0,
      discount: Number(o.discount) || 0,
      vat_amount: Number(o.vatAmount) || 0,
      grand_total: Number(o.grandTotal) || 0,
      payment_method: o.paymentMethod ?? null,
      received_amount: o.receivedAmount ?? null,
      change_amount: o.changeAmount ?? null,
      status: o.status || 'Completed',
      customer: o.customer ?? null,
    }),
    fromRow: (r) => ({
      id: r.id,
      timestamp: r.timestamp,
      dateStr: r.date_str,
      items: r.items || [],
      subtotal: Number(r.subtotal),
      itemDiscount: Number(r.item_discount),
      discount: Number(r.discount),
      vatAmount: Number(r.vat_amount),
      grandTotal: Number(r.grand_total),
      paymentMethod: r.payment_method,
      receivedAmount: r.received_amount === null ? undefined : Number(r.received_amount),
      changeAmount: r.change_amount === null ? undefined : Number(r.change_amount),
      status: r.status,
      customer: r.customer,
    }),
  },

  cashTransactions: {
    table: 'cash_transactions',
    idField: 'id',
    toRow: (t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount) || 0,
      category: t.category ?? null,
      payment_method: t.paymentMethod ?? null,
      date: t.date ?? null,
      timestamp: t.timestamp ?? null,
      reference_id: t.referenceId ?? null,
      note: t.note ?? null,
      is_auto: Boolean(t.isAuto),
    }),
    fromRow: (r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      category: r.category,
      paymentMethod: r.payment_method,
      date: r.date,
      timestamp: r.timestamp,
      referenceId: r.reference_id || '',
      note: r.note || '',
      isAuto: r.is_auto,
    }),
  },

  employees: {
    table: 'employees',
    idField: 'id',
    toRow: (e) => ({
      id: e.id,
      name: e.name,
      position: e.position ?? null,
      daily_wage: Number(e.dailyWage) || 0,
      start_date: e.startDate ?? null,
      wage_logs: e.wageLogs ?? [],
      total_advance: Number(e.totalAdvance) || 0,
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      dailyWage: Number(r.daily_wage),
      startDate: r.start_date,
      wageLogs: r.wage_logs || [],
      totalAdvance: Number(r.total_advance),
    }),
  },

  categories: {
    table: 'categories',
    idField: 'name',
    toRow: (name, index = 0) => ({ name, sort_order: index }),
    fromRow: (r) => r.name,
  },

  sizes: {
    table: 'sizes',
    idField: 'name',
    toRow: (name, index = 0) => ({ name, sort_order: index }),
    fromRow: (r) => r.name,
  },
};

export const loadEverything = async () => {
  const [products, orders, cash, employees, categories, sizes, settings] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('orders').select('*').order('timestamp', { ascending: false }),
    supabase.from('cash_transactions').select('*').order('timestamp', { ascending: false }),
    supabase.from('employees').select('*'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('sizes').select('*').order('sort_order'),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const firstError = [products, orders, cash, employees, categories, sizes, settings].find((r) => r.error);
  if (firstError) throw firstError.error;

  return {
    products: (products.data || []).map(COLLECTIONS.products.fromRow),
    orders: (orders.data || []).map(COLLECTIONS.orders.fromRow),
    cashTransactions: (cash.data || []).map(COLLECTIONS.cashTransactions.fromRow),
    employees: (employees.data || []).map(COLLECTIONS.employees.fromRow),
    categories: (categories.data || []).map(COLLECTIONS.categories.fromRow),
    sizes: (sizes.data || []).map(COLLECTIONS.sizes.fromRow),
    settings: settings.data ? settings.data.data : null,
  };
};

// One queued write. Ops are plain data so they survive a reload in localStorage.
export const runOp = async (op) => {
  if (!isCloudEnabled) return;

  if (op.type === 'upsert') {
    const { error } = await supabase.from(op.table).upsert(op.row, { onConflict: op.idField || 'id' });
    if (error) throw error;
    return;
  }

  if (op.type === 'delete') {
    const { error } = await supabase.from(op.table).delete().eq(op.idField || 'id', op.id);
    if (error) throw error;
    return;
  }

  if (op.type === 'replaceAll') {
    // Used for the small lookup tables (categories, sizes)
    const { error: delError } = await supabase.from(op.table).delete().neq(op.idField, '__none__');
    if (delError) throw delError;
    if (op.rows.length) {
      const { error } = await supabase.from(op.table).insert(op.rows);
      if (error) throw error;
    }
    return;
  }

  if (op.type === 'settings') {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, data: op.data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
  }
};
