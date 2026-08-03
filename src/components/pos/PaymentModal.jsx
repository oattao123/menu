import React, { useState } from 'react';
import { X, Banknote, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const PaymentModal = ({ cartItems, subtotal, itemDiscount = 0, discount, vatAmount, grandTotal, onClose, onPaymentSuccess }) => {
  const { settings, createOrder } = useStore();
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, PromptPay, CreditCard
  const [receivedAmount, setReceivedAmount] = useState(grandTotal.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  const numReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numReceived - grandTotal);
  const isCashInsufficient = paymentMethod === 'Cash' && numReceived < grandTotal;

  const handleQuickCash = (amount) => {
    setReceivedAmount(amount.toString());
  };

  const handleConfirmPayment = () => {
    if (isCashInsufficient) return;
    setIsProcessing(true);

    setTimeout(() => {
      const orderPayload = {
        items: cartItems,
        subtotal,
        itemDiscount,
        discount,
        vatAmount,
        grandTotal,
        paymentMethod,
        receivedAmount: paymentMethod === 'Cash' ? numReceived : grandTotal,
        changeAmount: paymentMethod === 'Cash' ? changeAmount : 0,
      };

      const newOrder = createOrder(orderPayload);
      setIsProcessing(false);
      onPaymentSuccess(newOrder);
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>ชำระเงิน (Payment)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Total Grand Amount Banner */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: '14px', padding: '1.25rem', color: '#fff', textAlign: 'center', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>ยอดรวมที่ต้องชำระทั้งสิ้น</div>
          <div style={{ fontSize: '2.4rem', fontWeight: '800', margin: '4px 0' }}>
            ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setPaymentMethod('Cash')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '0.85rem 0.5rem',
              borderRadius: '10px',
              border: paymentMethod === 'Cash' ? '2px solid #8b5cf6' : '1px solid var(--bg-card-border)',
              background: paymentMethod === 'Cash' ? 'rgba(139,92,246,0.15)' : 'var(--bg-surface)',
              color: paymentMethod === 'Cash' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <Banknote size={24} color={paymentMethod === 'Cash' ? '#8b5cf6' : '#94a3b8'} />
            เงินสด (Cash)
          </button>

          <button
            onClick={() => setPaymentMethod('PromptPay')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '0.85rem 0.5rem',
              borderRadius: '10px',
              border: paymentMethod === 'PromptPay' ? '2px solid #8b5cf6' : '1px solid var(--bg-card-border)',
              background: paymentMethod === 'PromptPay' ? 'rgba(139,92,246,0.15)' : 'var(--bg-surface)',
              color: paymentMethod === 'PromptPay' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <QrCode size={24} color={paymentMethod === 'PromptPay' ? '#8b5cf6' : '#94a3b8'} />
            พร้อมเพย์ (QR)
          </button>

          <button
            onClick={() => setPaymentMethod('CreditCard')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '0.85rem 0.5rem',
              borderRadius: '10px',
              border: paymentMethod === 'CreditCard' ? '2px solid #8b5cf6' : '1px solid var(--bg-card-border)',
              background: paymentMethod === 'CreditCard' ? 'rgba(139,92,246,0.15)' : 'var(--bg-surface)',
              color: paymentMethod === 'CreditCard' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <CreditCard size={24} color={paymentMethod === 'CreditCard' ? '#8b5cf6' : '#94a3b8'} />
            บัตรเครดิต (Card)
          </button>
        </div>

        {/* Dynamic Content based on Method */}
        {paymentMethod === 'Cash' && (
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>
              จำนวนเงินที่ได้รับจากลูกค้า (บาท)
            </label>
            <input
              type="number"
              className="input-field"
              style={{ fontSize: '1.5rem', fontWeight: '700', textIndent: '4px' }}
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              placeholder="0.00"
            />

            {/* Quick cash amounts */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button className="size-chip" onClick={() => handleQuickCash(grandTotal)}>พอดีเป๊ะ</button>
              <button className="size-chip" onClick={() => handleQuickCash(Math.ceil(grandTotal / 100) * 100)}>ปัดขึ้น 100</button>
              <button className="size-chip" onClick={() => handleQuickCash(500)}>500</button>
              <button className="size-chip" onClick={() => handleQuickCash(1000)}>1,000</button>
              <button className="size-chip" onClick={() => handleQuickCash(2000)}>2,000</button>
            </div>

            {/* Change Result */}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontWeight: '600' }}>เงินทอน (Change):</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: isCashInsufficient ? '#f43f5e' : '#10b981' }}>
                {isCashInsufficient ? 'รับเงินไม่ครบ' : `฿${changeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === 'PromptPay' && (
          <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: '700', marginBottom: '0.5rem' }}>
              สแกน QR Code เพื่อชำระเงินผ่าน พร้อมเพย์ (PromptPay)
            </div>
            
            {/* Offline Vector QR Code Representation */}
            <div style={{ width: 180, height: 180, background: '#fff', padding: '12px', borderRadius: '12px', margin: '0 auto 1rem auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '3px solid #0284c7' }}>
              <svg viewBox="0 0 100 100" fill="#0f172a" style={{ width: '100%', height: '100%' }}>
                <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                <rect x="10" y="10" width="15" height="15" fill="#fff" />
                <rect x="14" y="14" width="7" height="7" fill="#0f172a" />

                <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                <rect x="75" y="10" width="15" height="15" fill="#fff" />
                <rect x="79" y="14" width="7" height="7" fill="#0f172a" />

                <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                <rect x="10" y="75" width="15" height="15" fill="#fff" />
                <rect x="14" y="79" width="7" height="7" fill="#0f172a" />

                <rect x="40" y="10" width="8" height="8" />
                <rect x="52" y="18" width="8" height="8" />
                <rect x="35" y="30" width="12" height="12" />
                <rect x="52" y="32" width="12" height="8" />
                <rect x="70" y="45" width="10" height="10" />
                <rect x="40" y="55" width="15" height="8" />
                <rect x="65" y="70" width="12" height="12" />
                <rect x="42" y="75" width="8" height="15" />
              </svg>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              เลขพร้อมเพย์: <strong style={{ color: '#fff' }}>{settings.promptPayId}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              บัญชี: <strong>{settings.name}</strong>
            </div>
          </div>
        )}

        {paymentMethod === 'CreditCard' && (
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'center' }}>
            <CreditCard size={48} color="#c084fc" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>แตะหรือเสียบบัตรที่เครื่อง EDC</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              รองรับ VISA, Mastercard, JCB, UnionPay
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', opacity: isCashInsufficient || isProcessing ? 0.6 : 1 }}
            disabled={isCashInsufficient || isProcessing}
            onClick={handleConfirmPayment}
          >
            {isProcessing ? (
              'กำลังบันทึกออเดอร์...'
            ) : (
              <>
                <CheckCircle2 size={18} /> ยืนยันการชำระเงิน
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
