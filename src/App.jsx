import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://mst-backend-mauve.vercel.app";

// ============ Ortak tema (mobil yazar uygulamasıyla aynı marka dili) ============
// ============================================================
// AÇIK TEMA — modern, yüksek okunabilirlik
// Not: Anahtar isimleri (cyan, textLight vb.) eskiden kalma;
// değerleri açık temaya göre yeniden tanımlandı. İsimleri
// değiştirmedim ki kodun tamamı çalışmaya devam etsin.
// ============================================================
const THEME = {
  bg: "#F1F3F7",           // sayfa zemini — yumuşak gri
  panelBg: "#FFFFFF",      // kart/panel zemini — beyaz
  panelBgAlt: "#F7F9FC",   // input/ikincil zemin
  sidebarBg: "#FFFFFF",    // sol menü — beyaz
  border: "#D8DEE9",       // kenarlık — belirgin ama yumuşak
  divider: "#E8ECF3",      // ince ayırıcı
  cyan: "#1B5FA8",         // ANA VURGU — kurumsal mavi (buton, aktif menü)
  secondary: "#6B4BA8",    // ikincil vurgu — mor
  textLight: "#16202E",    // ANA METİN — koyu, yüksek kontrast
  textMuted: "#55637A",    // ikincil metin — okunaklı gri
  textFaint: "#8593A8",    // soluk metin (etiketler)
  success: "#1B7F4B",      // başarı — koyu yeşil (okunaklı)
  successBg: "rgba(27,127,75,0.10)",
  warn: "#A66A00",         // uyarı — koyu amber (okunaklı)
  warnBg: "rgba(166,106,0,0.10)",
  danger: "#B3261E",       // hata — koyu kırmızı
  dangerBg: "rgba(179,38,30,0.10)",
  onAccent: "#FFFFFF",     // vurgu rengi üzerindeki metin
};

// Tüm panelde kullanılacak yazı tipi
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
const FONT_MONO = "'Consolas', 'Courier New', monospace";

// Bildirim türlerine göre ikonlar
const BILDIRIM_IKON = {
  dekont: "💳", indirimli: "🏷️", reklam: "📣", ceviri: "🌐",
  siparis: "🛍️", destek: "💬", odul: "🎁",
};


// Admin (koyu tema) reklam grafik paleti
const RG_ADMIN = {
  text: THEME.textLight, muted: THEME.textMuted, faint: THEME.textFaint,
  grid: THEME.divider, panel: THEME.panelBg,
  spend: THEME.cyan, imp: THEME.secondary, click: THEME.warn, sale: THEME.success, accent: THEME.cyan,
};

// ReklamGrafikleri — bağımlılıksız saf SVG reklam grafikleri.
// Hem admin (koyu) hem yazar (Veridian açık) panelinde kullanılır.
// Renkler C (palet) prop'undan gelir: { text, muted, faint, grid, panel,
//   spend, imp, click, sale, accent }.

