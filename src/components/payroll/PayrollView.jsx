import React, { useState, useMemo } from 'react';

import {
  Users, Plus, Trash2, Edit3, Calendar, TrendingUp, TrendingDown,
  Wallet, ChevronDown, ChevronUp, X, Save, FileText, Clock, AlertTriangle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// ─── Custom Confirm Dialog (แทน window.confirm) ───────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={onCancel}>
    <div
      className="modal-card"
      style={{ maxWidth: 360, textAlign: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <AlertTriangle size={40} color="#f59e0b" />
      </div>
      <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
          ยกเลิก
        </button>
        <button
          className="btn-danger"
          style={{ flex: 1 }}
          onClick={() => { onConfirm(); onCancel(); }}
        >
          <Trash2 size={15} /> ยืนยันลบ
        </button>
      </div>
    </div>
  </div>
);

// ─── Log Type Pill ────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const cfg = {
    work:    { label: '+ บวกวัน',   bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.35)' },
    deduct:  { label: '− หักวัน',   bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e', border: 'rgba(244,63,94,0.35)' },
    advance: { label: '฿ เบิกเงิน', bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
  };
  const c = cfg[type] || cfg.work;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
      whiteSpace: 'nowrap'
    }}>
      {c.label}
    </span>
  );
};

// ─── Add Log Modal ─────────────────────────────────────────────
const AddLogModal = ({ employee, onClose, onSave }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState('work');
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');

  const handleTypeChange = (t) => {
    setType(t);
    setAmount(t === 'advance' ? '' : '1');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onSave({ type, date, amount: val, note });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            บันทึกรายการ — {employee.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'work',    label: 'บวกวัน',   icon: <TrendingUp size={16} />,   color: '#10b981' },
            { key: 'deduct',  label: 'หักวัน',   icon: <TrendingDown size={16} />, color: '#f43f5e' },
            { key: 'advance', label: 'เบิกเงิน', icon: <Wallet size={16} />,       color: '#f59e0b' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTypeChange(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '0.75rem 0.5rem', borderRadius: 10,
                border: type === t.key ? `2px solid ${t.color}` : '1px solid var(--bg-card-border)',
                background: type === t.key ? `${t.color}22` : 'var(--bg-surface)',
                color: type === t.key ? t.color : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>วันที่</label>
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>
              {type === 'advance' ? 'จำนวนเงิน (บาท)' : 'จำนวนวัน (0.5 = ครึ่งวัน, 1 = เต็มวัน)'}
            </label>
            <input
              type="number"
              className="input-field"
              step={type === 'advance' ? '1' : '0.5'}
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={type === 'advance' ? 'เช่น 500' : 'เช่น 1 หรือ 0.5'}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>หมายเหตุ (ไม่บังคับ)</label>
            <input
              type="text"
              className="input-field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ทำงานปกติ, มาสาย, เบิกค่าเดินทาง..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              <Save size={16} /> บันทึกรายการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Add / Edit Employee Modal ─────────────────────────────────
const EmployeeFormModal = ({ empToEdit, onClose }) => {
  const { addEmployee, updateEmployee } = useStore();
  const isEdit = Boolean(empToEdit);
  const [name,      setName]      = useState(empToEdit?.name      || '');
  const [position,  setPosition]  = useState(empToEdit?.position  || 'พนักงานขาย');
  const [dailyWage, setDailyWage] = useState(empToEdit?.dailyWage || 400);
  const [startDate, setStartDate] = useState(empToEdit?.startDate || new Date().toISOString().slice(0, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { name, position, dailyWage: parseFloat(dailyWage), startDate };
    if (isEdit) {
      updateEmployee(empToEdit.id, data);
    } else {
      addEmployee(data);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            {isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>ชื่อ-นามสกุล</label>
            <input
              type="text" className="input-field" required
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="เช่น คุณสมชาย ใจดี"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>ตำแหน่งงาน</label>
            <input
              type="text" className="input-field"
              value={position} onChange={(e) => setPosition(e.target.value)}
              placeholder="เช่น พนักงานขาย, แคชเชียร์"
            />
          </div>
          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>ค่าแรงต่อวัน (฿)</label>
              <input
                type="number" className="input-field" required min="1"
                value={dailyWage} onChange={(e) => setDailyWage(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>วันที่เริ่มงาน</label>
              <input
                type="date" className="input-field"
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              <Save size={16} /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Payslip Modal ─────────────────────────────────────────────
const PayslipModal = ({ employee, fromDate, toDate, onClose, calcEmployeePayroll }) => {
  const s = calcEmployeePayroll(employee, fromDate, toDate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>สลิปค่าแรง (Pay Slip)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          background: '#fff', color: '#0f172a', borderRadius: 10,
          padding: '1.5rem', fontFamily: "'Courier New', monospace",
          fontSize: '0.85rem', marginBottom: '1rem',
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: 1 }}>สลิปค่าแรงพนักงาน</div>
            <div style={{ fontSize: '0.75rem', marginTop: 2 }}>ช่วง {fromDate} ถึง {toDate}</div>
          </div>
          <div style={{ marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ชื่อ:</span><strong>{employee.name}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}><span>ตำแหน่ง:</span><span>{employee.position}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}><span>อัตราค่าแรง:</span><span>฿{employee.dailyWage.toLocaleString()}/วัน</span></div>
          </div>
          <div style={{ marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>วันทำงาน (บวก):</span><span style={{ color: '#059669' }}>+{s.workDays} วัน</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>วันหัก (ลา/สาย):</span><span style={{ color: '#dc2626' }}>−{s.deductDays} วัน</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: 4, marginTop: 4 }}>
              <span>วันสุทธิ:</span><span>{s.netDays} วัน</span>
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>ค่าแรงรวม ({s.netDays} × ฿{employee.dailyWage}):</span>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>฿{s.grossPay.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ยอดเบิกล่วงหน้า:</span>
              <span style={{ color: '#b45309' }}>−฿{s.advances.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900, borderTop: '2px solid #0f172a', paddingTop: 8 }}>
            <span>ยอดจ่ายสุทธิ:</span>
            <span style={{ color: s.netPay >= 0 ? '#059669' : '#dc2626' }}>฿{s.netPay.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>ปิด</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
            <FileText size={16} /> พิมพ์สลิป
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main PayrollView ──────────────────────────────────────────
export const PayrollView = () => {
  const { employees, deleteEmployee, addWageLog, removeWageLog, calcEmployeePayroll, addBatchWorkDays } = useStore();

  const [expandedEmpId, setExpandedEmpId] = useState(null);
  const [logModalEmpId, setLogModalEmpId] = useState(null);
  const [empFormTarget, setEmpFormTarget] = useState(null); // null=closed | 'new' | empObj
  const [payslipEmpId, setPayslipEmpId]  = useState(null);

  // Confirm dialog state
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  // Period filter
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate,   setToDate]   = useState(today);

  // Calculate days in selected date range
  const daysInRange = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const f = new Date(fromDate);
    const t = new Date(toDate);
    const diff = (t.getTime() - f.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 ? Math.floor(diff) + 1 : 0;
  }, [fromDate, toDate]);

  const computeSummary  = (emp) => calcEmployeePayroll(emp, fromDate, toDate);
  const totalGross      = employees.reduce((a, e) => a + computeSummary(e).grossPay, 0);
  const totalNetPay     = employees.reduce((a, e) => a + computeSummary(e).netPay,   0);
  const totalAdvances   = employees.reduce((a, e) => a + computeSummary(e).advances, 0);

  const logModalEmp = employees.find((e) => e.id === logModalEmpId);
  const payslipEmp  = employees.find((e) => e.id === payslipEmpId);

  const handleQuickAddAllFullRange = () => {
    if (daysInRange <= 0) return;
    if (confirm(`คุณต้องการเพิ่มวันทำงาน (${daysInRange} วัน) ให้พนักงานทุกคน (${employees.length} คน) หรือไม่?`)) {
      addBatchWorkDays('all', daysInRange, toDate, `ทำงานเต็มช่วง (${daysInRange} วัน)`);
    }
  };

  const handleQuickAddAllToday = () => {
    addBatchWorkDays('all', 1, today, 'ทำงานปกติวันนี้');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'จำนวนพนักงาน',               value: `${employees.length} คน`, color: '#fff' },
          { label: 'ยอดค่าแรงรวม (ก่อนหักเบิก)', value: `฿${totalGross.toLocaleString()}`,    color: '#c084fc' },
          { label: 'ยอดเบิกล่วงหน้ารวม',          value: `฿${totalAdvances.toLocaleString()}`, color: '#f59e0b' },
          { label: 'ยอดจ่ายสุทธิรวม',             value: `฿${totalNetPay.toLocaleString()}`,   color: '#10b981' },
        ].map((card) => (
          <div key={card.label} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Control Bar & Quick Batch Actions ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#1e293b', padding: '0.5rem 0.85rem',
          borderRadius: 10, border: '1px solid var(--bg-card-border)',
          flexWrap: 'wrap',
        }}>
          <Calendar size={15} color="#8b5cf6" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>ช่วงวันที่:</span>
          <input
            type="date" className="input-field"
            style={{ width: 135, padding: '4px 8px', fontSize: '0.82rem' }}
            value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          />
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>ถึง</span>
          <input
            type="date" className="input-field"
            style={{ width: 135, padding: '4px 8px', fontSize: '0.82rem' }}
            value={toDate} onChange={(e) => setToDate(e.target.value)}
          />
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginLeft: '4px' }}>
            ({daysInRange} วัน)
          </span>
        </div>

        {/* Quick Batch Work Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {daysInRange > 0 && (
            <button
              onClick={handleQuickAddAllFullRange}
              className="action-btn"
              style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '0.82rem' }}
              title="เพิ่มวันทำงานเต็มช่วงตามวันที่เลือกให้พนักงานทุกคน"
            >
              <TrendingUp size={15} />
              <span>ลงเวลาทำงานเต็มช่วง ({daysInRange} วัน) ให้ทุกคน</span>
            </button>
          )}

          <button
            onClick={handleQuickAddAllToday}
            className="action-btn"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.82rem' }}
            title="เพิ่มวันทำงาน 1 วันของวันนี้ให้พนักงานทุกคน"
          >
            <Clock size={15} />
            <span>เช็คชื่อวันนี้ (+1 วัน) ทุกคน</span>
          </button>

          <button className="btn-primary" onClick={() => setEmpFormTarget('new')} style={{ fontSize: '0.85rem' }}>
            <Plus size={16} /> เพิ่มพนักงาน
          </button>
        </div>
      </div>

      {/* ── Employee Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {employees.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <div>ยังไม่มีข้อมูลพนักงาน กดปุ่ม "เพิ่มพนักงาน" เพื่อเริ่มต้น</div>
          </div>
        )}

        {employees.map((emp) => {
          const summary    = computeSummary(emp);
          const isExpanded = expandedEmpId === emp.id;

          return (
            <div key={emp.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Header row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.1rem 1.25rem', flexWrap: 'wrap',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {emp.name.charAt(3) || emp.name.charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {emp.position} · <strong style={{ color: '#c084fc' }}>฿{emp.dailyWage.toLocaleString()}/วัน</strong>
                  </div>
                </div>

                {/* Quick Add Days for Single Emp */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    onClick={() => addBatchWorkDays([emp.id], 1, today, 'ทำงานปกติ 1 วัน')}
                    title="เพิ่มวันทำงาน 1 วันให้คนนี้"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    +1 วัน
                  </button>
                  {daysInRange > 0 && (
                    <button
                      onClick={() => addBatchWorkDays([emp.id], daysInRange, toDate, `ทำงานเต็มช่วง (${daysInRange} วัน)`)}
                      title={`เพิ่มวันทำงานเต็มช่วง (${daysInRange} วัน) ให้คนนี้`}
                      style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#c084fc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      +{daysInRange} วัน
                    </button>
                  )}
                </div>

                {/* Period Summary pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { label: 'วันทำงาน', value: `${summary.netDays} วัน`, bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
                    { label: 'เบิกล่วงหน้า', value: `฿${summary.advances.toLocaleString()}`, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
                    { label: 'จ่ายสุทธิ', value: `฿${summary.netPay.toLocaleString()}`, bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#c084fc' },
                  ].map((pill) => (
                    <div key={pill.label} style={{
                      textAlign: 'center', background: pill.bg,
                      border: `1px solid ${pill.border}`, borderRadius: 8, padding: '4px 10px',
                    }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{pill.label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: pill.color }}>{pill.value}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {/* บันทึก */}
                  <button
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    onClick={() => setLogModalEmpId(emp.id)}
                    title="บันทึกรายการละเอียด"
                  >
                    <Plus size={14} /> บันทึก
                  </button>

                  {/* สลิป */}
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', color: '#38bdf8' }}
                    onClick={() => setPayslipEmpId(emp.id)}
                    title="สลิปค่าแรง"
                  >
                    <FileText size={14} />
                  </button>

                  {/* แก้ไข */}
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', color: '#38bdf8' }}
                    onClick={() => setEmpFormTarget(emp)}
                    title="แก้ไขข้อมูล"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* ลบ */}
                  <button
                    className="btn-danger"
                    style={{ padding: '0.45rem 0.75rem' }}
                    onClick={() =>
                      askConfirm(
                        `ต้องการลบข้อมูลพนักงาน "${emp.name}" และประวัติทั้งหมดใช่ไหม?`,
                        () => deleteEmployee(emp.id)
                      )
                    }
                    title="ลบพนักงาน"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* expand */}

                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem' }}
                    onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}
                    title="ดูประวัติรายการ"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded log list */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--bg-card-border)', background: '#0f172a', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.75rem' }}>
                    ประวัติรายการทั้งหมด ({emp.wageLogs.length} รายการ)
                  </div>

                  {emp.wageLogs.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ยังไม่มีรายการ</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                      {emp.wageLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: '#1e293b', padding: '0.6rem 0.85rem', borderRadius: 8,
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', width: 88, flexShrink: 0 }}>
                            <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                            {log.date}
                          </div>

                          <TypeBadge type={log.type} />

                          <div style={{ flex: 1, fontSize: '0.85rem', color: '#cbd5e1' }}>
                            {log.type === 'advance'
                              ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>฿{log.amount.toLocaleString()}</span>
                              : <span style={{ color: log.type === 'work' ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{log.amount} วัน</span>
                            }
                            {log.note && <span style={{ color: '#64748b', marginLeft: 6 }}>— {log.note}</span>}
                          </div>

                          <button
                            onClick={() =>
                              askConfirm('ต้องการลบรายการนี้ใช่ไหม?', () => removeWageLog(emp.id, log.id))
                            }
                            style={{
                              background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
                              color: '#f43f5e', cursor: 'pointer', padding: '4px 8px',
                              borderRadius: 6, display: 'flex', alignItems: 'center',
                            }}
                            title="ลบรายการ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modals ── */}
      {logModalEmp && (
        <AddLogModal
          employee={logModalEmp}
          onClose={() => setLogModalEmpId(null)}
          onSave={(logData) => addWageLog(logModalEmp.id, logData)}
        />
      )}

      {empFormTarget !== null && (
        <EmployeeFormModal
          empToEdit={empFormTarget === 'new' ? null : empFormTarget}
          onClose={() => setEmpFormTarget(null)}
        />
      )}

      {payslipEmp && (
        <PayslipModal
          employee={payslipEmp}
          fromDate={fromDate}
          toDate={toDate}
          onClose={() => setPayslipEmpId(null)}
          calcEmployeePayroll={calcEmployeePayroll}
        />
      )}

      {/* ── Custom Confirm Dialog ── */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
};
