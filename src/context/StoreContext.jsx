import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  supabase,
  isCloudEnabled,
  fetchAllState,
  pushState,
  STATE_TABLE,
  CLIENT_ID,
} from '../lib/supabase';
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
  // Cloud sync (Supabase) — shared data across devices.
  // Without credentials everything below is skipped and the app stays local-only.
  // ==========================================

  // 'offline' = no database configured, 'connecting' | 'synced' | 'error'
  const [cloudStatus, setCloudStatus] = useState(isCloudEnabled ? 'connecting' : 'offline');
  const [cloudError, setCloudError] = useState('');

  const hydratedRef = useRef(false);
  // Last value seen from / sent to the database per key, so echoes are not pushed back
  const lastSyncedRef = useRef({});

  const setterFor = {
    products: setProducts,
    orders: setOrders,
    settings: setSettings,
    employees: setEmployees,
    cash_transactions: setCashTransactions,
    categories: setCategories,
    sizes: setSizes,
  };

  const applyRemote = (key, value) => {
    const setter = setterFor[key];
    if (!setter || value === undefined || value === null) return;
    lastSyncedRef.current[key] = JSON.stringify(value);
    setter(value);
  };

  // Initial load + realtime subscription
  useEffect(() => {
    if (!isCloudEnabled) return;
    let channel;
    let cancelled = false;

    const localSnapshot = {
      products,
      orders,
      settings,
      employees,
      cash_transactions: cashTransactions,
      categories,
      sizes,
    };

    (async () => {
      try {
        const remote = await fetchAllState();
        if (cancelled) return;

        for (const key of Object.keys(setterFor)) {
          if (remote[key] !== undefined) {
            applyRemote(key, remote[key]);
          } else {
            // First run: seed the database from whatever this device already has
            await pushState(key, localSnapshot[key]);
            lastSyncedRef.current[key] = JSON.stringify(localSnapshot[key]);
          }
        }

        hydratedRef.current = true;
        setCloudStatus('synced');
        setCloudError('');

        channel = supabase
          .channel('store_state_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: STATE_TABLE },
            (payload) => {
              const row = payload.new;
              if (!row || row.client_id === CLIENT_ID) return;
              applyRemote(row.key, row.data);
            }
          )
          .subscribe();
      } catch (err) {
        if (cancelled) return;
        setCloudStatus('error');
        setCloudError(err?.message || 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ');
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // Runs once — the local snapshot is only used to seed an empty database
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push local changes up (debounced, and never echoing what we just received)
  const useCloudPush = (key, value) => {
    useEffect(() => {
      if (!isCloudEnabled || !hydratedRef.current) return;
      const json = JSON.stringify(value);
      if (lastSyncedRef.current[key] === json) return;

      const timer = setTimeout(() => {
        lastSyncedRef.current[key] = json;
        pushState(key, value)
          .then(() => {
            setCloudStatus('synced');
            setCloudError('');
          })
          .catch((err) => {
            // Allow a retry on the next change
            delete lastSyncedRef.current[key];
            setCloudStatus('error');
            setCloudError(err?.message || 'บันทึกขึ้นฐานข้อมูลไม่สำเร็จ');
          });
      }, 400);

      return () => clearTimeout(timer);
    }, [key, value]);
  };

  useCloudPush('products', products);
  useCloudPush('orders', orders);
  useCloudPush('settings', settings);
  useCloudPush('employees', employees);
  useCloudPush('cash_transactions', cashTransactions);
  useCloudPush('categories', categories);
  useCloudPush('sizes', sizes);

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
    setCategories((prev) => [...prev, clean]);
    return { success: true, value: clean };
  };

  const deleteCategory = (name) => {
    if (name === 'ทั้งหมด') return { success: false, error: 'ลบหมวดหมู่นี้ไม่ได้' };
    if (products.some((p) => p.category === name)) {
      return { success: false, error: 'ยังมีสินค้าอยู่ในหมวดหมู่นี้' };
    }
    setCategories((prev) => prev.filter((c) => c !== name));
    return { success: true };
  };

  const addSize = (name) => {
    const clean = (name || '').trim().toUpperCase();
    if (!clean) return { success: false, error: 'กรุณากรอกชื่อไซส์' };
    if (sizes.some((s) => s.toUpperCase() === clean)) {
      return { success: false, error: 'มีไซส์นี้อยู่แล้ว' };
    }
    setSizes((prev) => [...prev, clean]);
    return { success: true, value: clean };
  };

  const deleteSize = (name) => {
    if (products.some((p) => (p.sizes || []).includes(name))) {
      return { success: false, error: 'ยังมีสินค้าที่ใช้ไซส์นี้อยู่' };
    }
    setSizes((prev) => prev.filter((s) => s !== name));
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
    return productWithId;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStockVariant = (productId, size, colorName, newQty) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const key = `${size}-${colorName}`;
        const updatedMatrix = { ...p.stockMatrix, [key]: Math.max(0, newQty) };
        return {
          ...p,
          stockMatrix: updatedMatrix,
        };
      })
    );
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
    return newTx;
  };

  const updateCashTransaction = (id, fields) => {
    setCashTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...fields, amount: parseFloat(fields.amount ?? tx.amount) } : tx))
    );
  };

  const deleteCashTransaction = (id) => {
    setCashTransactions((prev) => prev.filter((tx) => tx.id !== id));
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
          return { ...product, stockMatrix: updatedMatrix };
        }
        return product;
      })
    );

    // Record Order
    setOrders((prev) => [newOrder, ...prev]);

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
          return { ...product, stockMatrix: updatedMatrix };
        }
        return product;
      })
    );

    // Mark as refunded
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Refunded' } : o))
    );

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
  };

  // Delete an order from history along with the cash entries it generated.
  // Stock is not restored — use refundOrder for goods that actually came back.
  const deleteOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCashTransactions((prev) => prev.filter((tx) => !(tx.isAuto && tx.referenceId === orderId)));
  };

  const clearOrderHistory = () => {
    const orderIds = new Set(orders.map((o) => o.id));
    setOrders([]);
    setCashTransactions((prev) => prev.filter((tx) => !(tx.isAuto && orderIds.has(tx.referenceId))));
  };

  // Settings Action
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
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
    return newEmp;
  };

  const updateEmployee = (id, fields) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
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
        return { ...e, wageLogs: updatedLogs, totalAdvance };
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
        return { ...e, wageLogs: updatedLogs, totalAdvance };
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
        const updatedLogs = [newLog, ...(e.wageLogs || [])];
        return { ...e, wageLogs: updatedLogs };
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

