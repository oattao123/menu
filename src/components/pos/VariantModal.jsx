import React, { useState } from 'react';
import { X, Check, ShoppingBag } from 'lucide-react';
import { ProductImage } from '../ProductImage';

export const VariantModal = ({ product, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: 'สีดำ', hex: '#1e293b' });
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const variantKey = `${selectedSize}-${selectedColor.name}`;
  const availableStock = product.stockMatrix[variantKey] ?? 0;
  const isOutOfStock = availableStock <= 0;

  const handleConfirm = () => {
    if (isOutOfStock) return;
    onAddToCart({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      size: selectedSize,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      price: product.price,
      originalPrice: product.price,
      cost: product.cost,
      qty: Math.min(qty, availableStock),
      svgType: product.svgType,
      imageUrl: product.imageUrl,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>เลือกลักษณะสินค้า (ไซส์ & สี)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Product Summary Header */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '12px', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#1e293b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProductImage imageUrl={product.imageUrl} svgType={product.svgType} color={selectedColor.hex} className="w-12 h-12" alt={product.name} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>SKU: {product.sku}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>{product.name}</div>
            <div style={{ fontSize: '1.1rem', color: '#c084fc', fontWeight: '700', marginTop: '4px' }}>
              ฿{product.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Size Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>
            เลือกขนาด (Size)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {product.sizes.map((sz) => (
              <button
                key={sz}
                className={`size-chip ${selectedSize === sz ? 'selected' : ''}`}
                onClick={() => setSelectedSize(sz)}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>
            เลือกสี (Color): <span style={{ color: '#fff' }}>{selectedColor.name}</span>
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {product.colors.map((col) => (
              <button
                key={col.name}
                className={`color-swatch-btn ${selectedColor.name === col.name ? 'selected' : ''}`}
                style={{ backgroundColor: col.hex }}
                onClick={() => setSelectedColor(col)}
                title={col.name}
              >
                {selectedColor.name === col.name && (
                  <Check size={14} style={{ color: col.hex === '#ffffff' ? '#000' : '#fff', position: 'absolute', top: 5, left: 5 }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Status & Quantity */}
        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: isOutOfStock ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${isOutOfStock ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: isOutOfStock ? '#f43f5e' : '#10b981', fontWeight: '700' }}>
              {isOutOfStock ? '⚠️ ไม่มีสินค้าในสต็อก (Out of Stock)' : `✅ มีสินค้าพร้อมขาย ${availableStock} ชิ้น`}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              ไซส์ {selectedSize} - {selectedColor.name}
            </div>
          </div>

          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ width: 32, height: 32, borderRadius: '6px', background: '#334155', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ fontWeight: '700', width: 24, textAlign: 'center' }}>{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
                style={{ width: 32, height: 32, borderRadius: '6px', background: '#334155', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2, opacity: isOutOfStock ? 0.5 : 1 }}
            disabled={isOutOfStock}
            onClick={handleConfirm}
          >
            <ShoppingBag size={18} /> ใส่ตะกร้าสินค้า
          </button>
        </div>
      </div>
    </div>
  );
};
