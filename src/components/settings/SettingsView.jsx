import React, { useState } from 'react';
import { Save, Download, Upload, RefreshCw, Store, ShieldCheck, Database, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const SettingsView = () => {
  const { settings, updateSettings, resetToDefaultData, exportDataJSON, importDataJSON } = useStore();

  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = importDataJSON(evt.target.result);
      if (res.success) {
        setImportStatus('นำเข้าข้อมูลสำรองสำเร็จแล้ว!');
      } else {
        setImportStatus(`เกิดข้อผิดพลาด: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      <form onSubmit={handleSave} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc' }}>
          <Store size={22} /> ข้อมูลร้านค้าและหัวใบเสร็จรับเงิน
        </h3>

        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>ชื่อร้านค้า</label>
            <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>ชื่อสาขา</label>
            <input type="text" className="input-field" name="branch" value={formData.branch} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>ที่อยู่ร้านค้า (แสดงบนใบเสร็จ)</label>
          <input type="text" className="input-field" name="address" value={formData.address} onChange={handleChange} required />
        </div>

        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>เบอร์โทรศัพท์ร้าน</label>
            <input type="text" className="input-field" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
            <input type="text" className="input-field" name="taxId" value={formData.taxId} onChange={handleChange} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>เลขพร้อมเพย์ (รับชำระเงิน QR)</label>
            <input type="text" className="input-field" name="promptPayId" value={formData.promptPayId} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>
            PIN เจ้าของร้าน (ใช้ปลดล็อกออกจากโหมดพนักงาน)
          </label>
          <input
            type="text"
            inputMode="numeric"
            className="input-field"
            style={{ maxWidth: '180px', letterSpacing: '0.3rem' }}
            name="staffPin"
            value={formData.staffPin ?? '1234'}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>ข้อความท้ายใบเสร็จรับเงิน</label>
          <textarea
            className="input-field"
            rows={3}
            name="receiptFooter"
            value={formData.receiptFooter}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
            <Save size={18} /> บันทึกการตั้งค่า
          </button>
          {saveSuccess && (
            <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={18} /> บันทึกเรียบร้อยแล้ว!
            </span>
          )}
        </div>
      </form>

      {/* Offline Backup & Restore Section */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
          <Database size={22} /> การสำรองข้อมูล (Offline JSON Backup & Restore)
        </h3>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          สำรองข้อมูลสินค้า สต็อก รายการขาย และสมาชิกไว้ในเครื่อง หรือนำเข้าข้อมูลเดิมเมื่อเปลี่ยนเครื่อง
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={exportDataJSON} style={{ color: '#38bdf8', borderColor: '#38bdf8' }}>
            <Download size={18} /> ส่งออกข้อมูลเป็นไฟล์ JSON (Export)
          </button>

          <label className="btn-secondary" style={{ cursor: 'pointer', color: '#c084fc', borderColor: '#c084fc' }}>
            <Upload size={18} /> นำเข้าข้อมูลจากไฟล์ JSON (Import)
            <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
          </label>

          <button
            className="btn-danger"
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่?')) {
                resetToDefaultData();
                window.location.reload();
              }
            }}
          >
            <RefreshCw size={18} /> รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้น
          </button>
        </div>

        {importStatus && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', color: '#10b981', fontWeight: '600', fontSize: '0.85rem' }}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};
