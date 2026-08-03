import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Tag, CreditCard, RotateCcw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductImage } from '../ProductImage';
import { VariantModal } from './VariantModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

export const PosView = () => {
  const { products, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [manualDiscount, setManualDiscount] = useState(0);

  // Modals
  const [activeVariantProduct, setActiveVariantProduct] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Calculate Total Stock of a Product across variants
  const getProductTotalStock = (p) => {
    if (!p.stockMatrix) return 0;
    return Object.values(p.stockMatrix).reduce((acc, curr) => acc + curr, 0);
  };

  // Add Item to Cart
  const handleAddToCart = (itemVariant) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.productId === itemVariant.productId && ci.size === itemVariant.size && ci.color === itemVariant.color
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].qty += itemVariant.qty;
        return updated;
      } else {
        return [...prev, itemVariant];
      }
    });
  };

  const handleUpdateCartQty = (idx, delta) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].qty + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].qty = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (idx) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Adjust the price actually charged for one cart line (e.g. discount given to the customer)
  const handleUpdateCartPrice = (idx, val) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const parsed = parseFloat(val);
      updated[idx] = { ...updated[idx], price: Math.max(0, isNaN(parsed) ? 0 : parsed) };
      return updated;
    });
  };

  const handleResetCartPrice = (idx) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], price: updated[idx].originalPrice ?? updated[idx].price };
      return updated;
    });
  };

  // Cart Calculations
  const originalSubtotal = cartItems.reduce(
    (acc, item) => acc + (item.originalPrice ?? item.price) * item.qty,
    0
  );
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const itemDiscount = originalSubtotal - subtotal;
  const discountAmount = Math.min(subtotal, Math.max(0, manualDiscount));
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * 7) / 107; // 7% VAT included
  const grandTotal = afterDiscount;

  const handlePaymentSuccess = (order) => {
    setIsPaymentOpen(false);
    setCartItems([]);
    setManualDiscount(0);
    setCompletedOrder(order);
  };

  return (
    <div className="pos-layout" style={{ display: 'flex', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
      {/* Catalog Area (Left) */}
      <div className="pos-catalog" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="ค้นหาชื่อสินค้า หรือ รหัส SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`size-chip ${selectedCategory === cat ? 'selected' : ''}`}
              style={{ whiteSpace: 'nowrap', padding: '0.55rem 1rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="pos-grid" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', paddingRight: '4px' }}>
          {filteredProducts.map((product) => {
            const totalStock = getProductTotalStock(product);
            const isLowStock = totalStock > 0 && totalStock <= 5;
            const isOutOfStock = totalStock === 0;

            return (
              <div
                key={product.id}
                className={`glass-card product-card ${isOutOfStock ? 'is-disabled' : ''}`}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.55 : 1,
                  position: 'relative'
                }}
                onClick={() => !isOutOfStock && setActiveVariantProduct(product)}
              >
                <div>
                  {/* Card Visual Icon Header */}
                  <div style={{ width: '100%', height: '110px', background: 'rgba(15,23,42,0.6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', position: 'relative' }}>
                    <ProductImage imageUrl={product.imageUrl} svgType={product.svgType} color={product.colors[0]?.hex || '#64748b'} className="w-16 h-16" alt={product.name} />
                    
                    {/* Size Badges preview */}
                    <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: '3px' }}>
                      {product.sizes.map((sz) => (
                        <span key={sz} style={{ fontSize: '0.65rem', background: '#334155', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
                          {sz}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge-category">{product.category}</span>
                    {isLowStock && <span className="badge-low-stock">เหลือ {totalStock} ชิ้น</span>}
                    {isOutOfStock && <span className="badge-low-stock" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>หมด</span>}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#fff', marginTop: '6px', lineHeight: '1.3' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    SKU: {product.sku}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--bg-card-border)' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#c084fc' }}>
                    ฿{product.price.toLocaleString()}
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    disabled={isOutOfStock}
                  >
                    + เลือกไซส์
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Drawer Panel (Right) */}
      <div className="glass-card pos-cart" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--bg-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.1rem' }}>
            <ShoppingCart size={20} color="#c084fc" /> ตะกร้าสินค้า ({cartItems.reduce((a, c) => a + c.qty, 0)})
          </div>
          {cartItems.length > 0 && (
            <button onClick={() => setCartItems([])} style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Trash2 size={14} /> ล้างตะกร้า
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>ยังไม่มีสินค้าในตะกร้า</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>กดเลือกไซส์และสีสินค้าจากฝั่งซ้ายเพื่อใส่ตะกร้า</div>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={idx} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ProductImage imageUrl={item.imageUrl} svgType={item.svgType} color={item.colorHex || '#8b5cf6'} className="w-8 h-8" alt={item.name} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span style={{ background: '#334155', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: '700' }}>
                      {item.size}
                    </span>
                    <span>{item.color}</span>
                  </div>
                  {/* Editable unit price — lower it to give the customer a discount */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ราคา/ชิ้น</span>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      style={{ width: '68px', padding: '2px 6px', fontSize: '0.78rem', textAlign: 'right' }}
                      value={item.price}
                      onChange={(e) => handleUpdateCartPrice(idx, e.target.value)}
                    />
                    {(item.originalPrice ?? item.price) !== item.price && (
                      <>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textDecoration: 'line-through' }}>
                          ฿{(item.originalPrice ?? item.price).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleResetCartPrice(idx)}
                          title="คืนราคาเดิม"
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          <RotateCcw size={12} />
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: '700', marginTop: '2px' }}>
                    ฿{(item.price * item.qty).toLocaleString()}
                    {(item.originalPrice ?? item.price) > item.price && (
                      <span style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: '600', marginLeft: '6px' }}>
                        ลด ฿{(((item.originalPrice ?? item.price) - item.price) * item.qty).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Qty Counter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button onClick={() => handleUpdateCartQty(idx, -1)} style={{ width: 24, height: 24, borderRadius: '4px', background: '#334155', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <Minus size={12} />
                  </button>
                  <span style={{ width: 20, textAlign: 'center', fontWeight: '700', fontSize: '0.85rem' }}>{item.qty}</span>
                  <button onClick={() => handleUpdateCartQty(idx, 1)} style={{ width: 24, height: 24, borderRadius: '4px', background: '#334155', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Totals */}
        <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {itemDiscount > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>ราคาเต็ม</span>
                <span style={{ textDecoration: 'line-through' }}>฿{originalSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ec4899' }}>
                <span>ลดราคาสินค้า (รายชิ้น)</span>
                <span>-฿{itemDiscount.toLocaleString()}</span>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>ยอดรวมสินค้า</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} color="#ec4899" /> ส่วนลดท้ายบิล (Discount)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                className="input-field"
                style={{ width: '80px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right' }}
                value={manualDiscount}
                onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
              />
              <span style={{ color: '#ec4899', fontWeight: '600' }}>฿</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>ภาษีมูลค่าเพิ่ม (VAT 7% รวมแล้ว)</span>
            <span>฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #334155' }}>
            <span>สุทธิ (Grand Total)</span>
            <span style={{ color: '#10b981' }}>฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', fontSize: '1rem', opacity: cartItems.length === 0 ? 0.5 : 1 }}
            disabled={cartItems.length === 0}
            onClick={() => setIsPaymentOpen(true)}
          >
            <CreditCard size={20} /> ชำระเงิน (฿{grandTotal.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Modals */}
      {activeVariantProduct && (
        <VariantModal
          product={activeVariantProduct}
          onClose={() => setActiveVariantProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          cartItems={cartItems}
          subtotal={subtotal}
          itemDiscount={itemDiscount}
          discount={discountAmount}
          vatAmount={vatAmount}
          grandTotal={grandTotal}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
};
