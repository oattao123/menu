import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isCloudEnabled } from '../lib/supabase';
import { TABLE, SINGLE_KEYS, rowKey, loadEverything, runOp } from '../lib/db';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_STORE_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_CASH_TRANSACTIONS,
  CASH_CATEGORIES,
  CLOTHING_CATEGORIES,
  AVAILABLE_SIZES
} from '../data/initialData';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const local = localStorage.getItem('chic_store_products');
    if (!local) return INITIAL_PRODUCTS;
    // Products saved before wholesale pricing existed have no wholesalePrice
    return JSON.parse(local).map((p) => ({
      ...p,
      wholesalePrice: p.wholesalePrice ?? Math.round((p.cost + p.price) / 2),
    }));
  });

  const [orders, setOrders] = useState(() => {
    const local = localStorage.getItem('chic_store_orders');
    return local ? JSON.parse(local) : INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState(() => {
    const local = localStorage.getItem('chic_store_settings');
    return local ? JSON.parse(local) : INITIAL_STORE_SETTINGS;
  });

  const [employees, setEmployees] = useState(() => {
    const local = localStorage.getItem('chic_store_employees');
    return local ? JSON.parse(local) : INITIAL_EMPLOYEES;
  });

  const [cashTransactions, setCashTransactions] = useState(() => {
    const local = localStorage.getItem('chic_store_cash_transactions');
    return local ? JSON.parse(local) : INITIAL_CASH_TRANSACTIONS;
  });

  // Categories: first entry is always the "ทั้งหมด" filter option
  const [categories, setCategories] = useState(() => {
    const local = localStorage.getItem('chic_store_categories');
    return local ? JSON.parse(local) : CLOTHING_CATEGORIES;
  });

  const [sizes, setSizes] = useState(() => {
    const local = localStorage.getItem('chic_store_sizes');
    return local ? JSON.parse(local) : AVAILABLE_SIZES;
  });

  // Active role: 'owner' (full access) or 'staff' (front-counter only).
  // A fresh device opens in staff mode — the owner unlocks with the PIN.
  const [role, setRole] = useState(() => localStorage.getItem('chic_store_role') || 'staff');
  const isStaff = role === 'staff';

  // ==========================================
  // Cloud sync (Supabase) — one row per record, written individually.
  // Without credentials everything below is skipped and the app stays local-only.
  // ==========================================

  const [cloudStatus, setCloudStatus] = useState(isCloudEnabled ? 'connecting' : 'offline');
  // True until the first successful load, so the UI never shows this browser's
  // cache as if it were current shop data.
  const [isHydrating, setIsHydrating] = useState(isCloudEnabled);
  const [cloudError, setCloudError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const hydratedRef = useRef(false);
  const flushingRef = useRef(false);

  // Writes waiting to reach the database, keyed by row so repeated edits to the
  // same record collapse into a single write. Persisted so a reload keeps them.
  const queueRef = useRef(
    new Map(JSON.parse(localStorage.getItem('chic_store_op_queue') || '[]'))
  );

  const persistQueue = () => {
    localStorage.setItem('chic_store_op_queue', JSON.stringify([...queueRef.current]));
    setPendingCount(queueRef.current.size);
  };

  const flushQueue = async () => {
    if (!isCloudEnabled || !hydratedRef.current || flushingRef.current) return;
    if (queueRef.current.size === 0) return;

    flushingRef.current = true;
    try {
      for (const [key, op] of [...queueRef.current]) {
        try {
          await runOp(op);
          // Only drop it if no newer write for the same row arrived meanwhile
          if (queueRef.current.get(key) === op) queueRef.current.delete(key);
        } catch (err) {
          setCloudStatus('error');
          setCloudError(err?.message || 'บันทึกขึ้นฐานข้อมูลไม่สำเร็จ (จะลองส่งใหม่อัตโนมัติ)');
          return; // leave the rest queued for the retry timer
        }
      }
      setCloudStatus('synced');
      setCloudError('');
    } finally {
      flushingRef.current = false;
      persistQueue();
    }
  };

  const queueOp = (op) => {
    if (!isCloudEnabled) return;
    queueRef.current.set(`${op.type}:${op.key}`, op);
    persistQueue();
    flushQueue();
  };

  // Write helpers used by the actions below — each writes a single record
  const saveRow = (collection, obj) =>
    queueOp({ type: 'upsert', key: rowKey(collection, obj.id), data: obj });
  const saveRows = (collection, list) => list.forEach((obj) => saveRow(collection, obj));
  const deleteRow = (collection, id) => queueOp({ type: 'delete', key: rowKey(collection, id) });
  // Short ordered lists stay as one row each
  const saveList = (name, list) => queueOp({ type: 'upsert', key: SINGLE_KEYS[name], data: list });
  const saveSettings = (data) => queueOp({ type: 'upsert', key: 'settings', data });

  // Apply a row that arrived from another device
  const mergeRemoteRow = (setter, row, idField = 'id') => {
    setter((prev) => {
      const idx = prev.findIndex((x) => x[idField] === row[idField]);
      if (idx === -1) return [row, ...prev];
      const next = [...prev];
      next[idx] = row;
      return next;
    });
  };

  const removeRemoteRow = (setter, id, idField = 'id') =>
    setter((prev) => prev.filter((x) => x[idField] !== id));

  // Initial load (with retry) + realtime subscriptions
  useEffect(() => {
    if (!isCloudEnabled) return;
    let channel;
    let cancelled = false;
    let retryTimer;

    const connect = async () => {
      if (cancelled || hydratedRef.current) return;
      try {
        const remote = await loadEverything();
        if (cancelled) return;

        const databaseIsEmpty =
          !remote.settings &&
          remote.products.length === 0 &&
          remote.orders.length === 0 &&
          remote.employees.length === 0 &&
          remote.cashTransactions.length === 0 &&
          !remote.categories &&
          !remote.sizes;

        if (databaseIsEmpty) {
          // Brand new database: seed it from whatever this device has
          saveRows('products', products);
          saveRows('orders', orders);
          saveRows('cashTransactions', cashTransactions);
          saveRows('employees', employees);
          saveList('categories', categories);
          saveList('sizes', sizes);
          saveSettings(settings);
        } else {
          setProducts(remote.products);
          setOrders(remote.orders);
          setCashTransactions(remote.cashTransactions);
          setEmployees(remote.employees);
          if (remote.categories) setCategories(remote.categories);
          if (remote.sizes) setSizes(remote.sizes);
          if (remote.settings) setSettings(remote.settings);
        }

        hydratedRef.current = true;
        setIsHydrating(false);
        setCloudStatus('synced');
        setCloudError('');
        // Anything queued while offline is written on top of the loaded data
        flushQueue();

        const setterFor = {
          product: setProducts,
          order: setOrders,
          cash: setCashTransactions,
          employee: setEmployees,
        };

        channel = supabase
          .channel('shop_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
            const key = payload.new?.key ?? payload.old?.key;
            if (!key) return;

            if (key === 'categories') return setCategories(payload.new?.data || []);
            if (key === 'sizes') return setSizes(payload.new?.data || []);
            if (key === 'settings') return payload.new?.data && setSettings(payload.new.data);

            const [prefix, id] = key.split(':');
            const setter = setterFor[prefix];
            if (!setter || !id) return;

            if (payload.eventType === 'DELETE') removeRemoteRow(setter, id);
            else if (payload.new?.data) mergeRemoteRow(setter, payload.new.data);
          })
          .subscribe();
      } catch (err) {
        if (cancelled) return;
        // An unreachable database must not block the counter — fall back to the
        // local cache, keep queueing writes, and retry in the background.
        setIsHydrating(false);
        setCloudStatus('error');
        setCloudError(err?.message || 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ (จะลองใหม่อัตโนมัติ)');
        retryTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    window.addEventListener('online', connect);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      window.removeEventListener('online', connect);
      if (channel) supabase.removeChannel(channel);
    };
    // Runs once; retries and reconnects are handled inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry queued writes on a timer and as soon as the network returns
  useEffect(() => {
    if (!isCloudEnabled) return;
    const timer = setInterval(() => {
      if (queueRef.current.size > 0) flushQueue();
    }, 5000);
    const onOnline = () => flushQueue();
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before closing the tab while writes have not reached the database
  useEffect(() => {
    if (!isCloudEnabled || pendingCount === 0) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pendingCount]);

  // Sync to LocalStorage (kept as an offline cache even when the cloud is on)
  useEffect(() => {
    localStorage.setItem('chic_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('chic_store_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chic_store_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chic_store_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('chic_store_cash_transactions', JSON.stringify(cashTransactions));
  }, [cashTransactions]);

  useEffect(() => {
    localStorage.setItem('chic_store_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('chic_store_sizes', JSON.stringify(sizes));
  }, [sizes]);

  useEffect(() => {
    localStorage.setItem('chic_store_role', role);
  }, [role]);

  // Role Actions — staff mode is a soft lock for day-to-day use, not real security
  const enterStaffMode = () => setRole('staff');

  const exitStaffMode = (pin) => {
    const expected = String(settings.staffPin || '1234');
    if (String(pin || '').trim() !== expected) {
      return { success: false, error: 'PIN ไม่ถูกต้อง' };
    }
    setRole('owner');
    return { success: true };
  };

  // Category & Size Actions
  const addCategory = (name) => {
    const clean = (name || '').trim();
    if (!clean) return { success: false, error: 'กรุณากรอกชื่อหมวดหมู่' };
    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      return { success: false, error: 'มีหมวดหมู่นี้อยู่แล้ว' };
    }
    const next = [...categories, clean];
    setCategories(next);
    saveList('categories', next);
    return { success: true, value: clean };
  };

  const deleteCategory = (name) => {
    if (name === 'ทั้งหมด') return { success: false, error: 'ลบหมวดหมู่นี้ไม่ได้' };
    if (products.some((p) => p.category === name)) {
      return { success: false, error: 'ยังมีสินค้าอยู่ในหมวดหมู่นี้' };
    }
    const next = categories.filter((c) => c !== name);
    setCategories(next);
    saveList('categories', next);
    return { success: true };
  };

  const addSize = (name) => {
    const clean = (name || '').trim().toUpperCase();
    if (!clean) return { success: false, error: 'กรุณากรอกชื่อไซส์' };
    if (sizes.some((s) => s.toUpperCase() === clean)) {
      return { success: false, error: 'มีไซส์นี้อยู่แล้ว' };
    }
    const next = [...sizes, clean];
    setSizes(next);
    saveList('sizes', next);
    return { success: true, value: clean };
  };

  const deleteSize = (name) => {
    if (products.some((p) => (p.sizes || []).includes(name))) {
      return { success: false, error: 'ยังมีสินค้าที่ใช้ไซส์นี้อยู่' };
    }
    const next = sizes.filter((s) => s !== name);
    setSizes(next);
    saveList('sizes', next);
    return { success: true };
  };

  // Product Actions

  // Next running SKU (CLO-0001, CLO-0002, ...) that no existing product uses
  const generateSku = () => {
    const used = new Set(products.map((p) => p.sku));
    const highest = products.reduce((max, p) => {
      const match = /^CLO-(\d+)$/.exec(p.sku || '');
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    let next = highest + 1;
    let candidate = `CLO-${String(next).padStart(4, '0')}`;
    while (used.has(candidate)) {
      next += 1;
      candidate = `CLO-${String(next).padStart(4, '0')}`;
    }
    return candidate;
  };

  const addProduct = (newProd) => {
    const prodId = 'prod-' + Date.now();
    const productWithId = {
      ...newProd,
      id: prodId,
      sku: newProd.sku || generateSku(),
    };
    setProducts((prev) => [productWithId, ...prev]);
    saveRow('products', productWithId);
    return productWithId;
  };

  const updateProduct = (id, updatedFields) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    setProducts(updated);
    const row = updated.find((p) => p.id === id);
    if (row) saveRow('products', row);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteRow('products', id);
  };

  const updateStockVariant = (productId, size, colorName, newQty) => {
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== productId) return p;
        const key = `${size}-${colorName}`;
        return { ...p, stockMatrix: { ...p.stockMatrix, [key]: Math.max(0, newQty) } };
      });
      const changed = next.find((p) => p.id === productId);
      if (changed) saveRow('products', changed);
      return next;
    });
  };

  // Cash Ledger Actions
  const addCashTransaction = (txData) => {
    const now = new Date();
    const dateStr = txData.date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newTx = {
      id: 'tx-' + Date.now(),
      type: txData.type || 'in', // 'in' or 'out'
      amount: parseFloat(txData.amount) || 0,
      category: txData.category || (txData.type === 'out' ? 'ค่าใช้จ่ายอื่นๆ' : 'รายได้อื่นๆ'),
      paymentMethod: txData.paymentMethod || 'Cash',
      date: dateStr,
      timestamp: txData.timestamp || timeStr,
      referenceId: txData.referenceId || '',
      note: txData.note || '',
      isAuto: !!txData.isAuto,
    };

    setCashTransactions((prev) => [newTx, ...prev]);
    saveRow('cashTransactions', newTx);
    return newTx;
  };

  const updateCashTransaction = (id, fields) => {
    const next = cashTransactions.map((tx) =>
      tx.id === id ? { ...tx, ...fields, amount: parseFloat(fields.amount ?? tx.amount) } : tx
    );
    setCashTransactions(next);
    const row = next.find((tx) => tx.id === id);
    if (row) saveRow('cashTransactions', row);
  };

  const deleteCashTransaction = (id) => {
    setCashTransactions((prev) => prev.filter((tx) => tx.id !== id));
    deleteRow('cashTransactions', id);
  };

  // Order Actions & Stock Deduction
  const createOrder = (orderData) => {
    const now = new Date();
    const orderId = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;
    
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newOrder = {
      id: orderId,
      timestamp: timeStr,
      dateStr: dateStr,
      ...orderData,
      status: 'Completed',
    };

    // Deduct Stock for sold items
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        let updatedMatrix = { ...product.stockMatrix };
        let modified = false;

        orderData.items.forEach((item) => {
          if (item.productId === product.id) {
            const variantKey = `${item.size}-${item.color}`;
            const currentStock = updatedMatrix[variantKey] || 0;
            updatedMatrix[variantKey] = Math.max(0, currentStock - item.qty);
            modified = true;
          }
        });

        if (modified) {
          const updatedProduct = { ...product, stockMatrix: updatedMatrix };
          saveRow('products', updatedProduct);
          return updatedProduct;
        }
        return product;
      })
    );

    // Record Order
    setOrders((prev) => [newOrder, ...prev]);
    saveRow('orders', newOrder);

    // Automatically record Income Cash Transaction
    const autoIncomeTx = {
      id: 'tx-' + Date.now(),
      type: 'in',
      amount: newOrder.grandTotal,
      category: 'รายรับขายหน้าร้าน (POS)',
      paymentMethod: newOrder.paymentMethod || 'Cash',
      date: dateStr,
      timestamp: timeStr,
      referenceId: orderId,
      note: `ขายสินค้า ${orderId} (${newOrder.paymentMethod || 'Cash'})`,
      isAuto: true,
    };
    setCashTransactions((prev) => [autoIncomeTx, ...prev]);
    saveRow('cashTransactions', autoIncomeTx);

    return newOrder;
  };

  const refundOrder = (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'Refunded') return;

    // Restore stock
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        let updatedMatrix = { ...product.stockMatrix };
        let modified = false;

        targetOrder.items.forEach((item) => {
          if (item.productId === product.id) {
            const variantKey = `${item.size}-${item.color}`;
            const currentStock = updatedMatrix[variantKey] || 0;
            updatedMatrix[variantKey] = currentStock + item.qty;
            modified = true;
          }
        });

        if (modified) {
          const restored = { ...product, stockMatrix: updatedMatrix };
          saveRow('products', restored);
          return restored;
        }
        return product;
      })
    );

    // Mark as refunded
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Refunded' } : o)));
    saveRow('orders', { ...targetOrder, status: 'Refunded' });

    // Automatically record Expense Cash Transaction for refund
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const autoRefundTx = {
      id: 'tx-' + Date.now(),
      type: 'out',
      amount: targetOrder.grandTotal,
      category: 'คืนเงินสินค้าลูกค้า',
      paymentMethod: targetOrder.paymentMethod || 'Cash',
      date: dateStr,
      timestamp: timeStr,
      referenceId: targetOrder.id,
      note: `คืนเงินสินค้า ${targetOrder.id}`,
      isAuto: true,
    };
    setCashTransactions((prev) => [autoRefundTx, ...prev]);
    saveRow('cashTransactions', autoRefundTx);
  };

  // Delete an order from history along with the cash entries it generated.
  // Stock is not restored — use refundOrder for goods that actually came back.
  const deleteOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteRow('orders', orderId);
    cashTransactions
      .filter((tx) => tx.isAuto && tx.referenceId === orderId)
      .forEach((tx) => deleteRow('cashTransactions', tx.id));
    setCashTransactions((prev) => prev.filter((tx) => !(tx.isAuto && tx.referenceId === orderId)));
  };

  const clearOrderHistory = () => {
    const orderIds = new Set(orders.map((o) => o.id));
    orders.forEach((o) => deleteRow('orders', o.id));
    cashTransactions
      .filter((tx) => tx.isAuto && orderIds.has(tx.referenceId))
      .forEach((tx) => deleteRow('cashTransactions', tx.id));
    setOrders([]);
    setCashTransactions((prev) => prev.filter((tx) => !(tx.isAuto && orderIds.has(tx.referenceId))));
  };

  // Settings Action
  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveSettings(merged);
  };

  // ==========================================
  // Employee & Payroll Actions
  // ==========================================

  const addEmployee = (empData) => {
    const newEmp = {
      id: 'emp-' + Date.now(),
      name: empData.name,
      position: empData.position || 'พนักงาน',
      dailyWage: parseFloat(empData.dailyWage) || 0,
      startDate: empData.startDate || new Date().toISOString().slice(0, 10),
      wageLogs: [],   // { id, date, type: 'work'|'deduct'|'advance', amount, note }
      totalAdvance: 0,
    };
    setEmployees((prev) => [newEmp, ...prev]);
    saveRow('employees', newEmp);
    return newEmp;
  };

  const updateEmployee = (id, fields) => {
    const next = employees.map((e) => (e.id === id ? { ...e, ...fields } : e));
    setEmployees(next);
    const row = next.find((e) => e.id === id);
    if (row) saveRow('employees', row);
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    deleteRow('employees', id);
  };

  // Add a wage log entry (type: 'work' = บวกวัน, 'deduct' = หักวัน, 'advance' = เบิก)
  const addWageLog = (empId, logData) => {
    const logEntry = {
      id: 'log-' + Date.now(),
      date: logData.date || new Date().toISOString().slice(0, 10),
      type: logData.type, // 'work' | 'deduct' | 'advance'
      amount: parseFloat(logData.amount) || 0,
      note: logData.note || '',
    };
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== empId) return e;
        const updatedLogs = [logEntry, ...e.wageLogs];
        const totalAdvance = updatedLogs
          .filter((l) => l.type === 'advance')
          .reduce((acc, l) => acc + l.amount, 0);
        const updatedEmp = { ...e, wageLogs: updatedLogs, totalAdvance };
        saveRow('employees', updatedEmp);
        return updatedEmp;
      })
    );

    // Auto record cash outflow if employee advances money
    if (logData.type === 'advance') {
      const emp = employees.find((e) => e.id === empId);
      const now = new Date();
      const timeStr = `${logData.date || now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const advanceTx = {
        id: 'tx-' + Date.now(),
        type: 'out',
        amount: parseFloat(logData.amount) || 0,
        category: 'ค่าแรงและเงินเบิกพนักงาน',
        paymentMethod: 'Cash',
        date: logData.date || new Date().toISOString().slice(0, 10),
        timestamp: timeStr,
        referenceId: logEntry.id,
        note: `${emp ? emp.name : 'พนักงาน'} - เบิกเงินล่วงหน้า ${logData.note ? '(' + logData.note + ')' : ''}`,
        isAuto: true,
      };
      setCashTransactions((prev) => [advanceTx, ...prev]);
      saveRow('cashTransactions', advanceTx);
    }
  };

  const removeWageLog = (empId, logId) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== empId) return e;
        const updatedLogs = e.wageLogs.filter((l) => l.id !== logId);
        const totalAdvance = updatedLogs
          .filter((l) => l.type === 'advance')
          .reduce((acc, l) => acc + l.amount, 0);
        const updatedEmp = { ...e, wageLogs: updatedLogs, totalAdvance };
        saveRow('employees', updatedEmp);
        return updatedEmp;
      })
    );
  };

  // Calculate payroll summary for a single employee within a date range
  const calcEmployeePayroll = (emp, fromDate, toDate) => {
    if (!emp) return { workDays: 0, deductDays: 0, netDays: 0, grossPay: 0, advances: 0, netPay: 0, logs: [] };
    const logs = (emp.wageLogs || []).filter((l) => {
      if (!fromDate && !toDate) return true;
      const d = l.date;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });

    const workDays = logs.filter((l) => l.type === 'work').reduce((a, l) => a + (parseFloat(l.amount) || 0), 0);
    const deductDays = logs.filter((l) => l.type === 'deduct').reduce((a, l) => a + (parseFloat(l.amount) || 0), 0);
    const advances = logs.filter((l) => l.type === 'advance').reduce((a, l) => a + (parseFloat(l.amount) || 0), 0);
    const netDays = workDays - deductDays;
    const grossPay = netDays * (parseFloat(emp.dailyWage) || 0);
    const netPay = grossPay - advances;
    return { workDays, deductDays, netDays, grossPay, advances, netPay, logs };
  };

  // Add batch work days for employees
  const addBatchWorkDays = (empIds, daysCount, logDate, note = 'ลงเวลาทำงาน') => {
    const timestamp = Date.now();
    setEmployees((prev) =>
      prev.map((e) => {
        if (empIds !== 'all' && !empIds.includes(e.id)) return e;
        const newLog = {
          id: `log-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          date: logDate || new Date().toISOString().slice(0, 10),
          type: 'work',
          amount: parseFloat(daysCount) || 1,
          note: note,
        };
        const updatedEmp = { ...e, wageLogs: [newLog, ...(e.wageLogs || [])] };
        saveRow('employees', updatedEmp);
        return updatedEmp;
      })
    );
  };


  // Reset to default seed data
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setSettings(INITIAL_STORE_SETTINGS);
    setEmployees(INITIAL_EMPLOYEES);
    setCashTransactions(INITIAL_CASH_TRANSACTIONS);
    setCategories(CLOTHING_CATEGORIES);
    setSizes(AVAILABLE_SIZES);
    localStorage.clear();

    // Replace the database contents too, otherwise the next load brings it back
    products.forEach((p) => deleteRow('products', p.id));
    orders.forEach((o) => deleteRow('orders', o.id));
    cashTransactions.forEach((t) => deleteRow('cashTransactions', t.id));
    employees.forEach((e) => deleteRow('employees', e.id));
    saveRows('products', INITIAL_PRODUCTS);
    saveRows('orders', INITIAL_ORDERS);
    saveRows('cashTransactions', INITIAL_CASH_TRANSACTIONS);
    saveRows('employees', INITIAL_EMPLOYEES);
    saveList('categories', CLOTHING_CATEGORIES);
    saveList('sizes', AVAILABLE_SIZES);
    saveSettings(INITIAL_STORE_SETTINGS);
  };

  // Export / Import Backup Data
  const exportDataJSON = () => {
    const backupObj = {
      products,
      orders,
      settings,
      employees,
      cashTransactions,
      categories,
      sizes,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chic_boutique_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.orders) setOrders(parsed.orders);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.cashTransactions) setCashTransactions(parsed.cashTransactions);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.sizes) setSizes(parsed.sizes);

      // Send the imported data to the database as well
      if (parsed.products) saveRows('products', parsed.products);
      if (parsed.orders) saveRows('orders', parsed.orders);
      if (parsed.cashTransactions) saveRows('cashTransactions', parsed.cashTransactions);
      if (parsed.employees) saveRows('employees', parsed.employees);
      if (parsed.categories) saveList('categories', parsed.categories);
      if (parsed.sizes) saveList('sizes', parsed.sizes);
      if (parsed.settings) saveSettings(parsed.settings);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        settings,
        employees,
        cashTransactions,
        CASH_CATEGORIES,
        categories,
        sizes,
        cloudStatus,
        cloudError,
        pendingCount,
        isHydrating,
        isCloudEnabled,
        role,
        isStaff,
        enterStaffMode,
        exitStaffMode,
        addCategory,
        deleteCategory,
        addSize,
        deleteSize,
        generateSku,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStockVariant,
        createOrder,
        refundOrder,
        deleteOrder,
        clearOrderHistory,
        updateSettings,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addWageLog,
        removeWageLog,
        calcEmployeePayroll,
        addBatchWorkDays,
        addCashTransaction,

        updateCashTransaction,
        deleteCashTransaction,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

