import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Sidebar, STAFF_TABS } from './components/Sidebar';
import { PosView } from './components/pos/PosView';
import { CashLedgerView } from './components/cash/CashLedgerView';
import { InventoryView } from './components/inventory/InventoryView';
import { PricingView } from './components/pricing/PricingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { OrdersView } from './components/orders/OrdersView';
import { SettingsView } from './components/settings/SettingsView';
import { PayrollView } from './components/payroll/PayrollView';
import { Clock, Menu, UserCog } from 'lucide-react';
import { useStore } from './context/StoreContext';

function AppContent() {
  const { isStaff } = useStore();
  const [activeTab, setActiveTab] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Staff must never land on an owner-only page, even after switching roles
  const currentTab = isStaff && !STAFF_TABS.includes(activeTab) ? 'pos' : activeTab;

  const getPageTitle = () => {
    if (isStaff && currentTab === 'inventory') return 'เช็ค / ปรับจำนวนสต็อกสินค้า';
    switch (currentTab) {
      case 'pos':       return 'ระบบขายหน้าร้าน (Point of Sale)';
      case 'cash':      return 'สมุดบันทึกรับ-รายจ่าย (Cash Ledger & Cash Flow)';
      case 'inventory': return 'จัดการคลังสินค้าเสื้อผ้า (Inventory & Stock Matrix)';
      case 'pricing':   return 'ตารางราคาสินค้า (ราคาที่รับมา / ราคาส่ง / ราคาปลีก)';
      case 'dashboard': return 'แดชบอร์ดสรุปยอดขาย (Sales Analytics & Top Sellers)';
      case 'orders':    return 'ประวัติรายการขาย (Order History & Receipts)';
      case 'payroll':   return 'ระบบคำนวณค่าแรงพนักงาน (Employee Payroll)';
      case 'settings':  return 'ตั้งค่าข้อมูลร้านค้า (Store Settings & Offline Backup)';
      default:          return 'CHIC CLOTHING POS';
    }
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'pos':       return <PosView />;
      case 'cash':      return <CashLedgerView />;
      case 'inventory': return <InventoryView />;
      case 'pricing':   return <PricingView />;
      case 'dashboard': return <DashboardView />;
      case 'orders':    return <OrdersView />;
      case 'payroll':   return <PayrollView />;
      case 'settings':  return <SettingsView />;
      default:          return <PosView />;
    }
  };


  return (
    <div className="app-container">
      <Sidebar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <button className="nav-toggle" onClick={() => setIsSidebarOpen(true)} aria-label="เปิดเมนู">
              <Menu size={20} />
            </button>
            <h2 className="nav-page-title">{getPageTitle()}</h2>
          </div>
          <div className="navbar-date" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            {isStaff && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', background: 'rgba(139,92,246,0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.4)', fontWeight: '700' }}>
                <UserCog size={14} /> โหมดพนักงาน
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', background: '#1e293b', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--bg-card-border)' }}>
              <Clock size={14} color="#8b5cf6" />
              {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* View Page Container */}
        <section className="page-view-container">
          {renderActiveView()}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
