import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Calendar,
  Tag,
  CreditCard,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Coins,
  AlertTriangle
} from 'lucide-react';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem'
  }} onClick={onCancel}>
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        maxWidth: 380,
        width: '100%',
        padding: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <AlertTriangle size={42} color="#f59e0b" />
      </div>
      <p style={{ color: '#f8fafc', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="btn-secondary"
          style={{ flex: 1, padding: '0.6rem' }}
          onClick={onCancel}
        >
          ยกเลิก
        </button>
        <button
          className="btn-danger"
          style={{ flex: 1, padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          onClick={() => { onConfirm(); onCancel(); }}
        >
          <Trash2 size={16} /> ยืนยันลบ
        </button>
      </div>
    </div>
  </div>
);

export const CashLedgerView = () => {
  const {
    cashTransactions,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    CASH_CATEGORIES,
    settings
  } = useStore();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'in', 'out'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', '7days', 'month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [formData, setFormData] = useState({
    type: 'in',
    amount: '',
    category: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  // Today Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return cashTransactions.filter((tx) => {
      // Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // Method Filter
      if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) return false;

      // Date Range Filter
      if (dateRange === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (dateRange === '7days') {
        const txTime = new Date(tx.date).getTime();
        const nowTime = new Date().getTime();
        const diffDays = (nowTime - txTime) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (dateRange === 'month') {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (!tx.date.startsWith(currentMonth)) return false;
      } else if (dateRange === 'custom') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      // Search Term Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const noteMatch = tx.note && tx.note.toLowerCase().includes(query);
        const catMatch = tx.category && tx.category.toLowerCase().includes(query);
        const refMatch = tx.referenceId && tx.referenceId.toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        if (!noteMatch && !catMatch && !refMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [cashTransactions, typeFilter, categoryFilter, methodFilter, dateRange, startDate, endDate, searchTerm, todayStr]);

  // Statistics Calculations
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let cashInDrawer = 0;

    // Based on filtered
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'in') {
        totalIn += tx.amount;
      } else {
        totalOut += tx.amount;
      }
    });

    // All-time Cash Drawer Balance calculation (Cash payment method only)
    cashTransactions.forEach((tx) => {
      if (tx.paymentMethod === 'Cash') {
        if (tx.type === 'in') cashInDrawer += tx.amount;
        else cashInDrawer -= tx.amount;
      }
    });

    const netFlow = totalIn - totalOut;

    return { totalIn, totalOut, netFlow, cashInDrawer };
  }, [filteredTransactions, cashTransactions]);

  // Category Breakdown for Expenses
  const expenseCategoryBreakdown = useMemo(() => {
    const map = {};
    let sumExpense = 0;

    filteredTransactions
      .filter((tx) => tx.type === 'out')
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        sumExpense += tx.amount;
      });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: sumExpense > 0 ? Math.round((amount / sumExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Modal Handlers
  const handleOpenAddModal = (defaultType = 'in', defaultCategory = '') => {
    setEditingTx(null);
    setFormData({
      type: defaultType,
      amount: '',
      category: defaultCategory || (defaultType === 'in' ? CASH_CATEGORIES.INCOME[0] : CASH_CATEGORIES.EXPENSE[0]),
      paymentMethod: 'Cash',
      date: new Date().toISOString().slice(0, 10),
      note: defaultType === 'in' && defaultCategory === 'เงินทุนหมุนเวียน/เงินทอน' ? 'เปิดลิ้นชักเงินสด' : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      date: tx.date,
      note: tx.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    if (editingTx) {
      updateCashTransaction(editingTx.id, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        note: formData.note,
      });
    } else {
      addCashTransaction({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        note: formData.note,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (tx) => {
    setConfirmDialog({
      message: `คุณต้องการลบรายการ "${tx.note || tx.category}" ยอด ${tx.amount.toLocaleString()} ฿ หรือไม่?`,
      onConfirm: () => deleteCashTransaction(tx.id)
    });
  };


  const currencySymbol = settings?.currency || '฿';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet color="#10b981" size={28} />
            สมุดบันทึกเงินเข้า-ออก (Cash Ledger)
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
            จดบันทึกรายรับ-รายจ่าย ตรวจสอบลิ้นชักเงินสด และกระแสเงินสดร้านค้า
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenAddModal('in', 'เงินทุนหมุนเวียน/เงินทอน')}
            className="action-btn"
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}
          >
            <Coins size={16} />
            <span>เติมเงินลิ้นชัก</span>
          </button>
          
          <button
            onClick={() => handleOpenAddModal('in')}
            className="action-btn"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <PlusCircle size={16} />
            <span>บันทึกเงินเข้า (+)</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('out')}
            className="action-btn"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <MinusCircle size={16} />
            <span>บันทึกเงินออก (-)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        
        {/* Total In */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>ยอดรวมเงินเข้า (Income)</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', marginTop: '0.5rem' }}>
            +{stats.totalIn.toLocaleString()} {currencySymbol}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            ตามช่วงเวลาที่กรอง
          </div>
        </div>

        {/* Total Out */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>ยอดรวมเงินออก (Expense)</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f87171', marginTop: '0.5rem' }}>
            -{stats.totalOut.toLocaleString()} {currencySymbol}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            ตามช่วงเวลาที่กรอง
          </div>
        </div>

        {/* Net Flow */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>กระแสเงินสดสุทธิ (Net Flow)</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.netFlow >= 0 ? '#38bdf8' : '#f87171', marginTop: '0.5rem' }}>
            {stats.netFlow >= 0 ? '+' : ''}{stats.netFlow.toLocaleString()} {currencySymbol}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            รายรับ หัก รายจ่ายช่วงนี้
          </div>
        </div>

        {/* Cash In Drawer */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>เงินสดประเมินในลิ้นชัก</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <Coins size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.5rem' }}>
            {stats.cashInDrawer.toLocaleString()} {currencySymbol}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            เงินสดคงเหลือสุทธิหน้าร้าน
          </div>
        </div>

      </div>

      {/* Filter Toolbar & Search */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ค้นหาตามรายการ, หมายเหตุ, เลขอ้างอิง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ width: '100%', paddingLeft: '38px' }}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="all">ทุกประเภทเงิน</option>
              <option value="in">💚 เงินเข้า (+)</option>
              <option value="out">💔 เงินออก (-)</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="all">ทุกหมวดหมู่</option>
              <optgroup label="-- เงินเข้า --">
                {CASH_CATEGORIES.INCOME.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
              <optgroup label="-- เงินออก --">
                {CASH_CATEGORIES.EXPENSE.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            </select>

            {/* Method */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="all">ทุกช่องทาง</option>
              <option value="Cash">เงินสด (Cash)</option>
              <option value="PromptPay">PromptPay / สแกน</option>
              <option value="Transfer">โอนเงินธนาคาร</option>
              <option value="Credit Card">บัตรเครดิต</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="all">ช่วงเวลาทั้งหมด</option>
              <option value="today">วันนี้</option>
              <option value="7days">7 วันล่าสุด</option>
              <option value="month">เดือนนี้</option>
              <option value="custom">ระบุวันที่...</option>
            </select>

          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateRange === 'custom' && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px dashed #334155' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto', fontSize: '0.85rem' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ถึงวันที่:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </div>

      {/* Expense Category Breakdown Section */}
      {expenseCategoryBreakdown.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '16px',
          padding: '1.25rem'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={16} color="#f87171" />
            สัดส่วนค่าใช้จ่ายแยกตามหมวดหมู่ (Expense Distribution)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {expenseCategoryBreakdown.map((item) => (
              <div key={item.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#e2e8f0' }}>{item.category}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                    {item.amount.toLocaleString()} {currencySymbol} ({item.percentage}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${item.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ef4444, #f97316)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>
            รายการเคลื่อนไหวเงิน ({filteredTransactions.length} รายการ)
          </h3>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>วัน/เวลา</th>
                <th>ประเภท</th>
                <th>หมวดหมู่</th>
                <th>รายละเอียด / หมายเหตุ</th>
                <th>ช่องทาง</th>
                <th className="num">จำนวนเงิน ({currencySymbol})</th>
                <th className="num">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    ไม่พบรายการเงินเข้า-ออก ตรงตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIn = tx.type === 'in';
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--bg-card-border)', fontSize: '0.875rem' }}>
                      
                      {/* Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        <div>{tx.date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tx.timestamp?.split(' ')[1] || ''}</div>
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: isIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isIn ? '#34d399' : '#f87171',
                          border: `1px solid ${isIn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          {isIn ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isIn ? 'เงินเข้า (+)' : 'เงินออก (-)'}
                        </span>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {tx.category}
                      </td>

                      {/* Note & Reference */}
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                        <div>{tx.note || '-'}</div>
                        {tx.referenceId && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#1e293b',
                            fontSize: '0.7rem',
                            color: '#8b5cf6',
                            border: '1px solid #334155'
                          }}>
                            อ้างอิง: {tx.referenceId}
                          </span>
                        )}
                        {tx.isAuto && (
                          <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: '#64748b' }} title="บันทึกโดยอัตโนมัติจากระบบ">
                            [อัตโนมัติ]
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          background: '#1e293b',
                          color: '#cbd5e1',
                          border: '1px solid #334155'
                        }}>
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="num" style={{
                        padding: '0.85rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: isIn ? '#34d399' : '#f87171'
                      }}>
                        {isIn ? '+' : '-'}{tx.amount.toLocaleString()} {currencySymbol}
                      </td>

                      {/* Actions */}
                      <td className="num" style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(tx)}
                            title="แก้ไขรายการ"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            title="ลบรายการ"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Cash Transaction Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1.25rem 0' }}>
              {editingTx ? 'แก้ไขรายการเงิน' : formData.type === 'in' ? '➕ บันทึกเงินเข้า (Income)' : '➖ บันทึกเงินออก (Expense)'}
            </h2>

            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Type Switch */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>ประเภทรายการ</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      type: 'in',
                      category: CASH_CATEGORIES.INCOME[0]
                    })}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formData.type === 'in' ? '#10b981' : '#334155',
                      background: formData.type === 'in' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a',
                      color: formData.type === 'in' ? '#34d399' : '#94a3b8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💚 เงินเข้า (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      type: 'out',
                      category: CASH_CATEGORIES.EXPENSE[0]
                    })}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formData.type === 'out' ? '#ef4444' : '#334155',
                      background: formData.type === 'out' ? 'rgba(239, 68, 68, 0.2)' : '#0f172a',
                      color: formData.type === 'out' ? '#f87171' : '#94a3b8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💔 เงินออก (-)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  จำนวนเงิน ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600, color: formData.type === 'in' ? '#34d399' : '#f87171' }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>หมวดหมู่ *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  {(formData.type === 'in' ? CASH_CATEGORIES.INCOME : CASH_CATEGORIES.EXPENSE).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>ช่องทางเงินสด / ชำระ</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="Cash">เงินสด (Cash)</option>
                  <option value="PromptPay">PromptPay / สแกน QR</option>
                  <option value="Transfer">โอนเงินธนาคาร</option>
                  <option value="Credit Card">บัตรเครดิต</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>วันที่ทำรายการ</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ซื้อวัตถุดิบถุงกระดาษ, จ่ายค่าไฟร้าน..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.4rem',
                    background: formData.type === 'in' ? '#10b981' : '#ef4444'
                  }}
                >
                  บันทึกข้อมูล
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog Modal */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

    </div>
  );
};


