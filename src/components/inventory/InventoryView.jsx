import React, { useState } from 'react';
import { Search, Plus, AlertTriangle, Edit3, Trash2, Layers, Package, DollarSign, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../ProductImage';
import { ProductFormModal } from './ProductFormModal';

export const InventoryView = () => {
  const { products, deleteProduct, updateStockVariant, categories, isStaff } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [expandedProductId, setExpandedProductId] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Compute stock totals for products
  const getProductTotalStock = (p) => {
    if (!p.stockMatrix) return 0;
    return Object.values(p.stockMatrix).reduce((acc, curr) => acc + curr, 0);
  };

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const totalStock = getProductTotalStock(p);
    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = totalStock > 0 && totalStock <= 5;
    if (stockFilter === 'out') matchesStock = totalStock === 0;

    return matchesCategory && matchesQuery && matchesStock;
  });

  // Calculate High-level Inventory Stats
  const totalItemTypes = products.length;
  const totalStockPieces = products.reduce((acc, p) => acc + getProductTotalStock(p), 0);
  const lowStockCount = products.filter((p) => {
    const s = getProductTotalStock(p);
    return s > 0 && s <= 5;
  }).length;
  const totalInventoryValue = products.reduce((acc, p) => acc + p.cost * getProductTotalStock(p), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Top Stat Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>จำนวนรายการสินค้าทั้งหมด</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{totalItemTypes} SKUs</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>จำนวนเสื้อผ้าคงเหลือรวม</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{totalStockPieces.toLocaleString()} ชิ้น</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>สินค้าเตือนสต็อกต่ำ (≤5)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: lowStockCount > 0 ? '#f43f5e' : '#fff' }}>{lowStockCount} รายการ</div>
          </div>
        </div>

        {!isStaff && (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>มูลค่าคลังสินค้าตามต้นทุน</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>฿{totalInventoryValue.toLocaleString()}</div>
          </div>
        </div>
        )}
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
          style={{ width: '160px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          style={{ width: '160px' }}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">สต็อกทุกแบบ</option>
          <option value="low">เฉพาะสต็อกต่ำ (≤5)</option>
          <option value="out">เฉพาะสินค้าหมด</option>
        </select>

        <button className="btn-primary" onClick={() => setIsAddFormOpen(true)}>
          <Plus size={18} /> เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* Inventory Table */}
      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>SKU / หมวดหมู่</th>
              <th>{isStaff ? 'ราคาขายปลีก' : 'ราคารับมา / ส่ง / ปลีก'}</th>
              <th>จำนวนสต็อกรวม</th>
              <th>รายละเอียด Variant</th>
              {!isStaff && <th className="num">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const totalStock = getProductTotalStock(product);
              const isExpanded = expandedProductId === product.id;

              return (
                <React.Fragment key={product.id}>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, flexShrink: 0, background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ProductImage imageUrl={product.imageUrl} svgType={product.svgType} color={product.colors[0]?.hex || '#8b5cf6'} className="w-8 h-8" alt={product.name} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {product.sizes.join(', ')} | {product.colors.map((c) => c.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: '#38bdf8' }}>{product.sku}</div>
                      <span className="badge-category" style={{ marginTop: '2px', display: 'inline-block' }}>
                        {product.category}
                      </span>
                      {!isStaff && product.needsCostReview && (
                        <div>
                          <span className="badge-low-stock" style={{ marginTop: '4px', display: 'inline-block' }}>
                            รอกรอกราคาทุน
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      {!isStaff && (
                        <>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>รับมา: ฿{product.cost.toLocaleString()}</div>
                          <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: '600' }}>ส่ง: ฿{(product.wholesalePrice ?? 0).toLocaleString()}</div>
                        </>
                      )}
                      <div style={{ fontWeight: '700', color: '#c084fc' }}>
                        {isStaff ? '' : 'ปลีก: '}฿{product.price.toLocaleString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: totalStock <= 5 ? '#f43f5e' : '#10b981' }}>
                          {totalStock} ชิ้น
                        </span>
                        {totalStock <= 5 && <AlertTriangle size={16} color="#f43f5e" />}
                      </div>
                    </td>

                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} ดูตารางสต็อก
                      </button>
                    </td>

                    {!isStaff && (
                    <td className="num">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.4rem', color: '#38bdf8' }}
                          title="แก้ไข"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '0.4rem' }}
                          title="ลบ"
                          onClick={() => {
                            if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า ${product.name}?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>

                  {/* Expanded Variant Stock Matrix Row */}
                  {isExpanded && (
                    <tr style={{ background: '#0f172a' }}>
                      <td colSpan={isStaff ? 5 : 6} style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '700', marginBottom: '0.5rem' }}>
                          ตารางปรับปรุงสต็อก (Variant Matrix Stock)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                          {product.sizes.map((sz) =>
                            product.colors.map((col) => {
                              const key = `${sz}-${col.name}`;
                              const currentQty = product.stockMatrix[key] || 0;
                              return (
                                <div key={key} style={{ background: '#1e293b', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--bg-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.8rem' }}>
                                      {sz} - {col.name}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>สต็อก: {currentQty}</span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button
                                      onClick={() => updateStockVariant(product.id, sz, col.name, currentQty - 1)}
                                      style={{ width: 22, height: 22, borderRadius: '4px', background: '#334155', border: 'none', color: '#fff', cursor: 'pointer' }}
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      style={{ width: '36px', textAlign: 'center', background: '#0f172a', border: '1px solid #475569', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                      value={currentQty}
                                      onChange={(e) => updateStockVariant(product.id, sz, col.name, parseInt(e.target.value) || 0)}
                                    />
                                    <button
                                      onClick={() => updateStockVariant(product.id, sz, col.name, currentQty + 1)}
                                      style={{ width: 22, height: 22, borderRadius: '4px', background: '#334155', border: 'none', color: '#fff', cursor: 'pointer' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-state">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</div>
        )}
      </div>

      {/* Product Add / Edit Modal */}
      {(isAddFormOpen || editingProduct) && (
        <ProductFormModal
          productToEdit={editingProduct}
          onClose={() => {
            setIsAddFormOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
