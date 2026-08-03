import React, { useState } from 'react';
import { ShoppingBag, Package, BarChart3, Receipt, Settings, Shirt, Users, Wallet, Tag, UserCog, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StaffPinModal } from './StaffPinModal';

// Tabs a front-counter staff member may open
export const STAFF_TABS = ['pos', 'orders', 'inventory'];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { settings, isStaff, enterStaffMode } = useStore();
  const [isPinOpen, setIsPinOpen] = useState(false);

  const navItems = [
    { id: 'pos',       label: 'ขายหน้าร้าน (POS)',       icon: ShoppingBag },
    { id: 'cash',      label: 'บันทึกเงินเข้า-ออก',        icon: Wallet },
    { id: 'inventory', label: isStaff ? 'เช็คสต็อกสินค้า' : 'คลังสินค้า (Stock)', icon: Package },
    { id: 'pricing',   label: 'ตารางราคาสินค้า',           icon: Tag },
    { id: 'dashboard', label: 'รายงานสรุปยอดขาย',         icon: BarChart3 },
    { id: 'orders',    label: 'ประวัติการขาย',             icon: Receipt },
    { id: 'payroll',   label: 'ค่าแรงพนักงาน',            icon: Users },
    { id: 'settings',  label: 'ตั้งค่าร้านค้า',            icon: Settings },
  ].filter((item) => !isStaff || STAFF_TABS.includes(item.id));

  const handleSwitchRole = () => {
    if (isStaff) {
      setIsPinOpen(true);
      return;
    }
    enterStaffMode();
    setActiveTab('pos');
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-icon-box">
            <Shirt size={26} />
          </div>
          <div>
            <div className="brand-title">{settings.name || 'CHIC BOUTIQUE'}</div>
            <div className="brand-subtitle">{settings.branch || 'สาขาใหญ่'}</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
              >
                <Icon className="nav-item-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Role Switcher */}
        <button
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.6rem' }}
          onClick={handleSwitchRole}
        >
          {isStaff ? <Lock size={16} /> : <UserCog size={16} />}
          {isStaff ? 'ออกจากโหมดพนักงาน' : 'สลับเป็นโหมดพนักงาน'}
        </button>

        {/* Offline Status Badge */}
        <div className="offline-badge">
          <div className="offline-dot" />
          <span>{isStaff ? 'โหมดพนักงานหน้าร้าน' : 'ระบบพร้อมใช้งาน 100% Offline'}</span>
        </div>
      </div>
      </aside>

      {isPinOpen && <StaffPinModal onClose={() => setIsPinOpen(false)} />}
    </>
  );
};
