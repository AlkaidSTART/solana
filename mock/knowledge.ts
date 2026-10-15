import type { KnowledgeItem } from "@/stores/use-app-store";

export const MOCK_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: "kb_01",
    category: "LOGISTICS",
    zh: "通常在付款后 24-48 小时内发货，新加坡 1-2 日送达，印尼 Jabodetabek 2-3 天送达，外岛 5-7 天。",
    idGaul: "Pengiriman 1-2 hari kerja ya kak. Khusus Jabodetabek 2-3 harian nyampe, luar pulau 5-7 hari.",
    en: "Orders are shipped within 24-48h. Singapore 1-2 days, Jabodetabek 2-3 days, outer islands 5-7 days.",
    th: "จัดส่งภายใน 24-48 ชม. กรุงเทพฯ และปริมณฑล 2-3 วัน ต่างจังหวัด 5-7 วันครับ",
    enSg: "Shipped within 24-48h lah! Islandwide doorstep courier takes 1-2 days only, super fast.",
    ms: "Penghantaran 1-2 hari bekerja sis. Pos Laju Semenanjung 2-3 hari sampai, Sabah/Sarawak 5-7 hari.",
    vi: "Đơn hàng gửi trong 24-48h qua GHTK. Nội thành HCM/Hà Nội 1-2 ngày, tỉnh khác 3-5 ngày nha shop.",
    fil: "Ipapadala sa loob ng 24-48 oras po. Metro Manila 1-2 araw via J&T, provinces 3-5 araw po.",
    status: "PUBLISHED",
    lastUpdated: "2026-10-06",
  },
  {
    id: "kb_02",
    category: "FAQ",
    zh: "支持货到付款 (COD)，请在快递派送时保持手机畅通并准备好零钱。",
    idGaul: "Bisa COD kok kak! Pas kurir dateng pastiin nomor aktif & siapin uang pas ya kak.",
    en: "Cash on Delivery (COD) is supported! Please ensure your phone is reachable and have exact cash ready.",
    th: "รองรับการเก็บเงินปลายทาง (COD) ครับ โปรดเปิดมือถือรอรับสายขนส่งและเตรียมเงินพอดีนะครับ",
    enSg: "Cash on delivery available! Make sure phone is on when delivery guy comes down ok?",
    ms: "Boleh bayar masa barang sampai (COD) sis! Pastikan telefon aktif & sediakan duit secukupnya ya.",
    vi: "Shop có hỗ trợ ship COD nha! Khi shipper giao bạn nhớ giữ máy và chuẩn bị tiền mặt vừa đủ ạ.",
    fil: "Available po ang COD! Pakisigurong bukas ang cellphone kapag tumawag ang rider po.",
    status: "PUBLISHED",
    lastUpdated: "2026-10-05",
  },
  {
    id: "kb_03",
    category: "FAQ",
    zh: "支持本土主流转账：新加坡 PayNow、印尼 QRIS、泰国 PromptPay、马来西亚 Touch 'n Go 及 Solana USDC。",
    idGaul: "Bisa bayar lewat QRIS, transfer bank lokal, dan instant settlement crypto USDC ya kak.",
    en: "We support local instant rails: SG PayNow, ID QRIS, TH PromptPay, MY Touch 'n Go & Solana USDC.",
    th: "รองรับ PromptPay, สแกน QR ธนาคารในไทย และ Solana USDC ได้ทันทีครับ",
    enSg: "Can use SG PayNow, Nets, credit card or Solana USDC! Scan QR and confirm immediately.",
    ms: "Boleh bayar guna DuitNow QR, Touch 'n Go eWallet, FPX ataupun Solana USDC.",
    vi: "Hỗ trợ quét mã VietQR, MoMo, ZaloPay và thanh toán crypto Solana USDC nhận ngay ạ.",
    fil: "Tumatanggap po ng GCash, Maya, QR Ph at instant crypto Solana USDC settlement.",
    status: "PUBLISHED",
    lastUpdated: "2026-10-07",
  },
];

export interface AiTranslationPreset {
  idText: string;
  enText: string;
  thText: string;
  enSgText: string;
  msText: string;
  viText: string;
  filText: string;
}

export const MOCK_AI_TRANSLATION_SAMPLE: AiTranslationPreset = {
  idText: "Bisa kak, pengiriman ke seluruh kota Jabodetabek & Jawa Barat 1-2 hari sampai!",
  enText: "Yes, delivery across Jabodetabek and West Java takes 1-2 business days.",
  thText: "ได้ครับคุณลูกค้า จัดส่งทั่วกรุงเทพและปริมณฑลใช้เวลา 1-2 วันครับ",
  enSgText: "Can lah! Islandwide doorstep courier across Singapore takes 1-2 days only.",
  msText: "Boleh sis, penghantaran Semenanjung guna Pos Laju 1-2 hari bekerja sampai!",
  viText: "Dạ được nha shop, giao hàng hoả tốc nội thành 1-2 ngày là nhận được ạ!",
  filText: "Opo, 1-2 araw lang po ang delivery sa inyo via J&T Express!",
};

export function generateMockAiTranslation(snippet: string): AiTranslationPreset {
  return {
    idText: `Siap kak, untuk ${snippet}... kami bantu cek garansi ya.`,
    enText: `Yes dear, regarding ${snippet}... our team will verify for you.`,
    thText: `ครับผม สำหรับ ${snippet}... ทีมงานดูแลให้ครับ`,
    enSgText: `Can help you check ${snippet} right away lah, don't worry!`,
    msText: `Boleh sangat sis, untuk ${snippet}... kami semak untuk anda ya.`,
    viText: `Dạ vâng, về ${snippet}... shop sẽ kiểm tra hỗ trợ bạn ngay ạ.`,
    filText: `Opo, tungkol po sa ${snippet}... iche-check po namin agad para sa inyo.`,
  };
}

