// Offline Seed Data for Fashion Store Management System

export const INITIAL_STORE_SETTINGS = {
  name: "CHIC CLOTHING BOUTIQUE",
  branch: "สาขาใหญ่ (Central Plaza)",
  address: "99/9 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: "081-234-5678",
  taxId: "0105565001234",
  promptPayId: "0812345678",
  vatRate: 7,
  staffPin: "1234",
  currency: "฿",
  receiptFooter: "ขอบคุณที่อุดหนุนสินค้ากับ CHIC BOUTIQUE\nสินค้าซื้อแล้วเปลี่ยนคืนได้ภายใน 7 วัน (พร้อมใบเสร็จและป้ายสินค้า)",
};

export const CLOTHING_CATEGORIES = [
  "ทั้งหมด",
  "เสื้อยืด",
  "เสื้อเชิ้ต",
  "กางเกง & ยีนส์",
  "เดรส & กระโปรง",
  "แจ็คเก็ต & เสื้อคลุม",
  "เครื่องประดับ"
];

export const AVAILABLE_SIZES = ["S", "M", "L", "XL", "2XL"];

export const AVAILABLE_COLORS = [
  { name: "สีดำ", hex: "#1e293b" },
  { name: "สีขาว", hex: "#ffffff" },
  { name: "สีเทาท็อปดราย", hex: "#94a3b8" },
  { name: "สีครีมมินิมอล", hex: "#fef3c7" },
  { name: "สีน้ำเงินกรมท่า", hex: "#1e3a8a" },
  { name: "สีแดงไวน์", hex: "#881337" },
  { name: "สีเขียวมะกอก", hex: "#3f6212" },
  { name: "สีชมพูพาสเทล", hex: "#f472b6" },
  { name: "สีน้ำตาลเบจ", hex: "#78350f" },
];