// ---- yardımcılar ----
const fmt = (n) => Number(n || 0).toLocaleString("tr-TR");
const fmtK = (n) => {
  n = Number(n || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".0", "") + "B";
  return String(Math.round(n));
};
const kisaTarih = (t) => { // "2026-06-14" -> "14/06"
  if (!t) return "";
  const p = String(t).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}` : t;
};

// ============ ÇizgiTrend: zaman içinde bir metrik ============
function CizgiTrend({ gunluk = [], metrik = "spend", renk, etiket, C, yukseklik = 150 }) {
  const veri = gunluk.filter((g) => g && g.tarih);
  if (veri.length < 2) return <BosGrafik C={C} not="Trend için en az 2 günlük veri gerekli." h={yukseklik} />;
  const W = 640, H = yukseklik, padL = 44, padR = 12, padT = 12, padB = 24;
  const iw = W - padL - padR, ih = H - padT - padB;
  const vals = veri.map((g) => Number(g[metrik] || 0));
  const max = Math.max(...vals, 1);
  const x = (i) => padL + (veri.length === 1 ? iw / 2 : (i / (veri.length - 1)) * iw);
  const y = (v) => padT + ih - (v / max) * ih;
  const cizgi = veri.map((g, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(" ");
  const alan = `${cizgi} L${x(veri.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${x(0).toFixed(1)},${(padT + ih).toFixed(1)} Z`;
  const gid = `grad_${metrik}_${Math.random().toString(36).slice(2, 7)}`;
  const etiketAdim = Math.ceil(veri.length / 6);
  const yTicks = [0, 0.5, 1];
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 600 }}>{etiket}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={renk} stopOpacity="0.28" />
            <stop offset="100%" stopColor={renk} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => {
          const yy = padT + ih - t * ih;
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke={C.grid} strokeWidth="1" />
              <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="9" fill={C.faint} fontFamily="monospace">{fmtK(max * t)}</text>
            </g>
          );
        })}
        <path d={alan} fill={`url(#${gid})`} />
        <path d={cizgi} fill="none" stroke={renk} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {veri.map((g, i) => (
          <circle key={i} cx={x(i)} cy={y(vals[i])} r="2.4" fill={renk} />
        ))}
        {veri.map((g, i) => (i % etiketAdim === 0 || i === veri.length - 1) ? (
          <text key={"t" + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={C.faint} fontFamily="monospace">{kisaTarih(g.tarih)}</text>
        ) : null)}
      </svg>
    </div>
  );
}

// ============ Huni: Gösterim -> Tıklama -> Satış ============
function Huni({ impressions = 0, clicks = 0, conversions = 0, C }) {
  const asamalar = [
    { ad: "Gösterim", v: Number(impressions || 0), renk: C.imp },
    { ad: "Tıklama", v: Number(clicks || 0), renk: C.click },
    { ad: "Satış", v: Number(conversions || 0), renk: C.sale },
  ];
  const max = Math.max(...asamalar.map((a) => a.v), 1);
  const W = 640, barH = 34, gap = 16, padT = 6;
  const H = padT + asamalar.length * (barH + gap);
  const minW = 40;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {asamalar.map((a, i) => {
        const w = minW + (a.v / max) * (W - minW - 4);
        const yy = padT + i * (barH + gap);
        const x0 = (W - w) / 2;
        const oncekiV = i > 0 ? asamalar[i - 1].v : null;
        const oran = oncekiV && oncekiV > 0 ? ((a.v / oncekiV) * 100).toFixed(1) : null;
        return (
          <g key={i}>
            <rect x={x0} y={yy} width={w} height={barH} rx="6" fill={a.renk} fillOpacity="0.9" />
            <text x={W / 2} y={yy + barH / 2 - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{a.ad}</text>
            <text x={W / 2} y={yy + barH / 2 + 11} textAnchor="middle" fontSize="10" fill="#fff" fillOpacity="0.9" fontFamily="monospace">{fmt(a.v)}</text>
            {oran != null && (
              <text x={W - 4} y={yy - 4} textAnchor="end" fontSize="9.5" fill={C.muted} fontFamily="monospace">↓ %{oran}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============ Bar: kampanyaları karşılaştır ============
function KarsilastirmaBar({ kampanyalar = [], metrik = "spend", etiket, renk, C }) {
  const veri = kampanyalar.map((k) => ({ ad: k.name || k.kampanya || "—", v: Number(k[metrik] || 0) }))
    .filter((d) => d.v > 0).sort((a, b) => b.v - a.v).slice(0, 8);
  if (!veri.length) return <BosGrafik C={C} not="Karşılaştırma için veri yok." h={120} />;
  const max = Math.max(...veri.map((d) => d.v), 1);
  const satirH = 30, padT = 6;
  const W = 640, H = padT + veri.length * satirH;
  const etiketW = 150, barX = etiketW + 8, barMaxW = W - barX - 60;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 600 }}>{etiket}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {veri.map((d, i) => {
          const yy = padT + i * satirH;
          const w = (d.v / max) * barMaxW;
          const kisaAd = d.ad.length > 22 ? d.ad.slice(0, 21) + "…" : d.ad;
          return (
            <g key={i}>
              <text x={etiketW} y={yy + satirH / 2 + 3} textAnchor="end" fontSize="10.5" fill={C.text}>{kisaAd}</text>
              <rect x={barX} y={yy + 5} width={Math.max(w, 2)} height={satirH - 12} rx="4" fill={renk} fillOpacity="0.85" />
              <text x={barX + Math.max(w, 2) + 6} y={yy + satirH / 2 + 3} fontSize="10" fill={C.muted} fontFamily="monospace">{fmtK(d.v)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============ Özet kartlar: ROAS, tık maliyeti vb. ============
function OzetKartlar({ spend = 0, impressions = 0, clicks = 0, conversions = 0, C }) {
  const s = Number(spend || 0), imp = Number(impressions || 0), cl = Number(clicks || 0), cv = Number(conversions || 0);
  const roas = s > 0 ? (cv / s) : 0;           // satış / harcama (adet bazlı)
  const cpc = cl > 0 ? (s / cl) : 0;            // tıklama başına maliyet
  const cpa = cv > 0 ? (s / cv) : 0;            // satış başına maliyet
  const ctr = imp > 0 ? (cl / imp) * 100 : 0;   // tıklama oranı
  const kartlar = [
    { etiket: "ROAS (satış/harcama)", deger: roas.toFixed(3), alt: "1₺ başına satış", renk: C.sale },
    { etiket: "Tık. Başına Maliyet", deger: cpc.toFixed(2) + "₺", alt: "CPC", renk: C.click },
    { etiket: "Satış Başına Maliyet", deger: cv > 0 ? cpa.toFixed(2) + "₺" : "—", alt: "CPA", renk: C.spend },
    { etiket: "Tıklama Oranı", deger: "%" + ctr.toFixed(2), alt: "CTR", renk: C.imp },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
      {kartlar.map((k, i) => (
        <div key={i} style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>{k.etiket}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: k.renk, fontFamily: FONT_MONO, lineHeight: 1 }}>{k.deger}</div>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>{k.alt}</div>
        </div>
      ))}
    </div>
  );
}

function BosGrafik({ C, not, h = 120 }) {
  return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 12, background: C.panel, border: `1px dashed ${C.grid}`, borderRadius: 10 }}>{not}</div>
  );
}

// ============ Tüm dashboard: kampanya toplamı + günlük seri ============
// Birden çok kampanyanın gunluk serilerini birleştirir (tarih bazında toplar).
function birlestirGunluk(kampanyalar = []) {
  const harita = {};
  kampanyalar.forEach((k) => (k.gunluk || []).forEach((g) => {
    if (!g || !g.tarih) return;
    if (!harita[g.tarih]) harita[g.tarih] = { tarih: g.tarih, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    harita[g.tarih].spend += Number(g.spend || 0);
    harita[g.tarih].impressions += Number(g.impressions || 0);
    harita[g.tarih].clicks += Number(g.clicks || 0);
    harita[g.tarih].conversions += Number(g.conversions || 0);
  }));
  return Object.values(harita).sort((a, b) => a.tarih.localeCompare(b.tarih));
}

function ReklamDashboard({ kampanyalar = [], C, baslik = "Reklam Performansı" }) {
  const toplam = kampanyalar.reduce((a, k) => ({
    spend: a.spend + Number(k.spend || 0),
    impressions: a.impressions + Number(k.impressions || 0),
    clicks: a.clicks + Number(k.clicks || 0),
    conversions: a.conversions + Number(k.conversions || 0),
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
  const gunluk = birlestirGunluk(kampanyalar);
  const cokKampanya = kampanyalar.filter((k) => Number(k.spend || 0) > 0).length > 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <OzetKartlar {...toplam} C={C} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 12, padding: 16 }}>
          <CizgiTrend gunluk={gunluk} metrik="spend" renk={C.spend} etiket="Harcama Trendi (son 30 gün)" C={C} />
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 12, padding: 16 }}>
          <CizgiTrend gunluk={gunluk} metrik="conversions" renk={C.sale} etiket="Satış Trendi (son 30 gün)" C={C} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cokKampanya ? "1fr 1fr" : "1fr", gap: 22 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600 }}>Dönüşüm Hunisi</div>
          <Huni {...toplam} C={C} />
        </div>
        {cokKampanya && (
          <div style={{ background: C.panel, border: `1px solid ${C.grid}`, borderRadius: 12, padding: 16 }}>
            <KarsilastirmaBar kampanyalar={kampanyalar} metrik="spend" etiket="Kampanya Karşılaştırma (harcama)" renk={C.spend} C={C} />
          </div>
        )}
      </div>
    </div>
  );
}


const PLATFORMS = [
  { key: "mst", label: "MST Yayıncılık", badgeBg: THEME.cyan, badgeFg: THEME.onAccent },
  { key: "trendyol", label: "Trendyol", badgeBg: "#0A0A0A", badgeFg: "#FF6A00" },
  { key: "n11", label: "N11", badgeBg: "#5B21B6", badgeFg: "#FFFFFF" },
  { key: "hepsiburada", label: "Hepsiburada", badgeBg: "#FFFFFF", badgeFg: "#FF6000" },
  { key: "pazarama", label: "Pazarama", badgeBg: "#0F2A5C", badgeFg: "#FF2D87" },
  { key: "idefix", label: "İdefix", badgeBg: "#FFFFFF", badgeFg: "#111111" },
];

// Yazarın onayını gerektiren adımlar — admin panelden tamamlayamaz
const ONAY_ADIMLARI = ["kapak", "yazar_onay"];

// API ile senkronlanmayan platformlar — satış ELLE girilir (toplu bildirim gelir)
const MANUEL_PLATFORMLAR = [
  { key: "kitapyurdu", label: "Kitapyurdu", badgeBg: "#1D7A3C", badgeFg: "#FFFFFF" },
  { key: "dr", label: "D&R", badgeBg: "#FFFFFF", badgeFg: "#E4032E" },
];

// 17 ADIMLI YAYIN SÜRECİ — backend ile birebir aynı sıra
const PIPELINE_STAGES = [
  { key: "teslim", label: "Kitap Teslim Alındı" },
  { key: "isbn", label: "ISBN Alımı" },
  { key: "kapak", label: "Kapak Tasarımı", onay: true },
  { key: "tanitim_video", label: "Tanıtım Videosu (Yakında)" },
  { key: "editor", label: "Editörlük Süreci" },
  { key: "bandrol", label: "Bandrol Alımı" },
  { key: "redaksiyon", label: "Redaksiyon", opsiyonel: true },
  { key: "mizanpaj", label: "Mizanpaj / Baskıya Hazırlık" },
  { key: "yazar_onay", label: "Yazar Onayı (Kapak + Editörlük)", onay: true },
  { key: "baskiya_gonderim", label: "Baskıya Gönderim" },
  { key: "satis_video", label: "Satış Videosu Hazırlığı" },
  { key: "on_satis", label: "Ön Satışa Açılma" },
  { key: "depo_giris", label: "Matbaadan Depoya Giriş" },
  { key: "hediye_gonderim", label: "Hediye Kitap Gönderimi" },
  { key: "normal_satis", label: "Normal Satışa Açılma" },
  { key: "dagitim", label: "Dağıtım Ağlarına Yükleme" },
  { key: "yayin", label: "Yayında" },
];

function clonePipeline() {
  return PIPELINE_STAGES.map((s) => ({ ...s, status: "beklemede", approved: s.key === "kapak" ? false : undefined }));
}

// ============ Örnek veri (gerçek admin API'ları bağlanana kadar) ============
const SEED_AUTHORS = [
  {
    id: "zekiye.dogan", name: "Zekiye Doğan", email: "zekiye@example.com", plan: "vip", status: "aktif",
    wallet: { balance: 4200, pendingReceipts: [{ id: "r1", date: "2026-06-30", amount: 3000, note: "Havale dekontu — İş Bankası", file: "dekont_r1.jpg" }] },
    books: [
      { id: "mechul-tren", title: "Meçhul Tren", totalSold: 932, coverApproved: true,
        stock: { mst: 356, trendyol: 189, n11: 214, hepsiburada: 132, pazarama: 41 },
        pipeline: PIPELINE_STAGES.map((s) => ({ ...s, status: "tamamlandi", approved: s.key === "kapak" ? true : undefined })) },
    ],
  },
  {
    id: "oguz.korkut", name: "Oğuz Korkut", email: "oguz@example.com", plan: "standart", status: "aktif",
    wallet: { balance: 0, pendingReceipts: [] },
    books: [
      { id: "desifre", title: "Deşifre", totalSold: 0, coverApproved: false,
        stock: { mst: 0, trendyol: 0, n11: 0, hepsiburada: 0, pazarama: 0 },
        pipeline: clonePipeline().map((s, i) => ({ ...s, status: i < 2 ? "tamamlandi" : i === 2 ? "devam" : "beklemede" })) },
    ],
  },
  {
    id: "elif.demir", name: "Elif Demir", email: "elif@example.com", plan: "profesyonel", status: "aktif",
    wallet: { balance: 650, pendingReceipts: [{ id: "r2", date: "2026-07-01", amount: 1000, note: "Havale dekontu — Garanti BBVA", file: "dekont_r2.jpg" }] },
    books: [
      { id: "kayip-liman", title: "Kayıp Liman", totalSold: 53, coverApproved: true,
        stock: { mst: 8, trendyol: 22, n11: 4, hepsiburada: 9, pazarama: 3 },
        pipeline: PIPELINE_STAGES.map((s) => ({ ...s, status: "tamamlandi", approved: s.key === "kapak" ? true : undefined })) },
    ],
  },
];

const PLAN_LABELS = { standart: "Standart", profesyonel: "Profesyonel", vip: "VIP" };

// ============ Küçük yardımcı bileşenler ============
function Badge({ children, fg, bg }) {
  return <span style={{ fontSize: 11, color: fg, background: bg, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", small, disabled }) {
  const styles = {
    primary: { bg: THEME.cyan, fg: THEME.onAccent },
    ghost: { bg: "transparent", fg: THEME.textLight, border: `1px solid ${THEME.border}` },
    danger: { bg: THEME.dangerBg, fg: THEME.danger, border: `1px solid rgba(255,107,107,.3)` },
    success: { bg: THEME.successBg, fg: THEME.success, border: `1px solid rgba(89,227,157,.3)` },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: styles.bg, color: styles.fg, border: styles.border || "none", borderRadius: 6,
      padding: small ? "6px 12px" : "9px 16px", fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5, letterSpacing: "0.03em" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", background: THEME.panelBgAlt, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" };

// ============ Giriş ekranı ============
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pass.trim()) { setError("E-posta ve şifre gerekli."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Giriş başarısız."); setLoading(false); return; }
      onLogin({ token: data.token, admin: data.admin });
    } catch {
      setError("Sunucuya bağlanılamadı.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ width: 360, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 28 }}>
        <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: THEME.textLight, marginBottom: 2 }}>MST Yayıncılık</div>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 22, letterSpacing: "0.05em" }}>YÖNETİM PANELİ</div>
        <Field label="E-POSTA">
          <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mstyayincilik.com" onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="ŞİFRE">
          <input type="password" style={inputStyle} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        {error && <div style={{ color: THEME.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <div style={{ marginTop: 6 }}>
          <Btn onClick={submit} disabled={loading}>{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ============ Genel Bakış ============
// ============ Yönetim Paneli AI Asistanı ============
// Panelin kendi yapay zekası: sistemdeki veriyi okur, analiz ve geliştirme notu üretir.
const ASISTAN_HAZIR_SORULAR = [
  { etiket: "Bugün neye bakmalıyım?", soru: "Sistemdeki verilere bakarak bugün önceliklendirmem gereken en kritik 3 şeyi söyle. Her biri için ne yapmam gerektiğini de yaz." },
  { etiket: "Uygulama geliştirme notları", soru: "Yazarların uygulamayı nasıl kullandığına ve AI menajere hangi konuları sorduğuna bakarak uygulamada eksik olan özellikleri, bozuk görünen akışları ve fırsatları başlıklar halinde listele. Her madde için neden böyle düşündüğünü kısaca açıkla." },
  { etiket: "Satışı nasıl artırırım?", soru: "Satış verisine, platform dağılımına ve yazar davranışına bakarak satışı artırmak için somut öneriler ver. Hangi kitaplara ve hangi yazarlara odaklanmam gerektiğini söyle." },
  { etiket: "Riskli yazarlar", soru: "Uzaklaşan, ilgisi azalan veya memnuniyetsizlik sinyali veren yazarlar konusunda ne yapmalıyım? Geri kazanma planı öner." },
  { etiket: "Veri sağlığı", soru: "Verilerde tutarsızlık, eksiklik veya şüpheli görünen bir şey var mı? ISBN'siz kitaplar, hiç satmayan kitaplar ve platform eşleşmeleri açısından değerlendir." },
];

function PanelAsistani({ authFetch }) {
  const [cevap, setCevap] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [soru, setSoru] = useState("");
  const [sonSoru, setSonSoru] = useState("");

  const sor = async (metin) => {
    const s = String(metin || "").trim();
    if (!s || calisiyor) return;
    setCalisiyor(true); setHata(""); setCevap(null); setSonSoru(s);
    try {
      const r = await authFetch("/api/admin/asistan", { method: "POST", body: JSON.stringify({ soru: s }) });
      const d = await r.json();
      if (d.ok) setCevap(d.cevap);
      else setHata(d.error || "Asistan yanıt veremedi.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div style={{ marginTop: 18, background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: "16px 18px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>MST Asistanı</div>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.5, maxWidth: 700 }}>
        Sistemdeki tüm veriyi (yazarlar, kitaplar, satışlar, talepler, uygulama kullanımı) okur ve yorumlar.
        Grafik okuyup yorumu sen yapma — sor, o söylesin.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
        {ASISTAN_HAZIR_SORULAR.map((h) => (
          <Btn key={h.etiket} small variant="ghost" disabled={calisiyor} onClick={() => sor(h.soru)}>{h.etiket}</Btn>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={soru} onChange={(e) => setSoru(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { sor(soru); setSoru(""); } }}
          placeholder="Ya da kendi sorunu yaz: 'Hangi yazarım en çok kazandırıyor?'"
          style={{ flex: 1, background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" }}
        />
        <Btn disabled={calisiyor || !soru.trim()} onClick={() => { sor(soru); setSoru(""); }}>Sor</Btn>
      </div>

      {calisiyor && (
        <div style={{ fontSize: 12.5, color: THEME.textMuted, padding: "10px 0" }}>
          Veriler okunuyor ve analiz ediliyor... (10-20 saniye)
        </div>
      )}
      {hata && (
        <div style={{ fontSize: 12.5, color: THEME.danger, background: THEME.dangerBg, borderRadius: 6, padding: "10px 12px" }}>{hata}</div>
      )}
      {cevap && !calisiyor && (
        <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 10.5, color: THEME.textFaint, marginBottom: 8 }}>SORU: {sonSoru}</div>
          <div style={{ fontSize: 13.5, color: THEME.textLight, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{cevap}</div>
        </div>
      )}
    </div>
  );
}

// ============ Yazar Aktifliği — Genel Bakış paneli ============
// Amaç: kim aktif, kim uzaklaşıyor, kim kayıp. Geri dönüşüm kampanyasının hedef listesi buradan çıkar.
const SEGMENT_GORUNUM = {
  aktif:         { ad: "Aktif",          alt: "son 7 gün",     renk: "#2E7D32" },
  ilgisiAzalan:  { ad: "İlgisi azalan",  alt: "8-30 gün",      renk: "#C9A227" },
  uyuyan:        { ad: "Uyuyan",         alt: "31-90 gün",     renk: "#E07B39" },
  kayip:         { ad: "Kayıp",          alt: "90+ gün",       renk: "#C0392B" },
  hicGirmemis:   { ad: "Hiç girmemiş",   alt: "kayıt yok",     renk: "#7A7A7A" },
};

function AktiflikPaneli({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [acikSegment, setAcikSegment] = useState(null);

  useEffect(() => {
    let iptal = false;
    authFetch("/api/admin/aktiflik-ozet")
      .then((r) => r.json())
      .then((d) => { if (!iptal) { if (d.ok) setVeri(d); else setHata(d.error || "Aktiflik verisi okunamadı."); } })
      .catch(() => { if (!iptal) setHata("Sunucuya ulaşılamadı."); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, []);

  if (yukleniyor) return <div style={{ marginTop: 18, fontSize: 12.5, color: THEME.textMuted }}>Yazar aktifliği yükleniyor...</div>;
  if (hata) return (
    <div style={{ marginTop: 18, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 12.5, color: THEME.textMuted }}>
      <b style={{ color: THEME.textLight }}>Yazar Aktifliği</b> — {hata}
    </div>
  );
  if (!veri) return null;

  const segmentler = Object.entries(SEGMENT_GORUNUM);
  const toplamKayit = Object.values(veri.segmentler).reduce((t, n) => t + n, 0);
  const listelenen = acikSegment ? veri.yazarlar.filter((y) => {
    const harita = { aktif: "aktif", ilgisiAzalan: "ilgisi_azalan", uyuyan: "uyuyan", kayip: "kayip", hicGirmemis: "hic_girmemis" };
    return y.segment === harita[acikSegment];
  }) : [];

  return (
    <div style={{ marginTop: 18, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>Yazar Aktifliği</div>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
        Uygulamayı kim kullanıyor, kim uzaklaşıyor. Bir kutuya tıklayınca o gruptaki yazarlar listelenir —
        geri dönüşüm kampanyasının hedef listesi budur.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        {segmentler.map(([anahtar, g]) => {
          const sayi = veri.segmentler[anahtar] || 0;
          const secili = acikSegment === anahtar;
          return (
            <div key={anahtar} onClick={() => setAcikSegment(secili ? null : anahtar)}
              style={{ background: secili ? THEME.panelBgAlt : THEME.bg, border: `1px solid ${secili ? g.renk : THEME.border}`,
                borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: FONT_MONO, color: g.renk }}>{sayi}</div>
              <div style={{ fontSize: 10.5, color: THEME.textLight, marginTop: 2 }}>{g.ad}</div>
              <div style={{ fontSize: 9.5, color: THEME.textFaint }}>{g.alt}</div>
            </div>
          );
        })}
      </div>

      {toplamKayit > 0 && veri.ilgiAlanlari.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 6 }}>SON 30 GÜN — EN ÇOK KULLANILAN ALANLAR</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {veri.ilgiAlanlari.map((a) => (
              <span key={a.alan} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 20, background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, color: THEME.textLight }}>
                {a.alan} <span style={{ color: THEME.textFaint }}>· {a.yazar} yazar</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {acikSegment && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${THEME.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>
            {SEGMENT_GORUNUM[acikSegment].ad} — {listelenen.length} yazar
          </div>
          {listelenen.length === 0 ? (
            <div style={{ fontSize: 12, color: THEME.textFaint }}>Bu grupta yazar yok.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {listelenen.map((y) => (
                <div key={y.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "6px 10px", background: THEME.bg, borderRadius: 6, border: `1px solid ${THEME.border}` }}>
                  <span style={{ color: THEME.textLight }}>{y.name} <span style={{ color: THEME.textFaint, fontSize: 11 }}>{PLAN_LABELS[y.plan] || y.plan}</span></span>
                  <span style={{ color: THEME.textMuted, fontFamily: FONT_MONO, fontSize: 11.5 }}>
                    {y.gecenGun === null ? "hiç giriş yok" : `${y.gecenGun} gün önce`}
                    {y.aiSoru30 > 0 && <span style={{ color: THEME.cyan }}>{" · "}{y.aiSoru30} AI sorusu</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toplamKayit === 0 && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: THEME.warn }}>
          Henüz aktivite kaydı yok. SQL-yazar-aktivite.sql çalıştırıldıysa, yazarlar uygulamaya girdikçe veri birikmeye başlar.
        </div>
      )}
    </div>
  );
}

function Overview({ authors, onSyncAll, authFetch }) {
  const [idefixTest, setIdefixTest] = useState(null);   // { ok, text, detay }
  const [idefixBusy, setIdefixBusy] = useState(false);

  const [saglik, setSaglik] = useState(null);
  const [saglikBusy, setSaglikBusy] = useState(false);

  const saglikKontrol = async () => {
    if (saglikBusy) return;
    setSaglikBusy(true); setSaglik(null);
    try {
      const r = await authFetch("/api/admin/saglik-kontrol");
      const d = await r.json();
      setSaglik(d.ok ? d : { durum: "sorunlu", ozet: d.error || "Kontrol yapılamadı.", bulgular: [] });
    } catch { setSaglik({ durum: "sorunlu", ozet: "Sunucuya ulaşılamadı.", bulgular: [] }); }
    finally { setSaglikBusy(false); }
  };

  const idefixKontrol = async () => {
    if (idefixBusy) return;
    setIdefixBusy(true); setIdefixTest(null);
    try {
      const r = await authFetch("/api/admin/idefix-test");
      const d = await r.json();
      if (d.ok) {
        const satirlar = [];
        if (d.ornek?.length) {
          satirlar.push(...d.ornek.map((o) => `${o.ad || "(adsız)"} — ISBN: ${o.isbn || "yok"} — stok: ${o.stok}`));
        }
        // Ürün gelmediyse ham yanıtı göster — sebebini anlamak için
        if (!d.toplamUrun) {
          if (d.hamYanit) {
            satirlar.push("── İdefix'in döndüğü yanıt ──");
            satirlar.push(`Yapı: ${d.hamYanit.yapi}`);
            if (d.hamYanit.anahtarlar?.length) satirlar.push(`Alanlar: ${d.hamYanit.anahtarlar.join(", ")}`);
            if (d.hamYanit.ornekVeri) satirlar.push(`Ham veri: ${d.hamYanit.ornekVeri}`);
          }
          if (d.hamHata) {
            satirlar.push("── İstek hatası ──");
            satirlar.push(`HTTP ${d.hamHata.durum || "?"} — ${d.hamHata.mesaj || ""}`);
            if (d.hamHata.govde) satirlar.push(d.hamHata.govde);
          }
          if (!d.hamYanit && !d.hamHata) satirlar.push("(İdefix boş yanıt döndü — envanterde satışa açık ürün görünmüyor)");
        }
        setIdefixTest({ ok: true, text: d.mesaj, detay: satirlar.join("\n") });
      } else {
        setIdefixTest({
          ok: false,
          text: d.error || "Bağlantı kurulamadı.",
          detay: [d.httpDurum ? `HTTP ${d.httpDurum}` : null, d.detay].filter(Boolean).join("\n"),
        });
      }
    } catch {
      setIdefixTest({ ok: false, text: "Sunucuya ulaşılamadı." });
    } finally { setIdefixBusy(false); }
  };

  const totalBooks = authors.reduce((s, a) => s + a.books.length, 0);
  const pendingCovers = authors.reduce((s, a) => s + a.books.filter((b) => !b.coverApproved).length, 0);
  const pendingPayments = authors.reduce((s, a) => s + a.wallet.pendingReceipts.length, 0);
  const totalSold = authors.reduce((s, a) => s + a.books.reduce((s2, b) => s2 + b.totalSold, 0), 0);
  const cards = [
    { label: "TOPLAM YAZAR", value: authors.length },
    { label: "TOPLAM KİTAP", value: totalBooks },
    { label: "TOPLAM SATIŞ", value: totalSold },
    { label: "BEKLEYEN KAPAK ONAYI", value: pendingCovers, warn: pendingCovers > 0 },
    { label: "BEKLEYEN ÖDEME ONAYI", value: pendingPayments, warn: pendingPayments > 0 },
  ];

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null); // { ok, text }
  const runSync = async () => {
    if (syncing) return;
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await onSyncAll();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const adet = data.updated ?? data.count ?? data.synced ?? data.guncellenen;
        let metin = adet != null ? `Senkronizasyon tamamlandı — ${adet} kayıt güncellendi.` : "Senkronizasyon tamamlandı.";
        // Platform bazında eşleşme raporu
        if (data.eslesme) {
          const e = data.eslesme, c = data.cekilenUrun || {};
          const isim = { mst: "MST", pazarama: "Pazarama", trendyol: "Trendyol", hepsiburada: "Hepsiburada", n11: "N11", idefix: "İdefix" };
          const satirlar = Object.keys(isim).map((k) => {
            const eslesen = e[k] || 0, cekilen = c[k] || 0;
            const uyari = cekilen > 0 && eslesen === 0 ? "  ⚠ hiç eşleşmedi" : "";
            return `${isim[k].padEnd(13)} ${String(eslesen).padStart(3)}/${e.toplamKitap} kitap eşleşti (${cekilen} ürün çekildi)${uyari}`;
          });
          if (e.temizlenenBayatKayit) {
            satirlar.push("", `⚠ ${e.temizlenenBayatKayit} bayat stok kaydı temizlendi (artık eşleşmeyen platformlar)`);
          }
          if (e.hicEslesmeyenOrnekler?.length) {
            satirlar.push("", "Hiçbir platformda eşleşmeyen kitaplar:", ...e.hicEslesmeyenOrnekler.map((o) => `  • ${o}`));
          }
          metin += "\n\n" + satirlar.join("\n");
        }
        setSyncMsg({ ok: true, text: metin });
      } else {
        setSyncMsg({ ok: false, text: data.error || "Senkronizasyon başarısız oldu." });
      }
    } catch {
      setSyncMsg({ ok: false, text: "Sunucuya ulaşılamadı. Bağlantıyı kontrol edin." });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Genel Bakış</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {syncMsg && (
            <pre style={{
              fontSize: 11.5, color: syncMsg.ok ? THEME.textLight : THEME.danger,
              background: syncMsg.ok ? THEME.panelBgAlt : THEME.dangerBg,
              border: `1px solid ${syncMsg.ok ? THEME.border : THEME.danger}`,
              borderRadius: 6, padding: "9px 12px", margin: 0, maxWidth: 460,
              fontFamily: FONT_MONO, whiteSpace: "pre-wrap", lineHeight: 1.55,
            }}>{syncMsg.text}</pre>
          )}
          <Btn onClick={runSync} disabled={syncing}>
            {syncing ? "Senkronize ediliyor…" : "↻ Tüm Sistemi Şimdi Senkronize Et"}
          </Btn>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
        Pazaryerlerindeki (Trendyol, N11, Hepsiburada, Pazarama, WooCommerce) güncel satış ve stok verilerini ISBN eşleştirmesiyle hemen çeker. Otomatik senkronizasyon zaten günde bir kez çalışır; yeni bir ürün yüklediyseniz beklemeden bu butonu kullanabilirsiniz.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: THEME.panelBg, border: `1px solid ${c.warn ? "rgba(255,138,61,.35)" : THEME.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: FONT_MONO, color: c.warn ? THEME.warn : THEME.textLight }}>{c.value}</div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted, marginTop: 4, letterSpacing: "0.04em" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <PanelAsistani authFetch={authFetch} />

      <AktiflikPaneli authFetch={authFetch} />

      {/* SİSTEM SAĞLIK KONTROLÜ */}
      <div style={{ marginTop: 18, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>Sistem Sağlık Kontrolü</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>
              Telif tutarsızlığı, bayat stok, eksik veri gibi sessiz hataları tarar
            </div>
          </div>
          <Btn small disabled={saglikBusy} onClick={saglikKontrol}>
            {saglikBusy ? "Taranıyor..." : "Kontrol Et"}
          </Btn>
        </div>
        {saglik && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              padding: "9px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
              background: saglik.durum === "saglikli" ? THEME.successBg : saglik.durum === "uyarili" ? THEME.warnBg : THEME.dangerBg,
              color: saglik.durum === "saglikli" ? THEME.success : saglik.durum === "uyarili" ? THEME.warn : THEME.danger,
              border: `1px solid ${saglik.durum === "saglikli" ? THEME.success : saglik.durum === "uyarili" ? THEME.warn : THEME.danger}`,
            }}>
              {saglik.durum === "saglikli" ? "✓ " : saglik.durum === "uyarili" ? "⚠ " : "✗ "}{saglik.ozet}
              {saglik.incelenenKitap != null && (
                <span style={{ fontWeight: 400, opacity: 0.85 }}> ({saglik.incelenenKitap} kitap incelendi)</span>
              )}
            </div>
            {(saglik.bulgular || []).map((b, i) => (
              <div key={i} style={{
                marginTop: 8, padding: "9px 12px", borderRadius: 6, fontSize: 12,
                background: THEME.panelBgAlt,
                borderLeft: `3px solid ${b.seviye === "hata" ? THEME.danger : THEME.warn}`,
              }}>
                <div style={{ fontWeight: 600, color: b.seviye === "hata" ? THEME.danger : THEME.warn }}>
                  {b.seviye === "hata" ? "✗" : "⚠"} {b.baslik}
                  {b.sayi > 0 && <span style={{ marginLeft: 6, fontWeight: 400 }}>({b.sayi} kayıt)</span>}
                </div>
                <div style={{ color: THEME.textMuted, marginTop: 3, lineHeight: 1.55 }}>{b.detay}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* İDEFİX BAĞLANTI TESTİ */}
      <div style={{ marginTop: 18, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>İdefix Bağlantısı</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>
              API bilgilerinin doğru çalıştığını kontrol eder
            </div>
          </div>
          <Btn small variant="ghost" disabled={idefixBusy} onClick={idefixKontrol}>
            {idefixBusy ? "Kontrol ediliyor..." : "Bağlantıyı Test Et"}
          </Btn>
        </div>
        {idefixTest && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 6, fontSize: 12.5, lineHeight: 1.6,
            background: idefixTest.ok ? THEME.successBg : THEME.dangerBg,
            border: `1px solid ${idefixTest.ok ? THEME.success : THEME.danger}`,
            color: idefixTest.ok ? THEME.success : THEME.danger,
          }}>
            <div style={{ fontWeight: 600 }}>{idefixTest.ok ? "✓ " : "✗ "}{idefixTest.text}</div>
            {idefixTest.detay && (
              <pre style={{ margin: "8px 0 0", fontSize: 11, fontFamily: FONT_MONO, color: THEME.textMuted, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {idefixTest.detay}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Kullanıcı (Admin) Yönetimi ============
function KullaniciYonetimi({ authFetch }) {
  const [admins, setAdmins] = React.useState([]);
  const [benimId, setBenimId] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  // Yeni admin formu
  const [yAd, setYAd] = React.useState("");
  const [yEmail, setYEmail] = React.useState("");
  const [ySifre, setYSifre] = React.useState("");
  // Kendi şifre değiştirme
  const [eski, setEski] = React.useState("");
  const [yeni, setYeni] = React.useState("");

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/admins");
      const d = await r.json();
      setAdmins(d.admins || []); setBenimId(d.benimId);
    } catch { setAdmins([]); }
  };
  React.useEffect(() => { yukle(); }, []);

  const adminEkle = async () => {
    setMsg(null);
    const r = await authFetch("/api/admin/admins", { method: "POST", body: JSON.stringify({ name: yAd, email: yEmail, sifre: ySifre }) });
    const d = await r.json();
    if (d.ok) { setMsg({ ok: true, text: d.mesaj }); setYAd(""); setYEmail(""); setYSifre(""); yukle(); }
    else setMsg({ ok: false, text: d.error });
  };
  const sifreDegistir = async () => {
    setMsg(null);
    const r = await authFetch("/api/admin/change-password", { method: "PATCH", body: JSON.stringify({ eskiSifre: eski, yeniSifre: yeni }) });
    const d = await r.json();
    if (d.ok) { setMsg({ ok: true, text: "Şifren değiştirildi." }); setEski(""); setYeni(""); }
    else setMsg({ ok: false, text: d.error });
  };
  const adminSil = async (id, ad) => {
    if (!window.confirm(`${ad} adlı admini silmek istediğine emin misin?`)) return;
    const r = await authFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.ok) { setMsg({ ok: true, text: d.mesaj }); yukle(); }
    else setMsg({ ok: false, text: d.error });
  };

  const inp = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13, marginBottom: 8 };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Kullanıcı Yönetimi</h2>
      {msg && <div style={{ marginBottom: 16, fontSize: 13, color: msg.ok ? THEME.success : THEME.danger, background: THEME.panelBg, border: `1px solid ${msg.ok ? THEME.success : THEME.danger}`, borderRadius: 8, padding: "10px 14px" }}>{msg.text}</div>}

      {/* Mevcut adminler */}
      <div style={{ color: THEME.textMuted, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>YÖNETİCİLER</div>
      {admins.map((a) => (
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{a.name} {a.id === benimId && <span style={{ color: THEME.cyan, fontSize: 11 }}>(sen)</span>}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5 }}>{a.email}</div>
          </div>
          {a.id !== benimId && <Btn small variant="danger" onClick={() => adminSil(a.id, a.name)}>Sil</Btn>}
        </div>
      ))}

      {/* Yeni admin ekle */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 18, marginTop: 22 }}>
        <div style={{ color: THEME.cyan, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Yeni Yönetici Ekle</div>
        <input style={inp} placeholder="İsim" value={yAd} onChange={(e) => setYAd(e.target.value)} />
        <input style={inp} placeholder="E-posta" value={yEmail} onChange={(e) => setYEmail(e.target.value)} />
        <input style={inp} type="password" placeholder="Şifre (en az 8 hane)" value={ySifre} onChange={(e) => setYSifre(e.target.value)} />
        <Btn small variant="success" onClick={adminEkle}>Yönetici Ekle</Btn>
      </div>

      {/* Kendi şifreni değiştir */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 18, marginTop: 16 }}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Kendi Şifreni Değiştir</div>
        <input style={inp} type="password" placeholder="Mevcut şifren" value={eski} onChange={(e) => setEski(e.target.value)} />
        <input style={inp} type="password" placeholder="Yeni şifre (en az 8 hane)" value={yeni} onChange={(e) => setYeni(e.target.value)} />
        <Btn small variant="primary" onClick={sifreDegistir}>Şifreyi Güncelle</Btn>
      </div>
    </div>
  );
}

// ============ İndirimli Alım Özeti (denetim) ============
function IndirimliOzet({ session, authFetch }) {
  const [ozet, setOzet] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let iptal = false;
    authFetch("/api/admin/indirimli-ozet")
      .then((r) => r.json())
      .then((d) => { if (!iptal) { setOzet(d.ozet || []); setLoading(false); } })
      .catch(() => { if (!iptal) setLoading(false); });
    return () => { iptal = true; };
  }, []);
  const toplam = ozet.reduce((s, o) => s + Number(o.toplam_indirimli_adet || 0), 0);
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Hediye & İndirimli Alım Özeti</h2>
      <div style={{ color: THEME.textMuted, fontSize: 12.5, marginBottom: 18 }}>
        Bu adetler yazarların telif, puan ve ödül hesabına <b>sayılmaz</b>. Toplam indirimli: <b style={{ color: THEME.cyan }}>{toplam} adet</b>
      </div>
      {loading && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && ozet.length === 0 && (
        <div style={{ color: THEME.textMuted, fontSize: 13, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>
          Henüz indirimli alım kaydı yok.
        </div>
      )}
      {ozet.map((o) => (
        <div key={o.author_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 8 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{o.yazar}</div>
            <div style={{ color: THEME.textFaint, fontSize: 11, marginTop: 3 }}>
              {o.talep_sayisi} kayıt{o.son_alim ? ` · son: ${new Date(o.son_alim).toLocaleDateString("tr-TR")}` : ""}
            </div>
          </div>
          <div style={{ color: THEME.cyan, fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700 }}>{o.toplam_indirimli_adet} adet</div>
        </div>
      ))}
    </div>
  );
}

// ============ İndirimli kitap talepleri ============
function DiscountRequests({ requests, loading, onApprove, onReject, authors, onManualAdd }) {
  const [mAuthor, setMAuthor] = React.useState("");
  const [mBook, setMBook] = React.useState("");
  const [mQty, setMQty] = React.useState("");
  const [mTur, setMTur] = React.useState("indirimli");
  const [mSebep, setMSebep] = React.useState("");
  const [mNote, setMNote] = React.useState("");
  const [mMsg, setMMsg] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Seçili yazarın kitapları (kitap seçimi için)
  const seciliYazar = (authors || []).find((a) => String(a.id) === String(mAuthor));
  const yazarKitaplari = seciliYazar?.books || [];

  const kaydet = async () => {
    if (!mAuthor) { setMMsg({ ok: false, text: "Yazar seçin." }); return; }
    if (!mBook) { setMMsg({ ok: false, text: "Kitap seçin. Kayıt hangi kitaba ait olduğu belirtilmeli." }); return; }
    if (!mQty) { setMMsg({ ok: false, text: "Adet girin." }); return; }
    setSaving(true); setMMsg(null);
    const r = await onManualAdd({ authorId: mAuthor, bookId: mBook, quantity: parseInt(mQty, 10), note: mNote, tur: mTur, sebep: mSebep });
    setSaving(false);
    if (r?.ok) { setMMsg({ ok: true, text: r.mesaj || "Kaydedildi." }); setMQty(""); setMNote(""); setMSebep(""); setMAuthor(""); setMBook(""); }
    else setMMsg({ ok: false, text: r?.error || "Kaydedilemedi." });
  };

  // Yazar değişince kitap seçimini sıfırla
  React.useEffect(() => { setMBook(""); }, [mAuthor]);

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Hediye Gönderim & İndirimli Talepler</h2>

      {/* MANUEL GİRİŞ — telefon/yüz yüze indirimli satışlar için */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 18, marginBottom: 22 }}>
        <div style={{ color: THEME.cyan, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>+ Manuel Hediye / İndirimli Alım Girişi</div>
        <div style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 14 }}>
          Telefon/yüz yüze indirimli satılan kitapları buradan gir. Bu adetler yazarın telif, puan ve ödül hesabına <b>sayılmaz</b> (çifte kazanç önlenir).
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Yazar</label>
            <select value={mAuthor} onChange={(e) => setMAuthor(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13 }}>
              <option value="">Yazar seç...</option>
              {(authors || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Kitap</label>
            <select value={mBook} onChange={(e) => setMBook(e.target.value)} disabled={!mAuthor} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: mAuthor ? THEME.textLight : THEME.textFaint, fontSize: 13 }}>
              <option value="">{mAuthor ? (yazarKitaplari.length ? "Kitap seç..." : "Bu yazarın kitabı yok") : "Önce yazar seçin"}</option>
              {yazarKitaplari.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 90px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Adet</label>
            <input type="number" min="1" value={mQty} onChange={(e) => setMQty(e.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13 }} />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Tür</label>
            <select value={mTur} onChange={(e) => setMTur(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${mTur === "hediye" ? THEME.warn : THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13, fontWeight: 600 }}>
              <option value="indirimli">🏷️ İndirimli</option>
              <option value="hediye">🎁 Hediye</option>
            </select>
          </div>
          <div style={{ flex: "2 1 160px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Sebep</label>
            <input value={mSebep} onChange={(e) => setMSebep(e.target.value)} placeholder={mTur === "hediye" ? "Örn: fuar standı" : "Örn: yazar talebi"} style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13 }} />
          </div>
          <div style={{ flex: "2 1 160px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Not (opsiyonel)</label>
            <input value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="Örn: imza günü" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, fontSize: 13 }} />
          </div>
          <Btn small variant="success" onClick={kaydet} disabled={saving}>{saving ? "..." : "Kaydet"}</Btn>
        </div>
        {/* Türün telife etkisi — yanlış giriş yapılmasın diye açıkça yazıyoruz */}
        <div style={{ marginTop: 8, fontSize: 11.5, color: mTur === "hediye" ? THEME.warn : THEME.textMuted, background: mTur === "hediye" ? THEME.warnBg : "transparent", padding: mTur === "hediye" ? "6px 10px" : 0, borderRadius: 6 }}>
          {mTur === "hediye"
            ? "🎁 Hediye: Telif hesabından düşülür (gerçek satış değil). Stoğu MST sitesinden ELLE düşmeyi unutmayın."
            : "🏷️ İndirimli: Telif hesabından düşülür. Stoğu MST sitesinden elle düşmeyi unutmayın."}
        </div>
        {mMsg && <div style={{ marginTop: 10, fontSize: 12.5, color: mMsg.ok ? THEME.success : THEME.danger }}>{mMsg.text}</div>}
      </div>

      <div style={{ color: THEME.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Uygulamadan Gelen Talepler</div>
      {loading && requests.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && requests.length === 0 && (
        <div style={{ color: THEME.textMuted, fontSize: 13, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>
          Bekleyen talep yok.
        </div>
      )}
      {requests.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.author_name}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>
              {r.book_title || "Kitap belirtilmemiş"} · <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{r.quantity} adet</span>
            </div>
            {r.note && <div style={{ color: THEME.textFaint, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{r.note}"</div>}
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString("tr-TR")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn small variant="success" onClick={() => onApprove(r.id)}>Onayla</Btn>
            <Btn small variant="danger" onClick={() => onReject(r.id)}>Reddet</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Kapsamlı Reklam Başvuruları (Hat 2) ============
// Yazar başvurur → burada kalem kalem teklif hazırlanır → yazar onaylar → yürütülür → rapor.
// Komisyon yok; kalemler yazara olduğu gibi gösterilir.
const TEKLIF_DURUM = {
  basvuru:     { ad: "Yeni başvuru",  renk: "#C0392B" },
  teklif_hazir:{ ad: "Teklif iletildi", renk: "#C9A24B" },
  onaylandi:   { ad: "Yazar onayladı", renk: "#2E7D32" },
  reddedildi:  { ad: "Reddedildi",    renk: "#7A7A7A" },
  yurutuluyor: { ad: "Yürütülüyor",   renk: "#2D6A4F" },
  tamamlandi:  { ad: "Tamamlandı",    renk: "#7A7A7A" },
  iptal:       { ad: "İptal",         renk: "#7A7A7A" },
};

// ============ Reklam Merkezi — danışman + rakip istihbaratı ============
function ReklamMerkezi({ authFetch }) {
  const [soru, setSoru] = useState("");
  const [cevap, setCevap] = useState(null);
  const [dusunuyor, setDusunuyor] = useState(false);
  const [rakipler, setRakipler] = useState(null);
  const [rakipYukleniyor, setRakipYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const sor = async (metin) => {
    if (dusunuyor) return;
    setDusunuyor(true); setCevap(null); setHata("");
    try {
      const r = await authFetch("/api/admin/reklam/danisman", {
        method: "POST", body: JSON.stringify({ soru: metin || soru }),
      });
      const d = await r.json();
      if (d.ok) setCevap(d); else setHata(d.error || "Cevap alınamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setDusunuyor(false); }
  };

  const rakipCek = async () => {
    if (rakipYukleniyor) return;
    setRakipYukleniyor(true); setHata("");
    try {
      const r = await authFetch("/api/admin/reklam/rakipler");
      const d = await r.json();
      if (d.ok) setRakipler(d); else setHata(d.error || "Rakip verisi alınamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setRakipYukleniyor(false); }
  };

  const hazirSorular = [
    "Reklam tarafında bugün neye odaklanmalıyım?",
    "Yeni yazar bulma reklamlarımı nasıl iyileştiririm?",
    "Hangi kampanya para yakıyor, hangisi ölçeklenmeli?",
    "Kreatiflerimde ne eksik?",
    "Rakipler ne yapıyor, biz ne yapmalıyız?",
  ];

  const renk = { yuksek: THEME.danger, orta: THEME.warn, dusuk: THEME.textFaint };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Reklam Merkezi</h2>
      <div style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 18, lineHeight: 1.55, maxWidth: 720 }}>
        Reklam danışmanı hem yazar kampanyalarını hem MST'nin kendi yazar bulma reklamlarını görüyor.
        Veri azken kesin yargı vermez, "henüz yeterli veri yok" der.
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginBottom: 12 }}>{hata}</div>}

      {/* Danışman */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 10 }}>Reklam Danışmanı</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {hazirSorular.map((q) => (
            <Btn key={q} small variant="ghost" disabled={dusunuyor} onClick={() => { setSoru(q); sor(q); }}>{q}</Btn>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={soru} onChange={(e) => setSoru(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sor()}
            placeholder="Kendi sorunu yaz..."
            style={{ flex: 1, background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" }} />
          <Btn small disabled={dusunuyor} onClick={() => sor()}>{dusunuyor ? "Düşünüyor..." : "Sor"}</Btn>
        </div>

        {dusunuyor && <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 12 }}>Reklam verisi ve rakip hareketleri okunuyor... (10-20 sn)</div>}

        {cevap && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 13.5, color: THEME.textLight, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{cevap.cevap}</div>
            <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 10 }}>
              {cevap.veriDurumu.toplamKampanya} kampanya incelendi, {cevap.veriDurumu.harcamaGorulenKampanya} tanesinde harcama verisi var
              {cevap.rakipVerisiVar ? " · rakip verisi dahil" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Rakip istihbaratı */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>Rakip Reklam İstihbaratı</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3, maxWidth: 560, lineHeight: 1.5 }}>
              Meta Reklam Kütüphanesi'nden yayınevi reklamları taranır. Uzun süredir yayında olan reklam,
              çalışan reklamdır — amaç kopyalamak değil desen okumak.
            </div>
          </div>
          <Btn small disabled={rakipYukleniyor} onClick={rakipCek}>{rakipYukleniyor ? "Taranıyor..." : "Rakipleri tara"}</Btn>
        </div>

        {rakipler && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>
              {rakipler.taranmisTerim} arama terimi · {rakipler.bulunanSayfa} yayınevi · {rakipler.toplamReklam} aktif reklam
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {rakipler.rakipler.map((r) => (
                <div key={r.sayfaId} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px", borderLeft: `3px solid ${renk[r.ciddiyet]}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{r.sayfa}</div>
                    <div style={{ fontSize: 11.5, color: THEME.textMuted, fontFamily: FONT_MONO }}>
                      {r.aktifReklam} reklam{r.enUzunSurenGun ? ` · ${r.enUzunSurenGun} gündür` : ""}
                    </div>
                  </div>
                  {r.ornekMetinler[0] && (
                    <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
                      "{r.ornekMetinler[0].slice(0, 180)}..."
                    </div>
                  )}
                </div>
              ))}
            </div>
            {rakipler.rakipler.length === 0 && (
              <div style={{ fontSize: 12.5, color: THEME.textFaint }}>
                Aktif rakip reklamı bulunamadı. Reklam Kütüphanesi Türkiye'de bazı kategorilerde sınırlı veri döndürebiliyor.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Yazar Kampanyaları — onay ekranı ============
// Yazar kampanya açtığında bütçesi BLOKE edilir, harcanmaz. Burada onaylarsan
// sistem Meta'da gerçek kampanya kurar. Reddedersen bütçe otomatik iade edilir.
const KAMP_DURUM = {
  onay_bekliyor: { ad: "Onay bekliyor", renk: "#C0392B" },
  onaylandi:     { ad: "Onaylandı",     renk: "#C9A227" },
  yayinda:       { ad: "Yayında",       renk: "#2E7D32" },
  bitti:         { ad: "Tamamlandı",    renk: "#7A7A7A" },
  reddedildi:    { ad: "Reddedildi",    renk: "#7A7A7A" },
  iptal:         { ad: "İptal",         renk: "#7A7A7A" },
};

function YazarKampanyalari({ authFetch }) {
  const [liste, setListe] = useState(null);
  const [sonuc, setSonuc] = useState("");
  const [calisan, setCalisan] = useState(null);

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/reklam/kampanyalar");
      const d = await r.json();
      if (d.ok) setListe(d.kampanyalar); else setSonuc(d.error || "Okunamadı.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const islem = async (id, tur) => {
    let sebep = "";
    if (tur === "reddet") {
      sebep = window.prompt("Red sebebi (yazara iletilecek):", "Kitap görseli veya bilgileri eksik");
      if (sebep === null) return;
    } else {
      if (!window.confirm("Kampanya Meta'da gerçekten oluşturulacak ve yayına alınacak. Onaylıyor musun?")) return;
    }
    setCalisan(id); setSonuc("");
    try {
      const r = await authFetch(`/api/admin/reklam/kampanya/${id}/${tur === "reddet" ? "reddet" : "onayla"}`, {
        method: "POST", body: JSON.stringify(tur === "reddet" ? { sebep } : {}),
      });
      const d = await r.json();
      setSonuc(d.ok ? d.mesaj : (d.error || "İşlem yapılamadı."));
      yukle();
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisan(null); }
  };

  if (!liste) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>{sonuc || "Yükleniyor..."}</div>;

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Yazar Kampanyaları</h2>
      <div style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 1.55, maxWidth: 700 }}>
        Yazarın açtığı kampanyalar. Bütçe ayrılmış durumda — <b>henüz harcanmadı</b>.
        Onayladığında sistem Meta'da gerçek kampanya kurar ve yayına alır.
        Reddedersen bütçe yazara otomatik iade edilir ve sebep kendisine bildirilir.
      </div>
      {sonuc && <div style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 14, background: THEME.panelBgAlt, padding: "10px 12px", borderRadius: 6 }}>{sonuc}</div>}
      {liste.length === 0 && <div style={{ color: THEME.textFaint, fontSize: 13 }}>Henüz kampanya yok.</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {liste.map((k) => {
          const d = KAMP_DURUM[k.durum] || KAMP_DURUM.onay_bekliyor;
          const bekliyor = k.durum === "onay_bekliyor";
          return (
            <div key={k.id} style={{ background: THEME.panelBg, border: `1px solid ${bekliyor ? d.renk : THEME.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, color: THEME.textLight, fontWeight: 600 }}>
                    {k.yazar} <span style={{ color: THEME.textFaint, fontSize: 11.5 }}>{PLAN_LABELS[k.plan] || k.plan}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 2 }}>{k.kitap}</div>
                  <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 6 }}>
                    {Number(k.butce).toLocaleString("tr-TR")} ₺ · {k.gun_sayisi} gün ·
                    {" "}{k.amac === "bilinirlik" ? "bilinirlik" : "satış"} · {k.hedef_kitle}
                    {" "}({k.yas_min}-{k.yas_max}, {k.cinsiyet})
                  </div>
                  {k.isbn ? null : <div style={{ fontSize: 11.5, color: THEME.warn, marginTop: 5 }}>⚠ Kitapta ISBN yok</div>}
                  {k.red_sebebi && <div style={{ fontSize: 11.5, color: THEME.danger, marginTop: 5 }}>{k.red_sebebi}</div>}
                  {k.meta_campaign_id && <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 5, fontFamily: FONT_MONO }}>Meta: {k.meta_campaign_id}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 10.5, color: d.renk, border: `1px solid ${d.renk}`, borderRadius: 12, padding: "3px 9px", whiteSpace: "nowrap" }}>{d.ad}</span>
                  {bekliyor && (
                    <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Btn small disabled={calisan === k.id} onClick={() => islem(k.id, "onayla")}>Onayla ve Yayınla</Btn>
                      <Btn small variant="ghost" disabled={calisan === k.id} onClick={() => islem(k.id, "reddet")}>Reddet</Btn>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Meta dönüşüm beslemesi ============
// Satış telefonda kapandığı için Meta müşteriye dönüşen konuşmaları göremiyor.
// Bu kart, sözleşme imzalayan yazarları Meta'ya bildirir; algoritma böylece
// "ucuz konuşma" yerine "gerçek müşteri" arayan hale gelir.
function DonusumBeslemesi({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/meta/donusum-bekleyenler");
      const d = await r.json();
      if (d.ok) setVeri(d); else setSonuc(d.error || "Okunamadı.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const gonder = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setSonuc("");
    try {
      const r = await authFetch("/api/admin/meta/donusum-gonder", { method: "POST", body: "{}" });
      const d = await r.json();
      setSonuc(d.ok ? d.mesaj + (d.hataliSayi ? ` (${d.hataliSayi} hata)` : "") : (d.error || "Gönderilemedi."));
      yukle();
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight, marginBottom: 3 }}>Meta Dönüşüm Beslemesi</div>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.55, maxWidth: 660 }}>
        Satışlar telefonda kapandığı için Meta hangi konuşmanın müşteriye dönüştüğünü göremiyor —
        her gün sıfırdan tahmin ediyor. Sözleşme imzalayan yazarları bildirdiğimizde
        "bunlara benzeyenleri bul" diyebilir hale geliyor. Kişisel bilgi gönderilmez,
        yalnızca geri döndürülemez şifreli özet.
      </div>

      {veri && (
        <div style={{ display: "flex", gap: 22, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, color: veri.bekleyen ? THEME.cyan : THEME.textFaint }}>{veri.bekleyen}</div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted }}>bildirilmeyi bekleyen</div>
          </div>
          {veri.epostasiz > 0 && (
            <div>
              <div style={{ fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, color: THEME.warn }}>{veri.epostasiz}</div>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>e-postası yok — bildirilemez</div>
            </div>
          )}
        </div>
      )}

      <Btn small disabled={calisiyor || !veri || !veri.bekleyen} onClick={gonder}>
        {calisiyor ? "Gönderiliyor..." : "Sözleşmeleri Meta'ya bildir"}
      </Btn>
      {sonuc && <div style={{ fontSize: 12, color: THEME.textLight, marginTop: 10, lineHeight: 1.5 }}>{sonuc}</div>}
    </div>
  );
}

function ReklamBasvurulari({ authFetch }) {
  const [liste, setListe] = useState(null);
  const [hata, setHata] = useState("");
  const [acik, setAcik] = useState(null);

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/reklam-teklifleri");
      const d = await r.json();
      if (d.ok) setListe(d.teklifler); else setHata(d.error || "Okunamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  if (hata) return <div style={{ color: THEME.warn, fontSize: 13 }}>{hata}</div>;
  if (!liste) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>;

  return (
    <div>
      <DonusumBeslemesi authFetch={authFetch} />

      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Reklam Başvuruları</h2>
      <div style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 1.55 }}>
        Yazarların kapsamlı reklam talepleri. Teklifi kalem kalem hazırlarsın, yazar uygulamasından onaylar.
        Yeni başvurular en üstte.
      </div>
      {liste.length === 0 && <div style={{ color: THEME.textFaint, fontSize: 13 }}>Henüz başvuru yok.</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {liste.map((t) => {
          const d = TEKLIF_DURUM[t.durum] || TEKLIF_DURUM.basvuru;
          return (
            <div key={t.id} style={{ background: THEME.panelBg, border: `1px solid ${t.durum === "basvuru" ? d.renk : THEME.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: THEME.textLight, fontWeight: 600 }}>
                    {t.yazar} <span style={{ color: THEME.textFaint, fontSize: 11.5 }}>{PLAN_LABELS[t.plan] || t.plan}</span>
                  </div>
                  {t.kitap && <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 2 }}>{t.kitap}</div>}
                  <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 6, lineHeight: 1.6 }}>{t.hedef}</div>
                  <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 5 }}>
                    {t.butce_araligi && `Bütçe: ${t.butce_araligi}`}
                    {t.sure_tercihi && ` · Süre: ${t.sure_tercihi}`}
                    {t.toplam && ` · Teklif: ${Number(t.toplam).toLocaleString("tr-TR")} ₺`}
                  </div>
                  {t.yazar_notu && <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 5, fontStyle: "italic" }}>"{t.yazar_notu}"</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 10.5, color: d.renk, border: `1px solid ${d.renk}`, borderRadius: 12, padding: "3px 9px", whiteSpace: "nowrap" }}>{d.ad}</span>
                  <div style={{ marginTop: 8 }}>
                    <Btn small variant="ghost" onClick={() => setAcik(acik === t.id ? null : t.id)}>
                      {acik === t.id ? "Kapat" : "İşlem"}
                    </Btn>
                  </div>
                </div>
              </div>
              {acik === t.id && <TeklifEditor teklif={t} authFetch={authFetch} onDone={() => { setAcik(null); yukle(); }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeklifEditor({ teklif, authFetch, onDone }) {
  const mevcut = Array.isArray(teklif.kalemler) ? teklif.kalemler : [];
  const [kalemler, setKalemler] = useState(mevcut.length ? mevcut : [
    { ad: "Reklam bütçesi", aciklama: "Doğrudan platforma harcanır", tutar: "" },
    { ad: "Tanıtım videosu", aciklama: "Fragman tarzı, dikey format", tutar: "" },
    { ad: "Kampanya yönetimi", aciklama: "Kurulum, takip, optimizasyon", tutar: "" },
  ]);
  const [not, setNot] = useState(teklif.teklif_notu || "");
  const [rapor, setRapor] = useState(teklif.rapor_metni || "");
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const toplam = kalemler.reduce((t, k) => t + (Number(k.tutar) || 0), 0);
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "7px 10px", fontSize: 12.5, fontFamily: "inherit", boxSizing: "border-box" };

  const kalemGuncelle = (i, alan, deger) => {
    const y = [...kalemler]; y[i] = { ...y[i], [alan]: deger }; setKalemler(y);
  };

  const gonder = async () => {
    setCalisiyor(true); setSonuc("");
    try {
      const r = await authFetch(`/api/admin/reklam-teklif/${teklif.id}/hazirla`, {
        method: "POST",
        body: JSON.stringify({ kalemler: kalemler.filter((k) => Number(k.tutar) > 0), hizmetBedeli: 0, not, gecerlilikGun: 14 }),
      });
      const d = await r.json();
      setSonuc(d.ok ? d.mesaj : (d.error || "Gönderilemedi."));
      if (d.ok) setTimeout(onDone, 900);
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const durumDegistir = async (durum) => {
    setCalisiyor(true); setSonuc("");
    try {
      const r = await authFetch(`/api/admin/reklam-teklif/${teklif.id}/durum`, {
        method: "POST", body: JSON.stringify({ durum, rapor: durum === "tamamlandi" ? rapor : "" }),
      });
      const d = await r.json();
      setSonuc(d.ok ? d.mesaj : (d.error || "Güncellenemedi."));
      if (d.ok) setTimeout(onDone, 900);
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
      <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 8 }}>TEKLİF KALEMLERİ — yazar bunları olduğu gibi görecek</div>
      <div style={{ display: "grid", gap: 6 }}>
        {kalemler.map((k, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr 110px", gap: 6 }}>
            <input value={k.ad} onChange={(e) => kalemGuncelle(i, "ad", e.target.value)} placeholder="Kalem" style={inputStyle} />
            <input value={k.aciklama} onChange={(e) => kalemGuncelle(i, "aciklama", e.target.value)} placeholder="Açıklama" style={inputStyle} />
            <input value={k.tutar} onChange={(e) => kalemGuncelle(i, "tutar", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="₺" style={{ ...inputStyle, fontFamily: FONT_MONO, textAlign: "right" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <Btn small variant="ghost" onClick={() => setKalemler([...kalemler, { ad: "", aciklama: "", tutar: "" }])}>+ Kalem ekle</Btn>
        <div style={{ fontSize: 14, color: THEME.textLight, fontFamily: FONT_MONO }}>
          Toplam: <b style={{ color: THEME.cyan }}>{toplam.toLocaleString("tr-TR")} ₺</b>
        </div>
      </div>
      <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={2} placeholder="Yazara not (opsiyonel) — ne bekleyebileceğini dürüstçe yaz"
        style={{ ...inputStyle, width: "100%", marginTop: 8, resize: "vertical" }} />

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Btn small disabled={calisiyor || toplam <= 0} onClick={gonder}>Teklifi Yazara Gönder</Btn>
        {teklif.durum === "onaylandi" && <Btn small variant="ghost" onClick={() => durumDegistir("yurutuluyor")}>Yürütmeye Başla</Btn>}
        {teklif.durum === "yurutuluyor" && <Btn small variant="ghost" onClick={() => durumDegistir("tamamlandi")}>Tamamlandı + Rapor</Btn>}
        <Btn small variant="ghost" onClick={() => durumDegistir("iptal")}>İptal</Btn>
      </div>

      {teklif.durum === "yurutuluyor" && (
        <textarea value={rapor} onChange={(e) => setRapor(e.target.value)} rows={3}
          placeholder="Sonuç raporu — kaç kişiye ulaştı, kaç tıklama, satışa etkisi. Dürüst yaz."
          style={{ ...inputStyle, width: "100%", marginTop: 8, resize: "vertical" }} />
      )}
      {sonuc && <div style={{ fontSize: 12, color: sonuc.indexOf("iletildi") > -1 || sonuc.indexOf("güncellendi") > -1 ? THEME.success : THEME.danger, marginTop: 8 }}>{sonuc}</div>}
    </div>
  );
}

// ============ Eşleşme Teşhisi — hangi kitap hangi siteden çekilemiyor ============
const ESLESME_PLATFORMLARI = [
  { key: "mst", label: "MST" }, { key: "trendyol", label: "Trendyol" }, { key: "n11", label: "N11" },
  { key: "hepsiburada", label: "Hepsiburada" }, { key: "pazarama", label: "Pazarama" }, { key: "idefix", label: "İdefix" },
];
const DURUM_GORUNUM = {
  eslesti:         { simge: "✓", renk: THEME.success, aciklama: "Platformda bulundu, stok çekiliyor" },
  eslesmedi:       { simge: "✕", renk: THEME.danger,  aciklama: "Platform veri verdi ama kitap orada yok — ürün listelenmemiş ya da satıcı stok kodu farklı" },
  isbn_yok:        { simge: "?", renk: THEME.warn,    aciklama: "Kitapta ISBN girilmemiş — hiçbir platformda aranamıyor" },
  platform_sessiz: { simge: "–", renk: THEME.textFaint, aciklama: "Platform hiç ürün döndürmedi (API arızası/yetki) — kitapla ilgisi yok" },
};

function EslesmeTeshisi({ authFetch, onSelectAuthor }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sadeceSorunlu, setSadeceSorunlu] = useState(true);

  const calistir = async () => {
    setYukleniyor(true); setHata(""); setVeri(null);
    try {
      const r = await authFetch("/api/admin/eslesme-detay");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Teşhis çalıştırılamadı.");
    } catch { setHata("Sunucuya bağlanılamadı."); }
    finally { setYukleniyor(false); }
  };

  const kitaplar = !veri ? [] : (sadeceSorunlu ? veri.kitaplar.filter((k) => k.eksikSayisi > 0) : veri.kitaplar);

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Eşleşme Teşhisi</h2>
      <div style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 14, lineHeight: 1.55 }}>
        Hangi kitabın stok bilgisi hangi siteden alınamıyor ve <b>neden</b>. Bu ekran hiçbir kaydı değiştirmez —
        canlı veriyi çekip karşılaştırır. Çalışması 20-40 saniye sürebilir.
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <Btn onClick={calistir} disabled={yukleniyor}>{yukleniyor ? "Kontrol ediliyor..." : "Teşhisi Çalıştır"}</Btn>
        {veri && (
          <label style={{ fontSize: 12.5, color: THEME.textMuted, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={sadeceSorunlu} onChange={(e) => setSadeceSorunlu(e.target.checked)} />
            Sadece eksiği olanlar
          </label>
        )}
      </div>
      {hata && <div style={{ color: THEME.danger, fontSize: 13, marginBottom: 14 }}>{hata}</div>}

      {veri && (
        <>
          {veri.sessizPlatformlar.length > 0 && (
            <div style={{ background: THEME.dangerBg, border: `1px solid rgba(255,107,107,.3)`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: THEME.danger, lineHeight: 1.55 }}>
              ⚠️ Şu platformlar hiç ürün döndürmedi: <b>{veri.sessizPlatformlar.join(", ")}</b>.
              Bu bir eşleşme sorunu değil, platform/API sorunudur — o sütunlardaki "–" işaretleri kitapla ilgili değil.
              {Object.entries(veri.platformHatalari).filter(([, h]) => h).map(([p, h]) => (
                <div key={p} style={{ marginTop: 4, fontSize: 11.5 }}>{p}: {h}</div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 16 }}>
            {ESLESME_PLATFORMLARI.map((p) => {
              const o = veri.ozet[p.key] || {};
              return (
                <div key={p.key} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: o.eslesti ? THEME.success : THEME.danger }}>
                    {o.eslesti || 0}<span style={{ fontSize: 11, color: THEME.textFaint }}>/{veri.toplamKitap}</span>
                  </div>
                  <div style={{ fontSize: 10, color: THEME.textFaint, marginTop: 2 }}>{o.cekilenUrun || 0} ürün çekildi</div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
            {kitaplar.length} kitap gösteriliyor · {veri.isbnsizKitap} kitapta ISBN yok
          </div>

          <div style={{ overflowX: "auto", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: THEME.panelBgAlt }}>
                  <th style={{ textAlign: "left", padding: "9px 12px", color: THEME.textMuted, fontWeight: 600 }}>Kitap</th>
                  <th style={{ textAlign: "left", padding: "9px 12px", color: THEME.textMuted, fontWeight: 600 }}>Yazar</th>
                  <th style={{ textAlign: "left", padding: "9px 12px", color: THEME.textMuted, fontWeight: 600 }}>ISBN</th>
                  {ESLESME_PLATFORMLARI.map((p) => (
                    <th key={p.key} style={{ textAlign: "center", padding: "9px 6px", color: THEME.textMuted, fontWeight: 600, fontSize: 11 }}>{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kitaplar.map((k) => (
                  <tr key={k.bookId} style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "8px 12px", color: THEME.textLight }}>{k.title}</td>
                    <td style={{ padding: "8px 12px", color: THEME.cyan, cursor: "pointer" }} onClick={() => onSelectAuthor(k.authorId)}>{k.yazar}</td>
                    <td style={{ padding: "8px 12px", fontFamily: FONT_MONO, color: k.isbn ? THEME.textMuted : THEME.warn }}>{k.isbn || "yok"}</td>
                    {ESLESME_PLATFORMLARI.map((p) => {
                      const d = DURUM_GORUNUM[k.durum[p.key]] || DURUM_GORUNUM.platform_sessiz;
                      return (
                        <td key={p.key} title={d.aciklama} style={{ textAlign: "center", padding: "8px 6px", color: d.renk, fontWeight: 700, cursor: "help" }}>{d.simge}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, fontSize: 11.5, color: THEME.textMuted, lineHeight: 1.7 }}>
            {Object.entries(DURUM_GORUNUM).map(([k, d]) => (
              <div key={k}><span style={{ color: d.renk, fontWeight: 700 }}>{d.simge}</span> {d.aciklama}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Toplu ISBN yükleme ============
// ============ Mağaza Siparişleri ============
function ServiceOrdersView({ orders, loading, onUpdateStatus }) {
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Mağaza Siparişleri</h2>
      {loading && orders.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && orders.length === 0 && (
        <div style={{ color: THEME.textMuted, fontSize: 13, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>
          Henüz sipariş yok.
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{o.author_name} <span style={{ color: THEME.textMuted, fontWeight: 400 }}>— {o.title}</span></div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>
              {o.bookTitle && <>{o.bookTitle} · </>}{o.detail && <>{o.detail} · </>}{o.price != null ? <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{Number(o.price).toLocaleString("tr-TR")}₺</span> : "Ücretsiz başvuru"}
            </div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 4 }}>{new Date(o.createdAt).toLocaleDateString("tr-TR")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Badge fg={o.status === "Tamamlandı" ? THEME.success : o.status === "İptal edildi" ? THEME.danger : THEME.warn} bg={o.status === "Tamamlandı" ? "rgba(93,214,163,.1)" : o.status === "İptal edildi" ? "rgba(255,107,107,.1)" : THEME.warnBg}>{o.status}</Badge>
            {o.status !== "Tamamlandı" && <Btn small variant="success" onClick={() => onUpdateStatus(o.id, "Tamamlandı")}>Tamamla</Btn>}
            {o.status !== "İptal edildi" && <Btn small variant="danger" onClick={() => onUpdateStatus(o.id, "İptal edildi")}>İptal Et</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Reklam Talepleri / Kampanyalar ============
function AdRequestsView({ requests, loading, onUpdateStatus }) {
  const talepler = requests.filter((r) => r.kind === "request");
  const kampanyalar = requests.filter((r) => r.kind === "campaign");
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 8 }}>Reklam Talepleri</h2>
      {loading && requests.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}

      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, margin: "16px 0 10px" }}>YÖNETİLEN TALEPLER (STANDART/PROFESYONEL)</div>
      {talepler.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Bekleyen talep yok.</div>}
      {talepler.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.author_name}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>{r.bookTitle} · Bütçe <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{Number(r.budget).toLocaleString("tr-TR")}₺</span></div>
            {r.note && <div style={{ color: THEME.textFaint, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{r.note}"</div>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Badge fg={r.status === "açık" ? THEME.warn : THEME.success} bg={r.status === "açık" ? THEME.warnBg : "rgba(93,214,163,.1)"}>{r.status === "açık" ? "Bekliyor" : r.status}</Badge>
            {r.status === "açık" && <>
              <Btn small variant="success" onClick={() => onUpdateStatus(r.id, "Onaylandı")}>Onayla</Btn>
              <Btn small variant="danger" onClick={() => onUpdateStatus(r.id, "Reddedildi")}>Reddet</Btn>
            </>}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, margin: "22px 0 10px" }}>SELF-SERVE KAMPANYALAR (VIP)</div>
      {kampanyalar.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Aktif kampanya yok.</div>}
      {kampanyalar.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{c.author_name}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>{c.bookTitle} · {c.platform} · <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{Number(c.budget).toLocaleString("tr-TR")}₺</span> · {c.duration} gün</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Badge fg={c.status === "Aktif" ? THEME.success : THEME.textMuted} bg={c.status === "Aktif" ? "rgba(93,214,163,.1)" : THEME.panelBgAlt}>{c.status}</Badge>
            {c.status === "Aktif" && <Btn small variant="ghost" onClick={() => onUpdateStatus(c.id, "Bitti")}>Bitir</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Çeviri Talepleri ============
function TranslationRequestsView({ requests, loading, onUpdateStatus }) {
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Çeviri Talepleri</h2>
      {loading && requests.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && requests.length === 0 && (
        <div style={{ color: THEME.textMuted, fontSize: 13, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>
          Henüz çeviri talebi yok.
        </div>
      )}
      {requests.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.author_name}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>{r.bookTitle} → {r.language}</div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 4 }}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Badge fg={r.status === "devam" ? THEME.warn : THEME.success} bg={r.status === "devam" ? THEME.warnBg : "rgba(93,214,163,.1)"}>{r.status === "devam" ? "Devam ediyor" : "Tamamlandı"}</Badge>
            {r.status === "devam" && <Btn small variant="success" onClick={() => onUpdateStatus(r.id, "tamamlandi")}>Tamamlandı İşaretle</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}


// ============ Destek / Şikayet Talepleri (AI'dan gelen) ============
function DestekTalepleriView({ requests, loading, onUpdateStatus }) {
  const KAT = { sikayet: "Şikayet", destek: "Destek" };
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Destek & Şikayet Talepleri</h2>
      {loading && requests.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && requests.length === 0 && (
        <div style={{ color: THEME.textMuted, fontSize: 13, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>
          Henüz destek talebi yok.
        </div>
      )}
      {requests.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10, gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.author_name}</div>
              <Badge fg={r.kategori === "sikayet" ? THEME.warn : THEME.cyan} bg={r.kategori === "sikayet" ? THEME.warnBg : "rgba(27,95,168,0.08)"}>{KAT[r.kategori] || r.kategori}</Badge>
            </div>
            {r.konu && <div style={{ color: THEME.textLight, fontSize: 13, marginTop: 4, fontWeight: 600 }}>{r.konu}</div>}
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{r.mesaj}</div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 6 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("tr-TR") : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Badge fg={r.status === "bekliyor" ? THEME.warn : THEME.success} bg={r.status === "bekliyor" ? THEME.warnBg : "rgba(93,214,163,.1)"}>{r.status === "bekliyor" ? "Bekliyor" : "Çözüldü"}</Badge>
            {r.status === "bekliyor" && <Btn small variant="success" onClick={() => onUpdateStatus(r.id, "cozuldu")}>Çözüldü İşaretle</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}


// ============ Duyurular ============
// ============ OYUN YÖNETİMİ: kanıt onayı + görev/ödül + teslim ============
function OyunView({ authFetch, authors }) {
  const [altTab, setAltTab] = useState("kanit"); // kanit | gorevler | oduller | teslim
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: THEME.textLight, marginBottom: 4 }}>Görev & Ödül Yönetimi</div>
      <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 16 }}>Kazan-kazandır sistemi: kanıt onayları, görev/ödül tanımları ve ödül teslimleri.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {[["kanit", "Kanıt Onayları"], ["hizmet", "Kariyer Hizmetleri"], ["gorevler", "Görevler"], ["oduller", "Ödül Kataloğu"], ["teslim", "Ödül Teslim"], ["topluluk", "Topluluk Hedefi"], ["manuel", "Manuel Müdahale"]].map(([k, l]) => (
          <button key={k} onClick={() => setAltTab(k)} style={{ padding: "8px 14px", fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: "pointer",
            border: `1px solid ${altTab === k ? THEME.cyan : THEME.border}`, background: altTab === k ? THEME.cyan : "transparent", color: altTab === k ? "#03040A" : THEME.textMuted }}>{l}</button>
        ))}
      </div>
      {altTab === "kanit" && <KanitOnaylari authFetch={authFetch} />}
      {altTab === "hizmet" && <KariyerHizmetleri authFetch={authFetch} />}
      {altTab === "gorevler" && <GorevYonetimi authFetch={authFetch} />}
      {altTab === "oduller" && <OdulYonetimi authFetch={authFetch} />}
      {altTab === "teslim" && <OdulTeslim authFetch={authFetch} />}
      {altTab === "topluluk" && <ToplulukHedefYonetimi authFetch={authFetch} />}
      {altTab === "manuel" && <ManuelMudahale authFetch={authFetch} authors={authors} />}
    </div>
  );
}

function KanitOnaylari({ authFetch }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const load = () => { setLoading(true); authFetch("/api/admin/oyun/kanit-bekleyenler").then((r) => r.json()).then((d) => setList(d.bekleyenler || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const karar = async (yazarGorevId, onay) => {
    const res = await authFetch("/api/admin/oyun/kanit-onayla", { method: "POST", body: JSON.stringify({ yazarGorevId, onay }) });
    const d = await res.json();
    setMsg({ ok: res.ok, text: d.mesaj || d.error });
    load();
  };
  if (loading) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor…</div>;
  return (
    <div>
      {msg && <div style={{ fontSize: 12.5, color: msg.ok ? THEME.success : THEME.danger, marginBottom: 12 }}>{msg.text}</div>}
      {!list.length ? <div style={{ color: THEME.textMuted, fontSize: 13 }}>Onay bekleyen kanıt yok.</div> :
        list.map((k) => (
          <div key={k.id} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: THEME.textLight }}>{k.gorev}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>Yazar: {k.yazar}</div>
                <div style={{ display: "flex", gap: 10, fontSize: 11.5, marginTop: 6 }}>
                  {k.xp_odul > 0 && <span style={{ color: THEME.cyan }}>+{k.xp_odul} XP</span>}
                  {k.kredi_odul > 0 && <span style={{ color: THEME.warn }}>+{Number(k.kredi_odul)}₺</span>}
                  {k.odul_aciklama && <span style={{ color: THEME.success }}>🎁 {k.odul_aciklama}</span>}
                </div>
                {k.kanit_url && <a href={k.kanit_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: THEME.cyan, display: "inline-block", marginTop: 8, wordBreak: "break-all" }}>🔗 Kanıtı Gör: {k.kanit_url}</a>}
                {k.kanit_not && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4 }}>Not: {k.kanit_not}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Btn small variant="success" onClick={() => karar(k.id, true)}>Onayla</Btn>
                <Btn small variant="danger" onClick={() => karar(k.id, false)}>Reddet</Btn>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function KariyerHizmetleri({ authFetch }) {
  const [gorevler, setGorevler] = useState([]);
  const [yazarlar, setYazarlar] = useState([]);
  const [verilenler, setVerilenler] = useState([]);
  const [secYazar, setSecYazar] = useState("");
  const [secGorev, setSecGorev] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const inp = { padding: "8px 10px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight };

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/oyun/hizmet-gorevleri").then((r) => r.json()).then((d) => {
      setGorevler(d.gorevler || []); setYazarlar(d.yazarlar || []); setVerilenler(d.verilenler || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const ver = async () => {
    if (!secYazar || !secGorev) return;
    const res = await authFetch("/api/admin/oyun/hizmet-ver", { method: "POST", body: JSON.stringify({ authorId: secYazar, gorevId: secGorev }) });
    const d = await res.json();
    setMsg({ ok: res.ok, text: d.mesaj || d.error });
    if (res.ok) { setSecGorev(""); load(); }
  };

  if (loading) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor…</div>;

  return (
    <div>
      <div style={{ background: "rgba(45,106,79,.06)", border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>
        <b style={{ color: THEME.cyan }}>🎓 Kariyer & gelişim hizmetleri</b> — Yazarlık atölyesi, editör raporu, mentorluk, çeviri gibi hizmetleri bir yazara verdiğinde burada "verildi" işaretle. Görev otomatik tamamlanır, ödül tanımlanır. Doğrulama yazar beyanına değil, senin bu kaydına dayanır (suistimal edilemez).
      </div>

      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>HİZMET VER</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>Yazar</div>
            <select style={{ ...inp, width: "100%" }} value={secYazar} onChange={(e) => setSecYazar(e.target.value)}>
              <option value="">— seç —</option>
              {yazarlar.map((y) => <option key={y.id} value={y.id}>{y.name} ({y.plan})</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>Hizmet</div>
            <select style={{ ...inp, width: "100%" }} value={secGorev} onChange={(e) => setSecGorev(e.target.value)}>
              <option value="">— seç —</option>
              {gorevler.map((g) => <option key={g.id} value={g.id}>{g.baslik}</option>)}
            </select>
          </div>
          <Btn onClick={ver} disabled={!secYazar || !secGorev}>Verildi İşaretle</Btn>
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.ok ? THEME.success : THEME.danger, marginTop: 10 }}>{msg.text}</div>}
      </div>

      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>SON VERİLEN HİZMETLER ({verilenler.length})</div>
      {!verilenler.length ? <div style={{ fontSize: 12.5, color: THEME.textFaint }}>Henüz hizmet verilmedi.</div> :
        verilenler.slice(0, 30).map((v, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: THEME.textLight }}>{v.gorev} <span style={{ color: THEME.textMuted }}>→ {v.yazar}</span></div>
            <div style={{ fontSize: 11, color: THEME.textFaint }}>{v.tamamlanma_tarihi ? new Date(v.tamamlanma_tarihi).toLocaleDateString("tr-TR") : ""}</div>
          </div>
        ))}
    </div>
  );
}

function GorevYonetimi({ authFetch }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ baslik: "", aciklama: "", tip: "otomatik", periyot: "tek_sefer", hedefTur: "satis", hedefDeger: 1, xpOdul: 0, krediOdul: 0, odulAciklama: "", minSeviye: 1, kademe: "kucuk" });
  const [msg, setMsg] = useState(null);
  const load = () => authFetch("/api/admin/oyun/gorevler").then((r) => r.json()).then((d) => setList(d.gorevler || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const ekle = async () => {
    if (!form.baslik.trim()) return;
    const res = await authFetch("/api/admin/oyun/gorevler", { method: "POST", body: JSON.stringify(form) });
    const d = await res.json();
    setMsg({ ok: res.ok, text: res.ok ? "Görev eklendi." : (d.error || "Hata") });
    if (res.ok) { setForm({ ...form, baslik: "", aciklama: "", odulAciklama: "" }); load(); }
  };
  const sil = async (id) => { await authFetch(`/api/admin/oyun/gorevler/${id}`, { method: "DELETE" }); load(); };
  const inp = { width: "100%", padding: "8px 10px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, boxSizing: "border-box" };
  return (
    <div>
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>YENİ GÖREV</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input style={inp} placeholder="Görev başlığı" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <select style={inp} value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
            <option value="otomatik">Otomatik (sistem sayar)</option>
            <option value="sistem">Sistem (uygulama içi)</option>
            <option value="hizmet">Hizmet (MST verir — kariyer desteği)</option>
            <option value="kanit">Kanıt (admin onaylar)</option>
          </select>
          <select style={inp} value={form.periyot} onChange={(e) => setForm({ ...form, periyot: e.target.value })}>
            <option value="tek_sefer">Tek Sefer</option><option value="gunluk">Günlük</option><option value="haftalik">Haftalık</option><option value="aylik">Aylık</option><option value="sezonluk">Sezonluk</option>
          </select>
        </div>
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <select style={inp} value={form.hedefTur} onChange={(e) => setForm({ ...form, hedefTur: e.target.value })}>
            <optgroup label="Satış">
              <option value="satis">Toplam Satış</option><option value="kitap_satis">Tek Kitap Satışı</option>
            </optgroup>
            <optgroup label="Katalog & Kanal">
              <option value="kitap_ekle">Kitap Sayısı</option><option value="kanal_sayisi">Kanal Sayısı</option><option value="kitap_tamlik">Eksiksiz Kitap</option>
            </optgroup>
            <optgroup label="Kazanç & Sadakat">
              <option value="toplam_telif">Toplam Telif</option><option value="referans">Referans</option><option value="giris_serisi">Giriş Serisi</option><option value="uyelik_gun">Üyelik Günü</option>
            </optgroup>
            <optgroup label="MST Hizmet (kariyer)">
              <option value="hizmet_atolye">Atölye</option><option value="hizmet_editor_rapor">Editör Raporu</option><option value="hizmet_ceviri">Çeviri</option><option value="hizmet_websitesi">Web Sitesi</option><option value="hizmet_odul">Ödül/Liste</option>
            </optgroup>
            <option value="ozel">Özel</option>
          </select>
          <input style={inp} type="number" placeholder="Hedef" value={form.hedefDeger} onChange={(e) => setForm({ ...form, hedefDeger: Number(e.target.value) })} />
          <input style={inp} type="number" placeholder="XP" value={form.xpOdul} onChange={(e) => setForm({ ...form, xpOdul: Number(e.target.value) })} />
          <input style={inp} type="number" placeholder="Kredi ₺" value={form.krediOdul} onChange={(e) => setForm({ ...form, krediOdul: Number(e.target.value) })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <input style={inp} placeholder="Somut ödül (örn: kendi kitabından 1 adet)" value={form.odulAciklama} onChange={(e) => setForm({ ...form, odulAciklama: e.target.value })} />
          <select style={inp} value={form.kademe} onChange={(e) => setForm({ ...form, kademe: e.target.value })}>
            <option value="kucuk">Küçük</option><option value="orta">Orta</option><option value="buyuk">Büyük</option><option value="efsane">Efsane</option>
          </select>
          <input style={inp} type="number" placeholder="Min seviye" value={form.minSeviye} onChange={(e) => setForm({ ...form, minSeviye: Number(e.target.value) })} />
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.ok ? THEME.success : THEME.danger, marginBottom: 8 }}>{msg.text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn onClick={ekle}>Görev Ekle</Btn></div>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>MEVCUT GÖREVLER ({list.length})</div>
      {list.map((g) => (
        <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{g.baslik} <span style={{ fontSize: 10, color: THEME.textFaint }}>({g.tip} · {g.periyot})</span></div>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>Hedef: {g.hedef_deger} {g.hedef_tur} · +{g.xp_odul}XP +{Number(g.kredi_odul)}₺{g.odul_aciklama ? ` · 🎁 ${g.odul_aciklama}` : ""}</div>
          </div>
          <Btn small variant="danger" onClick={() => sil(g.id)}>Sil</Btn>
        </div>
      ))}
    </div>
  );
}

function OdulYonetimi({ authFetch }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ baslik: "", aciklama: "", kategori: "reklam", edinme: "dukkan", krediFiyat: 0, minSeviye: 1, kademe: "kucuk", gorsel: "🎁" });
  const load = () => authFetch("/api/admin/oyun/oduller").then((r) => r.json()).then((d) => setList(d.oduller || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const ekle = async () => { if (!form.baslik.trim()) return; const res = await authFetch("/api/admin/oyun/oduller", { method: "POST", body: JSON.stringify(form) }); if (res.ok) { setForm({ ...form, baslik: "", aciklama: "" }); load(); } };
  const sil = async (id) => { await authFetch(`/api/admin/oyun/oduller/${id}`, { method: "DELETE" }); load(); };
  const inp = { width: "100%", padding: "8px 10px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, boxSizing: "border-box" };
  return (
    <div>
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>YENİ ÖDÜL (DÜKKAN)</div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 10, marginBottom: 10 }}>
          <input style={inp} placeholder="Ödül başlığı" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <input style={inp} placeholder="Emoji" value={form.gorsel} onChange={(e) => setForm({ ...form, gorsel: e.target.value })} />
        </div>
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <input style={inp} type="number" placeholder="Kredi ₺" value={form.krediFiyat} onChange={(e) => setForm({ ...form, krediFiyat: Number(e.target.value) })} />
          <input style={inp} type="number" placeholder="Min seviye" value={form.minSeviye} onChange={(e) => setForm({ ...form, minSeviye: Number(e.target.value) })} />
          <select style={inp} value={form.kademe} onChange={(e) => setForm({ ...form, kademe: e.target.value })}>
            <option value="kucuk">Küçük</option><option value="orta">Orta</option><option value="buyuk">Büyük</option><option value="efsane">Efsane</option>
          </select>
          <select style={inp} value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            <option value="reklam">Reklam</option><option value="ai_kredi">AI Kredi</option><option value="tasarim">Tasarım</option><option value="video">Video</option><option value="podcast">Podcast</option><option value="kendi_kitap">Kendi Kitabı</option><option value="baska_kitap">Başka Kitap</option><option value="ceviri_yayin">Çeviri+Yayın</option><option value="pr">PR</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn onClick={ekle}>Ödül Ekle</Btn></div>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>MEVCUT ÖDÜLLER ({list.length})</div>
      {list.map((o) => (
        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: THEME.textLight }}>{o.gorsel} {o.baslik} <span style={{ fontSize: 11, color: THEME.warn, fontFamily: FONT_MONO }}>{Number(o.kredi_fiyat)}₺</span> <span style={{ fontSize: 10, color: THEME.textFaint }}>(sv{o.min_seviye})</span></div>
          <Btn small variant="danger" onClick={() => sil(o.id)}>Sil</Btn>
        </div>
      ))}
    </div>
  );
}

function OdulTeslim({ authFetch }) {
  const [list, setList] = useState([]);
  const load = () => authFetch("/api/admin/oyun/odul-talepleri").then((r) => r.json()).then((d) => setList(d.talepler || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const teslim = async (odulId) => { await authFetch("/api/admin/oyun/odul-teslim", { method: "POST", body: JSON.stringify({ odulId }) }); load(); };
  if (!list.length) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>Teslim bekleyen ödül yok.</div>;
  return (
    <div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>Yazarların kazandığı/aldığı, teslim edilecek ödüller.</div>
      {list.map((t) => (
        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600 }}>{t.odul_baslik}</div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>Yazar: {t.yazar} · {new Date(t.created_at).toLocaleDateString("tr-TR")} · {t.durum}</div>
          </div>
          <Btn small variant="success" onClick={() => teslim(t.id)}>Teslim Edildi</Btn>
        </div>
      ))}
    </div>
  );
}

function ManuelMudahale({ authFetch, authors }) {
  const [authorId, setAuthorId] = useState("");
  const [durum, setDurum] = useState(null);
  const [xp, setXp] = useState("");
  const [kredi, setKredi] = useState("");
  const [odul, setOdul] = useState("");
  const [msg, setMsg] = useState(null);
  const inp = { width: "100%", padding: "8px 10px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, boxSizing: "border-box" };

  const durumCek = async (id) => {
    setAuthorId(id); setDurum(null); setMsg(null);
    if (!id) return;
    const res = await authFetch(`/api/admin/oyun/yazar-durum/${id}`);
    const d = await res.json();
    if (res.ok) setDurum(d.yazar);
  };
  const dondurToggle = async () => {
    const yeni = !durum.oyun_dondur;
    const res = await authFetch("/api/admin/oyun/dondur", { method: "POST", body: JSON.stringify({ authorId, dondur: yeni }) });
    const d = await res.json();
    setMsg({ ok: res.ok, text: d.mesaj || d.error });
    durumCek(authorId);
  };
  const manuelVer = async () => {
    const res = await authFetch("/api/admin/oyun/manuel-ver", {
      method: "POST", body: JSON.stringify({ authorId, xp: xp ? Number(xp) : 0, kredi: kredi ? Number(kredi) : 0, odulBaslik: odul || null }),
    });
    const d = await res.json();
    setMsg({ ok: res.ok, text: d.mesaj || d.error });
    if (res.ok) { setXp(""); setKredi(""); setOdul(""); durumCek(authorId); }
  };

  return (
    <div>
      <div style={{ background: "rgba(255,138,61,.08)", border: `1px solid rgba(255,138,61,.3)`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>
        <b style={{ color: THEME.warn }}>⚠ Manuel müdahale</b> — Geçmişte toplu/ucuz basım yapılmış yazarlarda sistemin otomatik ödül vermesini engelleyebilir, elle XP/kredi/ödül verebilirsin. Otomatik ödüller donduğunda sistem o yazara hiçbir otomatik ödül vermez; sadece buradan elle verirsin.
      </div>
      <Field label="YAZAR SEÇ">
        <select style={inp} value={authorId} onChange={(e) => durumCek(e.target.value)}>
          <option value="">— Yazar seçin —</option>
          {(authors || []).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.plan})</option>)}
        </select>
      </Field>

      {durum && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textLight }}>{durum.name}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>Plan: {durum.plan} · Seviye {durum.seviye} · {durum.xp} XP</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>Otomatik ödüller</div>
                <button onClick={dondurToggle} style={{ fontSize: 12, fontWeight: 600, borderRadius: 6, padding: "6px 14px", cursor: "pointer", border: "none",
                  background: durum.oyun_dondur ? THEME.danger : THEME.success, color: "#fff" }}>
                  {durum.oyun_dondur ? "🔒 DONDURULDU (aç)" : "✓ AÇIK (dondur)"}
                </button>
              </div>
            </div>
            {durum.oyun_dondur && <div style={{ fontSize: 11.5, color: THEME.warn }}>Bu yazara sistem otomatik ödül vermiyor. Sadece elle verebilirsin.</div>}
          </div>

          <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>ELLE ÖDÜL VER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>XP (eksi de olabilir)</div><input style={inp} type="number" value={xp} onChange={(e) => setXp(e.target.value)} placeholder="örn. 500" /></div>
              <div><div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>Kredi ₺</div><input style={inp} type="number" value={kredi} onChange={(e) => setKredi(e.target.value)} placeholder="örn. 1000" /></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 4 }}>Somut ödül (opsiyonel)</div><input style={inp} value={odul} onChange={(e) => setOdul(e.target.value)} placeholder="örn. Kendi kitabından 1 adet" /></div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn onClick={manuelVer} disabled={!xp && !kredi && !odul}>Ödülü Ver</Btn></div>
          </div>
        </div>
      )}
      {msg && <div style={{ fontSize: 12.5, color: msg.ok ? THEME.success : THEME.danger, marginTop: 12 }}>{msg.text}</div>}
    </div>
  );
}

function ToplulukHedefYonetimi({ authFetch }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ baslik: "", aciklama: "", hedefTur: "toplam_satis", hedefDeger: 10000, odulAciklama: "" });
  const [msg, setMsg] = useState(null);
  const load = () => authFetch("/api/admin/sosyal/topluluk-hedefleri").then((r) => r.json()).then((d) => setList(d.hedefler || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const ekle = async () => {
    if (!form.baslik.trim()) return;
    const res = await authFetch("/api/admin/sosyal/topluluk-hedefi", { method: "POST", body: JSON.stringify(form) });
    setMsg({ ok: res.ok, text: res.ok ? "Topluluk hedefi oluşturuldu." : "Hata" });
    if (res.ok) { setForm({ ...form, baslik: "", aciklama: "", odulAciklama: "" }); load(); }
  };
  const sil = async (id) => { await authFetch(`/api/admin/sosyal/topluluk-hedefi/${id}`, { method: "DELETE" }); load(); };
  const inp = { width: "100%", padding: "8px 10px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt, color: THEME.textLight, boxSizing: "border-box" };
  return (
    <div>
      <div style={{ background: "rgba(45,106,79,.06)", border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>
        <b style={{ color: THEME.cyan }}>🌍 Ortak topluluk hedefi</b> — Tüm MST yazarlarının birlikte ulaşacağı kolektif bir hedef koy (örn. "Bu ay hep birlikte 10.000 satış"). Yazarlar ilerlemeyi canlı görür, ulaşınca herkes ödül kazanır. Birlik hissi + toplam satışı artırır.
      </div>
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>YENİ TOPLULUK HEDEFİ</div>
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Başlık (örn. Temmuz'da birlikte 10.000 satış)" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <select style={inp} value={form.hedefTur} onChange={(e) => setForm({ ...form, hedefTur: e.target.value })}>
            <option value="toplam_satis">Toplam Satış</option><option value="toplam_kitap">Toplam Kitap</option>
          </select>
          <input style={inp} type="number" placeholder="Hedef değer" value={form.hedefDeger} onChange={(e) => setForm({ ...form, hedefDeger: Number(e.target.value) })} />
        </div>
        <input style={{ ...inp, marginBottom: 12 }} placeholder="Ulaşınca herkese ödül (örn. 200 kredi)" value={form.odulAciklama} onChange={(e) => setForm({ ...form, odulAciklama: e.target.value })} />
        {msg && <div style={{ fontSize: 12, color: msg.ok ? THEME.success : THEME.danger, marginBottom: 8 }}>{msg.text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn onClick={ekle}>Hedef Oluştur</Btn></div>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>MEVCUT HEDEFLER ({list.length})</div>
      {list.map((h) => (
        <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: THEME.panelBg, border: `1px solid ${h.aktif ? THEME.cyan : THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{h.baslik} {h.tamamlandi && <span style={{ color: THEME.success, fontSize: 11 }}>✓ tamamlandı</span>}</div>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>Hedef: {Number(h.hedef_deger).toLocaleString("tr-TR")} {h.hedef_tur}{h.odul_aciklama ? ` · 🎁 ${h.odul_aciklama}` : ""}</div>
          </div>
          <Btn small variant="danger" onClick={() => sil(h.id)}>Sil</Btn>
        </div>
      ))}
    </div>
  );
}

function DuyurularView({ authFetch, authors }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baslik, setBaslik] = useState("");
  const [icerik, setIcerik] = useState("");
  const [hedef, setHedef] = useState("all");
  const [authorId, setAuthorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/announcements").then((r) => r.json()).then((d) => setList(d.announcements || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const yayinla = async () => {
    if (!baslik.trim() || !icerik.trim()) { setMsg({ ok: false, text: "Başlık ve içerik zorunlu." }); return; }
    if (hedef === "author" && !authorId) { setMsg({ ok: false, text: "Yazar seçin." }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await authFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify({ baslik, icerik, hedef, authorId: hedef === "author" ? authorId : null }) });
      const d = await r.json();
      if (r.ok && d.ok) { setMsg({ ok: true, text: "Duyuru yayınlandı." }); setBaslik(""); setIcerik(""); load(); }
      else setMsg({ ok: false, text: d.error || "Yayınlanamadı." });
    } catch { setMsg({ ok: false, text: "Sunucuya bağlanılamadı." }); } finally { setBusy(false); }
  };
  const sil = async (id) => {
    if (!window.confirm("Bu duyuru silinsin mi?")) return;
    await authFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 18 }}>Duyurular</h2>
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>YENİ DUYURU</div>
        <Field label="BAŞLIK"><input style={inputStyle} value={baslik} onChange={(e) => setBaslik(e.target.value)} /></Field>
        <Field label="İÇERİK"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={icerik} onChange={(e) => setIcerik(e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: hedef === "author" ? "1fr 1fr" : "1fr", gap: 12 }}>
          <Field label="HEDEF">
            <select style={inputStyle} value={hedef} onChange={(e) => setHedef(e.target.value)}>
              <option value="all">Herkes (tüm yazarlar)</option>
              <option value="author">Belli bir yazar</option>
            </select>
          </Field>
          {hedef === "author" && (
            <Field label="YAZAR">
              <select style={inputStyle} value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
                <option value="">Seçin...</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        {msg && <div style={{ color: msg.ok ? THEME.success : THEME.danger, fontSize: 12, marginBottom: 10 }}>{msg.text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn disabled={busy} onClick={yayinla}>{busy ? "Yayınlanıyor..." : "Yayınla"}</Btn>
        </div>
      </div>

      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>YAYINLANANLAR</div>
      {loading && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
      {!loading && list.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Henüz duyuru yok.</div>}
      {list.map((a) => (
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10, gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{a.baslik}</div>
              <Badge fg={a.hedef === "all" ? THEME.cyan : THEME.warn} bg={a.hedef === "all" ? "rgba(27,95,168,0.08)" : THEME.warnBg}>{a.hedef === "all" ? "Herkes" : (a.author_name || "Yazar")}</Badge>
            </div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{a.icerik}</div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString("tr-TR")}</div>
          </div>
          <Btn small variant="danger" onClick={() => sil(a.id)}>Sil</Btn>
        </div>
      ))}
    </div>
  );
}

// ============ Meta Reklam ============
function MetaReklamView({ authFetch }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/meta/campaigns").then((r) => r.json()).then(setData).catch(() => setData({ bagli: false, mesaj: "Yüklenemedi." })).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const senkron = async () => {
    setSyncing(true); setMsg(null);
    try {
      const r = await authFetch("/api/admin/meta/sync", { method: "POST" });
      const d = await r.json();
      if (d.bagli === false) setMsg({ ok: false, text: d.mesaj });
      else setMsg({ ok: true, text: `${d.senkronize} kampanya senkronlandı (${d.eslesmeyaen || 0} eşleşmeyen).` });
      load();
    } catch { setMsg({ ok: false, text: "Hata." }); } finally { setSyncing(false); }
  };
  const esle = async (metaId, bookId) => {
    await authFetch(`/api/admin/meta/campaigns/${metaId}/match`, { method: "PATCH", body: JSON.stringify({ bookId: bookId || null }) });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Meta Reklam</h2>
        <Btn onClick={senkron} disabled={syncing}>{syncing ? "Senkronlanıyor..." : "↻ Verileri Senkronla"}</Btn>
      </div>
      {msg && <div style={{ color: msg.ok ? THEME.success : THEME.danger, fontSize: 13, marginBottom: 14 }}>{msg.text}</div>}
      {loading && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}

      {!loading && data && data.bagli === false && (
        <div style={{ color: THEME.warn, fontSize: 13, background: THEME.warnBg, border: `1px solid rgba(255,138,61,.3)`, borderRadius: 8, padding: 20 }}>
          {data.mesaj || "Meta bağlı değil."}
          <div style={{ color: THEME.textMuted, fontSize: 12, marginTop: 8 }}>Vercel → mst-backend → Settings → Environment Variables → META_ACCESS_TOKEN ve META_AD_ACCOUNT_ID ekleyip Redeploy edin.</div>
        </div>
      )}

      {!loading && data && data.bagli && data.campaigns.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <ReklamDashboard kampanyalar={data.campaigns} C={RG_ADMIN} />
        </div>
      )}

      {!loading && data && data.bagli && (
        <>
          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 10 }}>KAMPANYALAR ({data.campaigns.length}) — kampanya adındaki ISBN ile otomatik eşleşir, gerekirse elle bağlayın</div>
          {data.campaigns.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Kampanya bulunamadı.</div>}
          {data.campaigns.map((c) => (
            <div key={c.metaId} style={{ background: THEME.panelBg, border: `1px solid ${c.eslesenKitap ? THEME.border : "rgba(255,138,61,.4)"}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap", fontSize: 12.5 }}>
                    <span style={{ color: THEME.textMuted }}>Harcama <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{Number(c.spend).toLocaleString("tr-TR")}₺</span></span>
                    <span style={{ color: THEME.textMuted }}>Gösterim <span style={{ color: THEME.textLight }}>{Number(c.impressions).toLocaleString("tr-TR")}</span></span>
                    <span style={{ color: THEME.textMuted }}>Tıklama <span style={{ color: THEME.textLight }}>{Number(c.clicks).toLocaleString("tr-TR")}</span></span>
                    <span style={{ color: THEME.textMuted }}>Satış <span style={{ color: THEME.success }}>{Number(c.conversions).toLocaleString("tr-TR")}</span></span>
                  </div>
                </div>
                <Badge fg={/ACTIVE/i.test(c.status) ? THEME.success : THEME.textMuted} bg={/ACTIVE/i.test(c.status) ? "rgba(93,214,163,.1)" : THEME.panelBgAlt}>{c.status}</Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${THEME.divider}` }}>
                <span style={{ fontSize: 12, color: THEME.textMuted }}>Kitap:</span>
                {c.eslesenKitap ? (
                  <Badge fg={THEME.success} bg="rgba(93,214,163,.1)">{c.eslesenKitap.title} — {c.eslesenKitap.author} {c.eslesmeTuru === "manuel" ? "(elle)" : "(oto)"}</Badge>
                ) : (
                  <span style={{ fontSize: 12, color: THEME.warn }}>Eşleşmedi {c.isbn ? `(ISBN ${c.isbn} kitapta yok)` : "(adında ISBN yok)"}</span>
                )}
                <select style={{ ...inputStyle, width: "auto", marginLeft: "auto", padding: "4px 8px", fontSize: 12 }} value={c.eslesenKitap?.id || ""} onChange={(e) => esle(c.metaId, e.target.value)}>
                  <option value="">— elle bağla —</option>
                  {(data.kitaplar || []).map((b) => <option key={b.id} value={b.id}>{b.title} ({b.author})</option>)}
                </select>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function BulkIsbnUpload({ onSubmit }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const parseLines = () => {
    return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const idx = line.lastIndexOf(",");
      if (idx === -1) return null;
      const title = line.slice(0, idx).trim();
      const isbn = line.slice(idx + 1).trim();
      return { title, isbn };
    }).filter(Boolean);
  };

  const submit = async () => {
    const pairs = parseLines();
    if (!pairs.length) { setError("Önce en az bir satır girin: Kitap Adı,ISBN"); return; }
    setError(""); setBusy(true); setResult(null);
    try {
      const data = await onSubmit(pairs);
      setResult(data);
    } catch (e) {
      setError("Yükleme başarısız: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 8 }}>Toplu ISBN Yükleme</h2>
      <div style={{ color: THEME.textMuted, fontSize: 12.5, marginBottom: 14, lineHeight: 1.6 }}>
        Her satıra bir kitap: <strong style={{ color: THEME.textLight }}>Kitap Adı,ISBN</strong> formatında yapıştırın.
        Örnek: <code style={{ color: THEME.cyan }}>Meçhul Tren,9786258758153</code><br />
        Kitap adı, sistemde kayıtlı en yakın başlıkla otomatik eşleştirilir; ISBN 13 haneli olmalıdır (tireler önemli değil).
      </div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"Meçhul Tren,978-625-8758-15-3\nBlue Sandal,9786258758016"}
        rows={10}
        style={{ width: "100%", boxSizing: "border-box", padding: 12, border: `1px solid ${THEME.border}`, borderRadius: 6, background: THEME.panelBgAlt, color: THEME.textLight, fontFamily: FONT_MONO, fontSize: 13, resize: "vertical", marginBottom: 10 }}
      />
      {error && <div style={{ color: THEME.danger, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <Btn onClick={submit} disabled={busy}>{busy ? "Yükleniyor..." : "Toplu Yükle"}</Btn>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>TOPLAM</div>
              <div style={{ fontSize: 18, color: THEME.textLight, fontFamily: FONT_MONO }}>{result.toplam}</div>
            </div>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>EŞLEŞEN</div>
              <div style={{ fontSize: 18, color: THEME.success, fontFamily: FONT_MONO }}>{result.eslesen}</div>
            </div>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>EŞLEŞMEYEN</div>
              <div style={{ fontSize: 18, color: result.eslesmeyen > 0 ? THEME.danger : THEME.textLight, fontFamily: FONT_MONO }}>{result.eslesmeyen}</div>
            </div>
          </div>
          <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: THEME.panelBgAlt, textAlign: "left" }}>
                  {["Girilen Başlık", "Durum", "Eşleşen Kitap / Sebep"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: 10, color: THEME.textMuted, letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.sonuclar.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${THEME.divider}` }}>
                    <td style={{ padding: "8px 12px", color: THEME.textLight }}>{r.title}</td>
                    <td style={{ padding: "8px 12px" }}>{r.ok ? <Badge fg={THEME.success} bg="rgba(93,214,163,.1)">✓ Eşleşti</Badge> : <Badge fg={THEME.danger} bg="rgba(255,107,107,.1)">✗ Eşleşmedi</Badge>}</td>
                    <td style={{ padding: "8px 12px", color: THEME.textMuted }}>{r.ok ? r.eslesenKitap : r.sebep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


function AuthorList({ authors, onSelect, onAddClick, onSetStatus, showPassive, onTogglePassive }) {
  const [arama, setArama] = React.useState("");

  // Ad, e-posta veya kitap adına göre filtrele
  const q = arama.trim().toLocaleLowerCase("tr");
  const goruntulenen = !q ? authors : authors.filter((a) => {
    const kitapEslesme = (a.books || []).some((b) => (b.title || "").toLocaleLowerCase("tr").includes(q));
    return (a.name || "").toLocaleLowerCase("tr").includes(q)
      || (a.email || "").toLocaleLowerCase("tr").includes(q)
      || kitapEslesme;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        {/* SOL: yeni yazar butonu + başlık */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Btn onClick={onAddClick}>+ Yeni Yazar Ekle</Btn>
          <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Yazarlar</h2>
        </div>
        {/* SAĞ: pasif göster */}
        <Btn small variant="ghost" onClick={onTogglePassive}>{showPassive ? "Aktifleri Göster" : "Pasifleri Göster"}</Btn>
      </div>

      {/* ARAMA ÇUBUĞU */}
      <div style={{ marginBottom: 14, position: "relative" }}>
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Yazar adı, e-posta veya kitap adı ile ara..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 34px",
            borderRadius: 8, border: `1px solid ${THEME.border}`,
            background: THEME.panelBg, color: THEME.textLight,
            fontSize: 13.5, fontFamily: FONT,
          }}
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: THEME.textFaint, fontSize: 14 }}>⌕</span>
        {arama && (
          <span
            onClick={() => setArama("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted, fontSize: 16, cursor: "pointer" }}
            title="Aramayı temizle"
          >×</span>
        )}
      </div>

      {arama && (
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10 }}>
          <b style={{ color: THEME.textLight }}>{goruntulenen.length}</b> sonuç bulundu
          {goruntulenen.length === 0 && " — arama teriminizi değiştirmeyi deneyin."}
        </div>
      )}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: THEME.panelBgAlt, textAlign: "left" }}>
              {["Ad Soyad", "E-posta", "Plan", "Kitap", "Toplam Satış", "Cüzdan", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontSize: 10.5, color: THEME.textMuted, letterSpacing: "0.04em", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {goruntulenen.map((a) => {
              const sold = a.books.reduce((s, b) => s + b.totalSold, 0);
              const pending = a.wallet.pendingReceipts.length;
              const pasif = a.status === "pasif";
              return (
                <tr key={a.id} style={{ borderTop: `1px solid ${THEME.divider}`, opacity: pasif ? 0.5 : 1 }}>
                  <td style={{ padding: "12px 14px", color: THEME.textLight, fontWeight: 600 }}>
                    {a.name}{pasif && <span style={{ marginLeft: 8, fontSize: 10, color: THEME.textFaint, letterSpacing: "0.05em" }}>PASİF</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: THEME.textMuted }}>{a.email}</td>
                  <td style={{ padding: "12px 14px" }}><Badge fg={THEME.cyan} bg="rgba(27,95,168,0.10)">{PLAN_LABELS[a.plan]}</Badge></td>
                  <td style={{ padding: "12px 14px", color: THEME.textLight }}>{a.books.length}</td>
                  <td style={{ padding: "12px 14px", color: THEME.textLight, fontFamily: FONT_MONO }}>{sold}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {pending > 0 ? <Badge fg={THEME.warn} bg={THEME.warnBg}>{pending} bekleyen dekont</Badge> : <span style={{ color: THEME.textFaint }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Btn small variant="ghost" onClick={() => onSelect(a.id)}>Detay →</Btn>
                    {pasif ? (
                      <Btn small variant="ghost" onClick={() => onSetStatus(a.id, "aktif", a.name)} style={{ marginLeft: 6 }}>Aktifleştir</Btn>
                    ) : (
                      <Btn small variant="ghost" onClick={() => onSetStatus(a.id, "pasif", a.name)} style={{ marginLeft: 6, color: THEME.warn }}>Pasifleştir</Btn>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Yeni yazar ekleme modalı ============
function AddAuthorModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Hanım");
  const [plan, setPlan] = useState("standart");
  const [bookTitle, setBookTitle] = useState("");
  const [bookIsbn, setBookIsbn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { username, tempPassword }

  const isbnClean = bookIsbn.replace(/[^0-9]/g, "");
  const isbnGecerli = isbnClean.length === 0 || isbnClean.length === 13;

  const create = async () => {
    setSubmitting(true); setError("");
    try {
      const data = await onAdd({
        name, email, plan, title,
        book: bookTitle.trim() ? { title: bookTitle.trim(), isbn: isbnClean || null } : null,
      });
      if (data && data.ok) setResult(data);
      else setError(data?.error || "Yazar eklenemedi.");
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,4,10,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ width: 400, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 24 }}>
        <h3 style={{ color: THEME.textLight, fontFamily: FONT, marginTop: 0 }}>Yeni Yazar Ekle</h3>

        {result ? (
          <>
            <div style={{ color: THEME.success, fontSize: 13, marginBottom: 14 }}>✓ Yazar oluşturuldu. Bu bilgileri yazara iletin:</div>
            <Field label="KULLANICI ADI">
              <div style={{ ...inputStyle, fontFamily: FONT_MONO, color: THEME.cyan }}>{result.username}</div>
            </Field>
            <Field label="GEÇİCİ ŞİFRE">
              <div style={{ ...inputStyle, fontFamily: FONT_MONO, color: THEME.cyan }}>{result.tempPassword}</div>
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <Btn onClick={onClose}>Kapat</Btn>
            </div>
          </>
        ) : (
          <>
            <Field label="AD SOYAD"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="E-POSTA"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="HİTAP">
              <select style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)}>
                <option value="Hanım">Hanım</option>
                <option value="Bey">Bey</option>
              </select>
            </Field>
            <Field label="ÜYELİK PAKETİ">
              <select style={inputStyle} value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="standart">Standart — 19.900₺</option>
                <option value="profesyonel">Profesyonel — 35.000₺</option>
                <option value="vip">VIP — 59.000₺</option>
              </select>
            </Field>

            <div style={{ borderTop: `1px solid ${THEME.divider}`, margin: "16px 0 12px", paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: THEME.textMuted, letterSpacing: "0.05em", marginBottom: 10 }}>
                İLK KİTAP <span style={{ color: THEME.textFaint }}>(opsiyonel — sonra da eklenebilir)</span>
              </div>
              <Field label="KİTAP ADI"><input style={inputStyle} value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="örn. Meçhul Tren" /></Field>
              <Field label="ISBN (13 HANE — BARKOD)">
                <input style={{ ...inputStyle, fontFamily: FONT_MONO, borderColor: isbnGecerli ? undefined : THEME.danger }}
                  value={bookIsbn} onChange={(e) => setBookIsbn(e.target.value)} placeholder="9786250000000" />
              </Field>
              {bookTitle.trim() && (
                <div style={{ fontSize: 11, color: isbnClean.length === 13 ? THEME.textMuted : THEME.warn, marginTop: -4 }}>
                  {isbnClean.length === 13
                    ? "✓ Kitap eklenecek. Stok senkronunda bu ISBN ile pazaryeri verisi çekilir."
                    : isbnClean.length === 0
                      ? "ISBN girilmezse kitap eklenir ama pazaryeri verisi çekilmez."
                      : `ISBN ${isbnClean.length}/13 hane.`}
                </div>
              )}
            </div>

            {error && <div style={{ color: THEME.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={onClose} disabled={submitting}>Vazgeç</Btn>
              <Btn disabled={!name.trim() || !email.trim() || !isbnGecerli || submitting} onClick={create}>{submitting ? "Oluşturuluyor..." : "Yazarı Oluştur"}</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ Baskı Maliyeti & Kitap Türü Editörü (istisna override) ============
function MaliyetEditor({ book, onSave, flash }) {
  const [turu, setTuru] = useState(book.kitapTuru || "roman");
  const [sayfa, setSayfa] = useState(book.sayfaSayisi != null ? String(book.sayfaSayisi) : "");
  const [override, setOverride] = useState(book.baskiMaliyetOverride != null ? String(book.baskiMaliyetOverride) : "");
  const [saving, setSaving] = useState(false);

  const formulMaliyet = sayfa ? (Number(sayfa) * (turu === "cocuk" ? 1.25 : 0.21) + 15) : null;
  const etkinMaliyet = override !== "" ? Number(override) : formulMaliyet;

  const kaydet = async () => {
    setSaving(true);
    const ok = await onSave(book.id, {
      kitapTuru: turu,
      sayfaSayisi: sayfa ? Number(sayfa) : null,
      baskiMaliyet: override !== "" ? Number(override) : null,
    });
    setSaving(false);
    if (flash) flash(ok, ok ? "Baskı maliyeti güncellendi." : "Güncellenemedi.");
  };

  return (
    <div style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>BASKI MALİYETİ & TÜR</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Field label="KİTAP TÜRÜ">
          <select style={inputStyle} value={turu} onChange={(e) => setTuru(e.target.value)}>
            <option value="roman">Roman (siyah-beyaz)</option>
            <option value="cocuk">Çocuk kitabı</option>
          </select>
        </Field>
        <Field label="SAYFA SAYISI"><input style={inputStyle} value={sayfa} onChange={(e) => setSayfa(e.target.value.replace(/[^0-9]/g, ""))} placeholder="200" /></Field>
        <Field label="FORMÜL MALİYETİ">
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: THEME.textMuted, fontFamily: FONT_MONO }}>
            {formulMaliyet != null ? `${formulMaliyet.toFixed(2)}₺` : "—"}
          </div>
        </Field>
      </div>
      <Field label="İSTİSNA MALİYET (elle) — boş bırakılırsa formül kullanılır">
        <input style={{ ...inputStyle, borderColor: override !== "" ? THEME.warn : undefined }} value={override}
          onChange={(e) => setOverride(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="örn. 80 (özel baskı maliyeti)" />
      </Field>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ fontSize: 12, color: THEME.cyan, fontFamily: FONT_MONO }}>
          Etkin maliyet: {etkinMaliyet != null ? `${Number(etkinMaliyet).toFixed(2)}₺` : "—"}
          {override !== "" && <span style={{ color: THEME.warn, fontSize: 10, marginLeft: 8 }}>(istisna)</span>}
        </div>
        <Btn small disabled={saving} onClick={kaydet}>{saving ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
    </div>
  );
}

// ============ Telif Özeti göstergesi (kilitli/çekilebilir) ============
// ============ Yazar geneli telif özeti — tüm kitapların toplamı ============
// Kitap kartlarındaki tek tek telifleri toplar; birden fazla eseri olan yazarda
// "bu yazar toplam ne hak etti?" sorusunun cevabı tek yerde görünsün.
function YazarTelifToplami({ books, wallet }) {
  const telifli = (books || []).filter((b) => b.telif && b.telif.toplamAdet);
  if (!telifli.length) return null;
  const topla = (alan) => telifli.reduce((t, b) => t + (Number(b.telif[alan]) || 0), 0);
  const toplamTelif = topla("toplamTelif");
  const cekilebilir = topla("cekilebilir");
  const kilitli = topla("kilitli");
  const toplamAdet = topla("toplamAdet");
  const maliyetEksik = telifli.filter((b) => b.telif.maliyetGirilmemis);
  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>
        YAZAR GENELİ TELİF — {telifli.length} eserin toplamı
        <span style={{ color: THEME.textFaint, fontSize: 11 }}>{" · "}{toplamAdet} satış</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { etiket: "Toplam Telif", deger: toplamTelif, renk: THEME.textLight },
          { etiket: "Çekilebilir", deger: cekilebilir, renk: THEME.success },
          { etiket: "Kilitli (stok tükenmeden)", deger: kilitli, renk: THEME.warn },
          { etiket: "Cüzdan Bakiyesi", deger: Number(wallet?.balance || 0), renk: THEME.cyan },
        ].map((k, i) => (
          <div key={i} style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>{k.etiket}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: k.renk, fontFamily: FONT_MONO }}>{Number(k.deger).toLocaleString("tr-TR")}₺</div>
          </div>
        ))}
      </div>
      {maliyetEksik.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: THEME.warn, lineHeight: 1.5 }}>
          ⚠️ {maliyetEksik.length} kitapta baskı maliyeti girilmemiş — toplam olduğundan yüksek görünüyor
          ({maliyetEksik.map((b) => b.title).join(", ")}).
        </div>
      )}
    </div>
  );
}

// ============ Yazara özel bilgilendirme ============
// Yazarın gerçek durumuna bakıp mesaj taslağı önerir; onaylayıp gönderirsin.
// Gönderilen mesaj yazarın uygulamasında "Duyuru & Destek" sekmesinde görünür.
const ONCELIK_RENK = { yuksek: "#C0392B", orta: "#C9A227", dusuk: "#7A7A7A" };

function BilgilendirmeKutusu({ author, authFetch }) {
  const [oneriler, setOneriler] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [baslik, setBaslik] = useState("");
  const [icerik, setIcerik] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const oneriGetir = async () => {
    setYukleniyor(true); setHata(""); setOneriler(null);
    try {
      const r = await authFetch(`/api/admin/authors/${author.id}/mesaj-onerileri`);
      const d = await r.json();
      if (d.ok) setOneriler(d.oneriler || []);
      else setHata(d.error || "Öneri alınamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setYukleniyor(false); }
  };

  const gonder = async () => {
    if (!baslik.trim() || !icerik.trim() || gonderiliyor) return;
    setGonderiliyor(true); setSonuc("");
    try {
      const r = await authFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ baslik: baslik.trim(), icerik: icerik.trim(), hedef: "author", authorId: author.id }),
      });
      const d = await r.json();
      if (r.ok && d.ok) { setSonuc(`Gönderildi — ${author.name} uygulamasında görecek.`); setBaslik(""); setIcerik(""); }
      else setSonuc(d.error || "Gönderilemedi.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setGonderiliyor(false); }
  };

  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 4 }}>
        {String(author.name).toLocaleUpperCase("tr-TR")} — ÖZEL BİLGİLENDİRME
      </div>
      <div style={{ fontSize: 11.5, color: THEME.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        Gönderdiğin mesaj yalnızca bu yazara gider, uygulamasındaki Duyuru &amp; Destek sekmesinde görünür.
      </div>

      <Btn small variant="ghost" disabled={yukleniyor} onClick={oneriGetir}>
        {yukleniyor ? "Durumu inceleniyor..." : "💡 Ne yazmalıyım? — öneri getir"}
      </Btn>
      {hata && <div style={{ fontSize: 12, color: THEME.warn, marginTop: 8 }}>{hata}</div>}

      {oneriler && oneriler.length === 0 && (
        <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 10 }}>
          Şu an bu yazara gönderilmesi gereken özel bir şey görünmüyor — her şey yolunda.
        </div>
      )}

      {oneriler && oneriler.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {oneriler.map((o, i) => (
            <div key={i} style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: THEME.textLight }}>{o.baslik}</div>
                <span style={{ fontSize: 9.5, color: ONCELIK_RENK[o.oncelik] || THEME.textFaint, border: `1px solid ${ONCELIK_RENK[o.oncelik] || THEME.border}`, borderRadius: 10, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {o.oncelik === "yuksek" ? "öncelikli" : o.oncelik === "orta" ? "orta" : "düşük"}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{o.icerik}</div>
              {o.neden && <div style={{ fontSize: 11, color: THEME.cyan, marginTop: 6 }}>Neden: {o.neden}</div>}
              <div style={{ marginTop: 8 }}>
                <Btn small variant="ghost" onClick={() => { setBaslik(o.baslik); setIcerik(o.icerik); setSonuc(""); }}>Bu taslağı kullan</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, borderTop: `1px solid ${THEME.border}`, paddingTop: 12, display: "grid", gap: 8 }}>
        <div style={{ fontSize: 10.5, color: THEME.textMuted }}>MESAJ GÖNDER</div>
        <input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Başlık" style={inputStyle} />
        <textarea value={icerik} onChange={(e) => setIcerik(e.target.value)} rows={5} placeholder="Mesaj — taslağı seçip düzenleyebilir ya da sıfırdan yazabilirsin"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn small disabled={gonderiliyor || !baslik.trim() || !icerik.trim()} onClick={gonder}>
            {gonderiliyor ? "Gönderiliyor..." : "Gönder"}
          </Btn>
          {sonuc && <span style={{ fontSize: 12, color: sonuc.indexOf("Gönderildi") === 0 ? THEME.success : THEME.danger }}>{sonuc}</span>}
        </div>
      </div>

      <OzelGorevKutusu author={author} authFetch={authFetch} />
    </div>
  );
}

// Yazara özel görev atama — sadece bu yazarın uygulamasında görünür
function OzelGorevKutusu({ author, authFetch }) {
  const [gorevler, setGorevler] = useState(null);
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [xp, setXp] = useState("50");
  const [kredi, setKredi] = useState("0");
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const yukle = async () => {
    try {
      const r = await authFetch(`/api/admin/authors/${author.id}/ozel-gorevler`);
      const d = await r.json();
      setGorevler(d.gorevler || []);
    } catch { setGorevler([]); }
  };
  useEffect(() => { yukle(); }, [author.id]);

  const ata = async () => {
    if (!baslik.trim() || calisiyor) return;
    setCalisiyor(true); setSonuc("");
    try {
      const r = await authFetch(`/api/admin/authors/${author.id}/ozel-gorev`, {
        method: "POST",
        body: JSON.stringify({ baslik: baslik.trim(), aciklama: aciklama.trim() || null, xpOdul: Number(xp) || 0, krediOdul: Number(kredi) || 0 }),
      });
      const d = await r.json();
      if (r.ok && d.ok) { setSonuc(d.mesaj); setBaslik(""); setAciklama(""); yukle(); }
      else setSonuc(d.error || "Görev atanamadı.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${THEME.border}`, paddingTop: 14 }}>
      <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 3 }}>ÖZEL GÖREV ATA</div>
      <div style={{ fontSize: 11, color: THEME.textFaint, marginBottom: 10, lineHeight: 1.5 }}>
        Sadece {author.name} görecek. Uygulamasında Kariyer & Görevler bölümünde, genel görevlerin üstünde çıkar.
      </div>

      {gorevler && gorevler.length > 0 && (
        <div style={{ display: "grid", gap: 5, marginBottom: 12 }}>
          {gorevler.map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, background: THEME.panelBgAlt, borderRadius: 5, padding: "7px 10px" }}>
              <span style={{ color: THEME.textLight }}>{g.baslik}</span>
              <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: g.durum === "tamamlandi" ? THEME.success : THEME.textMuted }}>
                {g.durum === "tamamlandi" ? "✓ tamamlandı" : "devam ediyor"}
                {g.xp_odul > 0 && <span style={{ color: THEME.textFaint }}>{" · "}{g.xp_odul} XP</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Görev başlığı — örn: Kapak taslağını onayla" style={inputStyle} />
        <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} placeholder="Açıklama (opsiyonel)" style={{ ...inputStyle, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ width: 90 }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 3 }}>XP ÖDÜLÜ</div>
            <input value={xp} onChange={(e) => setXp(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...inputStyle, fontFamily: FONT_MONO }} />
          </div>
          <div style={{ width: 90 }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 3 }}>KREDİ</div>
            <input value={kredi} onChange={(e) => setKredi(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...inputStyle, fontFamily: FONT_MONO }} />
          </div>
          <Btn small disabled={calisiyor || !baslik.trim()} onClick={ata}>{calisiyor ? "Atanıyor..." : "Görevi Ata"}</Btn>
        </div>
        {sonuc && <div style={{ fontSize: 12, color: sonuc.indexOf("atandı") > -1 ? THEME.success : THEME.danger, lineHeight: 1.5 }}>{sonuc}</div>}
      </div>
    </div>
  );
}

// ============ MST sitesi stok düşümü ============
// Havale / telefon / elden satışta tek tek ürüne girmeden stok düşürmek için.
// İstek MST sitesine (WooCommerce) gider; site kabul ederse kayıtlar güncellenir.
const STOK_DUSUM_TURLERI = [
  { key: "okuyucu",   ad: "Okuyucu satışı",       aciklama: "Havale/telefon/elden satış. Stok düşer, yazarın telifi İŞLER." },
  { key: "indirimli", ad: "Yazarın indirimli alımı", aciklama: "Yazar kendi kitabını indirimli aldı. Stok düşer, telif DÜŞÜLÜR." },
  { key: "hediye",    ad: "Hediye / tanıtım",     aciklama: "Basına, jüriye, tanıtıma gönderildi. Stok düşer, telif DÜŞÜLÜR." },
];

function StokDusumEditor({ book, onSubmit }) {
  const [adet, setAdet] = useState("1");
  const [tur, setTur] = useState("okuyucu");
  const [not, setNot] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);

  const secili = STOK_DUSUM_TURLERI.find((t) => t.key === tur);
  const gonder = async () => {
    const n = Number(adet);
    if (!n || n < 1 || calisiyor) return;
    setCalisiyor(true); setSonuc(null);
    const cevap = await onSubmit(book.id, { adet: n, tur, not });
    setSonuc(cevap);
    if (cevap?.ok) { setAdet("1"); setNot(""); }
    setCalisiyor(false);
  };

  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "7px 10px", fontSize: 12.5, fontFamily: "inherit" };

  return (
    <div style={{ marginTop: 12, background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
        MST SİTESİ STOK DÜŞÜMÜ — istek doğrudan siteye gider, ürüne tek tek girmeye gerek yok.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 3 }}>ADET</div>
          <input value={adet} onChange={(e) => setAdet(e.target.value.replace(/[^0-9]/g, ""))}
            style={{ ...inputStyle, width: "100%", fontFamily: FONT_MONO, boxSizing: "border-box" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 3 }}>İŞLEM TÜRÜ</div>
          <select value={tur} onChange={(e) => setTur(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}>
            {STOK_DUSUM_TURLERI.map((t) => <option key={t.key} value={t.key}>{t.ad}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize: 11, color: tur === "okuyucu" ? THEME.success : THEME.warn, marginBottom: 10, lineHeight: 1.5 }}>
        {secili.aciklama}
      </div>
      <input value={not} onChange={(e) => setNot(e.target.value)} placeholder="Not (örn: havale — Ahmet Y., 28.07)"
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 10 }} />
      <Btn small disabled={calisiyor || !adet} onClick={gonder}>
        {calisiyor ? "Siteye yazılıyor..." : "Stoğu Düş"}
      </Btn>
      {sonuc && (
        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.55, color: sonuc.ok ? THEME.success : THEME.danger }}>
          {sonuc.ok ? sonuc.mesaj : sonuc.error}
        </div>
      )}
    </div>
  );
}

function TelifOzetiKutu({ book }) {
  const t = book.telif;
  if (!t || !t.toplamAdet) return (
    <div style={{ fontSize: 11.5, color: THEME.textFaint, padding: "8px 0" }}>Henüz satış yok — telif hesaplanmadı.</div>
  );
  return (
    <div style={{ marginBottom: 12 }}>
      {t.maliyetGirilmemis && (
        <div style={{ background: "rgba(201,162,39,0.12)", border: `1px solid ${THEME.warn}`, borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 11.5, color: THEME.warn, lineHeight: 1.5 }}>
          ⚠️ Baskı maliyeti girilmemiş — telif olduğundan <b>yüksek</b> görünüyor. Doğru hesap için "Baskı Maliyeti" ile sayfa sayısı / maliyet girin.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { etiket: "Toplam Telif", deger: t.toplamTelif, renk: THEME.textLight },
          { etiket: "Çekilebilir", deger: t.cekilebilir, renk: THEME.success },
          { etiket: "Kilitli (stok tükenmeden)", deger: t.kilitli, renk: THEME.warn },
        ].map((k, i) => (
          <div key={i} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>{k.etiket}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: k.renk, fontFamily: FONT_MONO }}>{Number(k.deger).toLocaleString("tr-TR")}₺</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Kitap Eşleştirme & Satış Editörü (başlangıç stok + platform kodları) ============
function MatchingEditor({ book, onSave, flash }) {
  const PLATFORMS = [
    { key: "mst", label: "MST (WooCommerce)" },
    { key: "trendyol", label: "Trendyol" },
    { key: "n11", label: "N11" },
    { key: "hepsiburada", label: "Hepsiburada" },
    { key: "pazarama", label: "Pazarama" },
    { key: "idefix", label: "İdefix" },
  ];
  const bas = book.baslangicStok || {};
  const kod = book.platformCodes || {};
  const kalan = book.kalanStok || {};
  const [baslangic, setBaslangic] = useState(() => {
    const o = {}; PLATFORMS.forEach((p) => { o[p.key] = bas[p.key] != null ? String(bas[p.key]) : ""; }); return o;
  });
  const [kodlar, setKodlar] = useState(() => {
    const o = {}; PLATFORMS.forEach((p) => { o[p.key] = kod[p.key] || ""; }); return o;
  });
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    setBusy(true);
    try {
      const baslangicStok = {}, platformCodes = {};
      PLATFORMS.forEach((p) => {
        if (baslangic[p.key] !== "") baslangicStok[p.key] = parseInt(baslangic[p.key], 10);
        platformCodes[p.key] = kodlar[p.key].trim(); // boş = override sil
      });
      const d = await onSave(book.id, { baslangicStok, platformCodes });
      flash(d?.ok, d?.ok ? "Eşleştirme kaydedildi. Bir sonraki senkronda satışlar hesaplanır." : (d?.error || "Hata"));
    } catch { flash(false, "Sunucuya bağlanılamadı."); } finally { setBusy(false); }
  };

  return (
    <div style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 4 }}>EŞLEŞTİRME & SATIŞ HESABI</div>
      <div style={{ fontSize: 11.5, color: THEME.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        Satış = Başlangıç stok − Mevcut stok. Platform kodu boşsa ISBN kullanılır; farklıysa (örn. Hepsiburada) o platforma özel kod girin.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1.3fr", gap: 8, alignItems: "center", fontSize: 10.5, color: THEME.textMuted, marginBottom: 6 }}>
        <div>PLATFORM</div><div>BAŞLANGIÇ</div><div>MEVCUT (kalan)</div><div>KOD (ISBN'den farklıysa)</div>
      </div>
      {PLATFORMS.map((p) => (
        <div key={p.key} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1.3fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 12.5, color: THEME.textLight }}>{p.label}</div>
          <input style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }} value={baslangic[p.key]} onChange={(e) => setBaslangic({ ...baslangic, [p.key]: e.target.value.replace(/[^0-9]/g, "") })} placeholder="—" />
          <div style={{ fontSize: 12.5, color: THEME.textMuted, fontFamily: FONT_MONO }}>{kalan[p.key] != null ? kalan[p.key] : "—"}</div>
          <input style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, fontFamily: FONT_MONO }} value={kodlar[p.key]} onChange={(e) => setKodlar({ ...kodlar, [p.key]: e.target.value })} placeholder="ISBN kullanılır" />
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <Btn small disabled={busy} onClick={kaydet}>{busy ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
    </div>
  );
}

// ============ Giriş Bilgileri Paneli ============
function CredentialsPanel({ author, onSave, flash, onClose }) {
  const [name, setName] = useState(author.name || "");
  const [title, setTitle] = useState(author.title || "");
  const [plan, setPlan] = useState(author.plan || "standart");
  const [username, setUsername] = useState(author.username || "");
  const [email, setEmail] = useState(author.email || "");
  const [yeniSifre, setYeniSifre] = useState("");
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    setBusy(true);
    try {
      const body = {};
      if (name.trim() && name.trim() !== author.name) body.name = name.trim();
      if (title.trim() !== (author.title || "")) body.title = title.trim();
      if (plan !== author.plan) body.plan = plan;
      if (username.trim() && username.trim() !== author.username) body.username = username.trim();
      if (email.trim() && email.trim() !== author.email) body.email = email.trim();
      if (yeniSifre) body.yeniSifre = yeniSifre;
      if (!Object.keys(body).length) { flash(false, "Değişiklik yok."); setBusy(false); return; }
      const data = await onSave(author.id, body);
      if (data && data.ok) { flash(true, data.mesaj || "Güncellendi."); setYeniSifre(""); }
      else flash(false, data?.error || "Güncellenemedi.");
    } catch { flash(false, "Sunucuya bağlanılamadı."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>YAZAR BİLGİLERİ</div>

      {/* Kimlik bilgileri — yanlış girişleri buradan düzeltebilirsiniz */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
        <Field label="AD SOYAD"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="UNVAN"><input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bey / Hanım" /></Field>
        <Field label="PAKET">
          <select style={inputStyle} value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="standart">Standart</option>
            <option value="profesyonel">Profesyonel</option>
            <option value="vip">VIP</option>
          </select>
        </Field>
      </div>

      <div style={{ height: 1, background: THEME.divider, margin: "6px 0 14px" }} />
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>GİRİŞ BİLGİLERİ</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="KULLANICI ADI"><input style={{ ...inputStyle, fontFamily: FONT_MONO }} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        <Field label="E-POSTA"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      </div>
      <Field label="YENİ ŞİFRE (belirlemek için yaz, boş bırakırsan değişmez)">
        <input style={{ ...inputStyle, fontFamily: FONT_MONO }} value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} placeholder="En az 4 hane" />
      </Field>
      <div style={{ fontSize: 11, color: THEME.textFaint, margin: "-4px 0 12px" }}>Not: Şifreler güvenlik için gizli tutulur; eskisini göremezsin ama yenisini belirleyebilirsin.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" small onClick={onClose}>Kapat</Btn>
        <Btn disabled={busy} onClick={kaydet}>{busy ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
    </div>
  );
}

// ============ GÖREV TAKİP (CRM) ============
// Tüm kitapların bekleyen işleri tek ekranda: kim nerede takıldı, ne gecikti?
function GorevTakip({ authFetch, onSelectAuthor }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("surecte"); // surecte | gecikmis | takilan | onay | yayinda | hepsi
  const [islemde, setIslemde] = useState(null);    // bookId
  const [msg, setMsg] = useState(null);            // {bookId, ok, text}
  const [acikKitap, setAcikKitap] = useState(null); // adım listesi açık olan kitap
  const [sirala, setSirala] = useState("oncelik");  // oncelik | gecikme | ilerleme | kitap | yazar | yeni
  const [yenile, setYenile] = useState(0);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    authFetch("/api/admin/gorev-takip")
      .then((r) => r.json())
      .then((d) => { if (!iptal) { setVeri(d); setYukleniyor(false); } })
      .catch(() => { if (!iptal) { setVeri(null); setYukleniyor(false); } });
    return () => { iptal = true; };
  }, [yenile]);

  // Tek adımı bağımsız işaretle — süreç sıralı değildir
  const adimIsaretle = async (bookId, stageKey, status, adimLabel) => {
    setIslemde(bookId); setMsg(null);
    try {
      const r = await authFetch(`/api/admin/books/${bookId}/stage`, {
        method: "PATCH", body: JSON.stringify({ stageKey, status }),
      });
      const d = await r.json();
      if (d.ok) {
        const durumMetin = status === "tamamlandi" ? "tamamlandı" : status === "devam" ? "devam ediyor" : status === "atlandi" ? "atlandı" : "beklemede";
        setMsg({ bookId, ok: true, text: d.hediye ? `"${adimLabel}" ${durumMetin}. ${d.hediye}` : `"${adimLabel}" ${durumMetin}.` });
        setYenile((n) => n + 1);
      } else {
        setMsg({ bookId, ok: false, text: d.error || "İşlem yapılamadı." });
      }
    } catch { setMsg({ bookId, ok: false, text: "Sunucuya bağlanılamadı." }); }
    finally { setIslemde(null); }
  };

  if (yukleniyor) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>Görevler yükleniyor...</div>;
  if (!veri?.ok) return <div style={{ color: THEME.danger, fontSize: 13 }}>Görev listesi alınamadı.</div>;

  const { kitaplar = [], ozet = {}, hedefSure = 30 } = veri;
  const filtreli = kitaplar.filter((k) => {
    if (filtre === "hepsi") return true;
    if (filtre === "surecte") return !k.yayinda;
    if (filtre === "gecikmis") return k.gecikmis;
    if (filtre === "takilan") return k.takildi;
    if (filtre === "onay") return k.onayBekliyor;
    if (filtre === "yayinda") return k.yayinda;
    return true;
  }).sort((x, y) => {
    const tr = (a, b) => String(a || "").localeCompare(String(b || ""), "tr");
    switch (sirala) {
      case "gecikme":  // en çok geciken önce
        return (x.kalanGun ?? 999) - (y.kalanGun ?? 999);
      case "ilerleme": // en az ilerleyen önce
        return (x.yuzde || 0) - (y.yuzde || 0);
      case "kitap":
        return tr(x.title, y.title);
      case "yazar":
        return tr(x.yazar, y.yazar);
      case "yeni":     // en uzun süredir devam eden önce
        return (y.gecenGun || 0) - (x.gecenGun || 0);
      case "oncelik":
      default:         // gecikmiş → takılan → onay bekleyen → diğerleri
        if (x.yayinda !== y.yayinda) return x.yayinda ? 1 : -1;
        if (x.gecikmis !== y.gecikmis) return x.gecikmis ? -1 : 1;
        if (x.takildi !== y.takildi) return x.takildi ? -1 : 1;
        if (x.onayBekliyor !== y.onayBekliyor) return x.onayBekliyor ? -1 : 1;
        return (y.adimGun || 0) - (x.adimGun || 0);
    }
  });

  const kart = (etiket, deger, renk, key) => (
    <div onClick={() => setFiltre(key)} style={{
      background: filtre === key ? renk : THEME.panelBg,
      border: `1px solid ${filtre === key ? renk : THEME.border}`,
      borderRadius: 8, padding: "10px 12px", cursor: "pointer", flex: 1, minWidth: 96,
    }}>
      <div style={{ fontSize: 10, color: filtre === key ? THEME.onAccent : THEME.textMuted, marginBottom: 3 }}>{etiket}</div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: FONT_MONO, color: filtre === key ? THEME.onAccent : renk }}>{deger}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: "0 0 4px" }}>Görev Takip</h2>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Yayın süreci {veri.asamalar?.length || 17} adımdan oluşur · hedef süre {hedefSure} gün
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {kart("SÜREÇTE", ozet.surecte || 0, THEME.cyan, "surecte")}
        {kart("GECİKMİŞ", ozet.gecikmis || 0, THEME.danger, "gecikmis")}
        {kart("TAKILAN", ozet.takilan || 0, THEME.warn, "takilan")}
        {kart("ONAY BEKLİYOR", ozet.onayBekleyen || 0, THEME.secondary, "onay")}
        {kart("YAYINDA", ozet.yayinda || 0, THEME.success, "yayinda")}
        {kart("TÜMÜ", ozet.toplam || 0, THEME.textMuted, "hepsi")}
      </div>

      {/* SIRALAMA */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, color: THEME.textMuted }}>Sırala:</span>
        {[
          ["oncelik", "Öncelik"],
          ["gecikme", "En çok geciken"],
          ["ilerleme", "En az ilerleyen"],
          ["yeni", "En uzun süredir"],
          ["kitap", "Kitap adı"],
          ["yazar", "Yazar adı"],
        ].map(([k, l]) => (
          <span key={k} onClick={() => setSirala(k)} style={{
            padding: "4px 10px", borderRadius: 5, fontSize: 11.5, cursor: "pointer",
            background: sirala === k ? THEME.cyan : "transparent",
            color: sirala === k ? THEME.onAccent : THEME.textMuted,
            border: `1px solid ${sirala === k ? THEME.cyan : THEME.border}`,
            fontWeight: sirala === k ? 700 : 500,
          }}>{l}</span>
        ))}
        <span style={{ fontSize: 11, color: THEME.textFaint, marginLeft: "auto" }}>
          {filtreli.length} kitap
        </span>
      </div>

      {filtreli.length === 0 ? (
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "22px 16px", textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          Bu filtrede kitap yok.
        </div>
      ) : filtreli.map((k) => (
        <div key={k.bookId} style={{
          background: THEME.panelBg,
          border: `1px solid ${k.gecikmis ? THEME.danger : k.takildi ? THEME.warn : THEME.border}`,
          borderLeft: `4px solid ${k.yayinda ? THEME.success : k.gecikmis ? THEME.danger : k.takildi ? THEME.warn : THEME.cyan}`,
          borderRadius: 8, padding: "12px 14px", marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.textLight }}>{k.title}</div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
                <span onClick={() => onSelectAuthor && onSelectAuthor(k.authorId)} style={{ color: THEME.cyan, cursor: "pointer" }}>{k.yazar}</span>
                {" · "}{String(k.plan || "").toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: k.yayinda ? THEME.success : THEME.textLight }}>
                {k.aktifAdimLabel}
              </div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
                {k.tamamlanan}/{k.toplamAdim} adım · %{k.yuzde}
              </div>
            </div>
          </div>

          {/* İlerleme çubuğu */}
          <div style={{ height: 6, background: THEME.panelBgAlt, borderRadius: 3, overflow: "hidden", margin: "10px 0 8px" }}>
            <div style={{ height: "100%", width: `${k.yuzde}%`, background: k.yayinda ? THEME.success : k.gecikmis ? THEME.danger : THEME.cyan }} />
          </div>

          {/* Uyarı etiketleri */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", fontSize: 11, marginBottom: 8 }}>
            {!k.yayinda && (
              <span style={{ color: k.gecikmis ? THEME.danger : THEME.textMuted }}>
                {k.gecikmis ? `⚠ ${Math.abs(k.kalanGun)} gün gecikmiş` : `${k.kalanGun} gün kaldı`}
              </span>
            )}
            {k.takildi && <span style={{ color: THEME.warn, fontWeight: 600 }}>⏸ {k.adimGun} gündür aynı adımda</span>}
            {k.onayBekliyor && <span style={{ color: THEME.secondary, fontWeight: 600 }}>✋ Yazar onayı bekliyor</span>}
            {k.hediyeVerildi && <span style={{ color: THEME.success }}>🎁 Hediye gönderildi</span>}
            {k.redaksiyonIstendi && <span style={{ color: THEME.textMuted }}>📝 Redaksiyon dahil</span>}
          </div>

          {/* İŞLEM ALANI — adımlar bağımsız işaretlenir, sıra zorunlu değildir */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${THEME.divider}`, paddingTop: 9 }}>
            <Btn small variant={acikKitap === k.bookId ? "success" : "ghost"}
              onClick={() => setAcikKitap(acikKitap === k.bookId ? null : k.bookId)}>
              {acikKitap === k.bookId ? "Adımları gizle" : "⚙ Adımları yönet"}
            </Btn>
            <Btn small variant="ghost" onClick={() => onSelectAuthor && onSelectAuthor(k.authorId)}>
              Yazar detayı
            </Btn>
            {!k.yayinda && (
              <span style={{ fontSize: 11, color: THEME.textFaint }}>
                Yazar uygulaması "Yayında" işaretlenince açılır
              </span>
            )}
          </div>

          {/* ADIM YÖNETİMİ — her adım bağımsız */}
          {acikKitap === k.bookId && (
            <div style={{ marginTop: 10, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                Süreç <b style={{ color: THEME.textLight }}>sıralı değildir</b> — her adımı bağımsız işaretleyebilirsiniz.
                Adımın yanındaki butonlara tıklayın.
              </div>
              {(veri.asamalar || []).map((a, i) => {
                const durum = k.adimlar?.[a.key]?.status || "beklemede";
                const onayli = ONAY_ADIMLARI.includes(a.key);
                const renk = durum === "tamamlandi" ? THEME.success
                  : durum === "devam" ? THEME.cyan
                  : durum === "atlandi" ? THEME.textFaint : THEME.textMuted;
                const simge = durum === "tamamlandi" ? "✓" : durum === "devam" ? "▶" : durum === "atlandi" ? "–" : "○";
                const yayinAdimi = a.key === "yayin";
                return (
                  <div key={a.key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                    padding: "6px 8px", borderRadius: 4, marginBottom: 2,
                    background: durum === "devam" ? THEME.successBg : yayinAdimi ? THEME.warnBg : "transparent",
                    border: yayinAdimi ? `1px solid ${THEME.warn}` : "1px solid transparent",
                  }}>
                    <span style={{ color: renk, fontSize: 12, flex: 1 }}>
                      {simge} {i + 1}. {a.label}
                      {yayinAdimi && <b style={{ color: THEME.warn, fontSize: 10, marginLeft: 6 }}>← yazar erişimi</b>}
                    </span>
                    {onayli ? (
                      <span style={{ fontSize: 10, color: THEME.secondary, whiteSpace: "nowrap" }}>yazar onaylar</span>
                    ) : (
                      <span style={{ display: "flex", gap: 4 }}>
                        {durum !== "tamamlandi" && (
                          <span onClick={() => islemde !== k.bookId && adimIsaretle(k.bookId, a.key, "tamamlandi", a.label)}
                            style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, cursor: "pointer",
                              background: THEME.successBg, color: THEME.success, fontWeight: 600 }}>✓ Bitti</span>
                        )}
                        {durum !== "devam" && durum !== "tamamlandi" && (
                          <span onClick={() => islemde !== k.bookId && adimIsaretle(k.bookId, a.key, "devam", a.label)}
                            style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, cursor: "pointer",
                              background: THEME.panelBg, color: THEME.cyan, border: `1px solid ${THEME.border}` }}>▶ Başlat</span>
                        )}
                        {durum !== "beklemede" && (
                          <span onClick={() => islemde !== k.bookId && adimIsaretle(k.bookId, a.key, "beklemede", a.label)}
                            style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, cursor: "pointer",
                              background: THEME.panelBg, color: THEME.textMuted, border: `1px solid ${THEME.border}` }}>↺ Geri al</span>
                        )}
                        {durum !== "atlandi" && durum !== "tamamlandi" && (
                          <span onClick={() => islemde !== k.bookId && adimIsaretle(k.bookId, a.key, "atlandi", a.label)}
                            style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, cursor: "pointer",
                              background: THEME.panelBg, color: THEME.textFaint, border: `1px solid ${THEME.border}` }}>– Atla</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {msg && msg.bookId === k.bookId && (
            <div style={{ marginTop: 8, fontSize: 11.5, padding: "6px 10px", borderRadius: 5,
              color: msg.ok ? THEME.success : THEME.danger,
              background: msg.ok ? THEME.successBg : THEME.dangerBg }}>{msg.text}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ İndirimli & Hediye Kayıtları Paneli ============
// Yazar detayında: hangi kitap, kaç adet, hediye mi indirimli mi, neden verildi.
function IndirimliHediyePanel({ author, authFetch }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("hepsi"); // hepsi | indirimli | hediye
  const [iptalEdilen, setIptalEdilen] = useState(null); // iptal formu açık olan kayıt id
  const [iptalSebep, setIptalSebep] = useState("");
  const [islemMsg, setIslemMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [yenile, setYenile] = useState(0);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    authFetch(`/api/admin/authors/${author.id}/indirimli-hediye`)
      .then((r) => r.json())
      .then((d) => { if (!iptal) { setVeri(d); setYukleniyor(false); } })
      .catch(() => { if (!iptal) { setVeri(null); setYukleniyor(false); } });
    return () => { iptal = true; };
  }, [author.id, yenile]);

  // Kaydı iptal et (kayıt kalır, telife girmez)
  const kaydiIptalEt = async (id) => {
    if (!iptalSebep.trim()) { setIslemMsg({ ok: false, text: "İptal sebebi yazın." }); return; }
    setBusy(true); setIslemMsg(null);
    try {
      const r = await authFetch(`/api/admin/discount/${id}/iptal`, {
        method: "PATCH", body: JSON.stringify({ sebep: iptalSebep.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setIslemMsg({ ok: true, text: d.mesaj || "İptal edildi." });
        setIptalEdilen(null); setIptalSebep(""); setYenile((n) => n + 1);
      } else setIslemMsg({ ok: false, text: d.error || "İptal edilemedi." });
    } catch { setIslemMsg({ ok: false, text: "Sunucuya bağlanılamadı." }); }
    finally { setBusy(false); }
  };

  // Kaydı kalıcı sil (geri alınamaz)
  const kaydiSil = async (id, adet, tur) => {
    const etiket = tur === "hediye" ? "hediye" : "indirimli alım";
    if (!window.confirm(`${adet} adetlik ${etiket} kaydı KALICI olarak silinecek.\n\nBu işlem geri alınamaz. Kayıt geçmişte kalmaz.\n\nDevam edilsin mi?`)) return;
    setBusy(true); setIslemMsg(null);
    try {
      const r = await authFetch(`/api/admin/discount/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.ok) { setIslemMsg({ ok: true, text: d.mesaj || "Silindi." }); setYenile((n) => n + 1); }
      else setIslemMsg({ ok: false, text: d.error || "Silinemedi." });
    } catch { setIslemMsg({ ok: false, text: "Sunucuya bağlanılamadı." }); }
    finally { setBusy(false); }
  };

  if (yukleniyor) return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 18, marginBottom: 22, color: THEME.textMuted, fontSize: 13 }}>
      Kayıtlar yükleniyor...
    </div>
  );

  const kayitlar = veri?.kayitlar || [];
  const ozet = veri?.ozet || { indirimliAdet: 0, hediyeAdet: 0 };
  const gosterilen = filtre === "hepsi" ? kayitlar : kayitlar.filter((k) => k.tur === filtre);

  const durumEtiket = (s) => s === "onaylandi" ? "Onaylandı" : s === "bekliyor" ? "Bekliyor" : s === "reddedildi" ? "Reddedildi" : s === "iptal" ? "İPTAL EDİLDİ" : s;
  const durumRenk = (s) => s === "onaylandi" ? THEME.success : s === "bekliyor" ? THEME.warn : s === "iptal" ? THEME.textFaint : THEME.danger;

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>İNDİRİMLİ ALIM & HEDİYE KAYITLARI</div>

      {/* Özet — ikisi de telif hesabından düşülür (gerçek satış değil) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 3 }}>🏷️ İNDİRİMLİ</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: THEME.textLight, fontFamily: FONT_MONO }}>{ozet.indirimliAdet} adet</div>
        </div>
        <div style={{ background: THEME.warnBg, border: `1px solid ${THEME.warn}`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10.5, color: THEME.warn, marginBottom: 3 }}>
            🎁 HEDİYE {ozet.hediyeKota != null && <span style={{ opacity: 0.85 }}>· kota {ozet.hediyeKota}</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: THEME.warn, fontFamily: FONT_MONO }}>
            {ozet.hediyeAdet} adet
            {ozet.hediyeKota > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 600, marginLeft: 8, color: ozet.hediyeAsim > 0 ? THEME.danger : THEME.textMuted }}>
                {ozet.hediyeAsim > 0 ? `⚠ ${ozet.hediyeAsim} aşım` : `${ozet.hediyeKalan} hak kaldı`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Telif etkisi + elle stok düşme hatırlatması */}
      <div style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "9px 12px", marginBottom: 14, fontSize: 11.5, color: THEME.textMuted, lineHeight: 1.6 }}>
        <b style={{ color: THEME.textLight }}>Telif:</b> Her iki tür de telif hesabından düşülür — gerçek satış olmadıkları için yazar bu kitaplardan telif kazanmaz.<br />
        <b style={{ color: THEME.warn }}>Stok:</b> Bu kayıtlar stoğu <b>otomatik düşürmez</b>. MST Yayıncılık sitesinden stoğu <b>elle düşmeniz</b> gerekir.
      </div>

      {/* Filtre */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["hepsi", "Hepsi"], ["indirimli", "🏷️ İndirimli"], ["hediye", "🎁 Hediye"]].map(([k, l]) => (
          <div key={k} onClick={() => setFiltre(k)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
            background: filtre === k ? THEME.cyan : "transparent",
            color: filtre === k ? THEME.onAccent : THEME.textMuted,
            border: `1px solid ${filtre === k ? THEME.cyan : THEME.border}`,
            fontWeight: filtre === k ? 700 : 500,
          }}>{l}</div>
        ))}
      </div>

      {islemMsg && (
        <div style={{ marginBottom: 10, fontSize: 12.5, padding: "7px 11px", borderRadius: 6,
          color: islemMsg.ok ? THEME.success : THEME.danger,
          background: islemMsg.ok ? THEME.successBg : THEME.dangerBg }}>
          {islemMsg.text}
        </div>
      )}

      {gosterilen.length === 0 ? (
        <div style={{ fontSize: 12.5, color: THEME.textFaint, padding: "10px 0" }}>
          {filtre === "hepsi" ? "Bu yazara ait kayıt yok." : `Bu türde kayıt yok.`}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: THEME.panelBgAlt, textAlign: "left" }}>
              {["Tür", "Kitap", "Adet", "Sebep", "Durum", "Tarih", "İşlem"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", fontSize: 10.5, color: THEME.textMuted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gosterilen.map((k) => {
              const iptalli = k.status === "iptal";
              return (
              <React.Fragment key={k.id}>
              <tr style={{ borderTop: `1px solid ${THEME.divider}`, opacity: iptalli ? 0.55 : 1 }}>
                <td style={{ padding: "9px 10px" }}>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4, fontSize: 10.5, fontWeight: 700,
                    background: k.tur === "hediye" ? THEME.warnBg : THEME.successBg,
                    color: k.tur === "hediye" ? THEME.warn : THEME.success,
                    textDecoration: iptalli ? "line-through" : "none",
                  }}>{k.tur === "hediye" ? "🎁 HEDİYE" : "🏷️ İNDİRİMLİ"}</span>
                </td>
                <td style={{ padding: "9px 10px", color: THEME.textLight, textDecoration: iptalli ? "line-through" : "none" }}>
                  {k.kitap || <span style={{ color: THEME.danger }}>⚠ Kitap seçilmemiş</span>}
                </td>
                <td style={{ padding: "9px 10px", color: THEME.textLight, fontFamily: FONT_MONO, fontWeight: 700, textDecoration: iptalli ? "line-through" : "none" }}>{k.quantity}</td>
                <td style={{ padding: "9px 10px", color: THEME.textMuted }}>{k.sebep || k.note || "—"}</td>
                <td style={{ padding: "9px 10px", color: durumRenk(k.status), fontWeight: 600 }}>{durumEtiket(k.status)}</td>
                <td style={{ padding: "9px 10px", color: THEME.textFaint, fontSize: 11.5 }}>
                  {k.created_at ? new Date(k.created_at).toLocaleDateString("tr-TR") : "—"}
                </td>
                <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                  {!iptalli && (
                    <span
                      onClick={() => { setIptalEdilen(iptalEdilen === k.id ? null : k.id); setIptalSebep(""); setIslemMsg(null); }}
                      style={{ color: THEME.warn, cursor: "pointer", fontSize: 11.5, fontWeight: 600, marginRight: 10 }}
                      title="Kaydı iptal et — kayıt kalır, telife girmez"
                    >İptal</span>
                  )}
                  <span
                    onClick={() => !busy && kaydiSil(k.id, k.quantity, k.tur)}
                    style={{ color: THEME.danger, cursor: busy ? "default" : "pointer", fontSize: 11.5, fontWeight: 600 }}
                    title="Kaydı kalıcı olarak sil — geri alınamaz"
                  >Sil</span>
                </td>
              </tr>
              {/* İptal sebebi formu */}
              {iptalEdilen === k.id && (
                <tr style={{ background: THEME.warnBg }}>
                  <td colSpan={7} style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: THEME.warn, marginBottom: 6, fontWeight: 600 }}>
                      Bu kayıt neden iptal ediliyor? (kayıt geçmişinde saklanır)
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        value={iptalSebep}
                        onChange={(e) => setIptalSebep(e.target.value)}
                        placeholder="Örn: yanlış kitap seçildi / adet hatalı girildi"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${THEME.warn}`, background: THEME.panelBg, color: THEME.textLight, fontSize: 12.5, fontFamily: FONT }}
                      />
                      <Btn small variant="success" disabled={busy} onClick={() => kaydiIptalEt(k.id)}>{busy ? "..." : "İptal Et"}</Btn>
                      <Btn small variant="ghost" onClick={() => { setIptalEdilen(null); setIptalSebep(""); }}>Vazgeç</Btn>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            );})}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============ Kazanç & Telif Paneli ============
function TelifPanel({ author, onPayout, onUpdateRoyalty, onUpdateWallet, flash }) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [cuzdandanDus, setCuzdandanDus] = useState(true);
  const [royalty, setRoyalty] = useState(author.royaltyRate != null ? String(author.royaltyRate) : "");
  const [nextDate, setNextDate] = useState(author.nextPayoutDate ? String(author.nextPayoutDate).slice(0, 10) : "");
  const [walletDelta, setWalletDelta] = useState("");
  const [busy, setBusy] = useState("");

  const bakiye = Number(author.wallet?.balance || 0);

  const yapPayout = async () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) return flash(false, "Geçerli bir tutar girin.");
    setBusy("payout");
    try {
      const d = await onPayout(author.id, { amount: Number(payoutAmount), note: payoutNote, cuzdandanDus });
      if (d?.ok) { flash(true, d.mesaj || "Telif ödemesi kaydedildi."); setPayoutAmount(""); setPayoutNote(""); }
      else flash(false, d?.error || "İşlem başarısız.");
    } catch { flash(false, "Sunucuya bağlanılamadı."); } finally { setBusy(""); }
  };
  const kaydetRoyalty = async () => {
    setBusy("royalty");
    try {
      const d = await onUpdateRoyalty(author.id, { royaltyRate: royalty || null, nextPayoutDate: nextDate || null });
      flash(d?.ok, d?.ok ? "Telif ayarları güncellendi." : (d?.error || "Hata"));
    } catch { flash(false, "Sunucuya bağlanılamadı."); } finally { setBusy(""); }
  };
  const yapWallet = async () => {
    if (!walletDelta || Number(walletDelta) === 0) return flash(false, "Miktar girin (+ ekle, - çıkar).");
    setBusy("wallet");
    try {
      const d = await onUpdateWallet(author.id, { delta: Number(walletDelta) });
      if (d?.ok) { flash(true, "Cüzdan güncellendi."); setWalletDelta(""); }
      else flash(false, d?.error || "Hata");
    } catch { flash(false, "Sunucuya bağlanılamadı."); } finally { setBusy(""); }
  };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 4 }}>KAZANÇ & TELİF</div>
      <div style={{ fontSize: 13, color: THEME.textLight, marginBottom: 14 }}>Cüzdan bakiyesi: <span style={{ fontFamily: FONT_MONO, color: THEME.cyan }}>{bakiye.toLocaleString("tr-TR")}₺</span></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Telif ödemesi */}
        <div style={{ border: `1px solid ${THEME.divider}`, borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 10 }}>TELİF ÖDEMESİ KAYDET</div>
          <Field label="TUTAR (₺)"><input style={inputStyle} value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" /></Field>
          <Field label="AÇIKLAMA"><input style={inputStyle} value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} placeholder="örn. Ağustos telifi" /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: THEME.textMuted, marginBottom: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={cuzdandanDus} onChange={(e) => setCuzdandanDus(e.target.checked)} /> Cüzdandan düş
          </label>
          <Btn small disabled={busy === "payout"} onClick={yapPayout}>{busy === "payout" ? "..." : "Ödeme Kaydet"}</Btn>
        </div>

        {/* Telif oranı + cüzdan */}
        <div style={{ border: `1px solid ${THEME.divider}`, borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 10 }}>TELİF ORANI & TARİH</div>
          <Field label="TELİF ORANI (%)"><input style={inputStyle} value={royalty} onChange={(e) => setRoyalty(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="örn. 15" /></Field>
          <Field label="SONRAKİ ÖDEME TARİHİ"><input type="date" style={inputStyle} value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></Field>
          <Btn small variant="ghost" disabled={busy === "royalty"} onClick={kaydetRoyalty}>{busy === "royalty" ? "..." : "Kaydet"}</Btn>
          <div style={{ borderTop: `1px solid ${THEME.divider}`, margin: "12px 0" }} />
          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 8 }}>CÜZDAN DÜZELT (+/−)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={inputStyle} value={walletDelta} onChange={(e) => setWalletDelta(e.target.value.replace(/[^0-9.\-]/g, ""))} placeholder="+500 / -200" />
            <Btn small disabled={busy === "wallet"} onClick={yapWallet}>Uygula</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Sözleşme Paneli ============
function SozlesmePanel({ author, onSave, flash }) {
  const c = author.contract || {};
  const [term, setTerm] = useState(c.term || "");
  const [exclusivity, setExclusivity] = useState(c.exclusivity || "");
  const [signedDate, setSignedDate] = useState(c.signedDate ? String(c.signedDate).slice(0, 10) : "");
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    setBusy(true);
    try {
      const d = await onSave(author.id, { term, exclusivity, signedDate: signedDate || null });
      flash(d?.ok, d?.ok ? "Sözleşme güncellendi." : (d?.error || "Hata"));
    } catch { flash(false, "Sunucuya bağlanılamadı."); } finally { setBusy(false); }
  };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>SÖZLEŞME</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="SÜRE"><input style={inputStyle} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="örn. 2 yıl" /></Field>
        <Field label="MÜNHASIRLIK"><input style={inputStyle} value={exclusivity} onChange={(e) => setExclusivity(e.target.value)} placeholder="örn. Münhasır / Değil" /></Field>
        <Field label="İMZA TARİHİ"><input type="date" style={inputStyle} value={signedDate} onChange={(e) => setSignedDate(e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn disabled={busy} onClick={kaydet}>{busy ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
    </div>
  );
}

// ============ Yazar detayı — kapak onayı, aşama ilerletme, stok düzenleme ============
// ============ Cüzdan/Kredi hareket geçmişi (denetim) ============
function CuzdanGecmisi({ authorId, authFetch }) {
  const [acik, setAcik] = React.useState(false);
  const [hareketler, setHareketler] = React.useState([]);
  const [yuklendi, setYuklendi] = React.useState(false);
  const ac = async () => {
    if (!acik && !yuklendi) {
      try {
        const r = await authFetch(`/api/admin/authors/${authorId}/cuzdan-gecmisi`);
        const d = await r.json();
        setHareketler(d.hareketler || []);
      } catch { setHareketler([]); }
      setYuklendi(true);
    }
    setAcik(!acik);
  };
  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={ac} style={{ background: "transparent", border: `1px solid ${THEME.border}`, color: THEME.cyan, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
        {acik ? "▲ Kredi geçmişini gizle" : "▼ Kredi hareket geçmişi"}
      </button>
      {acik && (
        <div style={{ marginTop: 10 }}>
          {hareketler.length === 0 && <div style={{ color: THEME.textFaint, fontSize: 12 }}>Henüz kredi hareketi yok.</div>}
          {hareketler.map((h) => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${THEME.border}`, fontSize: 12.5 }}>
              <div>
                <span style={{ color: h.yon === "ekleme" ? THEME.success : THEME.danger, fontWeight: 700 }}>
                  {h.yon === "ekleme" ? "+" : "−"}{Number(h.miktar).toLocaleString("tr-TR")}₺
                </span>
                <span style={{ color: THEME.textMuted, marginLeft: 8 }}>{h.sebep || "—"}</span>
              </div>
              <div style={{ color: THEME.textFaint, fontSize: 11 }}>
                {h.bakiye_sonrasi != null ? `bakiye: ${Number(h.bakiye_sonrasi).toLocaleString("tr-TR")}₺ · ` : ""}
                {new Date(h.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthorDetail({ author, onBack, onAdvanceStage, onApproveCover, onEditStock, onApprovePayment, onRejectPayment, onEditIsbn, onEditCover, onSyncStock, onAddBook, onDeleteBook, onDeleteAuthor, onUpdateCredentials, onPayout, onUpdateRoyalty, onUpdateWallet, onUpdateContract, onUpdateMatching, onUpdateMaliyet, onStokDus, onRefresh, authFetch }) {
  const [editingStock, setEditingStock] = useState(null); // {bookId, key}
  const [stockDraft, setStockDraft] = useState("");
  // Manuel satış girişi (D&R / Kitapyurdu)
  const [editingManuel, setEditingManuel] = useState(null); // {bookId, key}
  const [manuelDraft, setManuelDraft] = useState("");
  const [manuelMsg, setManuelMsg] = useState(null);

  const manuelSatisKaydet = async (bookId, platform, satis) => {
    setManuelMsg(null);
    try {
      const r = await authFetch(`/api/admin/books/${bookId}/manuel-satis`, {
        method: "PATCH", body: JSON.stringify({ platform, satis }),
      });
      const d = await r.json();
      if (d.ok) {
        setManuelMsg({ bookId, ok: true, text: d.mesaj || "Kaydedildi." });
        // ÖNEMLİ: window.location.reload() KULLANMA — oturum sadece bellekte tutuluyor,
        // sayfa yenilenince admin giriş ekranına düşüyor. Sadece veriyi tazele.
        if (onRefresh) onRefresh();
        setTimeout(() => setManuelMsg(null), 2500);
      } else setManuelMsg({ bookId, ok: false, text: d.error || "Kaydedilemedi." });
    } catch { setManuelMsg({ bookId, ok: false, text: "Sunucuya bağlanılamadı." }); }
  };

  // Dekont geri alma (yanlış onaylanan ödemeler için)
  const [dekontGeriAl, setDekontGeriAl] = useState(null); // receipt id
  const [dekontSebep, setDekontSebep] = useState("");
  const [dekontBusy, setDekontBusy] = useState(false);
  const [dekontMsg, setDekontMsg] = useState(null);

  const dekontuGeriAl = async (receiptId) => {
    if (!dekontSebep.trim()) { setDekontMsg({ ok: false, text: "Geri alma sebebi yazın." }); return; }
    setDekontBusy(true); setDekontMsg(null);
    try {
      const r = await authFetch(`/api/admin/receipts/${receiptId}/geri-al`, {
        method: "PATCH", body: JSON.stringify({ sebep: dekontSebep.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setDekontMsg({ ok: true, text: d.mesaj || "Geri alındı." });
        setDekontGeriAl(null); setDekontSebep("");
        if (onRefresh) onRefresh(); // sayfa yenileme YOK — oturum düşer
      } else setDekontMsg({ ok: false, text: d.error || "Geri alınamadı." });
    } catch { setDekontMsg({ ok: false, text: "Sunucuya bağlanılamadı." }); }
    finally { setDekontBusy(false); }
  };

  const [editingIsbn, setEditingIsbn] = useState(null); // bookId
  const [isbnDraft, setIsbnDraft] = useState("");
  const [editingCover, setEditingCover] = useState(null); // bookId
  const [coverDraft, setCoverDraft] = useState("");
  const [syncing, setSyncing] = useState(null); // bookId
  const [syncResult, setSyncResult] = useState(null); // {bookId, text}
  // Yeni kitap ekleme formu
  const [showBookForm, setShowBookForm] = useState(false);
  const [nbTitle, setNbTitle] = useState("");
  const [nbIsbn, setNbIsbn] = useState("");
  const [nbPrice, setNbPrice] = useState("");
  const [nbTuru, setNbTuru] = useState("roman");
  const [nbSayfa, setNbSayfa] = useState("");
  // Başlangıç stok = baskı adedi. Pakete göre otomatik gelir, elle değiştirilebilir.
  const PAKET_BASKI = { standart: 500, profesyonel: 1000, vip: 1000 };
  const paketBaski = author.paketKurali?.minBaski ?? PAKET_BASKI[String(author.plan || "standart").toLowerCase()] ?? 500;
  const [nbStok, setNbStok] = useState(String(paketBaski));
  // Yazar değişirse (başka yazara geçince) varsayılanı yenile
  useEffect(() => { setNbStok(String(paketBaski)); }, [author.id, paketBaski]);
  const [nbSaving, setNbSaving] = useState(false);
  const [nbMsg, setNbMsg] = useState(null);
  const nbIsbnClean = nbIsbn.replace(/[^0-9]/g, "");
  const nbIsbnOk = nbIsbnClean.length === 0 || nbIsbnClean.length === 13;
  // Yönetim paneli (giriş/telif/sözleşme)
  const [mgmtTab, setMgmtTab] = useState(null); // "cred" | "telif" | "sozlesme" | null
  const [msg, setMsg] = useState(null);
  // Kitap eşleştirme (başlangıç stok + platform kodları) düzenleme
  const [matchingBook, setMatchingBook] = useState(null); // bookId
  const [maliyetBook, setMaliyetBook] = useState(null); // bookId (baskı maliyeti editörü)
  const [stokBook, setStokBook] = useState(null); // bookId (MST sitesi stok düşümü)
  const [silAcik, setSilAcik] = useState(null);   // bookId — silme onay kutusu açık olan kitap
  const [silMetin, setSilMetin] = useState("");   // kitap adı doğrulama metni

  const saveNewBook = async () => {
    setNbSaving(true); setNbMsg(null);
    try {
      const data = await onAddBook(author.id, {
        title: nbTitle.trim(),
        isbn: nbIsbnClean || null,
        salePrice: nbPrice ? Number(nbPrice) : null,
        kitapTuru: nbTuru,
        sayfaSayisi: nbSayfa ? Number(nbSayfa) : null,
        baslangicStok: nbStok !== "" ? Number(nbStok) : null,
      });
      if (data && data.ok) {
        setNbMsg({ ok: true, text: data.mesaj || "Kitap eklendi." });
        setNbTitle(""); setNbIsbn(""); setNbPrice(""); setNbTuru("roman"); setNbSayfa(""); setNbStok(String(paketBaski));
        setShowBookForm(false);
      } else {
        setNbMsg({ ok: false, text: data?.error || "Kitap eklenemedi." });
      }
    } catch {
      setNbMsg({ ok: false, text: "Sunucuya bağlanılamadı." });
    } finally {
      setNbSaving(false);
    }
  };

  const flash = (ok, text) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  return (
    <div>
      <Btn variant="ghost" small onClick={onBack}>← Yazarlara dön</Btn>
      <div style={{ marginTop: 14, marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 22, margin: "0 0 4px" }}>{author.name}</h2>
          <div style={{ color: THEME.textMuted, fontSize: 13 }}>{author.email} · <Badge fg={THEME.cyan} bg="rgba(27,95,168,0.10)">{PLAN_LABELS[author.plan]}</Badge>{author.status === "pasif" && <span style={{ marginLeft: 8, fontSize: 10, color: THEME.textFaint }}>PASİF</span>}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "cred" ? null : "cred"); setMsg(null); }}>Yazar Bilgileri</Btn>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "telif" ? null : "telif"); setMsg(null); }}>Kazanç & Telif</Btn>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "indirimli" ? null : "indirimli"); setMsg(null); }}>İndirimli & Hediye</Btn>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "mesaj" ? null : "mesaj"); setMsg(null); }}>✉️ Bilgilendirme & Görev</Btn>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "sozlesme" ? null : "sozlesme"); setMsg(null); }}>Sözleşme</Btn>
          <Btn onClick={() => { setShowBookForm((v) => !v); setNbMsg(null); }}>{showBookForm ? "Vazgeç" : "+ Kitap Ekle"}</Btn>
          {author.status === "pasif" && onDeleteAuthor && (
            <Btn small variant="danger" onClick={() => onDeleteAuthor(author.id, author.name)}>Kalıcı Sil</Btn>
          )}
        </div>
      </div>

      {msg && <div style={{ color: msg.ok ? THEME.success : THEME.danger, fontSize: 13, marginBottom: 14, padding: "8px 12px", background: msg.ok ? "rgba(93,214,163,.08)" : "rgba(255,107,107,.08)", borderRadius: 6 }}>{msg.text}</div>}

      {/* Giriş Bilgileri yönetimi */}
      {mgmtTab === "cred" && <CredentialsPanel author={author} onSave={onUpdateCredentials} flash={flash} onClose={() => setMgmtTab(null)} />}
      {/* Kazanç & Telif yönetimi */}
      {mgmtTab === "telif" && <TelifPanel author={author} onPayout={onPayout} onUpdateRoyalty={onUpdateRoyalty} onUpdateWallet={onUpdateWallet} flash={flash} />}
      {mgmtTab === "indirimli" && <IndirimliHediyePanel author={author} authFetch={authFetch} />}
      {/* Sözleşme yönetimi */}
      {mgmtTab === "mesaj" && <BilgilendirmeKutusu author={author} authFetch={authFetch} />}

      {mgmtTab === "sozlesme" && <SozlesmePanel author={author} onSave={onUpdateContract} flash={flash} />}


      {/* Yeni kitap ekleme formu */}
      {showBookForm && (
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>YENİ KİTAP — {author.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr", gap: 12 }}>
            <Field label="KİTAP ADI"><input style={inputStyle} value={nbTitle} onChange={(e) => setNbTitle(e.target.value)} placeholder="Kitap adı" /></Field>
            <Field label="ISBN (13 HANE)"><input style={{ ...inputStyle, fontFamily: FONT_MONO, borderColor: nbIsbnOk ? undefined : THEME.danger }} value={nbIsbn} onChange={(e) => setNbIsbn(e.target.value)} placeholder="9786250000000" /></Field>
            <Field label="FİYAT (₺)"><input style={inputStyle} value={nbPrice} onChange={(e) => setNbPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="180" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1.6fr", gap: 12, marginTop: 10 }}>
            <Field label="KİTAP TÜRÜ">
              <select style={inputStyle} value={nbTuru} onChange={(e) => setNbTuru(e.target.value)}>
                <option value="roman">Roman (siyah-beyaz)</option>
                <option value="cocuk">Çocuk kitabı</option>
              </select>
            </Field>
            <Field label="SAYFA SAYISI"><input style={inputStyle} value={nbSayfa} onChange={(e) => setNbSayfa(e.target.value.replace(/[^0-9]/g, ""))} placeholder="200" /></Field>
            <Field label="BAŞLANGIÇ STOK (BASKI ADEDİ)">
              <input style={{ ...inputStyle, fontFamily: FONT_MONO, borderColor: Number(nbStok) !== paketBaski ? THEME.warn : undefined }}
                value={nbStok} onChange={(e) => setNbStok(e.target.value.replace(/[^0-9]/g, ""))} placeholder={String(paketBaski)} />
              <div style={{ fontSize: 10, color: Number(nbStok) !== paketBaski ? THEME.warn : THEME.textFaint, marginTop: 3 }}>
                {Number(nbStok) === paketBaski
                  ? `${PLAN_LABELS[author.plan] || author.plan} paketi varsayılanı — 5 platforma da yazılır`
                  : `Pakette ${paketBaski}. Değiştirdin — bilerek yapıyorsan sorun yok.`}
              </div>
            </Field>
            <Field label="TAHMİNİ BASKI MALİYETİ">
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: THEME.cyan, fontFamily: FONT_MONO }}>
                {nbSayfa ? `${(Number(nbSayfa) * (nbTuru === "cocuk" ? 1.25 : 0.21) + 15).toFixed(2)}₺` : "— sayfa girin"}
                <span style={{ fontSize: 10, color: THEME.textFaint, marginLeft: 8 }}>
                  ({nbTuru === "cocuk" ? "sf×1,25" : "sf×0,21"}+15)
                </span>
              </div>
            </Field>
          </div>
          <div style={{ fontSize: 11, color: nbIsbnClean.length === 13 ? THEME.textMuted : THEME.warn, margin: "2px 0 12px" }}>
            {nbIsbnClean.length === 13
              ? "✓ ISBN geçerli. Stok senkronunda pazaryeri verisi bu ISBN ile çekilir."
              : nbIsbnClean.length === 0
                ? "ISBN opsiyonel; girilmezse pazaryeri verisi çekilmez, sonra eklenebilir."
                : `ISBN ${nbIsbnClean.length}/13 hane.`}
          </div>
          {nbMsg && <div style={{ color: nbMsg.ok ? THEME.success : THEME.danger, fontSize: 12, marginBottom: 10 }}>{nbMsg.text}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn disabled={!nbTitle.trim() || !nbIsbnOk || nbSaving} onClick={saveNewBook}>{nbSaving ? "Ekleniyor..." : "Kitabı Ekle"}</Btn>
          </div>
        </div>
      )}
      {nbMsg && nbMsg.ok && !showBookForm && <div style={{ color: THEME.success, fontSize: 12, marginBottom: 16 }}>{nbMsg.text}</div>}

      {/* Ödeme onayları */}
      {author.wallet.pendingReceipts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>BEKLEYEN ÖDEME DEKONTLARI</div>
          {author.wallet.pendingReceipts.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.warnBg, border: `1px solid rgba(255,138,61,.3)`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
              <div>
                <div style={{ color: THEME.textLight, fontWeight: 600, fontSize: 13 }}>{Number(r.amount).toLocaleString("tr-TR")}₺ <span style={{ color: THEME.textMuted, fontWeight: 400 }}>· {new Date(r.created_at).toLocaleDateString("tr-TR")}</span></div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{r.note}{r.file_url ? <> · 📎 {r.file_url}</> : null}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small variant="success" onClick={() => onApprovePayment(author.id, r.id)}>Onayla</Btn>
                <Btn small variant="danger" onClick={() => onRejectPayment(author.id, r.id)}>Reddet</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onaylanmış dekontlar — yanlış onay durumunda geri alınabilir */}
      {(author.wallet.onayliReceipts || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>ONAYLANMIŞ DEKONTLAR</div>
          {(author.wallet.onayliReceipts || []).map((r) => (
            <div key={r.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                <div>
                  <div style={{ color: THEME.textLight, fontWeight: 600, fontSize: 13 }}>
                    {Number(r.amount).toLocaleString("tr-TR")}₺
                    <span style={{ color: THEME.success, fontWeight: 600, fontSize: 11, marginLeft: 8 }}>✓ Onaylandı</span>
                    <span style={{ color: THEME.textMuted, fontWeight: 400, fontSize: 11.5 }}> · {new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
                  </div>
                  {r.note && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>{r.note}</div>}
                </div>
                <span
                  onClick={() => { setDekontGeriAl(dekontGeriAl === r.id ? null : r.id); setDekontSebep(""); }}
                  style={{ color: THEME.danger, cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}
                  title="Onayı geri al — yüklenen bakiye düşülür"
                >Geri Al</span>
              </div>
              {dekontGeriAl === r.id && (
                <div style={{ background: THEME.dangerBg, border: `1px solid ${THEME.danger}`, borderRadius: 8, padding: "11px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: THEME.danger, marginBottom: 6, fontWeight: 600 }}>
                    ⚠ {Number(r.amount).toLocaleString("tr-TR")}₺ yazarın bakiyesinden düşülecek. Sebep yazın:
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={dekontSebep}
                      onChange={(e) => setDekontSebep(e.target.value)}
                      placeholder="Örn: dekont sahte çıktı / tutar hatalı"
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${THEME.danger}`, background: THEME.panelBg, color: THEME.textLight, fontSize: 12.5, fontFamily: FONT }}
                    />
                    <Btn small variant="danger" disabled={dekontBusy} onClick={() => dekontuGeriAl(r.id)}>{dekontBusy ? "..." : "Geri Al"}</Btn>
                    <Btn small variant="ghost" onClick={() => { setDekontGeriAl(null); setDekontSebep(""); }}>Vazgeç</Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
          {dekontMsg && (
            <div style={{ fontSize: 12.5, padding: "7px 11px", borderRadius: 6, marginTop: 4,
              color: dekontMsg.ok ? THEME.success : THEME.danger,
              background: dekontMsg.ok ? THEME.successBg : THEME.dangerBg }}>{dekontMsg.text}</div>
          )}
        </div>
      )}

      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>CÜZDAN BAKİYESİ</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: THEME.cyan, marginBottom: 12 }}>{author.wallet.balance.toLocaleString("tr-TR")}₺</div>
      <CuzdanGecmisi authorId={author.id} authFetch={authFetch} />

      {/* Kitaplar */}
      <YazarTelifToplami books={author.books} wallet={author.wallet} />

      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>
        KİTAPLAR — <span style={{ color: THEME.cyan, fontFamily: FONT_MONO }}>{author.books.length} eser</span>
        {author.books.length > 0 && (
          <span style={{ color: THEME.textFaint }}>
            {" · "}{author.books.filter((b) => b.pipeline[b.pipeline.length - 1].status === "tamamlandi").length} yayında
            {" · "}{author.books.reduce((t, b) => t + (b.totalSold || 0), 0)} toplam satış
          </span>
        )}
      </div>
      {author.books.map((book) => {
        const lastStage = book.pipeline[book.pipeline.length - 1];
        const published = lastStage.status === "tamamlandi";
        const activeIdx = book.pipeline.findIndex((s) => s.status !== "tamamlandi");
        const activeStageIdx = activeIdx === -1 ? book.pipeline.length - 1 : activeIdx;

        return (
          <div key={book.id} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 15 }}>{book.title}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{book.totalSold} toplam satış</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {published
                  ? <Badge fg={THEME.success} bg={THEME.successBg}>✓ Yayınlandı</Badge>
                  : <Badge fg={THEME.warn} bg={THEME.warnBg}>{book.pipeline[activeStageIdx].label}</Badge>}
              </div>
            </div>

            {!published && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 8 }}>YAYIN SÜRECİ — AŞAMA İLERLET</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {book.pipeline.map((s, i) => (
                    <button
                      key={s.key}
                      onClick={() => onAdvanceStage(author.id, book.id, i)}
                      style={{
                        fontSize: 11, padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                        background: s.status === "tamamlandi" ? THEME.successBg : i === activeStageIdx ? THEME.warnBg : THEME.panelBgAlt,
                        color: s.status === "tamamlandi" ? THEME.success : i === activeStageIdx ? THEME.warn : THEME.textFaint,
                        border: `1px solid ${s.status === "tamamlandi" ? "rgba(89,227,157,.3)" : i === activeStageIdx ? "rgba(255,138,61,.3)" : THEME.border}`,
                      }}
                    >
                      {s.status === "tamamlandi" ? "✓ " : ""}{s.label}
                    </button>
                  ))}
                </div>
                {book.pipeline.find((s) => s.key === "kapak").status !== "tamamlandi" && (
                  <div style={{ marginTop: 10 }}>
                    <Btn small variant={book.coverApproved ? "success" : "primary"} onClick={() => onApproveCover(author.id, book.id)}>
                      {book.coverApproved ? "✓ Kapak Onaylandı" : "Kapağı Onayla"}
                    </Btn>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>ISBN:</div>
              {editingIsbn === book.id ? (
                <input
                  autoFocus value={isbnDraft} onChange={(e) => setIsbnDraft(e.target.value)}
                  onBlur={() => { onEditIsbn(book.id, isbnDraft.trim()); setEditingIsbn(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                  placeholder="978..." style={{ background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.cyan}`, borderRadius: 4, padding: "4px 8px", fontSize: 12.5, fontFamily: FONT_MONO, width: 160 }}
                />
              ) : (
                <span onClick={() => { setEditingIsbn(book.id); setIsbnDraft(book.isbn || ""); }} style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: book.isbn ? THEME.textLight : THEME.textFaint, cursor: "pointer", borderBottom: `1px dashed ${THEME.border}` }}>
                  {book.isbn || "girilmemiş — tıkla ve ekle"}
                </span>
              )}
              {book.isbn && (
                <Btn small variant="ghost" disabled={syncing === book.id} onClick={async () => {
                  setSyncing(book.id); setSyncResult(null);
                  const r = await onSyncStock();
                  const match = r?.detay?.find((d) => d.book === book.title);
                  setSyncResult({ bookId: book.id, text: match ? `✓ Güncellendi: ${match.guncellenenPlatformlar.join(", ")}` : "Eşleşme bulunamadı" });
                  setSyncing(null);
                }}>{syncing === book.id ? "Senkronize ediliyor..." : "🔄 Stok Senkronize Et"}</Btn>
              )}
              {syncResult && syncResult.bookId === book.id && <span style={{ fontSize: 11.5, color: THEME.success }}>{syncResult.text}</span>}
              <Btn small variant="ghost" onClick={() => setMaliyetBook(maliyetBook === book.id ? null : book.id)} style={{ marginLeft: "auto" }}>
                {maliyetBook === book.id ? "Maliyeti Kapat" : "₺ Baskı Maliyeti"}
              </Btn>
              <Btn small variant="ghost" onClick={() => setMatchingBook(matchingBook === book.id ? null : book.id)}>
                {matchingBook === book.id ? "Eşleştirmeyi Kapat" : "⚙ Eşleştirme & Satış"}
              </Btn>
              {onStokDus && (
                <Btn small variant="ghost" onClick={() => setStokBook(stokBook === book.id ? null : book.id)}>
                  {stokBook === book.id ? "Stok Düşümünü Kapat" : "📦 Stok Düş"}
                </Btn>
              )}
            </div>

            {/* Telif özeti — her kitapta görünür */}
            <TelifOzetiKutu book={book} />

            {stokBook === book.id && onStokDus && (
              <StokDusumEditor book={book} onSubmit={onStokDus} />
            )}

            {maliyetBook === book.id && onUpdateMaliyet && (
              <MaliyetEditor book={book} onSave={onUpdateMaliyet} flash={(ok, t) => setMsg({ ok, text: t })} />
            )}

            {matchingBook === book.id && (
              <>
                <MatchingEditor book={book} onSave={onUpdateMatching} flash={(ok, t) => setMsg({ ok, text: t })} />
                {onDeleteBook && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${THEME.border}` }}>
                    {silAcik === book.id ? (
                      <div style={{ background: THEME.dangerBg, border: `1px solid rgba(255,107,107,.3)`, borderRadius: 6, padding: 12 }}>
                        <div style={{ fontSize: 12.5, color: THEME.danger, marginBottom: 8 }}>
                          "{book.title}" kalıcı olarak silinecek. Onaylamak için kitap adını birebir yaz:
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            autoFocus value={silMetin} onChange={(e) => setSilMetin(e.target.value)}
                            placeholder={book.title}
                            style={{ background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 12.5, minWidth: 220 }}
                          />
                          <Btn small variant="danger"
                            disabled={silMetin.trim() !== book.title.trim()}
                            onClick={() => { onDeleteBook(book.id, book.title); setSilAcik(null); setSilMetin(""); }}>
                            Kalıcı Sil
                          </Btn>
                          <Btn small variant="ghost" onClick={() => { setSilAcik(null); setSilMetin(""); }}>Vazgeç</Btn>
                        </div>
                      </div>
                    ) : (
                      <Btn small variant="ghost" onClick={() => { setSilAcik(book.id); setSilMetin(""); }}>
                        🗑 Bu kitabı sil
                      </Btn>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>Kapak görsel linki:</div>
              {editingCover === book.id ? (
                <input
                  autoFocus value={coverDraft} onChange={(e) => setCoverDraft(e.target.value)}
                  onBlur={() => { onEditCover(book.id, coverDraft.trim()); setEditingCover(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                  placeholder="https://... .jpg" style={{ background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.cyan}`, borderRadius: 4, padding: "4px 8px", fontSize: 12, width: 280 }}
                />
              ) : (
                <span onClick={() => { setEditingCover(book.id); setCoverDraft(book.coverUrl || ""); }} style={{ fontSize: 12, color: book.coverUrl ? THEME.textLight : THEME.textFaint, cursor: "pointer", borderBottom: `1px dashed ${THEME.border}`, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {book.coverUrl || "girilmemiş — tıkla ve kapak linki ekle"}
                </span>
              )}
              {book.coverUrl && <img src={book.coverUrl} alt="" style={{ width: 24, height: 32, objectFit: "cover", borderRadius: 2, border: `1px solid ${THEME.border}` }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            </div>

            <div style={{ fontSize: 10.5, color: THEME.textMuted, marginBottom: 8 }}>PAZARYERİ STOKLARI — DÜZENLE</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${PLATFORMS.length}, 1fr)`, gap: 8 }}>
              {PLATFORMS.map((p) => {
                const isEditing = editingStock && editingStock.bookId === book.id && editingStock.key === p.key;
                return (
                  <div key={p.key} style={{ background: THEME.panelBgAlt, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: THEME.textMuted, marginBottom: 4 }}>{p.label}</div>
                    {isEditing ? (
                      <input
                        autoFocus type="number" value={stockDraft}
                        onChange={(e) => setStockDraft(e.target.value)}
                        onBlur={() => { onEditStock(author.id, book.id, p.key, Number(stockDraft) || 0); setEditingStock(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                        style={{ width: "100%", background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.cyan}`, borderRadius: 4, textAlign: "center", fontSize: 13, fontFamily: FONT_MONO }}
                      />
                    ) : (
                      <div onClick={() => { setEditingStock({ bookId: book.id, key: p.key }); setStockDraft(String(book.stock[p.key] ?? 0)); }}
                        style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: THEME.textLight, cursor: "pointer" }}>
                        {book.stock[p.key] ?? 0}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* MANUEL SATIŞ GİRİŞİ — D&R ve Kitapyurdu (API senkronu yok, toplu bildirim gelir) */}
            <div style={{ marginTop: 12, background: THEME.warnBg, border: `1px solid ${THEME.warn}`, borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, color: THEME.warn, marginBottom: 3, fontWeight: 600 }}>
                MANUEL SATIŞ GİRİŞİ — D&R / KİTAPYURDU
              </div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                Bu platformlar otomatik senkronlanmaz. Toplu bildirim geldiğinde <b>toplam satış adedini</b> girin
                (ekleme değil, güncel toplam).
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {MANUEL_PLATFORMLAR.map((p) => {
                  const isEditing = editingManuel && editingManuel.bookId === book.id && editingManuel.key === p.key;
                  return (
                    <div key={p.key} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9.5, color: THEME.textMuted, marginBottom: 4 }}>{p.label}</div>
                      {isEditing ? (
                        <input
                          autoFocus type="number" min="0" value={manuelDraft}
                          onChange={(e) => setManuelDraft(e.target.value)}
                          onBlur={() => {
                            const yeni = Number(manuelDraft);
                            const eski = Number(book.stock?.[p.key] ?? 0);
                            // Tıklayıp hiçbir şey yapmadan çıkıldıysa kaydetme
                            if (manuelDraft !== "" && Number.isFinite(yeni) && yeni !== eski) {
                              manuelSatisKaydet(book.id, p.key, yeni);
                            }
                            setEditingManuel(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                          style={{ width: "100%", background: THEME.panelBgAlt, color: THEME.textLight, border: `1px solid ${THEME.warn}`, borderRadius: 4, textAlign: "center", fontSize: 14, fontFamily: FONT_MONO }}
                        />
                      ) : (
                        <div onClick={() => { setEditingManuel({ bookId: book.id, key: p.key }); setManuelDraft(String(book.stock?.[p.key] ?? 0)); }}
                          style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: THEME.textLight, cursor: "pointer" }}>
                          {book.stock?.[p.key] ?? 0}
                          <span style={{ fontSize: 9.5, color: THEME.textFaint, fontWeight: 400, marginLeft: 4 }}>satış</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {manuelMsg && manuelMsg.bookId === book.id && (
                <div style={{ marginTop: 7, fontSize: 11.5, color: manuelMsg.ok ? THEME.success : THEME.danger }}>{manuelMsg.text}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ Ana panel ============
export default function AdminPanel() {
  const [session, setSession] = useState(null); // { token, admin }
  const [hoverMenu, setHoverMenu] = useState(null); // sol menüde fareyle üzerinde olunan öğe
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("overview"); // overview | authors | authorDetail
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [discountRequests, setDiscountRequests] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [adRequests, setAdRequests] = useState([]);
  const [loadingAdRequests, setLoadingAdRequests] = useState(false);
  const [translationRequests, setTranslationRequests] = useState([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [destekTalepleri, setDestekTalepleri] = useState([]);
  const [loadingDestek, setLoadingDestek] = useState(false);
  const [showPassive, setShowPassive] = useState(false);
  const [bildirimler, setBildirimler] = useState([]);
  const [bildirimAcik, setBildirimAcik] = useState(false);

  const authFetch = (path, options = {}) => fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}`, ...(options.headers || {}) },
  });

  const loadAuthors = (includePassive = showPassive) => {
    setLoadingAuthors(true); setLoadError("");
    authFetch(`/api/admin/authors${includePassive ? "?includePassive=1" : ""}`)
      .then((r) => r.json())
      .then((data) => setAuthors(data.authors || []))
      .catch(() => setLoadError("Yazarlar yüklenemedi. Sayfayı yenileyin."))
      .finally(() => setLoadingAuthors(false));
  };

  const loadBildirimler = () => {
    authFetch("/api/admin/bildirimler")
      .then((r) => r.json())
      .then((data) => setBildirimler(data.bildirimler || []))
      .catch(() => { /* sessiz */ });
  };
  useEffect(() => {
    if (!session) return;
    loadBildirimler();
    const t = setInterval(loadBildirimler, 60000); // her dakika yenile
    return () => clearInterval(t);
  }, [session]);

  const togglePassive = () => {
    const next = !showPassive;
    setShowPassive(next);
    loadAuthors(next);
  };

  // Yazar pasifleştir / aktifleştir (yumuşak — veri korunur)
  const setAuthorStatus = async (id, status, name) => {
    const soru = status === "pasif"
      ? `"${name}" pasifleştirilsin mi?\n\nListede görünmeyecek ama tüm verileri (kitaplar, cüzdan) korunur. İstediğinde geri alabilirsin.`
      : `"${name}" yeniden aktifleştirilsin mi?`;
    if (!window.confirm(soru)) return;
    const res = await authFetch(`/api/admin/authors/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadAuthors();
    else { const d = await res.json().catch(() => ({})); alert(d.error || "İşlem başarısız."); }
  };

  // Yazara kitap ekle (ISBN ile — sync-stock pazaryeri verisini çeker)
  const addBookToAuthor = async (authorId, book) => {
    const res = await authFetch(`/api/admin/authors/${authorId}/books`, {
      method: "POST",
      body: JSON.stringify(book),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };

  // MST sitesinde stok düşümü — istek siteye gider, sonuç kullanıcıya döner
  const stokDus = async (bookId, { adet, tur, not }) => {
    try {
      const r = await authFetch(`/api/admin/books/${bookId}/stok-dus`, {
        method: "POST", body: JSON.stringify({ adet, tur, not }),
      });
      const d = await r.json();
      if (r.ok && d.ok) { loadAuthors(); return d; }
      return { ok: false, error: d.error || "Stok düşülemedi." };
    } catch {
      return { ok: false, error: "Sunucuya ulaşılamadı." };
    }
  };

  // Kitabı sil (yanlış eklenen kitap) — geçmiş kayıt varsa ikinci onay ister
  const deleteBook = async (bookId, title) => {
    if (!window.confirm(
      `"${title}" kitabı silinsin mi?\n\nKitap, stok kayıtları ve yayın süreci kalıcı olarak silinir. Bu işlem geri alınamaz.`
    )) return;

    let res = await authFetch(`/api/admin/books/${bookId}`, { method: "DELETE", body: JSON.stringify({}) });
    let data = await res.json().catch(() => ({}));

    // Kitapta geçmiş kayıt varsa backend silmez, raporlar → ikinci onay
    if (res.status === 409 && data.onayGerekli) {
      const g = data.gecmis || {};
      const satirlar = [];
      if (g.satis) satirlar.push(`• ${g.satis} adet satış kaydı`);
      if (g.indirimHediye) satirlar.push(`• ${g.indirimHediye} indirimli/hediye kaydı`);
      if (g.reklam) satirlar.push(`• ${g.reklam} reklam kaydı`);
      if (g.hizmet) satirlar.push(`• ${g.hizmet} hizmet siparişi`);
      if (g.ceviri) satirlar.push(`• ${g.ceviri} çeviri talebi`);
      const onayli = window.confirm(
        `DİKKAT — "${title}" kitabının geçmiş kaydı var:\n\n${satirlar.join("\n")}\n\n` +
        `Silersen:\n` +
        `– Satış/stok verisi ve indirimli/hediye kayıtları tamamen silinir (telif hesabından da çıkar).\n` +
        `– Reklam, hizmet ve çeviri kayıtları kitap adıyla geçmişte kalır.\n\n` +
        `Yine de kalıcı olarak silinsin mi?`
      );
      if (!onayli) return;
      res = await authFetch(`/api/admin/books/${bookId}?onay=SIL`, {
        method: "DELETE", body: JSON.stringify({ onay: "SIL" }),
      });
      data = await res.json().catch(() => ({}));
    }

    if (res.ok) { loadAuthors(); alert(data.mesaj || "Kitap silindi."); }
    else alert(data.error || "Kitap silinemedi.");
  };

  // Yazarı kalıcı sil (sadece pasif) — çift onay
  const deleteAuthor = async (id, name) => {
    if (!window.confirm(`"${name}" KALICI olarak silinsin mi?\n\nBu işlem geri alınamaz. Yazarın tüm kitapları, cüzdanı ve talepleri de silinir.`)) return;
    if (!window.confirm(`Son onay: "${name}" ve tüm verileri kalıcı silinecek. Emin misin?`)) return;
    const res = await authFetch(`/api/admin/authors/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setSelectedId(null); loadAuthors(); alert(data.mesaj || "Silindi."); }
    else alert(data.error || "Silinemedi.");
  };

  const updateCredentials = async (id, body) => {
    const res = await authFetch(`/api/admin/authors/${id}/credentials`, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };
  const doPayout = async (id, body) => {
    const res = await authFetch(`/api/admin/authors/${id}/payout`, { method: "POST", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };
  const updateRoyalty = async (id, body) => {
    const res = await authFetch(`/api/admin/authors/${id}/royalty`, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };
  const updateWallet = async (id, body) => {
    const res = await authFetch(`/api/admin/authors/${id}/wallet`, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };
  const updateContract = async (id, body) => {
    const res = await authFetch(`/api/admin/authors/${id}/contract`, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };
  const updateMatching = async (bookId, body) => {
    const res = await authFetch(`/api/admin/books/${bookId}/matching`, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) loadAuthors();
    return data;
  };

  const updateMaliyet = async (bookId, body) => {
    const res = await authFetch(`/api/admin/books/${bookId}/baski-maliyet`, { method: "PATCH", body: JSON.stringify(body) });
    if (res.ok) loadAuthors();
    return res.ok;
  };

  // Tüm sistemi manuel senkronize et: pazaryeri stok/satış verisini şimdi çek,
  // ardından yazar listesini tazele ki güncel rakamlar ekrana yansısın.
  const syncAll = async () => {
    const res = await authFetch("/api/admin/sync-stock", { method: "POST" });
    if (res.ok) loadAuthors();
    return res;
  };

  const loadDiscountRequests = () => {
    setLoadingDiscounts(true);
    authFetch("/api/admin/discount-requests")
      .then((r) => r.json())
      .then((data) => setDiscountRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoadingDiscounts(false));
  };

  const loadServiceOrders = () => {
    setLoadingOrders(true);
    authFetch("/api/admin/service-orders")
      .then((r) => r.json())
      .then((data) => setServiceOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  };
  const loadAdRequests = () => {
    setLoadingAdRequests(true);
    authFetch("/api/admin/ad-requests")
      .then((r) => r.json())
      .then((data) => setAdRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoadingAdRequests(false));
  };
  const loadTranslationRequests = () => {
    setLoadingTranslations(true);
    authFetch("/api/admin/translation-requests")
      .then((r) => r.json())
      .then((data) => setTranslationRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoadingTranslations(false));
  };
  const loadDestekTalepleri = () => {
    setLoadingDestek(true);
    authFetch("/api/admin/destek-talepleri")
      .then((r) => r.json())
      .then((data) => setDestekTalepleri(data.talepler || []))
      .catch(() => {})
      .finally(() => setLoadingDestek(false));
  };
  const updateDestekStatus = (id, status) => {
    authFetch(`/api/admin/destek-talepleri/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
      .then((r) => r.json())
      .then(() => loadDestekTalepleri())
      .catch(() => {});
  };

  useEffect(() => { if (session) { loadAuthors(); loadDiscountRequests(); loadServiceOrders(); loadAdRequests(); loadTranslationRequests(); } }, [session]);
  useEffect(() => { if (session && view === "discounts") loadDiscountRequests(); }, [session, view]);
  useEffect(() => { if (session && view === "orders") loadServiceOrders(); }, [session, view]);
  useEffect(() => { if (session && view === "ads") loadAdRequests(); }, [session, view]);
  useEffect(() => { if (session && view === "translations") loadTranslationRequests(); }, [session, view]);
  useEffect(() => { if (session && view === "destek") loadDestekTalepleri(); }, [session, view]);

  if (!session) return <AdminLogin onLogin={setSession} />;

  const selected = authors.find((a) => a.id === selectedId);

  const advanceStage = async (authorId, bookId, stageIdx) => {
    await authFetch(`/api/admin/books/${bookId}/stage`, { method: "PATCH", body: JSON.stringify({ stageIndex: stageIdx }) });
    loadAuthors();
  };
  const approveCover = async (authorId, bookId) => {
    await authFetch(`/api/admin/books/${bookId}/approve-cover`, { method: "PATCH" });
    loadAuthors();
  };
  const editStock = async (authorId, bookId, platformKey, value) => {
    // iyimser (optimistic) güncelleme — beklerken ekranda hemen görünsün
    setAuthors((prev) => prev.map((a) => a.id !== authorId ? a : {
      ...a, books: a.books.map((b) => b.id !== bookId ? b : { ...b, stock: { ...b.stock, [platformKey]: value } }),
    }));
    await authFetch(`/api/admin/books/${bookId}/stock`, { method: "PATCH", body: JSON.stringify({ platform: platformKey, stock: value }) });
    loadAuthors();
  };
  const approvePayment = async (authorId, receiptId) => {
    await authFetch(`/api/admin/receipts/${receiptId}/approve`, { method: "POST" });
    loadAuthors();
  };
  const rejectPayment = async (authorId, receiptId) => {
    await authFetch(`/api/admin/receipts/${receiptId}/reject`, { method: "POST" });
    loadAuthors();
  };
  const addAuthor = async ({ name, email, plan, title, book }) => {
    const res = await authFetch("/api/admin/authors", { method: "POST", body: JSON.stringify({ name, email, plan, title }) });
    const data = await res.json();
    // Yazar oluştuysa ve ilk kitap bilgisi girildiyse, kitabı da ekle
    if (data && data.ok && data.authorId && book && book.title) {
      try {
        const bookRes = await authFetch(`/api/admin/authors/${data.authorId}/books`, {
          method: "POST",
          body: JSON.stringify({ title: book.title, isbn: book.isbn }),
        });
        const bookData = await bookRes.json().catch(() => ({}));
        data.bookAdded = bookRes.ok;
        data.bookMesaj = bookData.mesaj || bookData.error;
      } catch { data.bookAdded = false; }
    }
    loadAuthors();
    return data; // { ok, authorId, username, tempPassword, bookAdded?, bookMesaj? }
  };
  const approveDiscount = async (id) => {
    await authFetch(`/api/admin/discount-requests/${id}/approve`, { method: "POST" });
    loadDiscountRequests();
  };
  const rejectDiscount = async (id) => {
    await authFetch(`/api/admin/discount-requests/${id}/reject`, { method: "POST" });
    loadDiscountRequests();
  };
  const manualDiscountAdd = async ({ authorId, bookId, quantity, note, tur, sebep }) => {
    try {
      const res = await authFetch("/api/admin/discount-manual", {
        method: "POST",
        body: JSON.stringify({ authorId: parseInt(authorId, 10), bookId: bookId ? parseInt(bookId, 10) : null, quantity, note, tur, sebep }),
      });
      const data = await res.json();
      loadDiscountRequests();
      return data;
    } catch { return { ok: false, error: "Bağlantı hatası" }; }
  };
  const editIsbn = async (bookId, isbn) => {
    await authFetch(`/api/admin/books/${bookId}/isbn`, { method: "PATCH", body: JSON.stringify({ isbn }) });
    loadAuthors();
  };
  const editCover = async (bookId, coverUrl) => {
    await authFetch(`/api/admin/books/${bookId}/cover`, { method: "PATCH", body: JSON.stringify({ coverUrl }) });
    loadAuthors();
  };
  const syncStock = async () => {
    const res = await authFetch("/api/admin/sync-stock", { method: "POST" });
    const data = await res.json();
    loadAuthors();
    return data;
  };
  const bulkIsbn = async (pairs) => {
    const res = await authFetch("/api/admin/books/bulk-isbn", { method: "POST", body: JSON.stringify({ pairs }) });
    if (!res.ok) throw new Error("Sunucu hatası: " + res.status);
    const data = await res.json();
    loadAuthors();
    return data;
  };
  const updateOrderStatus = async (id, status) => {
    await authFetch(`/api/admin/service-orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadServiceOrders();
  };
  const updateAdRequestStatus = async (id, status) => {
    await authFetch(`/api/admin/ad-requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadAdRequests();
  };
  const updateTranslationStatus = async (id, status) => {
    await authFetch(`/api/admin/translation-requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadTranslationRequests();
  };

  const nav = [
    ["overview", "Genel Bakış"], ["gorevTakip", "Görev Takip"], ["authors", "Yazarlar"], ["discounts", "Hediye & İndirimli"],
    ["indirimliOzet", "Hediye & İnd. Özet"],
    ["orders", "Mağaza Siparişleri"], ["ads", "Reklam Talepleri"], ["translations", "Çeviri Talepleri"],
    ["destek", "Destek & Şikayet"], ["duyurular", "Duyurular"], ["meta", "Meta Reklam"],
    ["oyun", "Görev & Ödül"],
    ["reklamMerkezi", "Reklam Merkezi"],
    ["yazarKampanya", "Yazar Kampanyaları"],
    ["reklamTeklif", "Reklam Başvuruları"],
    ["eslesme", "Eşleşme Teşhisi"],
    ["isbn", "Toplu ISBN"],
    ["kullanicilar", "Kullanıcı Yönetimi"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, display: "flex", fontFamily: FONT }}>
      <div style={{ width: 220, background: THEME.sidebarBg, borderRight: `1px solid ${THEME.border}`, padding: "20px 14px", flexShrink: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, color: THEME.textLight, fontSize: 15, marginBottom: 2 }}>MST Yayıncılık</div>
        <div style={{ fontSize: 10.5, color: THEME.textMuted, letterSpacing: "0.05em", marginBottom: 4 }}>YÖNETİM PANELİ</div>
        <div style={{ fontSize: 10, color: THEME.cyan, marginBottom: 24 }}>{session.admin?.name || session.admin?.email}</div>
        {nav.map(([key, label]) => (
          <div key={key}
            onClick={() => { setView(key); setSelectedId(null); }}
            onMouseEnter={() => setHoverMenu(key)}
            onMouseLeave={() => setHoverMenu(null)}
            style={{
              padding: "9px 12px", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 13,
              background: view === key ? THEME.cyan
                : hoverMenu === key ? "rgba(27,95,168,0.09)" : "transparent",
              color: view === key ? THEME.onAccent
                : hoverMenu === key ? THEME.cyan : THEME.textMuted,
              fontWeight: view === key ? 700 : hoverMenu === key ? 600 : 500,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderLeft: `3px solid ${view === key ? THEME.cyan : hoverMenu === key ? "rgba(27,95,168,0.35)" : "transparent"}`,
              transition: "background 120ms, color 120ms, border-color 120ms",
            }}>
            <span>{label}</span>
            {key === "discounts" && discountRequests.length > 0 && (
              <span style={{ background: THEME.warnBg, color: THEME.warn, borderRadius: 20, padding: "1px 7px", fontSize: 10.5, fontWeight: 700 }}>{discountRequests.length}</span>
            )}
            {key === "orders" && serviceOrders.filter((o) => o.status === "Onay bekliyor" || o.status === "İnceleniyor").length > 0 && (
              <span style={{ background: THEME.warnBg, color: THEME.warn, borderRadius: 20, padding: "1px 7px", fontSize: 10.5, fontWeight: 700 }}>{serviceOrders.filter((o) => o.status === "Onay bekliyor" || o.status === "İnceleniyor").length}</span>
            )}
            {key === "ads" && adRequests.filter((r) => r.kind === "request" && r.status === "açık").length > 0 && (
              <span style={{ background: THEME.warnBg, color: THEME.warn, borderRadius: 20, padding: "1px 7px", fontSize: 10.5, fontWeight: 700 }}>{adRequests.filter((r) => r.kind === "request" && r.status === "açık").length}</span>
            )}
            {key === "translations" && translationRequests.filter((r) => r.status === "devam").length > 0 && (
              <span style={{ background: THEME.warnBg, color: THEME.warn, borderRadius: 20, padding: "1px 7px", fontSize: 10.5, fontWeight: 700 }}>{translationRequests.filter((r) => r.status === "devam").length}</span>
            )}
          </div>
        ))}
        <div onClick={() => setSession(null)} style={{ marginTop: 24, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: THEME.textFaint }}>Çıkış Yap</div>
      </div>

      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {/* Sağ üst bildirim merkezi */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, position: "relative" }}>
          <div
            onClick={() => setBildirimAcik((v) => !v)}
            style={{ position: "relative", cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: bildirimAcik ? "rgba(27,95,168,0.08)" : "transparent", display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: 19 }}>🔔</span>
            {bildirimler.length > 0 && (
              <span style={{ position: "absolute", top: 2, right: 4, background: THEME.danger, color: "#fff", borderRadius: 20, minWidth: 17, height: 17, fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {bildirimler.length}
              </span>
            )}
          </div>

          {bildirimAcik && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 340, maxHeight: 440, overflowY: "auto", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", zIndex: 50 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${THEME.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>Bildirimler</span>
                <span style={{ fontSize: 11, color: THEME.textMuted }}>{bildirimler.length} bekleyen</span>
              </div>
              {bildirimler.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12.5, color: THEME.textMuted }}>Bekleyen işlem yok 🎉</div>
              ) : (
                bildirimler.map((b, i) => (
                  <div key={i}
                    onClick={() => { setView(b.view); setSelectedId(null); setBildirimAcik(false); }}
                    style={{ padding: "11px 16px", borderBottom: `1px solid ${THEME.divider}`, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(27,95,168,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 15, marginTop: 1 }}>{BILDIRIM_IKON[b.tur] || "•"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.textLight }}>{b.baslik}</div>
                      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 1 }}>{b.detay}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {loadingAuthors && authors.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}
        {loadError && <div style={{ color: THEME.danger, fontSize: 13, marginBottom: 16 }}>{loadError}</div>}
        {view === "overview" && <Overview authors={authors} onSyncAll={syncAll} authFetch={authFetch} />}
        {view === "authors" && !selected && <AuthorList authors={authors} onSelect={(id) => setSelectedId(id)} onAddClick={() => setShowAddModal(true)} onSetStatus={setAuthorStatus} showPassive={showPassive} onTogglePassive={togglePassive} />}
        {view === "authors" && selected && (
          <AuthorDetail
            author={selected}
            authFetch={authFetch}
            onBack={() => setSelectedId(null)}
            onAdvanceStage={advanceStage}
            onApproveCover={approveCover}
            onEditStock={editStock}
            onApprovePayment={approvePayment}
            onRejectPayment={rejectPayment}
            onEditIsbn={editIsbn}
            onEditCover={editCover}
            onSyncStock={syncStock}
            onAddBook={addBookToAuthor}
            onDeleteBook={deleteBook}
            onStokDus={stokDus}
            onRefresh={loadAuthors}
            onDeleteAuthor={deleteAuthor}
            onUpdateCredentials={updateCredentials}
            onPayout={doPayout}
            onUpdateRoyalty={updateRoyalty}
            onUpdateWallet={updateWallet}
            onUpdateContract={updateContract}
            onUpdateMatching={updateMatching}
            onUpdateMaliyet={updateMaliyet}
          />
        )}
        {view === "discounts" && (
          <DiscountRequests requests={discountRequests} loading={loadingDiscounts} onApprove={approveDiscount} onReject={rejectDiscount} authors={authors} onManualAdd={manualDiscountAdd} />
        )}
        {view === "gorevTakip" && <GorevTakip authFetch={authFetch} onSelectAuthor={(id) => { setView("authors"); setSelectedId(id); }} />}
        {view === "indirimliOzet" && <IndirimliOzet session={session} authFetch={authFetch} />}
        {view === "orders" && <ServiceOrdersView orders={serviceOrders} loading={loadingOrders} onUpdateStatus={updateOrderStatus} />}
        {view === "ads" && <AdRequestsView requests={adRequests} loading={loadingAdRequests} onUpdateStatus={updateAdRequestStatus} />}
        {view === "translations" && <TranslationRequestsView requests={translationRequests} loading={loadingTranslations} onUpdateStatus={updateTranslationStatus} />}
        {view === "destek" && <DestekTalepleriView requests={destekTalepleri} loading={loadingDestek} onUpdateStatus={updateDestekStatus} />}
        {view === "duyurular" && <DuyurularView authFetch={authFetch} authors={authors} />}
        {view === "meta" && <MetaReklamView authFetch={authFetch} />}
        {view === "oyun" && <OyunView authFetch={authFetch} authors={authors} />}
        {view === "reklamMerkezi" && <ReklamMerkezi authFetch={authFetch} />}
        {view === "yazarKampanya" && <YazarKampanyalari authFetch={authFetch} />}
        {view === "reklamTeklif" && <ReklamBasvurulari authFetch={authFetch} />}
        {view === "eslesme" && <EslesmeTeshisi authFetch={authFetch} onSelectAuthor={(id) => { setView("authors"); setSelectedId(id); }} />}
        {view === "isbn" && <BulkIsbnUpload onSubmit={bulkIsbn} />}
        {view === "kullanicilar" && <KullaniciYonetimi authFetch={authFetch} />}
      </div>

      {showAddModal && <AddAuthorModal onClose={() => setShowAddModal(false)} onAdd={addAuthor} />}
    </div>
  );
}
