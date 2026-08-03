import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ReceiptModal = ({ order, onClose }) => {
  const { settings } = useStore();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '420px', background: '#1e293b' }} onClick={(e) => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700' }}>
            <CheckCircle2 size={20} /> ชำระเงินสำเร็จ
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Printable Slip Receipt Card */}
        <div
          className="printable-receipt"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '1.5rem',
            borderRadius: '8px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '0.85rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            marginBottom: '1.25rem'
          }}
        >
          {/* Shop Branding Header */}
          <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed #94a3b8', paddingBottom: '0.75rem' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {settings.name}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>{settings.branch}</div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px', lineHeight: '1.2' }}>
              {settings.address}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
              โทร: {settings.phone} | เลขกู้ภาษี: {settings.taxId}
            </div>
          </div>

          {/* Receipt Meta */}
          <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>เลขที่ใบเสร็จ:</span>
              <strong>{order.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>วันที่-เวลา:</span>
              <span>{order.timestamp}</span>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '6px' }}>
              <span>รายการ</span>
              <span>รวม (฿)</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.75rem' }}>
                  <span>
                    [{item.size} / {item.color}] x {item.qty} @{item.price}
                    {(item.originalPrice ?? item.price) > item.price && (
                      <span style={{ marginLeft: '4px', textDecoration: 'line-through', color: '#94a3b8' }}>
                        {item.originalPrice}
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: '600', color: '#000' }}>
                    {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            {order.itemDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', color: '#b91c1c' }}>
                <span>ลดราคาสินค้า (รายชิ้น):</span>
                <span>-฿{order.itemDiscount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>ยอดรวมสินค้า (Subtotal):</span>
              <span>฿{order.subtotal.toLocaleString()}</span>
            </div>

            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', color: '#b91c1c' }}>
                <span>ส่วนลด (Discount):</span>
                <span>-฿{order.discount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '0.75rem', color: '#475569' }}>
              <span>VAT ({settings.vatRate}% รวมในราคาสินค้า):</span>
              <span>฿{order.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #000', fontSize: '1.1rem', fontWeight: '900' }}>
              <span>สุทธิ (Grand Total):</span>
              <span>฿{order.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Detail */}
          <div style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>วิธีชำระเงิน:</span>
              <strong>{order.paymentMethod}</strong>
            </div>
            {order.paymentMethod === 'Cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>รับเงินสดมา:</span>
                  <span>฿{order.receivedAmount?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontWeight: 'bold' }}>
                  <span>เงินทอน:</span>
                  <span>฿{order.changeAmount?.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer message */}
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#475569', whiteSpace: 'pre-line' }}>
            {settings.receiptFooter}
          </div>

          {/* Vector Barcode simulation */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <svg viewBox="0 0 200 40" style={{ height: '32px', margin: '0 auto' }}>
              <rect x="10" y="0" width="3" height="40" fill="#000" />
              <rect x="16" y="0" width="1" height="40" fill="#000" />
              <rect x="20" y="0" width="4" height="40" fill="#000" />
              <rect x="28" y="0" width="2" height="40" fill="#000" />
              <rect x="34" y="0" width="5" height="40" fill="#000" />
              <rect x="42" y="0" width="1" height="40" fill="#000" />
              <rect x="46" y="0" width="3" height="40" fill="#000" />
              <rect x="52" y="0" width="6" height="40" fill="#000" />
              <rect x="62" y="0" width="2" height="40" fill="#000" />
              <rect x="68" y="0" width="4" height="40" fill="#000" />
              <rect x="76" y="0" width="1" height="40" fill="#000" />
              <rect x="80" y="0" width="5" height="40" fill="#000" />
              <rect x="88" y="0" width="2" height="40" fill="#000" />
              <rect x="94" y="0" width="3" height="40" fill="#000" />
              <rect x="100" y="0" width="1" height="40" fill="#000" />
              <rect x="105" y="0" width="4" height="40" fill="#000" />
              <rect x="112" y="0" width="2" height="40" fill="#000" />
              <rect x="118" y="0" width="5" height="40" fill="#000" />
              <rect x="126" y="0" width="1" height="40" fill="#000" />
              <rect x="130" y="0" width="3" height="40" fill="#000" />
              <rect x="136" y="0" width="4" height="40" fill="#000" />
              <rect x="144" y="0" width="2" height="40" fill="#000" />
              <rect x="150" y="0" width="5" height="40" fill="#000" />
              <rect x="158" y="0" width="2" height="40" fill="#000" />
              <rect x="164" y="0" width="3" height="40" fill="#000" />
              <rect x="170" y="0" width="1" height="40" fill="#000" />
              <rect x="174" y="0" width="4" height="40" fill="#000" />
              <rect x="182" y="0" width="2" height="40" fill="#000" />
            </svg>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>*{order.id}*</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            ปิดหน้านี้
          </button>
          <button className="btn-primary" style={{ flex: 1.5 }} onClick={handlePrint}>
            <Printer size={18} /> พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>
    </div>
  );
};