export const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    sku: "TSH-101",
    name: "เสื้อยืด Cotton 100% Premium Oversize",
    category: "เสื้อยืด",
    price: 390,
    wholesalePrice: 290,
    cost: 180,
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "สีดำ", hex: "#1e293b" },
      { name: "สีขาว", hex: "#ffffff" },
      { name: "สีครีมมินิมอล", hex: "#fef3c7" },
      { name: "สีน้ำเงินกรมท่า", hex: "#1e3a8a" }
    ],
    stockMatrix: {
      "S-สีดำ": 12, "M-สีดำ": 15, "L-สีดำ": 8, "XL-สีดำ": 5, "2XL-สีดำ": 2,
      "S-สีขาว": 20, "M-สีขาว": 18, "L-สีขาว": 10, "XL-สีขาว": 4, "2XL-สีขาว": 3,
      "S-สีครีมมินิมอล": 8, "M-สีครีมมินิมอล": 10, "L-สีครีมมินิมอล": 6, "XL-สีครีมมินิมอล": 2, "2XL-สีครีมมินิมอล": 0,
      "S-สีน้ำเงินกรมท่า": 5, "M-สีน้ำเงินกรมท่า": 7, "L-สีน้ำเงินกรมท่า": 4, "XL-สีน้ำเงินกรมท่า": 2, "2XL-สีน้ำเงินกรมท่า": 1,
    },
    svgType: "tshirt",
    description: "เสื้อยืดคอตตอนแท้ 100% ผ้านุ่ม ใส่สบาย ระบายอากาศดี ไม่หดไม่ย้วย",
  },
  {
    id: "prod-2",
    sku: "SHI-202",
    name: "เสื้อเชิ้ตผ้าลินินแท้ แขนยาวทรง Relaxed",
    category: "เสื้อเชิ้ต",
    price: 690,
    wholesalePrice: 490,
    cost: 320,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "สีขาว", hex: "#ffffff" },
      { name: "สีครีมมินิมอล", hex: "#fef3c7" },
      { name: "สีเขียวมะกอก", hex: "#3f6212" },
      { name: "สีฟ้าพาสเทล", hex: "#38bdf8" }
    ],
    stockMatrix: {
      "S-สีขาว": 8, "M-สีขาว": 12, "L-สีขาว": 9, "XL-สีขาว": 4,
      "S-สีครีมมินิมอล": 6, "M-สีครีมมินิมอล": 7, "L-สีครีมมินิมอล": 5, "XL-สีครีมมินิมอล": 2,
      "S-สีเขียวมะกอก": 4, "M-สีเขียวมะกอก": 6, "L-สีเขียวมะกอก": 3, "XL-สีเขียวมะกอก": 1,
      "S-สีฟ้าพาสเทล": 5, "M-สีฟ้าพาสเทล": 8, "L-สีฟ้าพาสเทล": 4, "XL-สีฟ้าพาสเทล": 2
    },
    svgType: "shirt",
    description: "เสื้อเชิ้ตลินินใส่ได้ทั้งทำงานและเที่ยว ระบายอากาศดีเยี่ยม ให้ลุคสุภาพผ่อนคลาย",
  },
  {
    id: "prod-3",
    sku: "PNT-303",
    name: "กางเกงสแล็คทรงกระบอกเล็ก ผ้าชิโน่ยืด",
    category: "กางเกง & ยีนส์",
    price: 890,
    wholesalePrice: 650,
    cost: 410,
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "สีดำ", hex: "#1e293b" },
      { name: "สีน้ำเงินกรมท่า", hex: "#1e3a8a" },
      { name: "สีน้ำตาลเบจ", hex: "#78350f" }
    ],
    stockMatrix: {
      "S-สีดำ": 10, "M-สีดำ": 14, "L-สีดำ": 12, "XL-สีดำ": 6, "2XL-สีดำ": 2,
      "S-สีน้ำเงินกรมท่า": 8, "M-สีน้ำเงินกรมท่า": 10, "L-สีน้ำเงินกรมท่า": 7, "XL-สีน้ำเงินกรมท่า": 4, "2XL-สีน้ำเงินกรมท่า": 1,
      "S-สีน้ำตาลเบจ": 5, "M-สีน้ำตาลเบจ": 8, "L-สีน้ำตาลเบจ": 6, "XL-สีน้ำตาลเบจ": 3, "2XL-สีน้ำตาลเบจ": 1
    },
    svgType: "pants",
    description: "กางเกงขาแน่นทรงสวย ยืดหยุ่นลุกนั่งสบาย ลุคสมาร์ทแคชชวล",
  },
  {
    id: "prod-4",
    sku: "DRS-404",
    name: "เดรสสั้นคอV สไตล์เกาหลี ผูกเอวปรับทรง",
    category: "เดรส & กระโปรง",
    price: 790,
    wholesalePrice: 570,
    cost: 350,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "สีชมพูพาสเทล", hex: "#f472b6" },
      { name: "สีครีมมินิมอล", hex: "#fef3c7" },
      { name: "สีแดงไวน์", hex: "#881337" }
    ],
    stockMatrix: {
      "S-สีชมพูพาสเทล": 6, "M-สีชมพูพาสเทล": 9, "L-สีชมพูพาสเทล": 4,
      "S-สีครีมมินิมอล": 5, "M-สีครีมมินิมอล": 8, "L-สีครีมมินิมอล": 3,
      "S-สีแดงไวน์": 3, "M-สีแดงไวน์": 5, "L-สีแดงไวน์": 2
    },
    svgType: "dress",
    description: "เดรสทรงเอเข้ารูปกำลังดี ผ้าชีฟองเกรดพรีเมียมพร้อมซับในทั้งตัว",
  },
  {
    id: "prod-5",
    sku: "JCK-505",
    name: "แจ็คเก็ตยีนส์ Denim Vintage Fit",
    category: "แจ็คเก็ต & เสื้อคลุม",
    price: 1290,
    wholesalePrice: 950,
    cost: 590,
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "สีน้ำเงินกรมท่า", hex: "#1e3a8a" },
      { name: "สีดำ", hex: "#1e293b" }
    ],
    stockMatrix: {
      "M-สีน้ำเงินกรมท่า": 5, "L-สีน้ำเงินกรมท่า": 6, "XL-สีน้ำเงินกรมท่า": 3,
      "M-สีดำ": 4, "L-สีดำ": 5, "XL-สีดำ": 2
    },
    svgType: "jacket",
    description: "เสื้อยีนส์ฟอกนุ่ม ทรงสตรีทวินเทจ กระดุมโลหะรมดำ ทนทานใส่ได้นาน",
  },
  {
    id: "prod-6",
    sku: "ACC-606",
    name: "หมวกแก๊ปปักลายมินิมอล Adjustable Cap",
    category: "เครื่องประดับ",
    price: 350,
    wholesalePrice: 250,
    cost: 140,
    sizes: ["Free Size"],
    colors: [
      { name: "สีดำ", hex: "#1e293b" },
      { name: "สีครีมมินิมอล", hex: "#fef3c7" },
      { name: "สีเขียวมะกอก", hex: "#3f6212" }
    ],
    stockMatrix: {
      "Free Size-สีดำ": 15,
      "Free Size-สีครีมมินิมอล": 10,
      "Free Size-สีเขียวมะกอก": 8
    },
    svgType: "cap",
    description: "หมวกแก๊ปผ้าคอตตอนทวิลล์ ปรับสายด้านหลังได้ ทรงสวยเข้ากับทุกรูปหน้า",
  }
];

export const INITIAL_ORDERS = [
  {
    id: "ORD-20260721-001",
    timestamp: "2026-07-21 09:30:15",
    dateStr: "2026-07-21",
    items: [
      {
        productId: "prod-1",
        sku: "TSH-101",
        name: "เสื้อยืด Cotton 100% Premium Oversize",
        size: "L",
        color: "สีดำ",
        price: 390,
        qty: 2,
        total: 780
      },
      {
        productId: "prod-3",
        sku: "PNT-303",
        name: "กางเกงสแล็คทรงกระบอกเล็ก ผ้าชิโน่ยืด",
        size: "XL",
        color: "สีดำ",
        price: 890,
        qty: 1,
        total: 890
      }
    ],
    subtotal: 1670,
    discount: 100,
    vatAmount: 102.71,
    grandTotal: 1570,
    paymentMethod: "PromptPay",
    status: "Completed",
  },
  {
    id: "ORD-20260721-002",
    timestamp: "2026-07-21 11:15:40",
    dateStr: "2026-07-21",
    items: [
      {
        productId: "prod-2",
        sku: "SHI-202",
        name: "เสื้อเชิ้ตผ้าลินินแท้ แขนยาวทรง Relaxed",
        size: "M",
        color: "สีขาว",
        price: 690,
        qty: 1,
        total: 690
      }
    ],
    subtotal: 690,
    discount: 0,
    vatAmount: 45.14,
    grandTotal: 690,
    paymentMethod: "Cash",
    receivedAmount: 1000,
    changeAmount: 310,
    status: "Completed",
  }
];

