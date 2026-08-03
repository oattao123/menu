import React, { useState } from 'react';
import { Search, UserPlus, Award, Phone, ShoppingBag, Star, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CustomersView = () => {
  const { customers, addCustomer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    addCustomer({ name, phone });
    setName('');
    setPhone('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="ค้นหาสมาชิกด้วยชื่อ หรือ เบอร์โทรศัพท์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} /> สมัครสมาชิกใหม่
        </button>
      </div>

      {/* Customer Grid Cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filteredCustomers.map((cust) => {
          const isGold = cust.tier === 'Gold';
          const isSilver = cust.tier === 'Silver';

          return (
            <div key={cust.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{cust.name}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Phone size={14} /> {cust.phone}
                    </div>
                  </div>

                  <span
                    style={{
                      background: isGold ? 'rgba(245,158,11,0.2)' : isSilver ? 'rgba(148,163,184,0.2)' : 'rgba(180,83,9,0.2)',
                      color: isGold ? '#f59e0b' : isSilver ? '#cbd5e1' : '#f97316',
                      border: `1px solid ${isGold ? '#f59e0b' : isSilver ? '#94a3b8' : '#f97316'}`,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Award size={14} /> {cust.tier} Tier
                  </span>
                </div>

                <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>คะแนนสะสม</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={16} fill="#c084fc" /> {cust.points} แต้ม
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ยอดซื้อสะสม</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                      ฿{cust.totalSpent.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShoppingBag size={14} /> ออเดอร์ทั้งหมด {cust.historyCount} รายการ
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>สมัครสมาชิกใหม่</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>ชื่อ-นามสกุล ลูกค้า</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="เช่น คุณวิภา สุขสันต์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>เบอร์โทรศัพท์ (ใช้สะสมแต้ม)</label>
                <input
                  type="tel"
                  className="input-field"
                  required
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  บันทึกสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
