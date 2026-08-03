import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Award, ArrowUpRight, BarChart2, PieChart, Wallet } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../ProductImage';

export const DashboardView = () => {
  const { orders, products, cashTransactions } = useStore();

  // Calculate Metrics from Orders
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalOrdersCount = completedOrders.length;
  const avgBasketSize = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Cash Ledger Stats
  let totalCashIn = 0;
  let totalCashOut = 0;
  let cashInDrawer = 0;
  (cashTransactions || []).forEach((tx) => {
    if (tx.type === 'in') totalCashIn += tx.amount;
    else totalCashOut += tx.amount;
    if (tx.paymentMethod === 'Cash') {
      if (tx.type === 'in') cashInDrawer += tx.amount;
      else cashInDrawer -= tx.amount;
    }
  });
  const netCashFlow = totalCashIn - totalCashOut;

  // Calculate Gross Profit (Revenue - Cost of Goods Sold)
  let totalCostOfGoodsSold = 0;
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = prod ? prod.cost : item.price * 0.5;
      totalCostOfGoodsSold += unitCost * item.qty;
    });
  });
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const profitMarginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Group Sales by Last 7 Days for SVG Chart
  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });

      const dayOrders = completedOrders.filter((o) => o.dateStr === dateStr);
      const dayRev = dayOrders.reduce((acc, o) => acc + o.grandTotal, 0);

      days.push({ dateStr, dayLabel, revenue: dayRev, orderCount: dayOrders.length });
    }
    return days;
  };

  const chartData = getLast7DaysData();
  const maxRevInChart = Math.max(...chartData.map((d) => d.revenue), 1000);

  // Top Selling Items Breakdown
  const productSalesMap = {};
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.name,
          sku: item.sku,
          qty: 0,
          revenue: 0,
          svgType: item.svgType || 'tshirt',
        };
      }
      productSalesMap[item.productId].qty += item.qty;
      productSalesMap[item.productId].revenue += item.price * item.qty;
    });
  });

  const topSellingList = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Category Breakdown
  const categorySalesMap = {};
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const catName = prod ? prod.category : 'เสื้อยืด';
      categorySalesMap[catName] = (categorySalesMap[catName] || 0) + item.price * item.qty;
    });
  });

  const categoryBreakdownList = Object.entries(categorySalesMap).map(([name, rev]) => ({
    name,
    rev,
    percent: totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      {/* Top Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>ยอดขายรวมสุทธิ</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
            ฿{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            <ArrowUpRight size={14} /> อัปเดตล่าสุด Realtime
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>กระแสเงินสดสุทธิ</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: netCashFlow >= 0 ? '#34d399' : '#f87171' }}>
            {netCashFlow >= 0 ? '฿' : '-฿'}{Math.abs(netCashFlow).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '4px' }}>
            เงินสดลิ้นชัก ฿{cashInDrawer.toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>จำนวนออเดอร์ทั้งหมด</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
            {totalOrdersCount} บิล
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            เฉลี่ย ฿{avgBasketSize.toFixed(0)} / บิล
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>กำไรขั้นต้น (Gross Profit)</span>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>
            ฿{grossProfit.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '4px' }}>
            คิดเป็น {profitMarginPercent}% Margin
          </div>
        </div>
      </div>


      {/* Main Charts & Analytics Section */}
      <div className="dash-charts" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Offline SVG Revenue Chart */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={20} color="#8b5cf6" /> รายงานยอดขายย้อนหลัง 7 วัน (Daily Revenue)
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>แสดงแนวโน้มรายได้จากออเดอร์หน้าร้าน</div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ flex: 1, minHeight: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem 0.5rem 0.5rem 0.5rem', borderBottom: '1px solid var(--bg-card-border)', gap: '0.75rem' }}>
            {chartData.map((d, idx) => {
              const heightPercent = maxRevInChart > 0 ? (d.revenue / maxRevInChart) * 100 : 0;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: '700' }}>
                    {d.revenue > 0 ? `฿${d.revenue.toLocaleString()}` : '฿0'}
                  </div>

                  <div style={{ width: '100%', maxWidth: '44px', background: '#0f172a', borderRadius: '8px 8px 0 0', height: '160px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', padding: '2px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(5, heightPercent)}%`,
                        background: d.revenue > 0 ? 'linear-gradient(to top, #7c3aed, #ec4899)' : '#334155',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                    {d.dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={20} color="#ec4899" /> สัดส่วนตามหมวดหมู่
          </h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categoryBreakdownList.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                ยังไม่มีข้อมูลการขายหมวดหมู่
              </div>
            ) : (
              categoryBreakdownList.map((cat, idx) => (
                <div key={idx} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{cat.name}</span>
                    <span style={{ color: '#c084fc', fontWeight: '700' }}>฿{cat.rev.toLocaleString()} ({cat.percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cat.percent}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Selling Products */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="#f59e0b" /> อันดับ 5 สินค้าขายดีประจำร้าน (Top Sellers)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {topSellingList.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ยังไม่มีประวัติการขายสินค้า</div>
          ) : (
            topSellingList.map((item, idx) => (
              <div key={idx} style={{ background: '#0f172a', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--bg-card-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309', color: '#fff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                  #{idx + 1}
                </div>
                <div style={{ width: 44, height: 44, background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProductImage imageUrl={item.imageUrl} svgType={item.svgType} color="#c084fc" className="w-8 h-8" alt={item.name} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ขายได้ <strong style={{ color: '#fff' }}>{item.qty} ชิ้น</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>
                    ฿{item.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