export const INITIAL_EMPLOYEES = [
  {
    id: "emp-1",
    name: "คุณสมหญิง รักงาน",
    position: "พนักงานขาย",
    dailyWage: 400,
    startDate: "2026-01-01",
    wageLogs: [
      { id: "log-001", date: "2026-07-21", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-002", date: "2026-07-20", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-003", date: "2026-07-19", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-004", date: "2026-07-18", type: "advance", amount: 500, note: "เบิกเงินล่วงหน้า" },
      { id: "log-005", date: "2026-07-17", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-006", date: "2026-07-16", type: "deduct", amount: 0.5, note: "มาสาย ครึ่งวัน" },
    ],
    totalAdvance: 500,
  },
  {
    id: "emp-2",
    name: "คุณประยุทธ์ ตั้งใจ",
    position: "แคชเชียร์",
    dailyWage: 380,
    startDate: "2026-03-15",
    wageLogs: [
      { id: "log-011", date: "2026-07-21", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-012", date: "2026-07-20", type: "work", amount: 1, note: "ทำงานปกติ" },
      { id: "log-013", date: "2026-07-19", type: "deduct", amount: 1, note: "ลาป่วย" },
    ],
    totalAdvance: 0,
  },
];

export const CASH_CATEGORIES = {
  INCOME: [
    "รายรับขายหน้าร้าน (POS)",
    "เงินทุนหมุนเวียน/เงินทอน",
    "รายได้อื่นๆ"
  ],
  EXPENSE: [
    "สั่งซื้อสินค้าเข้าสต็อก",
    "ค่าน้ำ/ค่าไฟ/ค่าเช่า",
    "ค่าอุปกรณ์และของใช้ในร้าน",
    "ค่าแรงและเงินเบิกพนักงาน",
    "คืนเงินสินค้าลูกค้า",
    "ค่าใช้จ่ายอื่นๆ"
  ]
};

export const INITIAL_CASH_TRANSACTIONS = [
  {
    id: "tx-001",
    type: "in", // "in" = เงินเข้า (Income), "out" = เงินออก (Expense)
    amount: 3000,
    category: "เงินทุนหมุนเวียน/เงินทอน",
    paymentMethod: "Cash",
    date: "2026-07-21",
    timestamp: "2026-07-21 08:00:00",
    note: "เงินทอนทอนเปิดลิ้นชักประจำวัน",
    isAuto: false,
  },
  {
    id: "tx-002",
    type: "in",
    amount: 1570,
    category: "รายรับขายหน้าร้าน (POS)",
    paymentMethod: "PromptPay",
    date: "2026-07-21",
    timestamp: "2026-07-21 09:30:15",
    referenceId: "ORD-20260721-001",
    note: "ขายสินค้า ORD-20260721-001 (PromptPay)",
    isAuto: true,
  },
  {
    id: "tx-003",
    type: "in",
    amount: 690,
    category: "รายรับขายหน้าร้าน (POS)",
    paymentMethod: "Cash",
    date: "2026-07-21",
    timestamp: "2026-07-21 11:15:40",
    referenceId: "ORD-20260721-002",
    note: "ขายสินค้า ORD-20260721-002 (Cash)",
    isAuto: true,
  },
  {
    id: "tx-004",
    type: "out",
    amount: 500,
    category: "ค่าแรงและเงินเบิกพนักงาน",
    paymentMethod: "Cash",
    date: "2026-07-18",
    timestamp: "2026-07-18 14:00:00",
    referenceId: "log-004",
    note: "คุณสมหญิง รักงาน - เบิกเงินล่วงหน้า",
    isAuto: true,
  },
  {
    id: "tx-005",
    type: "out",
    amount: 1200,
    category: "ค่าน้ำ/ค่าไฟ/ค่าเช่า",
    paymentMethod: "PromptPay",
    date: "2026-07-15",
    timestamp: "2026-07-15 10:30:00",
    note: "ชำระค่าไฟประจำเดือน",
    isAuto: false,
  },
  {
    id: "tx-006",
    type: "out",
    amount: 4500,
    category: "สั่งซื้อสินค้าเข้าสต็อก",
    paymentMethod: "Transfer",
    date: "2026-07-10",
    timestamp: "2026-07-10 16:20:00",
    note: "สั่งซื้อเสื้อยืด Oversize เติมคลังสินค้า",
    isAuto: false,
  }
];

