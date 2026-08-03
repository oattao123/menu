import React, { useState } from 'react';
import { Search, Tag, TrendingUp, Truck, PackageOpen } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../ProductImage';

const fmt = (n) => `฿${Number(n || 0).toLocaleString()}`;

const marginPercent = (sellPrice, cost) => {
  if (!cost) return 0;
  return ((sellPrice - cost) / cost) * 100;
};

export const PricingView = () => {
  const { products, categories } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  const getTotalStock = (p) =>
    p.stockMatrix ? Object.values(p.stockMatrix).reduce((acc, curr) => acc + curr, 0) : 0;

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const avgOf = (fn) =>
    products.length ? products.reduce((acc, p) => acc + fn(p), 0) / products.length : 0;

  const avgCost = avgOf((p) => p.cost);
  const avgWholesale = avgOf((p) => p.wholesalePrice ?? 0);
  const avgRetail = avgOf((p) => p.price);
  const avgRetailMargin = avgOf((p) => marginPercent(p.price, p.cost));

  const summaryCards = [
    { label: 'ราคาที่รับมาเฉลี่ย', value: fmt(Math.round(avgCost)), icon: PackageOpen, color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' },
    { label: 'ราคาส่งเฉลี่ย', value: fmt(Math.round(avgWholesale)), icon: Truck, color: '#38bdf8', bg: 'rgba(56,189,248,0.2)' },
    { label: 'ราคาปลีกเฉลี่ย', value: fmt(Math.round(avgRetail)), icon: Tag, color: '#c084fc', bg: 'rgba(139,92,246,0.2)' },
    { label: 'กำไรขายปลีกเฉลี่ย', value: `${avgRetailMargin.toFixed(1)}%`, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{card.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="ค้นหาสินค้าตามชื่อ หรือ SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ width: '180px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Price Table */}
      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>SKU / หมวดหมู่</th>
              <th className="num">ราคาที่รับมา</th>
              <th className="num">ราคาส่ง</th>
              <th className="num">กำไรขายส่ง</th>
              <th className="num">ราคาปลีก</th>
              <th className="num">กำไรขายปลีก</th>
              <th className="num">สต็อก</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const wholesale = product.wholesalePrice ?? 0;
              const wholesaleProfit = wholesale - product.cost;
              const retailProfit = product.price - product.cost;

              return (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, flexShrink: 0, background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ProductImage imageUrl={product.imageUrl} svgType={product.svgType} color={product.colors[0]?.hex || '#8b5cf6'} className="w-8 h-8" alt={product.name} />
                      </div>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{product.name}</div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: '600', color: '#38bdf8' }}>{product.sku}</div>
                    <span className="badge-category" style={{ marginTop: '2px', display: 'inline-block' }}>
                      {product.category}
                    </span>
                  </td>

                  <td className="num" style={{ color: '#94a3b8', fontWeight: '600' }}>
                    {fmt(product.cost)}
                  </td>

                  <td className="num" style={{ color: '#38bdf8', fontWeight: '700' }}>
                    {fmt(wholesale)}
                  </td>

                  <td className="num">
                    <div style={{ color: wholesaleProfit >= 0 ? '#10b981' : '#f43f5e', fontWeight: '700' }}>
                      {wholesaleProfit >= 0 ? '+' : '-'}{fmt(Math.abs(wholesaleProfit))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {marginPercent(wholesale, product.cost).toFixed(1)}%
                    </div>
                  </td>

                  <td className="num" style={{ color: '#c084fc', fontWeight: '700' }}>
                    {fmt(product.price)}
                  </td>

                  <td className="num">
                    <div style={{ color: retailProfit >= 0 ? '#10b981' : '#f43f5e', fontWeight: '700' }}>
                      {retailProfit >= 0 ? '+' : '-'}{fmt(Math.abs(retailProfit))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {marginPercent(product.price, product.cost).toFixed(1)}%
                    </div>
                  </td>

                  <td className="num" style={{ color: '#fff', fontWeight: '700' }}>
                    {getTotalStock(product)} ชิ้น
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-state">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</div>
        )}
      </div>
    </div>
  );
};
