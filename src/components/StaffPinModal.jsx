import React, { useState } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const StaffPinModal = ({ onClose }) => {
  const { exitStaffMode } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = exitStaffMode(pin);
    if (!result.success) {
      setError(result.error);
      setPin('');
      return;
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#c084fc" /> ออกจากโหมดพนักงาน
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>
              ใส่ PIN เจ้าของร้าน (4 หลัก)
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              className="input-field"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
            />
          </div>

          {error && <div style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              <Unlock size={18} /> ปลดล็อก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
