import type { Conversation } from "@/stores/use-app-store";

export const MOCK_ACTIVE_CONVERSATION_ID = "chat_01";

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "chat_01",
    customerName: "Rizky Firmansyah",
    customerPhone: "+62 812-9812-4412",
    countryCode: "+62",
    language: "id_ID",
    orderId: "ord_9821",
    unread: true,
    isHumanTakeover: false,
    windowExpiresIn: "22h 15m",
    lastMessage: "Min, bisa ganti patokan depan Alfamart ga ya?",
    lastTimestamp: "14:08 WIB",
    sentiment: "normal",
    messages: [
      {
        id: "m1",
        sender: "agent",
        text: "Halo Kak Rizky! Terima kasih sudah memesan di TokoSepatu_ID. Apakah pesanan COD sepatu sneaker ukuran 42 siap kami kirimkan ke Jl. Sudirman?",
        translationZh: "你好 Rizky！感谢在 TokoSepatu 下单。您的 42 码球鞋 COD 订单可以发往 Jl. Sudirman 吗？",
        timestamp: "14:04 WIB",
      },
      {
        id: "m2",
        sender: "buyer",
        text: "Halo min, siap kirim. Tapi tolong tulis di paket depan Alfamart seberang masjid ya min, biar kurir ga nyasar.",
        translationZh: "客服好，可以发。但请在包裹上写上在清真寺对面的 Alfamart 便利店前，免得快递员迷路。",
        timestamp: "14:08 WIB",
        slangTokens: [
          { token: "min", explanation: "印尼网购俚语，缩写自 Admin，意为客服/掌柜" },
          { token: "ga nyasar", explanation: "免得迷路 / 不要跑错地址" },
        ],
      },
    ],
  },
  {
    id: "chat_02",
    customerName: "Budi Santoso",
    customerPhone: "+62 813-1102-5591",
    countryCode: "+62",
    language: "id_ID",
    unread: false,
    isHumanTakeover: true,
    windowExpiresIn: "14h 02m",
    lastMessage: "Bisa kurangin ongkir ga min? Kemahalan.",
    lastTimestamp: "13:45 WIB",
    sentiment: "urgent",
    messages: [
      {
        id: "m3",
        sender: "agent",
        text: "Halo Kak Budi, pesanan Anda masih menunggu pembayaran nih. Butuh bantuan?",
        translationZh: "你好 Budi，您的订单仍在等待付款。需要帮助吗？",
        timestamp: "13:30 WIB",
      },
      {
        id: "m4",
        sender: "buyer",
        text: "Bisa kurangin ongkir ga min? Kemahalan ongkir ke Papua.",
        translationZh: "客服能减免运费吗？去巴布亚的运费太贵了。",
        timestamp: "13:45 WIB",
        slangTokens: [
          { token: "ongkir", explanation: "Ongkos Kirim 缩写，意为邮费/运费" },
          { token: "ga", explanation: "tidak/nggak 缩写，意为不/能不能" },
        ],
      },
    ],
  },
  {
    id: "chat_03",
    customerName: "Nong Nat",
    customerPhone: "+66 89-123-4567",
    countryCode: "+66",
    language: "th_TH",
    unread: false,
    isHumanTakeover: false,
    windowExpiresIn: "19h 30m",
    lastMessage: "มีไซส์ 38 สีขาวไหมครับ?",
    lastTimestamp: "12:15 ICT",
    sentiment: "normal",
    messages: [
      {
        id: "m5",
        sender: "buyer",
        text: "มีไซส์ 38 สีขาวไหมครับ?",
        translationZh: "请问 38 码白色还有现货吗？",
        timestamp: "12:15 ICT",
      },
      {
        id: "m6",
        sender: "agent",
        text: "สวัสดีครับ ไซส์ 38 สีขาวมีพร้อมส่งครับ สามารถกดสั่งซื้อได้เลยครับผม",
        translationZh: "您好，38 码白色有现货可直接发货，您可以直接下单哦！",
        timestamp: "12:16 ICT",
      },
    ],
  },
  {
    id: "chat_04",
    customerName: "Marcus Tan",
    customerPhone: "+65 9123-4567",
    countryCode: "+65",
    language: "en_SG",
    orderId: "ord_sg_7721",
    unread: false,
    isHumanTakeover: false,
    windowExpiresIn: "21h 10m",
    lastMessage: "Can COD or PayNow bro? Any discount voucher leh?",
    lastTimestamp: "15:28 SGT",
    sentiment: "normal",
    messages: [
      {
        id: "m7",
        sender: "buyer",
        text: "Hi boss, can COD or PayNow bro? Got discount voucher leh?",
        translationZh: "老板你好，可以 COD 还是 PayNow 转账？还有折扣券吗？",
        timestamp: "15:28 SGT",
        slangTokens: [
          { token: "PayNow", explanation: "新加坡本地即时转账系统" },
          { token: "leh", explanation: "新加坡本地语气助词" },
        ],
      },
      {
        id: "m8",
        sender: "agent",
        text: "Hi Marcus! PayNow QR is available at checkout lah, plus 10% coupon applied for you already!",
        translationZh: "嗨 Marcus！结账页面支持 PayNow 二维码，已为您自动抵扣 10% 优惠券！",
        timestamp: "15:29 SGT",
        slangTokens: [
          { token: "lah", explanation: "Singlish 亲近肯定语气词" },
        ],
      },
    ],
  },
  {
    id: "chat_05",
    customerName: "Farah Nadia",
    customerPhone: "+60 12-345 6789",
    countryCode: "+60",
    language: "ms_MY",
    orderId: "ord_my_3310",
    unread: false,
    isHumanTakeover: false,
    windowExpiresIn: "23h 05m",
    lastMessage: "Boleh pos esok ke sis? Pos Laju ya tq.",
    lastTimestamp: "14:50 MYT",
    sentiment: "normal",
    messages: [
      {
        id: "m9",
        sender: "buyer",
        text: "Boleh pos esok ke sis? Harap guna Pos Laju ya, terima kasih!",
        translationZh: "明天能发货吗姐姐？希望能用 Pos Laju 快递，谢谢！",
        timestamp: "14:50 MYT",
        slangTokens: [
          { token: "sis", explanation: "马来西亚网购亲切尊称" },
          { token: "Pos Laju", explanation: "大马国民快速快递" },
        ],
      },
      {
        id: "m10",
        sender: "agent",
        text: "Boleh sangat Sis Farah! Kami pos esok pagi guna Pos Laju, nanti tracking nombor kami WhatsApp ya.",
        translationZh: "完全没问题 Farah 姐！我们明早通过 Pos Laju 发出，运单号稍后 WhatsApp 发您。",
        timestamp: "14:52 MYT",
      },
    ],
  },
];

export interface SlangLexiconItem {
  token: string;
  desc: string;
}

export const MOCK_SLANG_LEXICON: SlangLexiconItem[] = [
  { token: "min", desc: "Admin 缩写，代指客服/掌柜" },
  { token: "ongkir", desc: "Ongkos Kirim 缩写，代指快递运费" },
  { token: "ga nyasar", desc: "免得跑偏/迷路，指示地标准确" },
  { token: "kemahalan", desc: "价格太贵了，可触发优惠挽留" },
  { token: "bisa COD ga", desc: "能否货到付款，高意向询盘" },
];

export const MOCK_QUICK_REPLIES: string[] = [
  "Siap kak, paket akan segera kami kirim!",
  "Bisa COD kok kak, mohon siapkan uang pas ya.",
  "Ada diskon ongkir Rp 10.000 khusus hari ini kak!",
];

export const MOCK_DEMO_BUYER_ORDER = {
  orderId: "ord_id_9821",
  displayLabel: "#ID-9821 (COD Rp 389.000)",
};


