import React, { useState } from 'react';
import { Search, Printer, RotateCcw, Trash2, CheckCircle, AlertOctagon } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ReceiptModal } from '../pos/ReceiptModal';

export const OrdersView = () => {
  const { orders, refundOrder, deleteOrder, clearOrderHistory, isStaff } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer && o.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customer && o.customer.phone.includes(searchQuery))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Search Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="ค้นหาตามเลขที่ออเดอร์ หรือ ชื่อ/เบอร์โทร ลูกค้าสมาชิก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!isStaff && orders.length > 0 && (
          <button
            className="btn-danger"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              if (
                window.confirm(
                  `ลบประวัติการขายทั้งหมด ${orders.length} รายการใช่หรือไม่?\n\nรายการเงินเข้า-ออกที่ระบบบันทึกอัตโนมัติจากบิลเหล่านี้จะถูกลบไปด้วย และสต็อกสินค้าจะไม่ถูกคืน (การกระทำนี้ย้อนกลับไม่ได้)`
                )
              ) {
                clearOrderHistory();
              }
            }}
          >
            <Trash2 size={18} /> ลบประวัติทั้งหมด
          </button>
        )}
      </div>

      {/* Orders List Table */}
      <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>เลขที่ออเดอร์ / เวลา</th>
              <th>ลูกค้าสมาชิก</th>
              <th>รายการสินค้า</th>
              <th>วิธีชำระเงิน</th>
              <th className="num">ยอดรวมสุทธิ</th>
              <th>สถานะ</th>
              <th className="num">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: '700', color: '#38bdf8' }}>{order.id}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{order.timestamp}</div>
                </td>

                <td>
                  {order.customer ? (
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{order.customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#ec4899' }}>{order.customer.tier} Tier</div>
                    </div>
                  ) : (
                    <span style={{ color: '#64748b' }}>ลูกค้าทั่วไป</span>
                  )}
                </td>

                <td style={{ minWidth: '220px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                    {order.items.map((i) => `${i.name} [${i.size}/${i.color}] x${i.qty}`).join(', ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    รวม {order.items.reduce((a, c) => a + c.qty, 0)} ชิ้น
                  </div>
                </td>

                <td>
                  <span style={{ background: '#0f172a', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #334155', whiteSpace: 'nowrap' }}>
                    {order.paymentMethod}
                  </span>
                </td>

                <td className="num">
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: order.status === 'Refunded' ? '#94a3b8' : '#10b981' }}>
                    ฿{order.grandTotal.toLocaleString()}
                  </div>
                </td>

                <td>
                  {order.status === 'Completed' ? (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                      <CheckCircle size={14} /> สำเร็จ
                    </span>
                  ) : (
                    <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}>
                      <AlertOctagon size={14} /> คืนเงินแล้ว
                    </span>
                  )}
                </td>

                <td className="num">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={() => setSelectedOrderForReceipt(order)}
                    >
                      <Printer size={14} /> ดู/พิมพ์ใบเสร็จ
                    </button>
                    {!isStaff && order.status === 'Completed' && (
                      <button
                        className="btn-danger"
                        style={{ padding: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        title="ยกเลิกและคืนสต็อก"
                        onClick={() => {
                          if (window.confirm(`คุณต้องการยกเลิกออเดอร์ ${order.id} และคืนสต็อกสินค้าใช่หรือไม่?`)) {
                            refundOrder(order.id);
                          }
                        }}
                      >
                        <RotateCcw size={14} /> คืนเงิน
                      </button>
                    )}
                    {!isStaff && (
                      <button
                        className="btn-danger"
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                        title="ลบรายการนี้ออกจากประวัติ"
                        onClick={() => {
                          if (
                            window.confirm(
                              `ลบออเดอร์ ${order.id} ออกจากประวัติการขายใช่หรือไม่?\n\nรายการเงินเข้า-ออกที่ระบบบันทึกอัตโนมัติจากบิลนี้จะถูกลบไปด้วย และสต็อกสินค้าจะไม่ถูกคืน (ถ้าลูกค้าคืนของ ให้กด "คืนเงิน" แทน)`
                            )
                          ) {
                            deleteOrder(order.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="empty-state">ยังไม่มีรายการขายที่ตรงกับการค้นหา</div>
        )}
      </div>

      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
};
