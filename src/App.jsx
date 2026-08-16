import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://mst-backend-mauve.vercel.app";

// ============ Ortak tema (mobil yazar uygulamasıyla aynı marka dili) ============
// ============================================================
// AÇIK TEMA — modern, yüksek okunabilirlik
// Not: Anahtar isimleri (cyan, textLight vb.) eskiden kalma;
// değerleri açık temaya göre yeniden tanımlandı. İsimleri
// değiştirmedim ki kodun tamamı çalışmaya devam etsin.
// ============================================================
// GÜNCELLENDİ (6 Ağu 2026, kullanıcı talebi — "2001 hissi veriyor, 2026'ya
// geçir"): Eski tema (Arial, düz beyaz/mavi) MST'nin aday tarafındaki
// (App.jsx) lacivert/altın kimliğiyle hiç bağlantısı yoktu. Yeni palet bu
// kimliği (koyulaştırılmış altın vurgu) açık zeminde kullanıyor — panel
// hâlâ uzun süre bakılan, veri yoğun bir arayüz olduğu için açık temada
// kalıyor, ama artık "MST'ye ait" görünüyor.
const THEME = {
  bg: "#F7F6F3",           // sayfa zemini — sıcak, yumuşak bej-gri
  panelBg: "#FFFFFF",      // kart/panel zemini — beyaz
  panelBgAlt: "#FBFAF8",   // input/ikincil zemin
  sidebarBg: "#FFFFFF",    // sol menü — beyaz
  border: "#E7E2D8",       // kenarlık — sıcak, yumuşak
  divider: "#F0ECE3",      // ince ayırıcı
  cyan: "#A9762F",         // ANA VURGU — MST altını (koyulaştırılmış, açık zeminde okunaklı)
  secondary: "#6B4BA8",    // ikincil vurgu — mor (değişmedi)
  textLight: "#181510",    // ANA METİN — sıcak koyu ton
  textMuted: "#6B6558",    // ikincil metin
  textFaint: "#A39C8C",    // soluk metin (etiketler)
  success: "#1B7F4B",
  successBg: "rgba(27,127,75,0.10)",
  warn: "#A66A00",
  warnBg: "rgba(166,106,0,0.10)",
  danger: "#B3261E",
  dangerBg: "rgba(179,38,30,0.10)",
  onAccent: "#FFFFFF",
  // YENİ: altın vurgunun yumuşak arka planı — rozet/kart şeritleri için
  cyanBg: "rgba(169,118,47,0.10)",
  altinAcik: "#C9A24B",
};

// Tüm panelde kullanılacak yazı tipleri — Arial yerine modern bir üçlü:
// başlıklar için aday tarafıyla ORTAK olan Cormorant Garamond (marka
// tutarlılığı), gövde için Inter, veri/rakam için JetBrains Mono.
const FONT = "'Inter', -apple-system, 'Segoe UI', sans-serif";
const FONT_DISPLAY = "'Cormorant Garamond', Georgia, serif";
const FONT_MONO = "'JetBrains Mono', 'Consolas', monospace";

// Google Fonts'u belgeye enjekte eder — panelin HTML kabuğuna (index.html)
// erişimimiz yok, bu yüzden React tarafından çalışma zamanında ekleniyor.
// Yalnızca bir kez eklenir (id kontrolüyle tekrar eklenmesi önlenir).
function fontlariYukle() {
  if (typeof document === "undefined" || document.getElementById("mst-panel-fontlar")) return;
  const link = document.createElement("link");
  link.id = "mst-panel-fontlar";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}

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

  // EKLENDİ (5 Ağu 2026, kullanıcı sorusu — "yapay zekası gerçek mi test
  // mi, ne durumda"): daha önce bu bilgi yalnızca kodda görülebiliyordu.
  const [aiDurum, setAiDurum] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const aiDurumYukle = async (baglantiDene) => {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const r = await authFetch(`/api/admin/ai-durum${baglantiDene ? "?baglantiDene=1" : ""}`);
      setAiDurum(await r.json());
    } catch { setAiDurum({ hata: true }); }
    finally { setAiBusy(false); }
  };
  useEffect(() => { aiDurumYukle(false); }, []); // eslint-disable-line

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

  const aiRenk = aiDurum?.baglantiTesti?.krediYetersizMi ? THEME.danger
    : aiDurum?.gercekAIcalisiyorMu ? THEME.success : (aiDurum?.testModuAcikMi ? THEME.warn : THEME.danger);
  const aiMetin = !aiDurum ? "Kontrol ediliyor…"
    : aiDurum.hata ? "Kontrol edilemedi"
    : aiDurum.baglantiTesti?.krediYetersizMi ? "KREDİ TÜKENDİ — hemen yükleme gerekiyor"
    : aiDurum.testModuAcikMi ? "TEST MODU — sahte cevap dönüyor, gerçek değil"
    : !aiDurum.anahtarTanimliMi ? "API anahtarı tanımlı değil — sistem çalışmıyor"
    : "GERÇEK — Anthropic API'sine bağlı";

  return (
    <div>
      {/* AI DURUMU (5 Ağu 2026, genişletildi 6 Ağu 2026 — "kredi ne durumda
          onu nasıl kontrol edeceğiz" sorusuna cevap) — "yapay zekası gerçek
          mi test mi, kredisi bitti mi" sorusuna her zaman görülebilir bir
          cevap. NOT: Anthropic'in kalan bakiyeyi (₺ tutarı) sorgulayan bir
          public API'si yok — o rakam yalnızca console.anthropic.com'da,
          giriş yaparak görülebilir. Burada gösterilen "kredi tükendi" tespiti,
          GERÇEK bir istek atıp Anthropic'in döndürdüğü spesifik hatayı
          okumaya dayanır — tahmini bir rakam değildir. Eser inceleme, AI
          Menajer ve AI takip sorusu AYNI anahtarı paylaştığı için tek kontrol
          üçünü de kapsar. */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8,
                    padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: aiRenk, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.textLight }}>AI Sistemleri — {aiMetin}</div>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
              Model: {aiDurum?.model || "claude-sonnet-4-6"} · Eser inceleme, AI Menajer, AI takip sorusu (tek anahtar)
              {aiDurum?.baglantiTesti && (
                aiDurum.baglantiTesti.basarili
                  ? ` · Bağlantı testi: ${aiDurum.baglantiTesti.gecikmeMs}ms'de yanıt verdi`
                  : aiDurum.baglantiTesti.krediYetersizMi
                    ? ` · Anthropic hesabındaki kredi bitti — console.anthropic.com/settings/billing üzerinden yükleme yapılmalı`
                    : ` · Bağlantı testi BAŞARISIZ: ${aiDurum.baglantiTesti.hata}`
              )}
            </div>
            {aiDurum?.baglantiTesti?.krediYetersizMi && (
              <div style={{ fontSize: 10.5, color: THEME.textFaint, marginTop: 3 }}>
                Not: kalan bakiye tutarını (₺) panelden gösteremiyoruz — Anthropic bunun için herkese açık bir API sunmuyor, yalnızca console'da manuel görülebiliyor.
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost" disabled={aiBusy} onClick={() => aiDurumYukle(false)}>Yenile</Btn>
          <Btn small disabled={aiBusy || !aiDurum?.anahtarTanimliMi || aiDurum?.testModuAcikMi}
            onClick={() => aiDurumYukle(true)}>Gerçek Bağlantıyı Dene</Btn>
        </div>
      </div>

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

// ============ Yazar Adayları — reklamdan gelen huni + AI ön inceleme ============
// GİZLİLİK: Eser metni panele HİÇ gelmez (sunucuda o uç yok). Görünen tek şey AI raporudur.
const ADAY_KATEGORI = {
  kisi_kurum_hedef: "Kişi/kurum hedef gösterme",
  suca_tesvik: "Suça teşvik",
  nefret_ayrimcilik: "Nefret / ayrımcılık",
  kisilik_haklari_hakaret: "Kişilik hakları / hakaret",
  yaniltici_saglik_finans: "Yanıltıcı sağlık-finans iddiası",
  siddet_intihar_detayi: "Şiddet / intihar detayı",
  telif_intihal_suphesi: "Telif / intihal şüphesi",
  mustehcenlik_cocuk_riski: "Müstehcenlik / çocuk riski",
  // EKLENDİ (5 Ağu 2026, kullanıcı talebi):
  dini_deger_ve_metinlere_saldiri: "Dini değer/metinlere saldırı",
  asilsiz_iddia_gercek_gibi_sunum: "Asılsız iddia — gerçek gibi sunum",
};
const ADAY_SIDDET = { yuksek: "#C0392B", orta: "#C9A227", dusuk: "#7A7A7A" };
const ADAY_ESER_DURUM = {
  incelemede: { ad: "AI inceliyor", renk: "#C9A227" },
  rapor_hazir: { ad: "ONAY BEKLİYOR", renk: "#C0392B" },
  onaylandi: { ad: "Onaylandı", renk: "#2E7D32" },
  reddedildi: { ad: "Reddedildi", renk: "#7A7A7A" },
};

// ============ ADAY KOKPİTİ (6 Ağu 2026, kullanıcı talebi — önce "2001
// hissi veriyor, 2026'ya geçir" sonra "yazar adaylık ile ilgili tüm
// herşeyi direkt o panele aktaralım, adını Aday Kokpiti yapalım") ============
// Önceden BEŞ AYRI menü vardı: Yazar Adayları (eser onay/red + editöryal
// değerlendirme + AI analizi), Aday Görüşmeleri, Aday Takip Önerileri,
// Danışman Kokpiti, ve kaynak analizi Yazar Adayları'nın altına gömülüydü.
// Editör bir adayı düşünmek için birden fazla ekrana gidip aynı kişiyi
// tekrar tekrar arıyordu. Artık TEK ekran: aday listesi solda (zengin
// filtrelerle), seçili adayın hero'su + görüşme talebi (varsa) + sistem
// takip önerisi (varsa) + eserleri (onay/red, editöryal form, AI ön
// analizi) + Karar Dosyası, hepsi aynı sayfada sırayla. En altta, aday
// seçili olmasa bile görünen genel Reklam Kaynak Analizi tablosu.
// Backend uçları DEĞİŞMEDİ — hepsi zaten vardı, burada birleştirildi.

const GORUSME_DURUM = {
  talep_edildi: { ad: "Talep edildi", renk: THEME.warn },
  planlandi:    { ad: "Planlandı",    renk: THEME.cyan },
  tamamlandi:   { ad: "Tamamlandı",   renk: THEME.success },
  gelmedi:      { ad: "Gelmedi",      renk: THEME.danger },
  iptal:        { ad: "İptal",        renk: THEME.textFaint },
};
const TAKIP_TIPI_ETIKET = {
  testi_tamamlayip_dosya_yuklemeyen: "Testi tamamlayıp dosya yüklemeyen",
  dosya_yukleyip_raporu_acmayan: "Dosya yükleyip raporu açmayan",
  raporu_acip_gorusme_istemeyen: "Raporu açıp görüşme istemeyen",
  gorusme_yapip_teklif_almayan: "Görüşme yapıp teklif almayan",
};

// Küçük, çizgi tabanlı SVG ikon seti — emoji yerine. Tek renk, currentColor
// ile boyanır, tutarlı kalınlık (1.8).
const Ikon = {
  gorusme: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M8 10h8M8 14h5M21 12a9 9 0 11-9-9 9 9 0 019 9z"/></svg>),
  oneri: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>),
  dosya: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>),
  ara: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>),
};

// Aday isminden baş harfleri çıkarır (avatar için) — "Elif Demir" -> "ED"
function bashHarfleri(adSoyad) {
  return (adSoyad || "").trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || "").join("") || "?";
}

function AdayKokpiti({ authFetch }) {
  const [adaylar, setAdaylar] = useState([]);
  const [kaynaklar, setKaynaklar] = useState([]);
  const [gorusmeler, setGorusmeler] = useState([]);
  const [oneriler, setOneriler] = useState([]);
  const [secili, setSecili] = useState(null); // aday listesi öğesi (özet)
  const [detay, setDetay] = useState(null);   // { aday, eserler } — /rapor'dan
  const [dosya, setDosya] = useState(null);
  const [kdYukleniyor, setKdYukleniyor] = useState(false);
  const [kdAcik, setKdAcik] = useState(true);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState("tumu");
  const [mesaj, setMesaj] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  // Görüşme düzenleme formu
  const [gorusmeFormAcik, setGorusmeFormAcik] = useState(false);
  const [gorusmeForm, setGorusmeForm] = useState({ durum: "", atananDanisman: "", danismanNotu: "", sonrakiTakipTarihi: "" });
  // Takip notu formu
  const [takipFormAcik, setTakipFormAcik] = useState(false);
  const [takipNotu, setTakipNotu] = useState("");
  const [takipKanal, setTakipKanal] = useState("telefon");
  // Eser onay/red
  const [redMetni, setRedMetni] = useState("");
  const [redAcik, setRedAcik] = useState(null);
  // Editöryal değerlendirme formu (hukuki onay/red'den ayrı katman)
  const [editForm, setEditForm] = useState({ karar: "", gucluYonler: "", eksikYonler: "", hedefOkur: "", editorlukIhtiyaci: "", hazirlikSeviyesi: "", sonrakiAdim: "", editorNotu: "" });
  const [editAcikEserId, setEditAcikEserId] = useState(null);

  const yukle = async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        authFetch("/api/admin/adaylar"),
        authFetch("/api/admin/gorusmeler"),
        authFetch("/api/admin/takip-onerileri"),
        authFetch("/api/admin/aday-kaynak-analizi"),
      ]);
      const [d1, d2, d3, d4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()]);
      setAdaylar(d1.adaylar || []);
      setGorusmeler(d2.gorusmeler || []);
      setOneriler(d3.oneriler || []);
      setKaynaklar(d4.kaynaklar || []);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const adaySec = async (a) => {
    setSecili(a); setDetay(null); setDosya(null); setMesaj("");
    setGorusmeFormAcik(false); setTakipFormAcik(false); setTakipNotu("");
    setRedAcik(null); setEditAcikEserId(null);
    try {
      const r = await authFetch(`/api/admin/adaylar/${a.id}/rapor`);
      const d = await r.json();
      setDetay({ aday: a, eserler: d.eserler || [] });
    } catch { setMesaj("Rapor okunamadı."); }
    setKdYukleniyor(true);
    try {
      const r2 = await authFetch(`/api/admin/adaylar/${a.id}/karar-dosyasi`);
      setDosya(await r2.json());
    } catch { /* karar dosyası henüz oluşmamış olabilir — sessizce geç */ }
    finally { setKdYukleniyor(false); }
  };
  const yenidenAc = () => secili && adaySec(secili);

  const kararDosyasiKanitDogrula = async (kanitId, durum) => {
    if (!secili || calisiyor) return;
    try {
      await authFetch(`/api/admin/adaylar/${secili.id}/dogrulama`, { method: "POST", body: JSON.stringify({ kanitId, durum }) });
      const r = await authFetch(`/api/admin/adaylar/${secili.id}/karar-dosyasi`);
      setDosya(await r.json());
    } catch { setMesaj("Kanıt doğrulaması kaydedilemedi."); }
  };

  const gorusmeKaydet = async (id) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/gorusmeler/${id}`, { method: "POST", body: JSON.stringify(gorusmeForm) });
      const d = await r.json();
      if (d.ok) { setMesaj("Görüşme güncellendi."); setGorusmeFormAcik(false); yukle(); }
      else setMesaj(d.error || "Güncellenemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const takipKaydet = async (adayId) => {
    if (!takipNotu.trim()) { setMesaj("Not boş olamaz."); return; }
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch("/api/admin/iletisim-gecmisi", { method: "POST", body: JSON.stringify({ adayId, kanal: takipKanal, mesaj: takipNotu }) });
      const d = await r.json();
      if (d.ok) { setMesaj("Takip kaydı eklendi."); setTakipFormAcik(false); setTakipNotu(""); }
      else setMesaj(d.error || "Kaydedilemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const onayla = async (eserId) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/eserler/${eserId}/onayla`, { method: "POST" });
      const d = await r.json();
      if (d.ok) { setMesaj(`Onaylandı — belge no: ${d.sertifikaNo}`); yenidenAc(); yukle(); }
      else setMesaj(d.error || "Onaylanamadı.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const reddet = async (eserId) => {
    const gerekceler = redMetni.split("\n").map(s => s.trim()).filter(Boolean);
    if (!gerekceler.length) { setMesaj("Her satıra bir gerekçe yazın."); return; }
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/eserler/${eserId}/reddet`, { method: "POST", body: JSON.stringify({ gerekceler }) });
      const d = await r.json();
      if (d.ok) { setMesaj("Reddedildi — gerekçeler adayın uygulamasında görünecek."); setRedAcik(null); setRedMetni(""); yenidenAc(); yukle(); }
      else setMesaj(d.error || "Reddedilemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const editoryalKaydet = async (eserId) => {
    if (!editForm.karar) { setMesaj("Bir karar seçin: Yayına hazır / Editöryal geliştirmeyle uygun / Henüz hazır değil."); return; }
    if (!editForm.gucluYonler.trim()) { setMesaj("En az bir güçlü yön belirtin."); return; }
    if (!editForm.eksikYonler.trim()) { setMesaj("En az bir geliştirme önerisi belirtin."); return; }
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/eserler/${eserId}/editoryal-degerlendirme`, {
        method: "POST",
        body: JSON.stringify({
          karar: editForm.karar, gucluYonler: editForm.gucluYonler, eksikYonler: editForm.eksikYonler,
          hedefOkur: editForm.hedefOkur, editorlukIhtiyaci: editForm.editorlukIhtiyaci,
          hazirlikSeviyesi: editForm.hazirlikSeviyesi, sonrakiAdim: editForm.sonrakiAdim, editorNotu: editForm.editorNotu,
        }),
      });
      const d = await r.json();
      if (d.ok) { setMesaj("Editöryal değerlendirme kaydedildi."); setEditAcikEserId(null); yenidenAc(); yukle(); }
      else setMesaj(d.error || "Kaydedilemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı — bu özellik için backend ucu henüz eklenmemiş olabilir."); }
    finally { setCalisiyor(false); }
  };

  const raporYayinla = async (eserId) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/eserler/${eserId}/rapor-yayinla`, { method: "POST" });
      const v = await r.json();
      setMesaj(v.ok ? "Rapor adaya açıldı." : (v.error || "Yayınlanamadı."));
      if (v.ok) { yenidenAc(); yukle(); }
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  // Seçili adaya ait görüşme ve takip önerisini istemci tarafında eşleştir.
  const seciliGorusme = secili ? gorusmeler.find(g => g.aday_id === secili.id) : null;
  const seciliOneri = secili ? oneriler.find(o => o.aday_id === secili.id) : null;
  const gorusenIdler = new Set(gorusmeler.map(g => g.aday_id));
  const oneriIdler = new Set(oneriler.map(o => o.aday_id));

  // Zengin filtreler (eski Yazar Adayları'ndan) — yeni pill tasarımında.
  const onayBekleyen = adaylar.filter(a => a.eser_durum === "rapor_hazir").length;
  const FILTRELER = [
    ["tumu", `Tümü (${adaylar.length})`],
    ["onay_bekleyen", `Onay bekleyen (${onayBekleyen})`],
    ["gorusme", "Görüşme bekleyen"],
    ["takip", "Takipte"],
    ["dosya_yuklemeyen", "Dosya yüklemeyen"],
    ["analizi_suren", "Analizi süren"],
    ["hareketsiz", "Hareketsiz (7g+)"],
  ];
  const filtrelenmis = adaylar.filter(a => {
    if (arama && !`${a.ad_soyad} ${a.telefon}`.toLowerCase().includes(arama.toLowerCase())) return false;
    if (filtre === "onay_bekleyen") return a.eser_durum === "rapor_hazir";
    if (filtre === "gorusme") return gorusenIdler.has(a.id);
    if (filtre === "takip") return oneriIdler.has(a.id);
    if (filtre === "dosya_yuklemeyen") return a.tip === "yazar" && !a.eser_id;
    if (filtre === "analizi_suren") return a.eser_durum === "incelemede";
    if (filtre === "hareketsiz") return a.son_giris && (Date.now() - new Date(a.son_giris).getTime()) > 7 * 24 * 3600 * 1000;
    return true;
  });

  // ── Stil sabitleri ──
  const kart = { background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 16 };
  const kartBaslik = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 };
  const kartBaslikH = { fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: THEME.textLight };
  const rozetMini = (renk, bg) => ({ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, color: renk, background: bg });
  const inputStyle = { background: THEME.panelBgAlt, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: FONT, width: "100%", boxSizing: "border-box" };
  const btn = (dolu, renk) => ({ padding: "8px 15px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: dolu ? "none" : `1px solid ${THEME.border}`, background: dolu ? (renk || THEME.cyan) : THEME.panelBg, color: dolu ? "#fff" : THEME.textLight });

  const kpiSayilar = { aktif: adaylar.length, gorusmeBekleyen: gorusmeler.filter(g => g.durum === "talep_edildi").length, takipOnerisi: oneriler.length };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <div>
          <h2 style={{ color: THEME.textLight, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: 0 }}>Aday Kokpiti</h2>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 2 }}>Eser değerlendirme, karar dosyası, görüşme ve takip — tek ekranda. Eser metinleri panele gelmez, yalnızca AI raporu görünür.</div>
        </div>
        <button onClick={yukle} style={btn(false)}>Yenile</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "18px 0" }}>
        {[
          { val: kpiSayilar.aktif, lbl: "Aktif aday", renk: THEME.altinAcik },
          { val: onayBekleyen, lbl: "Onay bekleyen eser", renk: THEME.danger },
          { val: kpiSayilar.gorusmeBekleyen, lbl: "Görüşme bekliyor", renk: THEME.warn },
          { val: kpiSayilar.takipOnerisi, lbl: "Takip önerisi", renk: THEME.warn },
        ].map((k, i) => (
          <div key={i} style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 12,
                                 padding: "14px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: k.renk }} />
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: THEME.textLight }}>{k.val}</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {mesaj && <div style={{ ...kart, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "flex-start" }}>
        {/* SOL: aday listesi */}
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 14, overflow: "hidden", maxHeight: 720, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 14, borderBottom: `1px solid ${THEME.divider}` }}>
            <input value={arama} onChange={e => setArama(e.target.value)} placeholder="İsim veya telefon ara…" style={inputStyle} />
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {FILTRELER.map(([k, ad]) => (
                <span key={k} onClick={() => setFiltre(k)}
                  style={{ padding: "5px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                           border: `1px solid ${filtre === k ? THEME.cyan : THEME.border}`,
                           background: filtre === k ? THEME.cyan : THEME.panelBg,
                           color: filtre === k ? "#fff" : THEME.textMuted }}>{ad}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!filtrelenmis.length && <div style={{ padding: 16, fontSize: 12.5, color: THEME.textMuted }}>Aday bulunamadı.</div>}
            {filtrelenmis.map(a => {
              const gBekliyor = gorusenIdler.has(a.id);
              const takipte = oneriIdler.has(a.id);
              const aktif = secili?.id === a.id;
              const d = a.eser_durum ? (ADAY_ESER_DURUM[a.eser_durum] || { ad: a.eser_durum, renk: THEME.textMuted }) : null;
              return (
                <div key={a.id} onClick={() => adaySec(a)}
                  style={{ padding: "12px 14px", borderBottom: `1px solid ${THEME.divider}`, cursor: "pointer",
                           display: "flex", alignItems: "center", gap: 11, position: "relative",
                           background: aktif ? THEME.cyanBg : "transparent" }}>
                  {aktif && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: THEME.altinAcik }} />}
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: THEME.cyanBg, color: THEME.cyan,
                                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY,
                                fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{bashHarfleri(a.ad_soyad)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: THEME.textLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.ad_soyad}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                      {d && <span style={rozetMini(d.renk, THEME.panelBgAlt)}>{d.ad}</span>}
                      {gBekliyor && <span style={rozetMini(THEME.warn, THEME.warnBg)}>Görüşme</span>}
                      {takipte && <span style={rozetMini(THEME.warn, THEME.warnBg)}>Takip</span>}
                      {!d && !gBekliyor && !takipte && <span style={{ fontSize: 11, color: THEME.textFaint }}>hazırlık {a.hazirlik_puani ?? 0}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAĞ: seçili adayın detayı */}
        <div>
          {!secili && <div style={kart}><div style={{ color: THEME.textMuted, fontSize: 13 }}>Soldan bir aday seçin.</div></div>}

          {secili && (
            <>
              {/* Hero */}
              <div style={kart}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg, ${THEME.altinAcik}, ${THEME.cyan})`,
                                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                  fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19 }}>{bashHarfleri(secili.ad_soyad)}</div>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: THEME.textLight }}>{secili.ad_soyad}</div>
                      <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 2 }}>
                        {secili.telefon} · {secili.eposta || "e-posta yok"} · kaynak: <b>{secili.kaynak || "bilinmiyor"}</b>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Akademi ilerleme */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                  <div style={{ flex: 1, maxWidth: 200, height: 6, background: THEME.divider, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(4, Math.round(((secili.akademi_mod || 0) / 10) * 100))}%`, background: (secili.akademi_mod || 0) === 0 ? THEME.divider : `linear-gradient(90deg, ${THEME.altinAcik}, ${THEME.cyan})` }} />
                  </div>
                  <span style={{ fontSize: 11, color: THEME.textMuted }}>{(secili.akademi_mod || 0) === 0 ? "Akademi: başlamadı" : `Akademi: ${secili.akademi_mod}/10 modül`}</span>
                </div>
              </div>

              {/* Görüşme talebi (varsa) */}
              {seciliGorusme && (
                <div style={kart}>
                  <div style={kartBaslik}>
                    <div style={kartBaslikH}><Ikon.gorusme width={16} height={16} color={THEME.cyan} />Görüşme Talebi</div>
                    <span style={rozetMini(GORUSME_DURUM[seciliGorusme.durum]?.renk || THEME.textMuted, THEME.warnBg)}>
                      {GORUSME_DURUM[seciliGorusme.durum]?.ad || seciliGorusme.durum}
                    </span>
                  </div>
                  <div style={{ background: THEME.cyanBg, borderRadius: 10, padding: "13px 15px" }}>
                    <div style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 4 }}>
                      <b style={{ color: THEME.textMuted, fontWeight: 600 }}>Uygun zaman:</b>{" "}
                      {seciliGorusme.uygun_gun ? new Date(seciliGorusme.uygun_gun).toLocaleDateString("tr-TR") : "belirtilmedi"} · {seciliGorusme.uygun_saat || "saat yok"} · {seciliGorusme.yontem === "telefon" ? "Telefon" : "Çevrim içi"}
                    </div>
                    {seciliGorusme.soru && <div style={{ fontSize: 12.5, color: THEME.textLight, fontStyle: "italic" }}>"{seciliGorusme.soru}"</div>}
                    {seciliGorusme.atanan_danisman && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4 }}>Danışman: {seciliGorusme.atanan_danisman}</div>}

                    {!gorusmeFormAcik ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button style={btn(true)} onClick={() => {
                          setGorusmeForm({ durum: seciliGorusme.durum, atananDanisman: seciliGorusme.atanan_danisman || "", danismanNotu: seciliGorusme.danisman_notu || "", sonrakiTakipTarihi: seciliGorusme.sonraki_takip_tarihi ? String(seciliGorusme.sonraki_takip_tarihi).slice(0, 10) : "" });
                          setGorusmeFormAcik(true);
                        }}>Düzenle</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {Object.entries(GORUSME_DURUM).map(([k, v]) => (
                            <span key={k} onClick={() => setGorusmeForm({ ...gorusmeForm, durum: k })}
                              style={{ ...rozetMini(gorusmeForm.durum === k ? "#fff" : THEME.textMuted, gorusmeForm.durum === k ? THEME.cyan : THEME.panelBg),
                                       cursor: "pointer", border: `1px solid ${THEME.border}` }}>{v.ad}</span>
                          ))}
                        </div>
                        <input value={gorusmeForm.atananDanisman} onChange={e => setGorusmeForm({ ...gorusmeForm, atananDanisman: e.target.value })} placeholder="Atanan danışman" style={inputStyle} />
                        <textarea value={gorusmeForm.danismanNotu} onChange={e => setGorusmeForm({ ...gorusmeForm, danismanNotu: e.target.value })} rows={2} placeholder="Danışman notu" style={{ ...inputStyle, resize: "vertical" }} />
                        <input type="date" value={gorusmeForm.sonrakiTakipTarihi} onChange={e => setGorusmeForm({ ...gorusmeForm, sonrakiTakipTarihi: e.target.value })} style={inputStyle} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button disabled={calisiyor} style={btn(true)} onClick={() => gorusmeKaydet(seciliGorusme.id)}>Kaydet</button>
                          <button style={btn(false)} onClick={() => setGorusmeFormAcik(false)}>Vazgeç</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sistem takip önerisi (varsa) */}
              {seciliOneri && (
                <div style={kart}>
                  <div style={kartBaslik}><div style={kartBaslikH}><Ikon.oneri width={16} height={16} color={THEME.cyan} />Sistem Önerisi</div></div>
                  <div style={{ borderLeft: `3px solid ${THEME.warn}`, background: THEME.warnBg, borderRadius: "0 10px 10px 0", padding: "12px 16px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.warn }}>{TAKIP_TIPI_ETIKET[seciliOneri.takip_tipi] || seciliOneri.takip_tipi}</div>
                    <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>
                      Sistem yalnızca hangi adayın nerede takıldığını gösterir — mesaj otomatik gönderilmez.
                    </div>
                    {!takipFormAcik ? (
                      <button style={{ ...btn(true), marginTop: 10 }} onClick={() => setTakipFormAcik(true)}>Takip Kaydı Ekle</button>
                    ) : (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[["telefon", "Telefon"], ["sms", "SMS"], ["eposta", "E-posta"], ["panel_notu", "Sadece not"]].map(([k, ad]) => (
                            <span key={k} onClick={() => setTakipKanal(k)}
                              style={{ ...rozetMini(takipKanal === k ? "#fff" : THEME.textMuted, takipKanal === k ? THEME.cyan : THEME.panelBg),
                                       cursor: "pointer", border: `1px solid ${THEME.border}` }}>{ad}</span>
                          ))}
                        </div>
                        <textarea value={takipNotu} onChange={e => setTakipNotu(e.target.value)} rows={3} placeholder="Gönderilen mesaj / not" style={{ ...inputStyle, resize: "vertical" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button disabled={calisiyor} style={btn(true)} onClick={() => takipKaydet(secili.id)}>Kaydet</button>
                          <button style={btn(false)} onClick={() => setTakipFormAcik(false)}>Vazgeç</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Eserler — onay/red + editöryal değerlendirme */}
              <div style={kart}>
                <div style={kartBaslik}><div style={kartBaslikH}><Ikon.dosya width={16} height={16} color={THEME.cyan} />Eserler</div></div>
                {!detay && <div style={{ fontSize: 12.5, color: THEME.textMuted }}>Yükleniyor…</div>}
                {detay && !detay.eserler.length && <div style={{ fontSize: 12.5, color: THEME.textMuted }}>Bu aday henüz eser yüklemedi.</div>}
                {detay && detay.eserler.map(e => {
                  const d = ADAY_ESER_DURUM[e.durum] || { ad: e.durum, renk: THEME.textMuted };
                  const rapor = e.rapor || {};
                  const ozet = rapor.ozet || {};
                  return (
                    <div key={e.id} style={{ border: `1px solid ${THEME.divider}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{e.eser_adi} <span style={{ color: THEME.textMuted, fontWeight: 400, fontSize: 11.5 }}>({e.tur || "tür belirtilmedi"} · {Math.round((e.karakter_sayisi || 0) / 1000)}k karakter)</span></div>
                        <span style={{ color: d.renk, fontWeight: 700, fontSize: 12 }}>{d.ad}{e.sertifika_no ? ` · ${e.sertifika_no}` : ""}</span>
                      </div>
                      {rapor.oneri && (
                        <div style={{ fontSize: 12.5, marginBottom: 10, color: THEME.textLight }}>
                          AI önerisi: <b style={{ color: rapor.oneri === "yayina_uygun_gorunuyor" ? THEME.success : rapor.oneri === "duzeltme_gerekli" ? THEME.danger : THEME.warn }}>
                            {rapor.oneri === "yayina_uygun_gorunuyor" ? "Yayına uygun görünüyor" : rapor.oneri === "duzeltme_gerekli" ? "Düzeltme gerekli" : "Dikkatli inceleme"}
                          </b>
                          <span style={{ color: THEME.textMuted }}> — {ozet.toplam ?? 0} bulgu ({ozet.yuksek ?? 0} yüksek · {ozet.orta ?? 0} orta · {ozet.dusuk ?? 0} düşük)</span>
                        </div>
                      )}
                      {(rapor.bulgular || []).map((b, i) => (
                        <div key={i} style={{ borderLeft: `3px solid ${ADAY_SIDDET[b.siddet] || THEME.textFaint}`, padding: "6px 10px", marginBottom: 6, background: THEME.panelBgAlt, borderRadius: 4 }}>
                          <div style={{ fontSize: 12, color: THEME.textLight, fontWeight: 600 }}>{ADAY_KATEGORI[b.kategori] || b.kategori} <span style={{ color: ADAY_SIDDET[b.siddet], fontSize: 10.5 }}>({b.siddet})</span> <span style={{ color: THEME.textMuted, fontWeight: 400 }}>· {b.parca}. bölüm</span></div>
                          {b.alinti && <div style={{ fontSize: 11.5, color: THEME.textMuted, fontStyle: "italic" }}>"{b.alinti}"</div>}
                          <div style={{ fontSize: 11.5, color: THEME.textMuted }}>{b.aciklama}</div>
                        </div>
                      ))}
                      {e.durum === "rapor_hazir" && (
                        <div style={{ marginTop: 10 }}>
                          <button onClick={() => onayla(e.id)} disabled={calisiyor} style={{ ...btn(true, THEME.success), marginRight: 8 }}>ONAYLA — YAYINA UYGUNLUK BELGESİ AÇ</button>
                          <button onClick={() => setRedAcik(redAcik === e.id ? null : e.id)} style={{ ...btn(false), color: THEME.danger, borderColor: THEME.danger }}>REDDET…</button>
                          {redAcik === e.id && (
                            <div style={{ marginTop: 10 }}>
                              <textarea value={redMetni} onChange={ev => setRedMetni(ev.target.value)} rows={4} placeholder={"Her satıra bir gerekçe yazın — aday bunları uygulamasında görecek.\nÖrn: Gerçek bir kurum hedef gösteriliyor (3. bölüm)"} style={{ ...inputStyle, resize: "vertical" }} />
                              <button onClick={() => reddet(e.id)} disabled={calisiyor} style={{ ...btn(true, THEME.danger), marginTop: 8 }}>Gerekçelerle reddet</button>
                            </div>
                          )}
                        </div>
                      )}

                      {(e.durum === "rapor_hazir" || e.durum === "onaylandi") && (
                        <div style={{ marginTop: 12, borderTop: `1px dashed ${THEME.divider}`, paddingTop: 10 }}>
                          <button onClick={() => setEditAcikEserId(editAcikEserId === e.id ? null : e.id)} style={{ ...btn(false), color: THEME.cyan, borderColor: THEME.cyan }}>
                            {editAcikEserId === e.id ? "Editöryal formu kapat" : "Editöryal Değerlendirme Gir…"}
                          </button>
                          {editAcikEserId === e.id && (
                            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                              {e.ai_editoryal_onanaliz && (() => {
                                let ai; try { ai = JSON.parse(e.ai_editoryal_onanaliz); } catch { ai = null; }
                                if (!ai) return null;
                                return (
                                  <div style={{ background: THEME.cyanBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 4 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: THEME.cyan, marginBottom: 8, letterSpacing: .3 }}>AI ÖN ANALİZİ — öneri niteliğindedir, karar editöre aittir</div>
                                    {ai.ozet && <div style={{ fontSize: 12, color: THEME.textLight, marginBottom: 8 }}>{ai.ozet}</div>}
                                    {ai.guclu_yonler?.length > 0 && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}><b style={{ color: THEME.success }}>Güçlü yönler:</b> {ai.guclu_yonler.join(" · ")}</div>}
                                    {ai.gelistirilecek?.length > 0 && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}><b style={{ color: THEME.warn }}>Geliştirilecek:</b> {ai.gelistirilecek.join(" · ")}</div>}
                                    {ai.editor_sorunlari?.length > 0 && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}><b style={{ color: THEME.danger }}>Editör sorunları:</b> {ai.editor_sorunlari.join(" · ")}</div>}
                                    {ai.yazim_kalitesi && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}><b>Yazım kalitesi:</b> {({ az: "az hata", orta: "orta düzeyde hata", sik: "sık hata" })[ai.yazim_kalitesi.seviye] || ai.yazim_kalitesi.seviye}{ai.yazim_kalitesi.aciklama ? ` — ${ai.yazim_kalitesi.aciklama}` : ""}<span style={{ color: THEME.textFaint, fontSize: 10 }}> (AI izlenimi, kesin sayım değildir)</span></div>}
                                    {ai.tur_benzerligi?.emin_mi && ai.tur_benzerligi?.tarz_gozlemi && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}><b>Tarz gözlemi:</b> {ai.tur_benzerligi.tarz_gozlemi}<span style={{ color: THEME.textFaint, fontSize: 10 }}> (tahmini, kesin kaynak değildir)</span></div>}
                                    {ai.hazirlik_seviyesi && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}><b>Hazırlık seviyesi:</b> {ai.hazirlik_seviyesi}</div>}
                                    <button onClick={() => setEditForm({ ...editForm, gucluYonler: (ai.guclu_yonler || []).join("\n"), eksikYonler: (ai.gelistirilecek || []).join("\n"), hedefOkur: ai.hedef_okur || editForm.hedefOkur, hazirlikSeviyesi: ai.hazirlik_seviyesi || editForm.hazirlikSeviyesi, sonrakiAdim: ai.onerilen_calisma || editForm.sonrakiAdim })}
                                      style={{ ...btn(false), fontSize: 11, color: THEME.cyan, borderColor: THEME.cyan }}>AI önerisini forma aktar (gözden geçirip düzenleyin)</button>
                                  </div>
                                );
                              })()}
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {[["hazir", "Yayına hazırlık için uygun"], ["gelistirme", "Editöryal geliştirmeyle uygun"], ["henuz_degil", "Henüz hazır değil"]].map(([k, ad]) => (
                                  <span key={k} onClick={() => setEditForm({ ...editForm, karar: k })}
                                    style={{ ...rozetMini(editForm.karar === k ? "#fff" : THEME.textMuted, editForm.karar === k ? THEME.cyan : THEME.panelBg), cursor: "pointer", border: `1px solid ${THEME.border}`, padding: "6px 12px" }}>{ad}</span>
                                ))}
                              </div>
                              <textarea value={editForm.gucluYonler} onChange={ev => setEditForm({ ...editForm, gucluYonler: ev.target.value })} rows={2} placeholder="Güçlü yönler (zorunlu — en az bir madde)" style={{ ...inputStyle, resize: "vertical" }} />
                              <textarea value={editForm.eksikYonler} onChange={ev => setEditForm({ ...editForm, eksikYonler: ev.target.value })} rows={2} placeholder="Geliştirilmesi gereken alanlar (zorunlu — en az bir madde)" style={{ ...inputStyle, resize: "vertical" }} />
                              <textarea value={editForm.hedefOkur} onChange={ev => setEditForm({ ...editForm, hedefOkur: ev.target.value })} rows={2} placeholder="Hedef okur değerlendirmesi" style={{ ...inputStyle, resize: "vertical" }} />
                              <input value={editForm.editorlukIhtiyaci} onChange={ev => setEditForm({ ...editForm, editorlukIhtiyaci: ev.target.value })} placeholder="Editörlük ihtiyacı" style={inputStyle} />
                              <input value={editForm.hazirlikSeviyesi} onChange={ev => setEditForm({ ...editForm, hazirlikSeviyesi: ev.target.value })} placeholder="Yayın hazırlık seviyesi" style={inputStyle} />
                              <input value={editForm.sonrakiAdim} onChange={ev => setEditForm({ ...editForm, sonrakiAdim: ev.target.value })} placeholder="Önerilen sonraki adım" style={inputStyle} />
                              <textarea value={editForm.editorNotu} onChange={ev => setEditForm({ ...editForm, editorNotu: ev.target.value })} rows={2} placeholder="Adaya özel editör notu" style={{ ...inputStyle, resize: "vertical" }} />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => editoryalKaydet(e.id)} disabled={calisiyor} style={btn(true)}>Editöryal Değerlendirmeyi Kaydet</button>
                                <button onClick={() => raporYayinla(e.id)} disabled={calisiyor} style={{ ...btn(false), color: THEME.warn, borderColor: THEME.warn }}>RAPORU ADAYA AÇ (onaydan bağımsız)</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {e.durum === "incelemede" && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 6 }}>AI incelemesi sürüyor: {e.toplam_parca ? Math.round(((e.son_islenen_parca || 0) / e.toplam_parca) * 100) : 0}%</div>}
                      {e.durum === "reddedildi" && (e.red_gerekceleri || []).map((g, i) => <div key={i} style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4 }}>• {g}</div>)}
                    </div>
                  );
                })}
              </div>

              {/* Karar Dosyası — Danışman Brifingi */}
              <div style={kart}>
                <div onClick={() => setKdAcik(!kdAcik)} style={{ ...kartBaslik, cursor: "pointer" }}>
                  <div style={kartBaslikH}><Ikon.dosya width={16} height={16} color={THEME.cyan} />Karar Dosyası — Danışman Brifingi</div>
                  <span style={{ color: THEME.textMuted, fontSize: 12 }}>{kdAcik ? "▲ gizle" : "▼ göster"}</span>
                </div>
                {kdAcik && (kdYukleniyor
                  ? <div style={{ fontSize: 12.5, color: THEME.textMuted }}>Yükleniyor…</div>
                  : <KararDosyasiGovde ad={secili.ad_soyad} dosya={dosya} kanitDogrula={kararDosyasiKanitDogrula} calisiyor={calisiyor} hazirlikPuani={secili.hazirlik_puani} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reklam Kaynak Analizi — genel referans, aday seçili olmasa bile görünür */}
      <div style={kart}>
        <div style={kartBaslikH}>Reklam Kaynak Analizi — hangi kanal ne getiriyor</div>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", fontSize: 12.5, color: THEME.textLight, borderCollapse: "collapse" }}>
            <thead><tr style={{ color: THEME.textMuted, textAlign: "left" }}><th style={{ padding: 6 }}>Kaynak</th><th>Kayıt</th><th>Yazar adayı</th><th>Eser yükleyen</th><th>Onaylanan</th></tr></thead>
            <tbody>
              {kaynaklar.map((k, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${THEME.divider}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{k.kaynak}</td><td>{k.kayit}</td><td>{k.yazar_adayi}</td><td>{k.eser_yukleyen}</td><td style={{ color: THEME.success, fontWeight: 700 }}>{k.onaylanan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// ============ SENKRON UYARILARI — ani stok düşüşü karantinası ============
// Ürün pazaryerinde yayından kalkarsa API stok 0 döndürür ve sistem bunu
// "hepsi satıldı" sanır. Bu ekran o kayıtları yazmadan önce insana sorar.
function SenkronUyarilari({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [gecmis, setGecmis] = useState([]);
  const [mesaj, setMesaj] = useState("");
  const [notlar, setNotlar] = useState({});
  const [calisiyor, setCalisiyor] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);

  const kutu = { background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 };
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/senkron-uyarilari");
      setVeri(await r.json());
      const g = await authFetch("/api/admin/senkron-uyari-gecmisi");
      setGecmis((await g.json()).gecmis || []);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const karar = async (id, tip) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/senkron-uyarilari/${id}/${tip}`, {
        method: "POST", body: JSON.stringify({ not: notlar[id] || "" }) });
      const v = await r.json();
      setMesaj(v.ok
        ? (tip === "onayla"
            ? `Onaylandı — stok ${v.yazilanStok} yazıldı, ${v.hesaplananSatis} satış hesaplandı.`
            : `Reddedildi — stok ${v.korunanStok} olarak korundu.`)
        : (v.error || "İşlem yapılamadı."));
      if (v.ok) yukle();
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Senkron Uyarıları</h2>
        <button onClick={yukle} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Yenile</button>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Bir pazaryerinde stok aniden düşerse sistem <b>yazmayı bekletir</b>. Bu genellikle ürünün
        yayından kalktığı veya listeden düştüğü anlamına gelir — satış değil. Onaylayana kadar
        mevcut stok korunur.
      </div>
      {mesaj && <div style={{ ...kutu, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={kutu}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          Onay bekleyen ({veri?.toplam ?? 0})
        </div>
        {!veri?.uyarilar?.length && (
          <div style={{ color: THEME.textMuted, fontSize: 13 }}>Bekleyen uyarı yok — senkron temiz.</div>
        )}
        {(veri?.uyarilar || []).map(u => (
          <div key={u.id} style={{ padding: "11px 6px", borderTop: `1px solid ${THEME.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: THEME.textLight, fontSize: 13.5, fontWeight: 600 }}>{u.title}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
                  {u.platform} · stok <b style={{ color: THEME.textLight }}>{u.onceki_stok}</b>
                  {" → "}<b style={{ color: "#C0392B" }}>{u.gelen_stok}</b>
                  {u.baslangic_stok != null && ` · başlangıç ${u.baslangic_stok}`}
                  {u.isbn && ` · ISBN ${u.isbn}`}
                </div>
                <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 3 }}>
                  {u.sebep === "sifira_dustu"
                    ? "Stok sıfıra düştü — ürün yayından kalkmış olabilir"
                    : `Ani düşüş (%${u.dusus_orani}) — olağandışı`}
                </div>
                {u.baslangic_stok != null && (
                  <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3 }}>
                    Onaylarsanız <b>{Math.max(0, u.baslangic_stok - u.gelen_stok)}</b> satış hesaplanacak.
                  </div>
                )}
              </div>
            </div>
            <input value={notlar[u.id] || ""} onChange={e => setNotlar({ ...notlar, [u.id]: e.target.value })}
              placeholder="Not (ör. pazaryerinde kontrol edildi, ürün pasif)" style={{ ...inputStyle, marginTop: 8, marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={calisiyor} onClick={() => karar(u.id, "reddet")}
                style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 4,
                         padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Reddet — stoğu koru
              </button>
              <button disabled={calisiyor} onClick={() => karar(u.id, "onayla")}
                style={{ background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: 4,
                         padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Onayla — gerçek satış
              </button>
            </div>
          </div>
        ))}
        {veri?.uyarilar?.length > 0 && (
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${THEME.border}` }}>
            Emin değilseniz <b>Reddet</b> seçin — stok korunur, bir sonraki senkronda tekrar sorulur.
            Onaylamak hayali satış ve telif üretebilir.
          </div>
        )}
      </div>

      <div style={kutu}>
        <div onClick={() => setGecmisAcik(!gecmisAcik)}
          style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
          <span style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13 }}>Karar geçmişi ({gecmis.length})</span>
          <span style={{ color: THEME.textMuted }}>{gecmisAcik ? "▾" : "▸"}</span>
        </div>
        {gecmisAcik && (gecmis.length ? gecmis.map(g => (
          <div key={g.id} style={{ padding: "7px 4px", borderTop: `1px solid ${THEME.border}`, fontSize: 12 }}>
            <span style={{ color: THEME.textLight }}>{g.title}</span>
            <span style={{ color: THEME.textMuted }}> · {g.platform} · {g.onceki_stok} → {g.gelen_stok} · </span>
            <span style={{ color: g.durum === "onaylandi" ? "#C9A227" : "#2E7D32", fontWeight: 700 }}>
              {g.durum === "onaylandi" ? "onaylandı" : "reddedildi"}
            </span>
            <span style={{ color: THEME.textMuted }}> · {g.karar_veren}</span>
            {g.karar_notu && <div style={{ color: THEME.textMuted, fontSize: 11.5 }}>{g.karar_notu}</div>}
          </div>
        )) : <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 6 }}>Henüz karar verilmemiş.</div>)}
      </div>
    </div>
  );
}

// ============ Ortak: aday seçici + stil yardımcıları ============
const P_KUTU = { borderRadius: 8, padding: 16, marginBottom: 14 };
function pKutu() { return { ...P_KUTU, background: THEME.cardBg, border: `1px solid ${THEME.border}` }; }
function pInput() { return { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`,
  borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }; }

function AdaySecici({ authFetch, secili, onSec, baslik = "Yazar adayları" }) {
  const [adaylar, setAdaylar] = useState([]);
  useEffect(() => {
    (async () => {
      try { const r = await authFetch("/api/admin/adaylar");
        setAdaylar(((await r.json()).adaylar || []).filter(a => a.tip === "yazar")); } catch {}
    })();
  }, []);
  return (
    <div style={{ ...pKutu(), flex: "0 0 260px", maxHeight: 560, overflowY: "auto" }}>
      <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{baslik}</div>
      {!adaylar.length && <div style={{ color: THEME.textMuted, fontSize: 12.5 }}>Aday yok.</div>}
      {adaylar.map(a => (
        <div key={a.id} onClick={() => onSec(a)}
          style={{ padding: "8px 6px", borderBottom: `1px solid ${THEME.border}`, cursor: "pointer",
                   background: secili?.id === a.id ? "rgba(201,162,75,.08)" : "transparent" }}>
          <div style={{ color: THEME.textLight, fontSize: 13 }}>{a.ad_soyad}</div>
          <div style={{ color: THEME.textMuted, fontSize: 11 }}>{a.telefon}</div>
        </div>
      ))}
    </div>
  );
}

// ============ Bölüm 12 — GÖRÜŞME OYUN PLANI (Danışman Kokpiti 2.0) ============
const ITIRAZ_TEMA_ADI = {
  fiyat: "Fiyat / bütçe", zamanlama: "Zamanlama", guven: "Güven / kanıt ihtiyacı",
  kapsam: "Kapsam belirsizliği", es_karari: "Eş veya aile kararı",
  onceki_deneyim: "Önceki kötü deneyim", sonuc_belirsizligi: "Sonuç belirsizliği",
};
const SONUC_ADI = {
  uygun: "Uygun", dogrulama_bekliyor: "Doğrulama bekliyor", zamanlama: "Zamanlama",
  finansman: "Finansman", uygun_degil: "Uygun değil",
};

function GorusmeOyunPlani({ authFetch }) {
  const [secili, setSecili] = useState(null);
  const [plan, setPlan] = useState(null);
  const [mesaj, setMesaj] = useState("");
  const [itiraz, setItiraz] = useState({ tema: "fiyat", detay: "", cozuldu: false, cozumYolu: "" });
  const [sonuc, setSonuc] = useState({ sonuc: "dogrulama_bekliyor", takipTarihi: "", takipKanali: "telefon", acikSoru: "" });
  const [ovr, setOvr] = useState({ alan: "", danismanKarari: "", gerekce: "" });
  const [calisiyor, setCalisiyor] = useState(false);

  const planAc = async (a) => {
    setSecili(a); setPlan(null); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/adaylar/${a.id}/gorusme-plani`);
      if (r.status === 404) { setMesaj("Bu aday değerlendirmeyi tamamlamamış — görüşme planı üretilemez."); return; }
      setPlan(await r.json());
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };

  const gonder = async (yol, govde, basarili) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(yol, { method: "POST", body: JSON.stringify(govde) });
      const v = await r.json();
      setMesaj(v.ok ? basarili : (v.error || "Kaydedilemedi."));
      if (v.ok) planAc(secili);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const B = ({ baslik, children, vurgu }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".16em", color: vurgu ? "#C0392B" : THEME.textMuted, marginBottom: 5 }}>{baslik}</div>
      {children}
    </div>
  );

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: "0 0 6px" }}>Görüşme Oyun Planı</h2>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Adayın hedefini yeniden keşfetmiyorsunuz. Belirsizliği doğruluyor, uygunluğu teyit ediyor ve bilinçli sözleşmeyi kapatıyorsunuz.
      </div>
      {mesaj && <div style={{ ...pKutu(), color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <AdaySecici authFetch={authFetch} secili={secili} onSec={planAc} />
        <div style={{ flex: 1, minWidth: 360 }}>
          {!secili && <div style={pKutu()}><span style={{ color: THEME.textMuted, fontSize: 13 }}>Soldan bir aday seçin.</span></div>}

          {plan && (
            <>
              <div style={pKutu()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 15 }}>{secili.ad_soyad}</div>
                  <span style={{ fontSize: 12, fontWeight: 700,
                    color: plan.paketGosterilebilir ? "#2E7D32" : "#C0392B" }}>
                    {plan.paketGosterilebilir ? "Paket kapısı AÇIK" : "Paket kapısı KAPALI"}
                  </span>
                </div>
                <B baslik="GÖRÜŞME AÇILIŞI">
                  <div style={{ fontSize: 13.5, color: THEME.textLight, lineHeight: 1.6 }}>{plan.acilis}</div>
                </B>
                <B baslik="SONRAKİ EN İYİ AKSİYON">
                  <div style={{ fontSize: 13, color: "#C9A227" }}>{plan.sonrakiEnIyiAksiyon}</div>
                </B>
                <B baslik="ANALİZ GÜVENİ">
                  <div style={{ fontSize: 12.5, color: THEME.textLight }}>
                    {plan.analizGuveni} — <span style={{ color: THEME.textMuted }}>{plan.analizGuvenNedeni}</span>
                  </div>
                </B>
              </div>

              <div style={pKutu()}>
                <B baslik="DOĞRULAMA SORULARI">
                  {(plan.dogrulamaSorulari || []).map((s, i) => (
                    <div key={i} style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${THEME.border}` }}>
                      <div style={{ fontSize: 13, color: THEME.textLight }}>{s.soru}</div>
                      <div style={{ fontSize: 11.5, color: THEME.textMuted }}>
                        {s.gosterge} · {s.seviye}{s.neden?.length ? ` — ${s.neden.join(", ")}` : ""}
                      </div>
                    </div>
                  ))}
                  {!(plan.dogrulamaSorulari || []).length && <span style={{ fontSize: 12.5, color: THEME.textMuted }}>Doğrulanacak boşluk yok.</span>}
                </B>
                <B baslik="AÇIKÇA SÖYLENECEKLER" vurgu>
                  {(plan.acikSoylenecekler || []).map((x, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 3 }}>· {x}</div>
                  ))}
                  {!(plan.acikSoylenecekler || []).length && <span style={{ fontSize: 12.5, color: THEME.textMuted }}>—</span>}
                </B>
                <B baslik="ÖDEME SENARYOLARI">
                  {(plan.odemeSenaryolari || []).map((x, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 3 }}>· {x}</div>
                  ))}
                </B>
                {(plan.kapasiteUyarilari || []).length > 0 && (
                  <B baslik="KAPASİTE UYARILARI" vurgu>
                    {plan.kapasiteUyarilari.map((x, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "#C0392B", marginBottom: 3 }}>· {x}</div>
                    ))}
                  </B>
                )}
              </div>

              <div style={{ ...pKutu(), borderColor: "rgba(192,57,43,.35)" }}>
                <div style={{ fontSize: 11, letterSpacing: ".15em", color: "#C0392B", marginBottom: 6 }}>KAÇINILACAKLAR</div>
                {(plan.kacinilacaklar || []).map((x, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 3 }}>· {x}</div>
                ))}
              </div>

              {/* İtiraz kaydı — serbest metin değil, tema */}
              <div style={pKutu()}>
                <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>İtiraz kaydet</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {Object.entries(ITIRAZ_TEMA_ADI).map(([k, ad]) => (
                    <button key={k} onClick={() => setItiraz({ ...itiraz, tema: k })}
                      style={{ ...pInput(), width: "auto", cursor: "pointer", fontSize: 12,
                        background: itiraz.tema === k ? THEME.cyan : THEME.bg,
                        color: itiraz.tema === k ? THEME.onAccent : THEME.textLight }}>{ad}</button>
                  ))}
                </div>
                <input value={itiraz.detay} onChange={e => setItiraz({ ...itiraz, detay: e.target.value })}
                  placeholder="Detay (opsiyonel)" style={{ ...pInput(), marginBottom: 6 }} />
                <input value={itiraz.cozumYolu} onChange={e => setItiraz({ ...itiraz, cozumYolu: e.target.value, cozuldu: true })}
                  placeholder="Çözüm yolu (yazarsanız çözüldü işaretlenir)" style={{ ...pInput(), marginBottom: 6 }} />
                <button disabled={calisiyor}
                  onClick={() => gonder(`/api/admin/adaylar/${secili.id}/itiraz`, itiraz, "İtiraz kaydedildi.")}
                  style={{ background: THEME.cyan, color: THEME.onAccent, border: "none", borderRadius: 4,
                           padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Kaydet</button>
                {(plan.mevcutItirazlar || []).length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {plan.mevcutItirazlar.map((x, i) => (
                      <div key={i} style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 2 }}>
                        · {ITIRAZ_TEMA_ADI[x.tema] || x.tema} {x.cozuldu ? "✓" : "(açık)"} {x.detay ? `— ${x.detay}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Görüşme sonucu */}
              <div style={pKutu()}>
                <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Görüşme sonucu</div>
                <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>
                  "Uygun" ve "uygun değil" dışındaki sonuçlarda takip tarihi ve açık soru zorunludur — görüşme kayıp olarak kapanmaz.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {Object.entries(SONUC_ADI).map(([k, ad]) => (
                    <button key={k} onClick={() => setSonuc({ ...sonuc, sonuc: k })}
                      style={{ ...pInput(), width: "auto", cursor: "pointer", fontSize: 12,
                        background: sonuc.sonuc === k ? THEME.cyan : THEME.bg,
                        color: sonuc.sonuc === k ? THEME.onAccent : THEME.textLight }}>{ad}</button>
                  ))}
                </div>
                <input value={sonuc.acikSoru} onChange={e => setSonuc({ ...sonuc, acikSoru: e.target.value })}
                  placeholder="Açık sorular (virgülle ayırın)" style={{ ...pInput(), marginBottom: 6 }} />
                <input type="date" value={sonuc.takipTarihi} onChange={e => setSonuc({ ...sonuc, takipTarihi: e.target.value })}
                  style={{ ...pInput(), marginBottom: 6 }} />
                <button disabled={calisiyor}
                  onClick={() => gonder(`/api/admin/adaylar/${secili.id}/gorusme-sonuc`,
                    { ...sonuc, acikSorular: sonuc.acikSoru.split(",").map(s => s.trim()).filter(Boolean) },
                    "Görüşme sonucu kaydedildi.")}
                  style={{ background: THEME.cyan, color: THEME.onAccent, border: "none", borderRadius: 4,
                           padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sonucu kaydet</button>
              </div>

              {/* Override */}
              <div style={pKutu()}>
                <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Sistem önerisini değiştir</div>
                <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>
                  Değiştirebilirsiniz — ancak gerekçe zorunludur ve denetim kaydına yazılır.
                </div>
                <input value={ovr.alan} onChange={e => setOvr({ ...ovr, alan: e.target.value })}
                  placeholder="Alan (ör. paket_onerisi)" style={{ ...pInput(), marginBottom: 6 }} />
                <input value={ovr.danismanKarari} onChange={e => setOvr({ ...ovr, danismanKarari: e.target.value })}
                  placeholder="Danışman kararı" style={{ ...pInput(), marginBottom: 6 }} />
                <textarea value={ovr.gerekce} onChange={e => setOvr({ ...ovr, gerekce: e.target.value })} rows={2}
                  placeholder="Gerekçe (en az 10 karakter)" style={{ ...pInput(), resize: "vertical", marginBottom: 6 }} />
                <button disabled={calisiyor}
                  onClick={() => gonder(`/api/admin/adaylar/${secili.id}/override`, ovr, "Override kaydedildi.")}
                  style={{ background: "transparent", color: "#C9A227", border: "1px solid #C9A227", borderRadius: 4,
                           padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Değişikliği kaydet</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Bölüm 13-14 — TEKLİF MERKEZİ ============
function TeklifMerkezi({ authFetch }) {
  const [secili, setSecili] = useState(null);
  const [katalog, setKatalog] = useState([]);
  const [form, setForm] = useState({ hizmetler: [], araToplam: "", odemePlani: "pesin", hedefOzeti: "", cozumGerekcesi: "", gecerlilikTarihi: "" });
  const [sonuc, setSonuc] = useState(null);
  const [mesaj, setMesaj] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  useEffect(() => {
    (async () => { try { const r = await authFetch("/api/admin/vaat-katalogu");
      setKatalog((await r.json()).katalog || []); } catch {} })();
  }, []);

  const olustur = async () => {
    if (calisiyor || !secili) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch("/api/admin/teklif", { method: "POST",
        body: JSON.stringify({ adayId: secili.id, ...form, araToplam: Number(form.araToplam || 0) }) });
      const v = await r.json();
      if (v.ok) { setSonuc(v); setMesaj((v.uyarilar || []).join(" ") || "Teklif oluşturuldu (taslak)."); }
      else setMesaj(v.error + (v.eksik ? ` (${v.eksik.join(", ")})` : ""));
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const kdv = 20;
  const toplam = form.araToplam ? Math.round(Number(form.araToplam) * (1 + kdv / 100) * 100) / 100 : 0;

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: "0 0 6px" }}>Teklif Merkezi</h2>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Teklif satış PDF'i değil, karar dosyasına bağlı yaşayan plandır. Karar dosyası olmayan adaya teklif üretilemez.
      </div>
      {mesaj && <div style={{ ...pKutu(), color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <AdaySecici authFetch={authFetch} secili={secili} onSec={a => { setSecili(a); setSonuc(null); setMesaj(""); }} />
        <div style={{ flex: 1, minWidth: 340 }}>
          {!secili && <div style={pKutu()}><span style={{ color: THEME.textMuted, fontSize: 13 }}>Soldan bir aday seçin.</span></div>}
          {secili && (
            <div style={pKutu()}>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{secili.ad_soyad} için teklif</div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>HİZMETLER (yalnız katalogdakiler)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {katalog.map(k => {
                  const sec = form.hizmetler.includes(k.hizmet);
                  return (
                    <button key={k.hizmet} onClick={() => setForm({ ...form,
                      hizmetler: sec ? form.hizmetler.filter(h => h !== k.hizmet) : [...form.hizmetler, k.hizmet] })}
                      style={{ ...pInput(), width: "auto", cursor: "pointer", fontSize: 12,
                        background: sec ? THEME.cyan : THEME.bg, color: sec ? THEME.onAccent : THEME.textLight }}>
                      {k.vaat_adi}
                    </button>
                  );
                })}
              </div>
              <textarea value={form.hedefOzeti} onChange={e => setForm({ ...form, hedefOzeti: e.target.value })} rows={2}
                placeholder="Kişisel hedef özeti" style={{ ...pInput(), resize: "vertical", marginBottom: 6 }} />
              <textarea value={form.cozumGerekcesi} onChange={e => setForm({ ...form, cozumGerekcesi: e.target.value })} rows={2}
                placeholder="Önerilen çözüm ve NEDEN — 'neden şimdi' dahil" style={{ ...pInput(), resize: "vertical", marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={form.araToplam} onChange={e => setForm({ ...form, araToplam: e.target.value })}
                  placeholder="Ara toplam (₺)" inputMode="decimal" style={{ ...pInput(), width: 160 }} />
                <select value={form.odemePlani} onChange={e => setForm({ ...form, odemePlani: e.target.value })} style={{ ...pInput(), width: 170 }}>
                  <option value="pesin">Peşin</option><option value="taksit_3">3 taksit</option>
                  <option value="taksit_6">6 taksit</option><option value="asamali">Aşamalı</option>
                </select>
                <input type="date" value={form.gecerlilikTarihi} onChange={e => setForm({ ...form, gecerlilikTarihi: e.target.value })}
                  style={{ ...pInput(), width: 160 }} />
              </div>
              <div style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 10 }}>
                KDV %{kdv} dahil toplam: <b>{toplam} ₺</b>
                <span style={{ color: THEME.textMuted }}> — adaya gizli maliyet gösterilmez, toplam yük budur.</span>
              </div>
              <button disabled={calisiyor || !form.hizmetler.length} onClick={olustur}
                style={{ background: THEME.cyan, color: THEME.onAccent, border: "none", borderRadius: 4,
                         padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Teklif oluştur (taslak)</button>

              {sonuc?.teklif && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${THEME.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 12.5, color: THEME.textLight }}>
                    Teklif #{sonuc.teklif.id} · sürüm {sonuc.teklif.surum} · toplam {sonuc.teklif.toplam} ₺
                  </div>
                  <button disabled={calisiyor} onClick={async () => {
                    const r = await authFetch(`/api/admin/teklif/${sonuc.teklif.id}/gonder`, { method: "POST", body: "{}" });
                    const v = await r.json();
                    setMesaj(v.ok ? "Teklif adaya gönderildi." : (v.error || "Gönderilemedi."));
                  }} style={{ ...pInput(), width: "auto", cursor: "pointer", marginTop: 8 }}>Adaya gönder</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ VAAT YÖNETİMİ (6 Ağu 2026, kullanıcı talebi — "2001 hissi
// veriyor, 2026'ya geçir") ============
// Önceden İKİ AYRI menü vardı: Vaat Kataloğu (statik referans — hangi
// hizmetin kapsamı/SLA'sı ne) ve Vaat Teslimat Merkezi (dinamik — satılan
// vaatlerin operasyonel görev/risk takibi). Artık TEK ekran: üstte
// operasyonel SLA riski (ana odak), altta tüm vaat kataloğu referans
// olarak — ihtiyaç oldukça açılıyor. Backend uçları DEĞİŞMEDİ.
function VaatYonetimi({ authFetch }) {
  const [sla, setSla] = useState(null);
  const [katalog, setKatalog] = useState([]);
  const [mesaj, setMesaj] = useState("");
  const [kanit, setKanit] = useState({});
  const [acikVaat, setAcikVaat] = useState(null);
  const [katalogAcik, setKatalogAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);

  const yukle = async () => {
    try {
      const [r1, r2] = await Promise.all([authFetch("/api/admin/sla-riski"), authFetch("/api/admin/vaat-katalogu")]);
      setSla(await r1.json());
      setKatalog((await r2.json()).katalog || []);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const gorevGuncelle = async (id, durum) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/gorev/${id}`, { method: "POST", body: JSON.stringify({ durum, kanitNotu: kanit[id] || undefined }) });
      const v = await r.json();
      setMesaj(v.ok ? "Görev güncellendi." : (v.error || "Güncellenemedi."));
      if (v.ok) yukle();
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const kart = { background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 16 };
  const inputStyle = { background: THEME.panelBgAlt, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: FONT, boxSizing: "border-box" };
  const btn = (dolu, renk) => ({ padding: "8px 15px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: dolu ? "none" : `1px solid ${THEME.border}`, background: dolu ? (renk || THEME.cyan) : THEME.panelBg, color: dolu ? "#fff" : THEME.textLight });

  const Satir = ({ etiket, deger, vurgu }) => deger ? (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".06em", color: vurgu ? THEME.danger : THEME.textFaint, fontWeight: 600, textTransform: "uppercase" }}>{etiket}</div>
      <div style={{ fontSize: 12.5, color: THEME.textLight, lineHeight: 1.5 }}>{Array.isArray(deger) ? deger.join(", ") : deger}</div>
    </div>
  ) : null;

  const riskliSayi = (sla?.riskli || []).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <div>
          <h2 style={{ color: THEME.textLight, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: 0 }}>Vaat Yönetimi</h2>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 2 }}>Satılan vaat otomatik operasyona dönüşür. Kalite kapıları kanıtsız geçilemez, bağımlı görev sırası atlanamaz.</div>
        </div>
        <button onClick={yukle} style={btn(false)}>Yenile</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, margin: "18px 0" }}>
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "14px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: riskliSayi ? THEME.danger : THEME.success }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: THEME.textLight }}>{riskliSayi}</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>Riskli / geciken görev</div>
        </div>
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "14px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: THEME.altinAcik }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 600, color: THEME.textLight }}>{katalog.length}</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>Tanımlı vaat</div>
        </div>
      </div>

      {mesaj && <div style={{ ...kart, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      {/* Operasyonel SLA riski — ana odak */}
      <div style={kart}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.textLight, marginBottom: 4 }}>SLA Riski</div>
        <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 12 }}>{sla?.not}</div>
        {!riskliSayi && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Riskli görev yok.</div>}
        {(sla?.riskli || []).map(g => (
          <div key={g.id} style={{ padding: "12px 4px", borderTop: `1px solid ${THEME.divider}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>
                  {g.gorev}{" "}
                  <span onClick={() => setAcikVaat(acikVaat === g.vaat_adi ? null : g.vaat_adi)}
                        style={{ color: THEME.cyan, fontWeight: 400, fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>· {g.vaat_adi}</span>
                </div>
                <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>
                  {g.ad_soyad} · {g.tarafi === "yazar" ? "YAZAR görevi" : g.ekip || "MST"}
                  {g.sorumlu ? ` · ${g.sorumlu}` : " · sorumlu atanmamış"} · plan {g.planlanan_bitis}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: g.seviye === "gecikti" ? THEME.danger : THEME.warn }}>
                {g.seviye === "gecikti" ? `${g.gecikme_gun} gün gecikti` : "yaklaşıyor"}
              </span>
            </div>
            {g.seviye === "gecikti" && g.gecikme_eskalasyonu && (
              <div style={{ fontSize: 11.5, color: THEME.danger, marginTop: 4 }}>Eskalasyon: {g.gecikme_eskalasyonu}</div>
            )}
            {/* Görevin bağlı olduğu vaadin katalog bilgisi — tıklanınca açılır */}
            {acikVaat === g.vaat_adi && (() => {
              const v = katalog.find(k => k.vaat_adi === g.vaat_adi);
              if (!v) return <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 6 }}>Katalog bilgisi bulunamadı.</div>;
              return (
                <div style={{ marginTop: 8, padding: 12, background: THEME.panelBgAlt, borderRadius: 8, border: `1px solid ${THEME.divider}` }}>
                  <Satir etiket="Kapsam" deger={v.kapsam} />
                  <Satir etiket="KAPSAM DIŞI — SATIŞTA VAAT EDİLEMEZ" deger={v.kapsam_disi} vurgu />
                  <Satir etiket="SLA" deger={v.sla_gun != null ? `${v.sla_gun} gün` : null} />
                  <Satir etiket="TESLİM KANITI" deger={v.teslim_kaniti} />
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input value={kanit[g.id] || ""} onChange={e => setKanit({ ...kanit, [g.id]: e.target.value })}
                placeholder="Teslim kanıtı (kalite kapısı için zorunlu)" style={{ ...inputStyle, width: 280 }} />
              <button disabled={calisiyor} onClick={() => gorevGuncelle(g.id, "basladi")} style={btn(false)}>Başladı</button>
              <button disabled={calisiyor} onClick={() => gorevGuncelle(g.id, "tamamlandi")} style={btn(true, THEME.success)}>Tamamlandı</button>
            </div>
          </div>
        ))}
      </div>

      {/* Vaat Kataloğu — referans, ihtiyaç oldukça açılır */}
      <div style={kart}>
        <div onClick={() => setKatalogAcik(!katalogAcik)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.textLight }}>Vaat Kataloğu — tüm hizmetler ({katalog.length})</div>
          <span style={{ color: THEME.textMuted, fontSize: 12 }}>{katalogAcik ? "▲ gizle" : "▼ göster"}</span>
        </div>
        {katalogAcik && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>
              Katalogda tanımlı olmayan hizmet satılamaz. Satışta ne söylenebileceği ile operasyonun ne teslim edeceği burada aynı yerde durur.
            </div>
            {katalog.map(k => (
              <div key={k.id} style={{ border: `1px solid ${THEME.divider}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                     onClick={() => setAcikVaat(acikVaat === `k${k.id}` ? null : `k${k.id}`)}>
                  <div>
                    <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13.5 }}>{k.vaat_adi}</div>
                    <div style={{ color: THEME.textMuted, fontSize: 11 }}>{k.hizmet} · SLA {k.sla_gun ?? "—"} gün</div>
                  </div>
                  <span style={{ color: THEME.textMuted }}>{acikVaat === `k${k.id}` ? "▾" : "▸"}</span>
                </div>
                {acikVaat === `k${k.id}` && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${THEME.divider}`, paddingTop: 10 }}>
                    <Satir etiket="Kapsam" deger={k.kapsam} />
                    <Satir etiket="KAPSAM DIŞI — SATIŞTA VAAT EDİLEMEZ" deger={k.kapsam_disi} vurgu />
                    <Satir etiket="Başlangıç koşulu" deger={k.baslangic_kosulu} />
                    <Satir etiket="Sorumlu ekip" deger={k.sorumlu_ekip} />
                    <Satir etiket="Kabul kriteri" deger={k.kabul_kriteri} />
                    <Satir etiket="TESLİM KANITI" deger={k.teslim_kaniti} />
                    <Satir etiket="GECİKME ESKALASYONU" deger={k.gecikme_eskalasyonu} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ============ Laboratuvar uzman kuyruğu ============
function LaboratuvarKuyrugu({ authFetch }) {
  const [bekleyen, setBekleyen] = useState([]);
  const [notlar, setNotlar] = useState({});
  const [mesaj, setMesaj] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  const yukle = async () => {
    try { const r = await authFetch("/api/admin/laboratuvar-kuyrugu"); setBekleyen((await r.json()).bekleyen || []); }
    catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const karar = async (id, onay) => {
    if (calisiyor) return; setCalisiyor(true);
    try {
      const r = await authFetch(`/api/admin/laboratuvar-cikti/${id}/uzman`, { method: "POST",
        body: JSON.stringify({ onay, not: notlar[id] || "" }) });
      const v = await r.json();
      setMesaj(v.ok ? (onay ? "Onaylandı — portfolyoya eklendi." : "Reddedildi.") : (v.error || "Kaydedilemedi."));
      if (v.ok) yukle();
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Laboratuvar Kuyruğu</h2>
        <button onClick={yukle} style={{ ...pInput(), width: "auto", cursor: "pointer" }}>Yenile</button>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Uzman kapılı laboratuvar çıktıları onaysız portfolyoya girmez. Aday çıktısını değiştirirse onay sıfırlanır.
      </div>
      {mesaj && <div style={{ ...pKutu(), color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}
      <div style={pKutu()}>
        {!bekleyen.length && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Bekleyen çıktı yok.</div>}
        {bekleyen.map(b => (
          <div key={b.id} style={{ padding: "10px 6px", borderTop: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.textLight, fontSize: 13, fontWeight: 600 }}>
              {b.ad_soyad} · {b.lab_adi}
              <span style={{ color: THEME.textMuted, fontWeight: 400, fontSize: 11.5 }}> → {b.uretilen_kanit}</span>
            </div>
            <div style={{ fontSize: 12.5, color: THEME.textMuted, margin: "6px 0", whiteSpace: "pre-wrap",
                          maxHeight: 160, overflowY: "auto", padding: 8, background: THEME.bg, borderRadius: 4 }}>
              {b.cikti}
            </div>
            <input value={notlar[b.id] || ""} onChange={e => setNotlar({ ...notlar, [b.id]: e.target.value })}
              placeholder="Uzman notu" style={{ ...pInput(), marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={calisiyor} onClick={() => karar(b.id, true)}
                style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 4,
                         padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Onayla</button>
              <button disabled={calisiyor} onClick={() => karar(b.id, false)}
                style={{ background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: 4,
                         padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Reddet</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Bölüm 9 — AKADEMİ UZMAN KAPISI ============
// EKLENDİ (6 Ağu 2026, kullanıcı talebi — "AI'larına direktif
// gönderebileceğimiz bir panelimiz olmalı"): AI Menajer'in temel davranış
// talimatı (anayasa) artık burada, koddan bağımsız olarak düzenlenebilir.
// Değişiklik en geç 60 saniye içinde canlıya yansır (backend önbelleği).
function MenajerDirektifleri({ authFetch }) {
  const [direktif, setDirektif] = useState("");
  const [orijinal, setOrijinal] = useState("");
  const [varsayilanMi, setVarsayilanMi] = useState(true);
  const [guncelleyen, setGuncelleyen] = useState(null);
  const [guncellemeTarihi, setGuncellemeTarihi] = useState(null);
  const [mesaj, setMesaj] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = async () => {
    setYukleniyor(true);
    try {
      const r = await authFetch("/api/admin/menajer-direktif");
      const d = await r.json();
      setDirektif(d.direktif || ""); setOrijinal(d.direktif || "");
      setVarsayilanMi(!!d.varsayilanMi); setGuncelleyen(d.guncelleyen); setGuncellemeTarihi(d.guncellemeTarihi);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setYukleniyor(false); }
  };
  useEffect(() => { yukle(); }, []);

  const kaydet = async () => {
    if (calisiyor || direktif.trim() === orijinal.trim()) return;
    setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch("/api/admin/menajer-direktif", { method: "POST", body: JSON.stringify({ direktif }) });
      const d = await r.json();
      if (d.ok) { setMesaj("Kaydedildi — en geç 60 saniye içinde canlıya yansır."); yukle(); }
      else setMesaj(d.error || "Kaydedilemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const fabrikaAyarinaDon = async () => {
    try {
      const r = await authFetch("/api/admin/menajer-direktif/varsayilan");
      const d = await r.json();
      setDirektif(d.direktif || "");
      setMesaj("Fabrika ayarı metne yüklendi — kaydetmeyi unutmayın.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };

  const kutu = { background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 16 };
  const btn = (dolu) => ({ padding: "9px 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: dolu ? "none" : `1px solid ${THEME.border}`, background: dolu ? THEME.cyan : THEME.panelBg, color: dolu ? "#fff" : THEME.textLight });

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>AI Menajer Direktifleri</h2>
      <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 18 }}>
        AI Menajer'in her yazarla konuşurken uyduğu temel kurallar. Buradaki değişiklik kod değişikliği gerektirmez, deploy beklemez.
      </div>

      {mesaj && <div style={{ ...kutu, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={kutu}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: THEME.textFaint }}>
            {varsayilanMi ? "Fabrika ayarı kullanılıyor (hiç özelleştirilmemiş)"
              : `Son güncelleyen: ${guncelleyen || "bilinmiyor"} · ${guncellemeTarihi ? new Date(guncellemeTarihi).toLocaleString("tr-TR") : ""}`}
          </span>
          <button onClick={fabrikaAyarinaDon} style={btn(false)}>Fabrika ayarına dön</button>
        </div>
        {yukleniyor ? <div style={{ fontSize: 13, color: THEME.textMuted }}>Yükleniyor…</div> : (
          <textarea value={direktif} onChange={e => setDirektif(e.target.value)} rows={22}
            style={{ width: "100%", background: THEME.panelBgAlt, color: THEME.textLight, border: `1px solid ${THEME.border}`,
                     borderRadius: 8, padding: 14, fontSize: 13, fontFamily: "monospace", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box" }} />
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={kaydet} disabled={calisiyor || direktif.trim() === orijinal.trim()} style={btn(true)}>
            {calisiyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {direktif.trim() !== orijinal.trim() && <span style={{ fontSize: 12, color: THEME.warn, alignSelf: "center" }}>Kaydedilmemiş değişiklik var</span>}
        </div>
      </div>
    </div>
  );
}

function AkademiUzmanKapisi({ authFetch }) {
  const [bekleyen, setBekleyen] = useState([]);
  const [sozluk, setSozluk] = useState({});
  const [mesaj, setMesaj] = useState("");
  const [notlar, setNotlar] = useState({});
  const [calisiyor, setCalisiyor] = useState(false);
  const kutu = { background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 };
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/akademi-kanitlari");
      const d = await r.json();
      setBekleyen(d.bekleyen || []); setSozluk(d.sinyalSozlugu || {});
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const karar = async (id, onay) => {
    if (calisiyor) return; setCalisiyor(true);
    try {
      const r = await authFetch(`/api/admin/akademi-kanit/${id}/uzman`, {
        method: "POST", body: JSON.stringify({ onay, not: notlar[id] || "" }) });
      const v = await r.json();
      setMesaj(v.ok ? (onay ? "Onaylandı — portfolyoya eklendi." : "Reddedildi.") : (v.error || "Kaydedilemedi."));
      if (v.ok) yukle();
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Akademi Uzman Kapısı</h2>
        <button onClick={yukle} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Yenile</button>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Video izleme yeterlilik sayılmaz. Yalnızca <b>uzman onayı</b> doğrulanmış yetkinlik sinyali üretir.
      </div>
      {mesaj && <div style={{ ...kutu, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={kutu}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Sinyal anlamları</div>
        {Object.entries(sozluk).map(([k, v]) => (
          <div key={k} style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 3 }}>
            · <b style={{ color: THEME.textLight }}>{k}</b> — {v.anlam}
            <span style={{ color: v.kanitDegeri === "yuksek" ? "#2E7D32" : v.kanitDegeri === "yok" ? "#C0392B" : "#C9A227" }}>
              {" "}(kanıt değeri: {v.kanitDegeri})
            </span>
          </div>
        ))}
      </div>

      <div style={kutu}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          Onay bekleyen görev çıktıları ({bekleyen.length})
        </div>
        {!bekleyen.length && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Bekleyen görev yok.</div>}
        {bekleyen.map(b => (
          <div key={b.id} style={{ padding: "10px 6px", borderTop: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.textLight, fontSize: 13, fontWeight: 600 }}>
              {b.ad_soyad} · Modül {b.modul_no}
            </div>
            <div style={{ fontSize: 12.5, color: THEME.textMuted, margin: "6px 0", whiteSpace: "pre-wrap",
                          maxHeight: 140, overflowY: "auto", padding: 8, background: THEME.bg, borderRadius: 4 }}>
              {b.cikti || "(çıktı boş)"}
            </div>
            <input value={notlar[b.id] || ""} onChange={e => setNotlar({ ...notlar, [b.id]: e.target.value })}
              placeholder="Uzman notu" style={{ ...inputStyle, marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={calisiyor} onClick={() => karar(b.id, true)}
                style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Onayla</button>
              <button disabled={calisiyor} onClick={() => karar(b.id, false)}
                style={{ background: "transparent", color: "#C0392B", border: "1px solid #C0392B", borderRadius: 4, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Reddet</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Bölüm 11 — REKLAM LTV ZİNCİRİ ============
function ReklamLtv({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [mesaj, setMesaj] = useState("");
  const kutu = { background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 };
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  const yukle = async () => {
    try { const r = await authFetch("/api/admin/reklam-ltv"); setVeri(await r.json()); }
    catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const para = v => v == null ? "—" : `${v} ₺`;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Reklam LTV Zinciri</h2>
        <button onClick={yukle} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Yenile</button>
      </div>
      {mesaj && <div style={{ ...kutu, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}
      {veri && (
        <>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>{veri.not}</div>

          <div style={kutu}>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Kampanya → sözleşme → ifa → memnuniyet
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11.5, color: THEME.textLight, borderCollapse: "collapse" }}>
                <thead><tr style={{ color: THEME.textMuted, textAlign: "left" }}>
                  <th style={{ padding: 5 }}>Kampanya</th><th>Lead</th><th>Güvenilir değ.</th><th>Nitelikli</th>
                  <th>Görüşme</th><th>Sözleşme</th><th>Zamanında ifa</th><th>Yeniden yatırım</th>
                  <th>Şikâyet</th><th>Sağlıklı sözl. maliyeti</th><th>Yazar LTV</th>
                </tr></thead>
                <tbody>
                  {(veri.kampanyalar || []).map((k, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${THEME.border}` }}>
                      <td style={{ padding: 5, fontWeight: 600 }}>{k.kampanya}</td>
                      <td>{k.lead}</td><td>{k.guvenilir_degerlendirme}</td><td>{k.nitelikli}</td>
                      <td>{k.gorusme}</td><td>{k.sozlesme}</td>
                      <td>{k.zamaninda_ifa}/{k.ifa_adet}</td>
                      <td style={{ color: "#2E7D32" }}>{k.yeniden_yatirim}</td>
                      <td style={{ color: k.sikayet > 0 ? "#C0392B" : THEME.textMuted }}>{k.sikayet}</td>
                      <td style={{ fontWeight: 700 }}>{para(k.saglikli_sozlesme_maliyeti)}</td>
                      <td>{para(k.yazar_ltv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={kutu}>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Guardrail'ler</div>
            {(veri.kampanyalar || []).map((k, i) => (
              <div key={i} style={{ padding: "7px 4px", borderTop: i ? `1px solid ${THEME.border}` : "none", fontSize: 12 }}>
                <b style={{ color: THEME.textLight }}>{k.kampanya}</b>
                <span style={{ color: THEME.textMuted }}>
                  {" "}· iptal %{k.guardrail?.iptal_orani ?? "—"}
                  {" "}· şikâyet %{k.guardrail?.sikayet_orani ?? "—"}
                  {" "}· zamanında ifa %{k.guardrail?.zamaninda_ifa_orani ?? "—"}
                </span>
                {k.guardrail?.yanlis_beklenti_riski && (
                  <span style={{ color: "#C0392B", fontWeight: 700 }}> · YANLIŞ BEKLENTİ RİSKİ</span>
                )}
                {k.not && <div style={{ color: THEME.textMuted, fontSize: 11.5 }}>{k.not}</div>}
              </div>
            ))}
          </div>

          <div style={{ ...kutu, borderColor: "rgba(192,57,43,.35)" }}>
            <div style={{ fontSize: 11, letterSpacing: ".15em", color: "#C0392B", marginBottom: 6 }}>
              YASAK OTOMASYONLAR
            </div>
            {(veri.yasakOtomasyonlar || []).map((y, i) => (
              <div key={i} style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 3 }}>· {y}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Bölüm 8 — DANIŞMAN KOKPİTİ ============
// Karar dosyasını gerekçe kodlarıyla birlikte gösterir. Hiçbir gösterge
// tek rozet altında birleştirilmez; "hazırlık", "ticari", "kaynak kalite"
// ve "riskler" AYRI okunur.
const SEVIYE_RENK = {
  yuksek: "#2E7D32", hazir: "#2E7D32", uygun: "#2E7D32", uyumlu: "#2E7D32",
  orta: "#C9A227", gelisiyor: "#C9A227", planlama: "#C9A227", kismi: "#C9A227",
  dusuk: "#C0392B", erken: "#C0392B", kapasite_yok: "#C0392B", uyumsuz: "#C0392B",
  bilinmiyor: "#7A7A7A", belirsiz: "#7A7A7A",
};
const GOSTERGE_ADI = {
  yanit_guvenilirligi: "Yanıt güvenilirliği",
  hedef_netligi: "Hedef netliği",
  eser_hazirligi: "Eser hazırlığı",
  finansal_uyum: "Finansal uyum",
  beklenti_riski: "Beklenti / memnuniyetsizlik riski",
  teslimat_uygunlugu: "Teslimat uygunluğu",
};

// TAŞINDI (5 Ağu 2026, kullanıcı talebi — "aday ile danışman arasında
// köprü"): JBlok, önceden yalnızca DanismanKokpiti'nin İÇİNDE tanımlıydı.
// Karar Dosyası'nı (bilinen/tahmin/bilinmeyen ayrımı) artık YazarAdaylari
// ekranında da göstermemiz gerektiği için modül seviyesine taşındı — iki
// ekran da aynı bileşeni kullanıyor, kod tekrarı yok.
function JBlok({ baslik, veri, bos }) {
  let dizi = veri;
  if (typeof dizi === "string") { try { dizi = JSON.parse(dizi); } catch { dizi = []; } }
  dizi = Array.isArray(dizi) ? dizi : (dizi ? [dizi] : []);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: ".15em", color: THEME.textMuted, marginBottom: 4 }}>{baslik}</div>
      {!dizi.length && <div style={{ fontSize: 12.5, color: THEME.textMuted }}>{bos}</div>}
      {dizi.map((x, i) => (
        <div key={i} style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 3 }}>
          · {x.gosterge ? (GOSTERGE_ADI[x.gosterge] || x.gosterge) : (x.hizmet || x.risk || x.adim || (typeof x === "string" ? x : JSON.stringify(x)))}
          {x.seviye && <span style={{ color: SEVIYE_RENK[x.seviye] || THEME.textMuted }}> — {x.seviye}</span>}
          {x.olasilik != null && <span style={{ color: THEME.textMuted }}> (olasılık {x.olasilik})</span>}
          {(x.dayanak || x.neden || x.gerekce) && (
            <span style={{ color: THEME.textMuted }}> — {[].concat(x.dayanak || x.neden || x.gerekce).join(", ")}</span>
          )}
          {x.aciklama && <span style={{ color: THEME.textMuted }}> — {x.aciklama}</span>}
        </div>
      ))}
    </div>
  );
}
// Karar Dosyası'nın hem başlık/kapı durumu hem BİLDİKLERİMİZ/TAHMİN/
// BİLMEDİKLERİMİZ/RİSKLER bloklarını basan, iki ekranın da (YazarAdaylari
// ve DanismanKokpiti) paylaştığı gövde.
// KOMUTA MERKEZİ (5 Ağu 2026, onaylanan konsept) — Karar Dosyası'nın
// görsel dili baştan tasarlandı: üstte büyük KPI şeridi (4 kritik rakam
// tek bakışta), altta üç sütunlu Bilinen/Tahmin/Bilinmeyen görünümü, en
// üstte kritik risk varsa kırmızı uyarı bandı. Panelin GERÇEK teması
// (açık/beyaz, THEME sabitleri) korundu — mockup koyu temaydı ama panelin
// geneliyle tutarlı olması için renkler THEME'e uyarlandı, yapı (Komuta
// Merkezi mimarisi) aynen uygulandı. Hiçbir veri/alan kaybedilmedi —
// aşağıdaki bölümler (Göstergeler tam liste, riskler, AI analizi,
// kaçınılacaklar, kanıtlar) hep aynı, yalnız üst kısım yeniden tasarlandı.
function KomutaMerkeziUst({ ad, kd, gostergeler, hazirlikPuani }) {
  const icerikRiski = (gostergeler || []).find(g => g.gosterge === "icerik_riski");
  const bilinenSayi = (kd.bilinen || []).length;
  let ai = kd.ai_analiz_ozeti;
  if (typeof ai === "string") { try { ai = JSON.parse(ai); } catch { ai = null; } }
  const gucluYonSayi = ai?.editoryal?.gucluYonler?.length || 0;
  const riskRenk = icerikRiski ? (SEVIYE_RENK[icerikRiski.seviye] || THEME.textMuted) : THEME.textFaint;

  const kpi = { flex: 1, padding: "16px 18px", textAlign: "center", borderRight: `1px solid ${THEME.border}` };
  const kpiVal = { fontFamily: FONT_MONO, fontSize: 24, fontWeight: 700, marginBottom: 4 };
  const kpiLbl = { fontSize: 10, letterSpacing: ".08em", color: THEME.textFaint };

  return (
    <>
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px",
                      background: THEME.panelBgAlt, borderBottom: `1px solid ${THEME.border}` }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 16 }}>{ad}</div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 2 }}>politika {kd.politika_surumu}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ padding: "5px 13px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                           background: kd.paket_gosterilebilir ? THEME.successBg : THEME.dangerBg,
                           color: kd.paket_gosterilebilir ? THEME.success : THEME.danger }}>
              PAKET KAPISI {kd.paket_gosterilebilir ? "AÇIK" : "KAPALI"}
            </span>
            <span style={{ padding: "5px 13px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                           background: THEME.panelBg, border: `1px solid ${SEVIYE_RENK[kd.analiz_guveni] || THEME.border}`,
                           color: SEVIYE_RENK[kd.analiz_guveni] || THEME.textMuted }}>
              GÜVEN: {(kd.analiz_guveni || "").toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={kpi}><div style={{ ...kpiVal, color: THEME.cyan }}>{hazirlikPuani ?? "—"}</div><div style={kpiLbl}>HAZIRLIK PUANI</div></div>
          <div style={kpi}><div style={{ ...kpiVal, color: riskRenk }}>{icerikRiski ? icerikRiski.seviye.toUpperCase() : "—"}</div><div style={kpiLbl}>İÇERİK RİSKİ</div></div>
          <div style={kpi}><div style={{ ...kpiVal, color: THEME.textLight }}>{bilinenSayi} / {(gostergeler || []).length}</div><div style={kpiLbl}>DOĞRULANMIŞ GÖSTERGE</div></div>
          <div style={{ ...kpi, borderRight: "none" }}><div style={{ ...kpiVal, color: gucluYonSayi ? THEME.success : THEME.textFaint }}>{gucluYonSayi || "—"}</div><div style={kpiLbl}>GÜÇLÜ YÖN (AI)</div></div>
        </div>
      </div>

      {icerikRiski?.seviye === "yuksek" && ai?.riskTaramasi?.kategoriler?.length > 0 && (
        <div style={{ background: THEME.dangerBg, border: `1px solid ${THEME.danger}`, borderLeft: `4px solid ${THEME.danger}`,
                      borderRadius: 6, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".1em", color: THEME.danger, fontWeight: 700, marginBottom: 4 }}>
            ⚠ AI RİSK TARAMASI — YÜKSEK ŞİDDET
          </div>
          <div style={{ fontSize: 12.5, color: THEME.textLight }}>
            {ai.riskTaramasi.kategoriler.filter(k => k.siddet === "yuksek").map(k => ADAY_KATEGORI[k.kategori] || k.kategori).join(", ")}
            {" "}kategorisinde bulgu · Görüşmeden önce editör notunu okuyun.
          </div>
        </div>
      )}

      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: THEME.textFaint, padding: "10px 16px", borderBottom: `1px solid ${THEME.border}` }}>
          KARAR GÖRÜŞ ALANI
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { baslik: "BİLDİKLERİMİZ", veri: kd.bilinen, bos: "Doğrulanmış gösterge yok.", renk: THEME.success },
            { baslik: "TAHMİN ETTİKLERİMİZ", veri: kd.tahmin, bos: "—", renk: THEME.warn },
            { baslik: "BİLMEDİKLERİMİZ", veri: kd.bilinmeyen, bos: "Belirgin boşluk yok.", renk: THEME.textFaint },
          ].map((s, i) => {
            let dizi = s.veri;
            if (typeof dizi === "string") { try { dizi = JSON.parse(dizi); } catch { dizi = []; } }
            dizi = Array.isArray(dizi) ? dizi : (dizi ? [dizi] : []);
            return (
              <div key={s.baslik} style={{ padding: 16, borderRight: i < 2 ? `1px solid ${THEME.border}` : "none" }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", color: s.renk, fontWeight: 700, marginBottom: 10,
                              display: "flex", justifyContent: "space-between" }}>
                  <span>{s.baslik}</span><span>{dizi.length}</span>
                </div>
                {!dizi.length && <div style={{ fontSize: 12, color: THEME.textFaint }}>{s.bos}</div>}
                {dizi.map((x, j) => (
                  <div key={j} style={{ padding: "8px 0", borderTop: j ? `1px solid ${THEME.divider}` : "none", fontSize: 12 }}>
                    <b style={{ color: THEME.textLight, fontWeight: 600 }}>
                      {x.gosterge ? (GOSTERGE_ADI[x.gosterge] || x.gosterge) : (x.hizmet || x.risk || x.adim || (typeof x === "string" ? x : ""))}
                      {x.seviye && <span style={{ color: SEVIYE_RENK[x.seviye] || THEME.textMuted, fontWeight: 400 }}> — {x.seviye}{x.olasilik != null ? ` (${x.olasilik})` : ""}</span>}
                    </b>
                    {(x.dayanak || x.neden || x.gerekce) && (
                      <div style={{ color: THEME.textMuted, fontSize: 10.5, marginTop: 2 }}>
                        {[].concat(x.dayanak || x.neden || x.gerekce).join(", ")}
                      </div>
                    )}
                    {x.aciklama && <div style={{ color: THEME.textMuted, fontSize: 10.5, marginTop: 2 }}>{x.aciklama}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function KararDosyasiGovde({ ad, dosya, kanitDogrula, calisiyor, hazirlikPuani }) {
  const kd = dosya?.kararDosyasi;
  const sozluk = dosya?.gerekceSozlugu || {};
  const kodAcikla = (kodlar) => (kodlar || []).map(k => sozluk[k] || k).join(" · ");
  const kutu = { background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 };
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  if (!kd) {
    return (
      <div style={kutu}>
        <div style={{ color: THEME.textMuted, fontSize: 13 }}>
          Bu aday için henüz karar dosyası üretilmemiş — değerlendirmeyi tamamlamamış olabilir.
        </div>
      </div>
    );
  }

  return (
    <>
      <KomutaMerkeziUst ad={ad} kd={kd} gostergeler={dosya.gostergeler} hazirlikPuani={hazirlikPuani} />

      <div style={kutu}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Göstergeler — tam liste</div>
        {(dosya.gostergeler || []).map((g, i) => (
          <div key={i} style={{ padding: "7px 4px", borderTop: i ? `1px solid ${THEME.border}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: THEME.textLight }}>{GOSTERGE_ADI[g.gosterge] || g.gosterge}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: SEVIYE_RENK[g.seviye] || THEME.textMuted }}>
                {g.seviye}{g.olasilik != null ? ` (${g.olasilik})` : ""}
              </span>
            </div>
            {g.gerekce_kodlari?.length > 0 && (
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>{kodAcikla(g.gerekce_kodlari)}</div>
            )}
          </div>
        ))}
      </div>

      <div style={kutu}>
        <JBlok baslik="RİSKLER VE KAPILAR" veri={kd.riskler} bos="Risk sinyali yok." />
        <JBlok baslik="ERTELENECEK HİZMETLER" veri={kd.ertelenecek_hizmetler} bos="—" />
        <JBlok baslik="GÜVENLİ BAŞLANGIÇ" veri={kd.guvenli_baslangic} bos="—" />
        <JBlok baslik="ALTERNATİF YOL" veri={kd.alternatif_yol} bos="—" />
        <JBlok baslik="GÖRÜŞMEDE DOĞRULANACAK" veri={kd.insan_dogrulamasi_gereken} bos="—" />
      </div>

      {/* EKLENDİ (6 Ağu 2026, kullanıcı kararı — "sorularla boğmadan veri
          gerçekliğini artırmak, ikisinin ortası"): AI'ın en zayıf iki
          göstergenin (hedef netliği, finansal uyum) kaynak sorularından
          sonra ürettiği takip sorusu ve adayın SERBEST cevabı. Bu metin
          HİÇBİR göstergeyi otomatik değiştirmez — yalnızca danışmana ek
          bağlam sunar, "adayın kendi sözleriyle" diye açıkça işaretli. */}
      {dosya?.aiTakipNotlari?.length > 0 && (
        <div style={{ ...kutu, borderColor: "rgba(169,118,47,.3)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".15em", color: THEME.cyan, marginBottom: 10 }}>
            ADAYIN KENDİ SÖZLERİYLE — serbest not, göstergeleri etkilemez
          </div>
          {dosya.aiTakipNotlari.map((n, i) => (
            <div key={i} style={{ marginBottom: i < dosya.aiTakipNotlari.length - 1 ? 12 : 0,
                                   paddingBottom: i < dosya.aiTakipNotlari.length - 1 ? 12 : 0,
                                   borderBottom: i < dosya.aiTakipNotlari.length - 1 ? `1px solid ${THEME.divider}` : "none" }}>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, fontStyle: "italic", marginBottom: 4 }}>{n.ai_sorusu}</div>
              <div style={{ fontSize: 13, color: THEME.textLight }}>"{n.aday_cevabi}"</div>
            </div>
          ))}
        </div>
      )}

      {/* EKLENDİ (5 Ağu 2026, kullanıcı talebi — "yazar aday ekosistemindeki
          bulgulardan elde edilen sonuçlar"): AI'ın eseri okuyup ürettiği
          editöryal analiz ve risk taraması özeti artık burada. Önceden bu
          bilgi Karar Dosyası'na hiç yansımıyordu — danışman görüşmeye AI'ın
          bulgularından habersiz gidiyordu. */}
      {kd.ai_analiz_ozeti && (() => {
        let ai = kd.ai_analiz_ozeti;
        if (typeof ai === "string") { try { ai = JSON.parse(ai); } catch { ai = null; } }
        if (!ai) return null;
        const ed = ai.editoryal;
        const rt = ai.riskTaramasi;
        return (
          <div style={{ ...kutu, borderColor: "rgba(93,163,214,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: ".15em", color: THEME.cyan, marginBottom: 10 }}>
              AI EDİTÖRYAL ANALİZİ VE RİSK TARAMASI ÖZETİ
            </div>
            {ed ? (
              <>
                {ed.ozet && <div style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 8 }}>{ed.ozet}</div>}
                {ed.gucluYonler?.length > 0 && (
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
                    <b style={{ color: THEME.success }}>Güçlü yönler:</b> {ed.gucluYonler.join(" · ")}
                  </div>
                )}
                {ed.gelistirilecek?.length > 0 && (
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
                    <b style={{ color: THEME.warn }}>Geliştirilecek:</b> {ed.gelistirilecek.join(" · ")}
                  </div>
                )}
                {ed.editorSorunlari?.length > 0 && (
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
                    <b style={{ color: THEME.danger }}>Editör sorunları:</b> {ed.editorSorunlari.join(" · ")}
                  </div>
                )}
                {ed.yazimKalitesi && (
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
                    <b>Yazım kalitesi:</b> {({ az: "az hata", orta: "orta düzeyde hata", sik: "sık hata" })[ed.yazimKalitesi.seviye] || ed.yazimKalitesi.seviye}
                    <span style={{ color: THEME.textFaint, fontSize: 10.5 }}> (AI izlenimi)</span>
                  </div>
                )}
                {ed.turBenzerligi && (
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
                    <b>Tarz gözlemi:</b> {ed.turBenzerligi}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 8 }}>
                Editöryal AI analizi henüz üretilmemiş.
              </div>
            )}
            {rt && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${THEME.border}` }}>
                <div style={{ fontSize: 12, color: THEME.textLight, marginBottom: 4 }}>
                  <b>Risk taraması önerisi:</b>{" "}
                  <span style={{ color: rt.oneri === "yayina_uygun_gorunuyor" ? THEME.success : rt.oneri === "duzeltme_gerekli" ? THEME.danger : THEME.warn }}>
                    {rt.oneri === "yayina_uygun_gorunuyor" ? "Yayına uygun görünüyor" : rt.oneri === "duzeltme_gerekli" ? "Düzeltme gerekli" : "Dikkatli inceleme"}
                  </span>
                  <span style={{ color: THEME.textMuted }}> — {rt.ozet?.toplam ?? 0} bulgu ({rt.ozet?.yuksek ?? 0} yüksek · {rt.ozet?.orta ?? 0} orta · {rt.ozet?.dusuk ?? 0} düşük)</span>
                </div>
                {rt.kategoriler?.length > 0 && (
                  <div style={{ fontSize: 11.5, color: THEME.textMuted }}>
                    {rt.kategoriler.map((k, i) => (
                      <span key={i} style={{ marginRight: 10 }}>
                        {ADAY_KATEGORI[k.kategori] || k.kategori} <span style={{ color: ADAY_SIDDET[k.siddet] }}>({k.siddet})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ ...kutu, borderColor: "rgba(192,57,43,.35)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".15em", color: "#C0392B", marginBottom: 6 }}>
          KAÇINILMASI GEREKEN YAKLAŞIM
        </div>
        <div style={{ fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>
          · Satış, görünürlük veya yatırım geri dönüşü konusunda taahhüt vermeyin.<br />
          · Doğrulanmamış göstergeleri kesinmiş gibi anlatmayın.<br />
          · Eser hazırlığı doğrulanmadan reklam veya uluslararası hak kapsamı önermeyin.<br />
          · Fiyatı görüşmenin sonunda sürpriz olarak açmayın.
          {!kd.paket_gosterilebilir && <><br />· <b>Bu adaya paket sunmayın</b> — önce yukarıdaki alanları doğrulayın.</>}
        </div>
      </div>

      {dosya.kanitlar?.length > 0 && (
        <div style={kutu}>
          <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Kanıtlar</div>
          {dosya.kanitlar.map(k => (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                     padding: "7px 4px", borderTop: `1px solid ${THEME.border}` }}>
              <div>
                <div style={{ fontSize: 12.5, color: THEME.textLight }}>{k.tur}</div>
                {k.link && <a href={k.link} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11.5, color: THEME.cyan }}>{k.link.slice(0, 50)}</a>}
                <div style={{ fontSize: 11, color: THEME.textMuted }}>
                  beyan: {JSON.stringify(k.beyan_edilen)} · durum: {k.durum}
                </div>
              </div>
              {kanitDogrula && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button disabled={calisiyor} onClick={() => kanitDogrula(k.id, "dogrulandi")}
                    style={{ ...inputStyle, width: "auto", cursor: "pointer", fontSize: 12, color: "#2E7D32" }}>Doğrula</button>
                  <button disabled={calisiyor} onClick={() => kanitDogrula(k.id, "reddedildi")}
                    style={{ ...inputStyle, width: "auto", cursor: "pointer", fontSize: 12, color: "#C0392B" }}>Reddet</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ============ Model 2 Faz 18.10 — Aday Kazanım Öğrenmeleri ============
// Kampanya kalite sıralaması, huni dönüşümleri, öğrenme defteri. Sistem yalnızca
// önerir; bütçe/kampanya aksiyonları admin onayı olmadan uygulanmaz.
function AdayKazanimOgrenmeleri({ authFetch }) {
  const [kaynaklar, setKaynaklar] = useState([]);
  const [defter, setDefter] = useState([]);
  const [segmentler, setSegmentler] = useState(null);   // Faz 18.9
  const [karar, setKarar] = useState(null);             // Faz 18.8
  const [kalite, setKalite] = useState(null);           // Madde 11 — çok düzeyli kalite
  const [duzey, setDuzey] = useState("kaynak");
  const [outbox, setOutbox] = useState(null);           // Madde 13 — CAPI kuyruk durumu
  const [maliyet, setMaliyet] = useState(null);         // Madde 14 — CPL / sözleşme maliyeti
  const [saklama, setSaklama] = useState(null);         // Madde 6 — saklama süresi
  const [harcamaForm, setHarcamaForm] = useState({ kampanya: "", harcama: "", donemBaslangic: "" });
  const [disaAktarim, setDisaAktarim] = useState(null);
  const [mesaj, setMesaj] = useState("");
  const [defterFormAcik, setDefterFormAcik] = useState(false);
  const [defterForm, setDefterForm] = useState({ hipotez: "", hedefKitle: "", mesajAcisi: "", kreatifTuru: "", guvenSeviyesi: "erken_sinyal", ogrenilenSonuc: "", sonrakiDeneyOnerisi: "" });
  const [calisiyor, setCalisiyor] = useState(false);

  const yukle = async () => {
    try {
      const r1 = await authFetch("/api/admin/aday-kaynak-analizi");
      const d1 = await r1.json();
      setKaynaklar((d1.kaynaklar || []).sort((a, b) => b.kaynak_kalite_puani - a.kaynak_kalite_puani));
      const r2 = await authFetch("/api/admin/ogrenme-defteri");
      const d2 = await r2.json();
      setDefter(d2.kayitlar || []);
      const r3 = await authFetch("/api/admin/yeniden-hedefleme-segmentleri");
      setSegmentler(await r3.json());
      const r4 = await authFetch("/api/admin/deney-karar-destegi");
      setKarar(await r4.json());
      const r5 = await authFetch(`/api/admin/kalite-analizi?duzey=${duzey}`);
      setKalite(await r5.json());
      const r6 = await authFetch("/api/admin/capi-outbox-durum");
      setOutbox(await r6.json());
      const r7 = await authFetch("/api/admin/maliyet-analizi");
      setMaliyet(await r7.json());
      const r8 = await authFetch("/api/admin/saklama-durumu");
      setSaklama(await r8.json());
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, [duzey]);

  const kutu = { background: THEME.cardBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 16, marginBottom: 14 };
  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  const defterKaydet = async () => {
    if (!defterForm.hipotez.trim()) { setMesaj("Hipotez boş olamaz."); return; }
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch("/api/admin/ogrenme-defteri", { method: "POST", body: JSON.stringify(defterForm) });
      const d = await r.json();
      if (d.ok) { setMesaj("Öğrenme defterine kaydedildi."); setDefterFormAcik(false); yukle(); }
      else setMesaj(d.error || "Kaydedilemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const renkleKaliteRengi = (p) => p >= 60 ? "#2E7D32" : p >= 30 ? "#C9A227" : "#C0392B";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, margin: 0 }}>Aday Kazanım Öğrenmeleri</h2>
        <button onClick={yukle} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Yenile</button>
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
        Ana ölçüt ucuz lead sayısı değil, nitelikli ve sözleşmeli yazar kazanma maliyetidir. Aşağıdaki sıralama huninin sonuna göredir.
      </div>
      {mesaj && <div style={{ ...kutu, color: THEME.cyan, fontSize: 13 }}>{mesaj}</div>}

      <div style={kutu}>
        <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Kampanya / Kaynak Kalite Sıralaması</div>
        <table style={{ width: "100%", fontSize: 12, color: THEME.textLight, borderCollapse: "collapse" }}>
          <thead><tr style={{ color: THEME.textMuted, textAlign: "left" }}>
            <th style={{ padding: 6 }}>Kaynak</th><th>Kayıt</th><th>Eser yükleyen</th><th>Rapor gören</th><th>Görüşmeye katılan</th><th>Sözleşme</th><th>Kalite Puanı</th>
          </tr></thead>
          <tbody>
            {kaynaklar.map((k, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${THEME.border}` }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{k.kaynak}</td>
                <td>{k.kayit}</td><td>{k.eser_yukleyen}</td><td>{k.rapor_goruntuleyen}</td>
                <td>{k.gorusmeye_katilan}</td><td>{k.sozlesme_yapan}</td>
                <td style={{ color: renkleKaliteRengi(k.kaynak_kalite_puani), fontWeight: 700 }}>{k.kaynak_kalite_puani}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 11, color: THEME.textMuted }}>
          Bütçe artırma, kampanya durdurma veya kreatif değiştirme kararlarını Reklam Merkezi ekranından, senin onayınla uygula — bu tablo yalnızca bilgi amaçlıdır.
        </div>
      </div>

      {/* Madde 11 — Çok düzeyli kalite analizi */}
      {kalite && (
        <div style={kutu}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>Kalite Analizi</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["kaynak","Kaynak"],["kampanya","Kampanya"],["reklam_seti","Reklam Seti"],["kreatif","Kreatif"],["mesaj_acisi","Mesaj Açısı"]].map(([k,ad]) => (
                <button key={k} onClick={() => setDuzey(k)}
                  style={{ ...inputStyle, width: "auto", cursor: "pointer", fontSize: 12,
                    background: duzey === k ? THEME.cyan : THEME.bg,
                    color: duzey === k ? THEME.onAccent : THEME.textLight }}>{ad}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>
            Sıralama sözleşme önceliklidir. Sözleşme verisi olmayan gruplarda görüşme/rapor/eser sinyallerine geri dönülür — form sayısına göre "en iyi" seçilmez.
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11.5, color: THEME.textLight, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: THEME.textMuted, textAlign: "left" }}>
                <th style={{ padding: 5 }}>Grup</th><th>Kayıt</th><th>Doğr.</th><th>Değ.</th><th>Eser</th>
                <th>Rapor</th><th>Akad.</th><th>Görüşme</th><th>Katıldı</th><th>Sözl.</th><th>Nitel.sz</th><th>Puan</th>
              </tr></thead>
              <tbody>
                {(kalite.gruplar || []).map((g, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: 5, fontWeight: 600 }}>{g.grup}</td>
                    <td>{g.kayit}</td><td>{g.dogrulanan}</td><td>{g.degerlendirme_tamamlayan}</td>
                    <td>{g.eser_yukleyen}</td><td>{g.rapor_goruntuleyen}</td><td>{g.akademiye_baslayan}</td>
                    <td>{g.gorusme_talep_eden}</td><td>{g.gorusmeye_katilan}</td><td>{g.sozlesme}</td>
                    <td style={{ color: g.niteliksiz_orani > 20 ? "#C0392B" : THEME.textMuted }}>%{g.niteliksiz_orani}</td>
                    <td style={{ fontWeight: 700, color: g.kalite_puani >= 60 ? "#2E7D32" : g.kalite_puani >= 30 ? "#C9A227" : "#C0392B" }}>
                      {g.kalite_puani}
                      <span style={{ fontSize: 9, color: THEME.textMuted, marginLeft: 3 }}>
                        {g.puan_temeli === "sozlesme_oncelikli" ? "S" : "~"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10.5, color: THEME.textMuted, marginTop: 6 }}>
            S = sözleşme verisiyle hesaplandı · ~ = yeterli sözleşme yok, geri dönüş sinyalleriyle tahmin
          </div>
        </div>
      )}

      {/* Madde 14 — Maliyet analizi */}
      {maliyet && (
        <div style={kutu}>
          <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Maliyet Analizi</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>{maliyet.not}</div>
          <table style={{ width: "100%", fontSize: 11.5, color: THEME.textLight, borderCollapse: "collapse" }}>
            <thead><tr style={{ color: THEME.textMuted, textAlign: "left" }}>
              <th style={{ padding: 5 }}>Kampanya</th><th>Harcama</th><th>Lead</th><th>CPL</th>
              <th>Nitelikli</th><th>Nit. maliyet</th><th>Sözleşme</th><th>Sözl. maliyet</th>
            </tr></thead>
            <tbody>
              {(maliyet.kampanyalar || []).map((k, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: 5, fontWeight: 600 }}>{k.kampanya}</td>
                  <td>{k.harcama != null ? `${k.harcama} ₺` : "—"}</td>
                  <td>{k.lead}</td><td>{k.cpl != null ? `${k.cpl} ₺` : "—"}</td>
                  <td>{k.nitelikli}</td><td>{k.nitelikli_aday_maliyeti != null ? `${k.nitelikli_aday_maliyeti} ₺` : "—"}</td>
                  <td>{k.sozlesme}</td>
                  <td style={{ fontWeight: 700, color: k.sozlesme_maliyeti != null ? "#2E7D32" : THEME.textMuted }}>
                    {k.sozlesme_maliyeti != null ? `${k.sozlesme_maliyeti} ₺` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={harcamaForm.kampanya} onChange={e => setHarcamaForm({ ...harcamaForm, kampanya: e.target.value })}
              placeholder="Kampanya adı" style={{ ...inputStyle, width: 200 }} />
            <input value={harcamaForm.harcama} onChange={e => setHarcamaForm({ ...harcamaForm, harcama: e.target.value })}
              placeholder="Harcama (₺)" inputMode="decimal" style={{ ...inputStyle, width: 130 }} />
            <input type="date" value={harcamaForm.donemBaslangic}
              onChange={e => setHarcamaForm({ ...harcamaForm, donemBaslangic: e.target.value })} style={{ ...inputStyle, width: 160 }} />
            <button onClick={async () => {
              if (!harcamaForm.kampanya || !harcamaForm.harcama) { setMesaj("Kampanya ve harcama zorunlu."); return; }
              try {
                const r = await authFetch("/api/admin/kampanya-harcama", { method: "POST",
                  body: JSON.stringify({ ...harcamaForm, harcama: Number(harcamaForm.harcama) }) });
                const v = await r.json();
                setMesaj(v.ok ? "Harcama kaydedildi." : (v.error || "Kaydedilemedi."));
                if (v.ok) { setHarcamaForm({ kampanya: "", harcama: "", donemBaslangic: "" }); yukle(); }
              } catch { setMesaj("Sunucuya ulaşılamadı."); }
            }} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Harcama Kaydet</button>
          </div>
        </div>
      )}

      {/* Madde 6 — Saklama süresi durumu */}
      {saklama && (
        <div style={kutu}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>Eser Metni Saklama Durumu</div>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3 }}>
                Saklama süresi: {saklama.saklama_gun} gün · Metni duran: {saklama.metni_duran} ·
                Silinen: {saklama.metni_silinen} ·
                <span style={{ color: saklama.suresi_dolmus_bekleyen > 0 ? "#C0392B" : THEME.textMuted }}>
                  {" "}Süresi dolmuş bekleyen: {saklama.suresi_dolmus_bekleyen}
                </span>
              </div>
            </div>
            <button onClick={async () => {
              setMesaj("Temizlik çalışıyor...");
              try {
                const r = await authFetch("/api/admin/saklama-temizligi", { method: "POST" });
                const v = await r.json();
                setMesaj(`Temizlik tamam: ${v.sonuc?.silinen ?? 0} eser metni silindi (rapor ve kararlar korundu).`);
                yukle();
              } catch { setMesaj("Sunucuya ulaşılamadı."); }
            }} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Temizliği Çalıştır</button>
          </div>
        </div>
      )}

      {/* Madde 13 — CAPI kuyruk durumu */}
      {outbox && (
        <div style={kutu}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>Meta CAPI Gönderim Kuyruğu</div>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3 }}>
                {(outbox.ozet || []).map(o => `${o.durum}: ${o.adet}`).join(" · ") || "kayıt yok"}
              </div>
            </div>
            <button onClick={async () => {
              setMesaj("Kuyruk işleniyor...");
              try {
                const r = await authFetch("/api/admin/capi-outbox-isle", { method: "POST" });
                const s = await r.json();
                setMesaj(s.ok ? `İşlendi: ${JSON.stringify(s.sonuc)}` : (s.error || "Hata"));
                yukle();
              } catch { setMesaj("Sunucuya ulaşılamadı."); }
            }} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>Kuyruğu İşle</button>
          </div>
        </div>
      )}

      {/* Faz 18.8 — Deney karar desteği */}
      {karar && (
        <div style={kutu}>
          <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Deney Karar Desteği</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>{karar.not}</div>
          {karar.onde && (
            <div style={{ padding: "8px 12px", background: "rgba(46,125,50,.12)", border: "1px solid rgba(46,125,50,.4)", borderRadius: 4, marginBottom: 10, fontSize: 12.5, color: THEME.textLight }}>
              Şu an önde: <b>{karar.onde.kampanya}</b> · nitelikli oran %{karar.onde.nitelikli_oran} · güven: {karar.onde.guven}
            </div>
          )}
          {(karar.kampanyalar || []).map((k, i) => (
            <div key={i} style={{ padding: "8px 6px", borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: THEME.textLight }}>
                <span style={{ fontWeight: 600 }}>{k.kampanya}</span>
                <span style={{ color: k.guven === "yetersiz_veri" ? THEME.textMuted : k.guven === "yuksek" ? "#2E7D32" : "#C9A227" }}>
                  {k.kayit} kayıt · %{k.nitelikli_oran} nitelikli · {k.sozlesme} sözleşme
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3 }}>{k.yorum}</div>
            </div>
          ))}
        </div>
      )}

      {/* Faz 18.9 — Yeniden hedefleme segmentleri */}
      {segmentler && (
        <div style={kutu}>
          <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Yeniden Hedefleme Segmentleri</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>
            Segmentler Meta'ya otomatik gönderilmez. Dışa aktardığında hash'lenmiş liste alırsın, özel kitleye elle yüklersin — bütçe etkisi olan her adım senin onayınla.
          </div>
          {Object.entries(segmentler.ozet || {}).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 6px", borderTop: `1px solid ${THEME.border}` }}>
              <span style={{ fontSize: 12.5, color: THEME.textLight }}>{v.ad}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <b style={{ color: "#C9A227", fontSize: 13 }}>{v.sayi}</b>
                <button disabled={!v.sayi} onClick={async () => {
                  setMesaj("");
                  try {
                    const r = await authFetch(`/api/admin/segment-disa-aktar/${k}`);
                    const d = await r.json();
                    if (d.satirlar) { setDisaAktarim(d); setMesaj(`${d.ad}: ${d.adet} kayıt hazırlandı.`); }
                    else setMesaj(d.error || "Dışa aktarılamadı.");
                  } catch { setMesaj("Sunucuya ulaşılamadı."); }
                }} style={{ ...inputStyle, width: "auto", cursor: v.sayi ? "pointer" : "not-allowed", fontSize: 12, opacity: v.sayi ? 1 : .4 }}>Dışa aktar</button>
              </span>
            </div>
          ))}
          {disaAktarim && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: THEME.textLight, marginBottom: 6 }}>
                {disaAktarim.ad} — {disaAktarim.adet} kayıt (SHA-256 hash, ham numara içermez)
              </div>
              <textarea readOnly rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 11 }}
                value={["ph,em", ...disaAktarim.satirlar.map(s => `${s.ph || ""},${s.em || ""}`)].join("\n")} />
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>Bu içeriği kopyalayıp .csv olarak kaydedin, Meta Etkinlik Yöneticisi'nde özel kitle olarak yükleyin.</div>
            </div>
          )}
        </div>
      )}

      <div style={kutu}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>Öğrenme Defteri</div>
          <button onClick={() => setDefterFormAcik(!defterFormAcik)} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
            {defterFormAcik ? "Kapat" : "Yeni Deney Kaydı"}
          </button>
        </div>
        {defterFormAcik && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            <textarea value={defterForm.hipotez} onChange={e => setDefterForm({ ...defterForm, hipotez: e.target.value })} rows={2} placeholder="Test edilen hipotez (zorunlu)" style={{ ...inputStyle, resize: "vertical" }} />
            <input value={defterForm.hedefKitle} onChange={e => setDefterForm({ ...defterForm, hedefKitle: e.target.value })} placeholder="Hedef kitle" style={inputStyle} />
            <input value={defterForm.mesajAcisi} onChange={e => setDefterForm({ ...defterForm, mesajAcisi: e.target.value })} placeholder="Reklam mesajı / açısı" style={inputStyle} />
            <input value={defterForm.kreatifTuru} onChange={e => setDefterForm({ ...defterForm, kreatifTuru: e.target.value })} placeholder="Kreatif türü" style={inputStyle} />
            <select value={defterForm.guvenSeviyesi} onChange={e => setDefterForm({ ...defterForm, guvenSeviyesi: e.target.value })} style={inputStyle}>
              <option value="erken_sinyal">Erken sinyal (düşük veri)</option>
              <option value="orta">Orta güven</option>
              <option value="yuksek">Yüksek güven</option>
            </select>
            <textarea value={defterForm.ogrenilenSonuc} onChange={e => setDefterForm({ ...defterForm, ogrenilenSonuc: e.target.value })} rows={2} placeholder="Öğrenilen sonuç" style={{ ...inputStyle, resize: "vertical" }} />
            <textarea value={defterForm.sonrakiDeneyOnerisi} onChange={e => setDefterForm({ ...defterForm, sonrakiDeneyOnerisi: e.target.value })} rows={2} placeholder="Sonraki deney önerisi" style={{ ...inputStyle, resize: "vertical" }} />
            <button onClick={defterKaydet} disabled={calisiyor} style={{ background: THEME.cyan, color: THEME.onAccent, border: "none", borderRadius: 4, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "fit-content" }}>Kaydet</button>
          </div>
        )}
        {!defter.length && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Henüz kayıt yok — geçmiş öğrenmeler burada birikir, silinmez.</div>}
        {defter.map(d => (
          <div key={d.id} style={{ padding: "10px 8px", borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ color: THEME.textLight, fontSize: 13, fontWeight: 600 }}>{d.hipotez}</div>
            <div style={{ color: THEME.textMuted, fontSize: 11.5, marginTop: 3 }}>
              {d.hedef_kitle && `${d.hedef_kitle} · `}{d.mesaj_acisi} {d.guven_seviyesi && `· güven: ${d.guven_seviyesi}`}
            </div>
            {d.ogrenilen_sonuc && <div style={{ color: "rgba(201,162,75,.8)", fontSize: 12, marginTop: 4 }}>→ {d.ogrenilen_sonuc}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Demo Hesaplar — yazar adayı satış provası ============
// Satış ekibi aday için kişisel demo oluşturur, bağlantıyı gönderir.
// Adayın hangi adıma kadar geldiği takip edilir — nerede bıraktığı görünür.
const DEMO_DURUM = {
  gonderildi:       { ad: "Gönderildi",   renk: "#7A7A7A" },
  acildi:           { ad: "Açıldı",       renk: "#C9A227" },
  form_dolduruldu:  { ad: "Form doldurdu", renk: "#C0392B" },
  sozlesmeye_gecti: { ad: "Sözleşmeye geçti", renk: "#2E7D32" },
  kaybedildi:       { ad: "Kaybedildi",   renk: "#7A7A7A" },
};
const DEMO_ADIMLAR = ["Karşılama", "Pano", "Yayın süreci", "Telif", "Tanıtım", "Danışman", "Paketler", "Başvuru"];

function VersiyonSkorboard({ authFetch }) {
  const [skorlar, setSkorlar] = React.useState([]);
  const [yukleniyor, setYukleniyor] = React.useState(true);

  React.useEffect(() => {
    authFetch("/api/admin/versiyon-skor")
      .then(r => r.json())
      .then(d => { setSkorlar(d.skorlar || []); setYukleniyor(false); })
      .catch(() => setYukleniyor(false));
  }, []);

  const YAKLASIM_RENK = { A:"rgba(201,162,75,.8)", B:"rgba(80,180,120,.8)", C:"rgba(100,160,220,.8)", D:"rgba(220,100,100,.8)", E:"rgba(180,120,220,.8)" };
  const YAKLASIM_AD = { A:"Prestij", B:"Veri", C:"Merak", D:"Risk", E:"Topluluk" };

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.textLight, marginBottom: 4 }}>Versiyon Test Skorboard</div>
          <div style={{ fontSize: 12, color: THEME.textMuted }}>Hangi karşılama versiyonu daha çok dosya göndertiyor?</div>
        </div>
        <button onClick={() => authFetch("/api/admin/versiyon-skor").then(r=>r.json()).then(d=>setSkorlar(d.skorlar||[]))}
          style={{ padding: "6px 14px", border: `1px solid ${THEME.border}`, background: "none", color: THEME.textMuted, fontSize: 12, cursor: "pointer" }}>
          Yenile
        </button>
      </div>

      {yukleniyor ? (
        <div style={{ textAlign: "center", color: THEME.textMuted, padding: 40 }}>Yükleniyor...</div>
      ) : skorlar.length === 0 ? (
        <div style={{ textAlign: "center", color: THEME.textMuted, padding: 40 }}>
          Henüz veri yok. Sistem çalışmaya başladığında skorlar burada görünecek.
        </div>
      ) : (
        <div>
          {/* Özet kartlar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 24 }}>
            {["A","B","C","D","E"].map(harf => {
              const grp = skorlar.filter(s => s.versiyon_id?.startsWith(harf));
              const topGorulme = grp.reduce((s,r) => s + Number(r.gorulme||0), 0);
              const topDosya = grp.reduce((s,r) => s + Number(r.dosya||0), 0);
              const oran = topGorulme > 0 ? Math.round(100*topDosya/topGorulme) : 0;
              return (
                <div key={harf} style={{ padding: "12px 10px", background: "rgba(245,240,228,.04)", border: `1px solid ${THEME.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: YAKLASIM_RENK[harf] }}>{oran}%</div>
                  <div style={{ fontSize: 9, letterSpacing: ".2em", color: THEME.textMuted, marginTop: 4 }}>{YAKLASIM_AD[harf]}</div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>{topGorulme} kişi</div>
                </div>
              );
            })}
          </div>

          {/* Detay tablo */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                {["Versiyon", "Yaklaşım", "Görüldü", "Tıklandı", "Dosya Gönderdi", "Dosya Oranı", "Sözleşme"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: THEME.textMuted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skorlar.map((s, i) => {
                const harf = s.versiyon_id?.[0] || "A";
                const oran = Number(s.dosya_oran || 0);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: YAKLASIM_RENK[harf] }}>{s.versiyon_id}</td>
                    <td style={{ padding: "8px 10px", color: THEME.textMuted }}>{YAKLASIM_AD[harf] || harf}</td>
                    <td style={{ padding: "8px 10px" }}>{s.gorulme}</td>
                    <td style={{ padding: "8px 10px" }}>{s.tiklama}</td>
                    <td style={{ padding: "8px 10px", color: Number(s.dosya) > 0 ? "#6DBF8A" : THEME.textMuted, fontWeight: Number(s.dosya) > 0 ? 700 : 400 }}>{s.dosya}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "rgba(245,240,228,.1)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, oran*3)}%`, background: oran > 20 ? "#6DBF8A" : oran > 10 ? "#C9A24B" : "rgba(245,240,228,.3)" }} />
                        </div>
                        <span style={{ color: oran > 10 ? "#6DBF8A" : THEME.textMuted }}>%{oran}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", color: Number(s.sozlesme) > 0 ? "rgba(201,162,75,.9)" : THEME.textMuted, fontWeight: Number(s.sozlesme) > 0 ? 700 : 400 }}>{s.sozlesme}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ============ MST Çocuk Stüdyo — Kitap Resim Atölyesi ============
// Bağımsız aracın (kitap-resim-araci.html) admin panele taşınmış hali —
// kendi Neon veritabanında kalıcı, artık her yerden erişilebilir.
// "Gökkuşağı Rafı" teması (kullanıcının 10 varyanttan seçtiği) kullanılıyor
// — beyaz zemin, üstte gökkuşağı şeridi, Fredoka font, panel geneli koyu
// temadan kasıtlı olarak farklı (bu, MST Çocuk Stüdyo'nun kendi kimliği).
function KitapStudyo({ authFetch, token }) {
  const [projeler, setProjeler] = React.useState(null);
  const [hata, setHata] = React.useState("");
  const [yeniAd, setYeniAd] = React.useState("");
  const [olusturuluyor, setOlusturuluyor] = React.useState(false);
  const [seciliId, setSeciliId] = React.useState(null);
  const [seciliProje, setSeciliProje] = React.useState(null);
  // EKLENDİ (14 Ağu 2026, Stil Seçimi aşaması): hangi stil adayının şu an
  // üretiliyor olduğunu (indeks) tutar — birden fazla eşzamanlı üretim
  // isteğini önlemek için.
  const [stilUretiliyorIdx, setStilUretiliyorIdx] = React.useState(null);
  // EKLENDİ (14 Ağu 2026, ② Karakter aşaması): yeni karakter formu ve
  // hangi karakterin görselinin üretiliyor olduğunu tutan state'ler.
  const [yeniKarakterAd, setYeniKarakterAd] = React.useState("");
  const [yeniKarakterAciklama, setYeniKarakterAciklama] = React.useState("");
  const [karakterUretiliyorIdx, setKarakterUretiliyorIdx] = React.useState(null);
  const [kaydediliyor, setKaydediliyor] = React.useState(false);
  // EKLENDİ (14 Ağu 2026, ③ Sahneler aşaması — 1. parça: kitap metni yükleme
  // + otomatik sahne bölme): metin ayrıştırma durumunu ve mammoth (.docx
  // okuyucu) kütüphanesinin yüklenip yüklenmediğini tutar.
  const [sahnelerDolduruluyorMu, setSahnelerDolduruluyorMu] = React.useState(false);
  const [sahnelerDurumMetni, setSahnelerDurumMetni] = React.useState("");
  // EKLENDİ (14 Ağu 2026, ③ Sahneler — 2. parça: künye + kapaklar): künye
  // üretimi anlık (canvas), kapak üretimi OpenAI'ye gidiyor — ayrı "üretiliyor"
  // bayrakları gerekiyor.
  const [kunyeUretiliyorMu, setKunyeUretiliyorMu] = React.useState(false);
  const [onKapakUretiliyorMu, setOnKapakUretiliyorMu] = React.useState(false);
  const [arkaKapakUretiliyorMu, setArkaKapakUretiliyorMu] = React.useState(false);
  // EKLENDİ (14 Ağu 2026, ③ Sahneler — 3-6. parçalar): sayfa çifti üretimi,
  // güvenilirlik katmanı (bekleme/yeniden deneme/maliyet), PDF+önizleme,
  // karakter ek poz için state'ler.
  const [spreadUretiliyorIdx, setSpreadUretiliyorIdx] = React.useState(null);
  const [tumunuUretiliyorMu, setTumunuUretiliyorMu] = React.useState(false);
  const [beklemeSn, setBeklemeSn] = React.useState("4");
  const [toplamMaliyet, setToplamMaliyet] = React.useState(0);
  const [onizlemeAcikMi, setOnizlemeAcikMi] = React.useState(false);
  const [onizlemeIndex, setOnizlemeIndex] = React.useState(0);
  const [pdfHazirlaniyorMu, setPdfHazirlaniyorMu] = React.useState(false);
  const [ekPozTarifleri, setEkPozTarifleri] = React.useState({});
  const [ekPozUretiliyorIdx, setEkPozUretiliyorIdx] = React.useState(null);
  // EKLENDİ (14 Ağu 2026, "projeden çıkınca üretim devam etmeli" — Bedirhan'ın
  // talebi): arka planda üretilen projelerin GÜNCEL verisini React state'inden
  // (seciliProje) BAĞIMSIZ tutan bir ref. Kullanıcı "Tümünü Üret"e bastıktan
  // sonra Proje Panosuna dönüp başka bir projeye girse bile, bu ref'teki kopya
  // üzerinden üretim doğru projeye yazmaya devam eder — seciliProje değişmiş
  // olsa bile karışmaz. Ekranda hâlâ o proje açıksa, her adımda ayrıca
  // setSeciliProje ile ekran da güncellenir.
  const aktifUretimVerisiRef = React.useRef({});
  const [aktifUretimIlerleme, setAktifUretimIlerleme] = React.useState({}); // {[projeId]: "3/10"}

  // hedefId verilmezse (normal, ekrandaki proje üzerinde çalışma) seciliProje
  // döner — mevcut tüm çağrılarla geriye dönük uyumlu. hedefId verilmişse
  // (arka plan üretimi) ref'teki en güncel kopya döner.
  const projeOku = (hedefId) => {
    if (!hedefId || hedefId === seciliId) return aktifUretimVerisiRef.current[hedefId] || seciliProje;
    return aktifUretimVerisiRef.current[hedefId];
  };
  // Projeyi günceller: ref'e yazar, backend'e PUT eder, ekranda hâlâ o proje
  // açıksa state'i de günceller. Tüm üretim fonksiyonları artık setSeciliProje
  // + metaKaydet yerine bunu kullanıyor.
  const projeGuncelle = async (hedefId, guncelMeta) => {
    aktifUretimVerisiRef.current[hedefId] = guncelMeta;
    if (hedefId === seciliId) setSeciliProje(guncelMeta);
    try {
      const r = await authFetch(`/api/admin/kitap-studyo/projeler/${hedefId}`, {
        method: "PUT", body: JSON.stringify({ ...guncelMeta, asama: guncelMeta.asama || "uretim" }),
      });
      const d = await r.json();
      if (!d.ok && hedefId === seciliId) setHata(d.error || "Kaydedilemedi.");
      return d.ok;
    } catch { if (hedefId === seciliId) setHata("Sunucuya ulaşılamadı."); return false; }
  };

  const stil = {
    sayfa: { background: "#FFFFFF", borderTop: "8px solid", borderImage: "linear-gradient(90deg,#E85D75,#F4A83E,#4FAF7A,#3E8ED0) 1", padding: "28px 24px", borderRadius: 8, color: "#18181a" },
    baslik: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px" },
    alt: { fontSize: 13, color: "#6f6f6c", margin: "0 0 20px" },
    kart: { background: "#FBF9F6", borderRadius: 16, padding: "16px 18px", border: "2px solid #F4A83E", marginBottom: 12, cursor: "pointer" },
    kartBaslik: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 15, margin: "0 0 6px" },
    rozet: { display: "inline-block", fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600, background: "#4FAF7A", color: "#fff", padding: "3px 10px", borderRadius: 100 },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E4DFD1", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" },
    buton: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, background: "#E85D75", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 100, cursor: "pointer" },
    butonPasif: { opacity: 0.5, cursor: "default" },
  };

  const projeleriYukle = async () => {
    setHata("");
    try {
      const r = await authFetch("/api/admin/kitap-studyo/projeler");
      const d = await r.json();
      if (d.ok) setProjeler(d.projeler);
      else setHata(d.error || "Projeler yüklenemedi.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
  };
  React.useEffect(() => { projeleriYukle(); }, []);

  const projeAc = async (id) => {
    setSeciliId(id); setSeciliProje(null); setHata("");
    try {
      const r = await authFetch(`/api/admin/kitap-studyo/projeler/${id}`);
      const d = await r.json();
      if (d.ok) setSeciliProje(d.proje);
      else setHata(d.error || "Proje açılamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
  };

  // EKLENDİ (14 Ağu 2026): mevcut proje meta'sını (tüm alanları) backend'e
  // yazar — bağımsız araçtaki projeMetaKaydet() karşılığı. guncelMeta
  // verilmezse, o anki seciliProje state'i gönderilir.
  const metaKaydet = async (guncelMeta, yeniAsama) => {
    const meta = guncelMeta || seciliProje;
    setKaydediliyor(true); setHata("");
    try {
      const r = await authFetch(`/api/admin/kitap-studyo/projeler/${seciliId}`, {
        method: "PUT", body: JSON.stringify({ ...meta, asama: yeniAsama || seciliProje.asama }),
      });
      const d = await r.json();
      if (!d.ok) setHata(d.error || "Kaydedilemedi.");
      return d.ok;
    } catch { setHata("Sunucuya ulaşılamadı."); return false; }
    finally { setKaydediliyor(false); }
  };

  // Bir stil adayı için OpenAI'den örnek bir sahne üretir, sonucu (Vercel
  // Blob URL'i) o adayın görselUrl alanına yazar ve kalıcı hale getirir.
  // DÜZELTİLDİ (15 Ağu 2026): artık diğer üretim fonksiyonlarıyla (kunyeUret
  // vb.) aynı desende — projeOku/projeGuncelle ile, ekrandan başka sekmeye
  // geçilse (view/seciliProje değişse) bile üretim doğru projeye yazmaya
  // devam ediyor. Önceden seciliProje'ye doğrudan bağımlıydı, bu yüzden
  // kullanıcı üretim sırasında başka sekmeye geçince proje "sıfırlanmış"
  // gibi görünüyordu (Bedirhan'ın bildirdiği hata).
  const stilOrnegiUret = async (idx, hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    if (stilUretiliyorIdx !== null && hedefId === seciliId) return;
    if (!p.ornekSahne?.trim()) { if (hedefId === seciliId) setHata("Önce bir örnek sahne yazın (örn. \"Küçük ayı ormanda yürüyor\")."); return; }
    if (hedefId === seciliId) { setStilUretiliyorIdx(idx); setHata(""); }
    try {
      const aday = p.stilAdaylari[idx];
      const gorselUrl = await gorselIsteYenidenDeneyerek({ karakterTanimi: aday.stilTanimi, sahne: p.ornekSahne, model: p.model, kalite: p.kalite, boyut: p.boyut });
      const guncelP = projeOku(hedefId);
      const yeniStilAdaylari = guncelP.stilAdaylari.map((s, i) => i === idx ? { ...s, gorselUrl } : s);
      const guncelMeta = { ...guncelP, stilAdaylari: yeniStilAdaylari };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setStilUretiliyorIdx(null); }
  };

  // Seçilen stili projeye kilitler (STYLE LOCK) ve aşamayı karaktere taşır.
  const stiliOnayla = async (idx) => {
    const aday = seciliProje.stilAdaylari[idx];
    const guncelMeta = { ...seciliProje, onaylananStilEtiket: aday.etiket, stilTanimi: aday.stilTanimi };
    setSeciliProje({ ...guncelMeta, asama: "karakter" });
    const basarili = await metaKaydet(guncelMeta, "karakter");
    if (basarili) await projeAc(seciliId); // güncel durumu (asama dahil) taze çek
  };

  // EKLENDİ (14 Ağu 2026): ② Karakter aşaması — yeni karakter ekleme,
  // referans görsel üretme, silme, sahnelere geçme.
  const karakterEkle = async () => {
    if (!yeniKarakterAd.trim()) return;
    const yeniKarakter = { ad: yeniKarakterAd.trim(), aciklama: yeniKarakterAciklama.trim(), gorselUrl: null, ekPozlar: [] };
    const guncelMeta = { ...seciliProje, karakterler: [...(seciliProje.karakterler || []), yeniKarakter] };
    setSeciliProje(guncelMeta);
    setYeniKarakterAd(""); setYeniKarakterAciklama("");
    await metaKaydet(guncelMeta);
  };

  // Karakterin İLK (referans) görselini üretir — henüz hiçbir referansı
  // yokken /v1/images/generations yoluna gider (kitap-resim-uret.js'de
  // referansGorseller boşsa otomatik seçilen yol). Onaylı stil tanımı
  // karakterTanimi olarak, karakterin kendi açıklaması sahne olarak gidiyor
  // — STYLE LOCK'ın karakterin ilk görselinde de korunması için.
  // DÜZELTİLDİ (15 Ağu 2026): projeOku/projeGuncelle desenine geçirildi —
  // bkz. stilOrnegiUret üstündeki not.
  const karakterGorseliUret = async (idx, hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    if (karakterUretiliyorIdx !== null && hedefId === seciliId) return;
    if (hedefId === seciliId) { setKarakterUretiliyorIdx(idx); setHata(""); }
    try {
      const karakter = p.karakterler[idx];
      const gorselUrl = await gorselIsteYenidenDeneyerek({
        karakterTanimi: p.stilTanimi,
        sahne: `Karakter referans görseli, tam boy, nötr duruş, nötr arka plan: ${karakter.aciklama}`,
        model: p.model, kalite: p.kalite, boyut: "1024x1024",
      });
      const guncelP = projeOku(hedefId);
      const yeniKarakterler = guncelP.karakterler.map((k, i) => i === idx ? { ...k, gorselUrl } : k);
      const guncelMeta = { ...guncelP, karakterler: yeniKarakterler };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setKarakterUretiliyorIdx(null); }
  };

  const karakterSil = async (idx) => {
    const guncelMeta = { ...seciliProje, karakterler: seciliProje.karakterler.filter((_, i) => i !== idx) };
    setSeciliProje(guncelMeta);
    await metaKaydet(guncelMeta);
  };

  // DEĞİŞTİRİLDİ (15 Ağu 2026, yeni akış: metin → stil → karakter → uretim):
  // ismi "sahnelereGec"ten "kitapUretimineGec"e çevrildi, artık son aşama
  // olan "uretim"e geçiyor (künye/kapak/sayfa görselleri burada üretiliyor).
  const kitapUretimineGec = async () => {
    setSeciliProje({ ...seciliProje, asama: "uretim" });
    const basarili = await metaKaydet(seciliProje, "uretim");
    if (basarili) await projeAc(seciliId);
  };

  // EKLENDİ (14 Ağu 2026): ③ Sahneler aşaması — kitap metni yükleme +
  // otomatik sahne bölme. mammoth (.docx okuyucu) CDN'den dinamik yüklenir
  // — vanilla araçtaki gibi <script> etiketiyle, npm bağımlılığı eklemeden.
  const mammothYukle = () => new Promise((resolve, reject) => {
    if (window.mammoth) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("mammoth yüklenemedi"));
    document.head.appendChild(s);
  });

  const kitapMetniDosyaSecildi = async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;
    setHata("");
    try {
      let metin;
      if (dosya.name.toLowerCase().endsWith(".docx")) {
        await mammothYukle();
        const arrayBuffer = await dosya.arrayBuffer();
        const sonuc = await window.mammoth.extractRawText({ arrayBuffer });
        metin = sonuc.value;
      } else {
        metin = await dosya.text();
      }
      const guncelMeta = { ...seciliProje, kitapMetni: metin };
      setSeciliProje(guncelMeta);
      await metaKaydet(guncelMeta);
    } catch (err) { setHata("Dosya okunamadı: " + err.message); }
  };

  // Kitap metnini (kitap-metin-ayir.js üzerinden) sayfa çiftlerine böler —
  // metin uydurmadan, orijinali böler; arka kapak yazısını da üretir.
  const sahneleriOtomatikDoldur = async () => {
    if (!seciliProje.kitapMetni?.trim()) { setHata("Önce kitap metnini yükleyin ya da yapıştırın."); return; }
    if (sahnelerDolduruluyorMu) return;
    // EKLENDİ (15 Ağu 2026, Bedirhan'ın talebi: "1 görsel bile silinmemeli,
    // ben talep ettiğimde ancak değişsin"): mevcut sayfa çiftlerinden
    // herhangi birinde zaten üretilmiş görsel varsa, bu işlem hepsini
    // sessizce sileceği için önce açıkça onay istiyoruz.
    const uretilmisVarMi = (seciliProje.spreadler || []).some((s) => s.solGorselUrl || s.sagGorselUrl);
    if (uretilmisVarMi) {
      const onay = window.confirm(
        "Bazı sayfa çiftlerinde zaten üretilmiş görseller var. Sahneleri yeniden otomatik doldurmak bu görselleri SİLECEK " +
        "(kredi harcanmış görseller dahil). Devam etmek istediğine emin misin?"
      );
      if (!onay) return;
    }
    setSahnelerDolduruluyorMu(true); setHata("");
    setSahnelerDurumMetni("Sahnelere ayrılıyor ve karakterler tespit ediliyor, bu biraz sürebilir…");
    try {
      const r = await authFetch("/api/admin/kitap-studyo/metin-ayir", {
        method: "POST",
        body: JSON.stringify({
          metin: seciliProje.kitapMetni,
          hedefSayfaSayisi: seciliProje.hedefSayfaSayisi ? parseInt(seciliProje.hedefSayfaSayisi, 10) : undefined,
          kitapAdi: seciliProje.kitapAdi, yazarAdi: seciliProje.yazarAdi,
        }),
      });
      const d = await r.json();
      if (!d.ok) { setHata(d.error || "Metin ayrıştırılamadı."); setSahnelerDurumMetni(""); return; }
      const yeniSpreadler = (d.sayfalar || []).map((s) => ({
        sahne: s.sahne || "", solMetin: s.solSayfaMetni || "", sagMetin: s.sagSayfaMetni || "",
        solMetinsiz: false, sagMetinsiz: false, solGorselUrl: null, sagGorselUrl: null,
      }));
      // EKLENDİ (14 Ağu 2026, Bedirhan'ın vizyonu: "önce karakterleri çıkarıp
      // çiziyor"): metin-ayir artık karakterleri de tespit ediyor. Kullanıcının
      // ② Karakter aşamasında elle eklediği karakterlerle aynı isimde olanı
      // ikiletmemek için isme göre birleştiriyoruz — geri kalanı yeni eklenir.
      const mevcutKarakterler = seciliProje.karakterler || [];
      const mevcutAdlar = new Set(mevcutKarakterler.map((k) => (k.ad || "").trim().toLowerCase()));
      const yeniCikarilanlar = (d.karakterler || [])
        .filter((k) => k.ad && !mevcutAdlar.has(k.ad.trim().toLowerCase()))
        .map((k) => ({ ad: k.ad, aciklama: k.aciklama || "", gorselUrl: null, ekPozlar: [] }));
      const guncelMeta = {
        ...seciliProje, spreadler: yeniSpreadler,
        karakterler: [...mevcutKarakterler, ...yeniCikarilanlar],
        kapakArkasiYazisi: d.kapakArkasiYazisi || seciliProje.kapakArkasiYazisi || "",
      };
      setSeciliProje(guncelMeta);
      await metaKaydet(guncelMeta);
      const karakterMetni = yeniCikarilanlar.length ? ` ve ${yeniCikarilanlar.length} karakter tespit edildi` : "";
      setSahnelerDurumMetni(`${yeniSpreadler.length} sayfa çifti oluşturuldu${karakterMetni} — üretime geçmeden önce gözden geçir.`);
    } catch { setHata("Sunucuya ulaşılamadı."); setSahnelerDurumMetni(""); }
    finally { setSahnelerDolduruluyorMu(false); }
  };

  // EKLENDİ (15 Ağu 2026, yeni akış: metin → stil → karakter → uretim):
  // ① Metin ve Sahneler aşamasından ② Stil aşamasına geçiş.
  const stileGec = async () => {
    if (!(seciliProje.spreadler || []).length) { setHata("Önce sahneleri otomatik doldur (ya da en az bir sayfa çifti ekle)."); return; }
    setSeciliProje({ ...seciliProje, asama: "stil" });
    const basarili = await metaKaydet(seciliProje, "stil");
    if (basarili) await projeAc(seciliId);
  };

  // EKLENDİ (14 Ağu 2026): ③ Sahneler — künye + ön/arka kapak. Ortak yardımcı:
  // canvas'ta çok satırlı metni sığdırır (vanilla araçtaki metniSar mantığı).
  const metniSar = (ctx, metin, x, y, maxGenislik, satirYuksekligi) => {
    const kelimeler = (metin || "").split(" ");
    let satir = ""; let cy = y;
    for (const kelime of kelimeler) {
      const test = satir + kelime + " ";
      if (ctx.measureText(test).width > maxGenislik && satir !== "") {
        ctx.fillText(satir.trim(), x, cy); satir = kelime + " "; cy += satirYuksekligi;
      } else { satir = test; }
    }
    ctx.fillText(satir.trim(), x, cy);
    return cy;
  };

  const fontHazirla = async (px, aile) => { try { await document.fonts.load(`${px}px ${aile}`); } catch {} };

  // Hazır bir görseli (base64/veri URL) doğrudan Blob'a yükler — künye/kapak
  // gibi OpenAI'ye hiç gitmeyen görseller için.
  // DÜZELTİLDİ (15 Ağu 2026, "413 Content Too Large" — client-side Blob
  // upload da başarısız oldu, kaynak koddan doğrulandı: @vercel/blob/client'ın
  // handleUpload()'ı statik BLOB_READ_WRITE_TOKEN gerektiriyor, storeId/OIDC
  // ile çalışmıyor — kitap görselleri store'unun ise hiç statik token'ı yok):
  // client-side Blob upload tamamen terk edildi. Yerine, ZATEN ÇALIŞAN sunucu
  // tarafı yükleme (OIDC ile) korunuyor — ama artık görsel küçük parçalara
  // bölünüp sırayla gönderiliyor, her istek Vercel'in 4.5MB sınırının çok
  // altında kalıyor. Backend son parçada hepsini birleştirip Blob'a yüklüyor.
  const gorselYukle = async (b64, onEki) => {
    const mime = b64.startsWith("/9j/") ? "image/jpeg" : "image/png"; // JPEG'ler hep bu imzayla başlar
    const uzanti = mime === "image/jpeg" ? "jpg" : "png";
    const PARCA_BOYUTU = 1_400_000; // base64 karakter sayısı — ~1MB ham veri, JSON sarmalıyla birlikte güvenle 4.5MB'ın altında
    const toplamParca = Math.max(1, Math.ceil(b64.length / PARCA_BOYUTU));
    const anahtar = `${onEki || "gorsel"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    let sonCevap = null;
    for (let i = 0; i < toplamParca; i++) {
      const parcaVerisi = b64.slice(i * PARCA_BOYUTU, (i + 1) * PARCA_BOYUTU);
      const r = await authFetch("/api/admin/kitap-studyo/gorsel-parca-yukle", {
        method: "POST",
        body: JSON.stringify({ anahtar, parcaNo: i, toplamParca, parcaVerisi, dosyaOnEki: onEki, uzanti }),
      });
      if (!r.ok) {
        let mesaj = `Yükleme başarısız (HTTP ${r.status}).`;
        try { const d = await r.json(); if (d?.error) mesaj = d.error; } catch { /* HTML dönmüş olabilir, mesajı koru */ }
        throw new Error(mesaj);
      }
      sonCevap = await r.json();
    }
    if (!sonCevap?.tamamlandi || !sonCevap?.gorselUrl) throw new Error("Görsel yüklenemedi (son parça tamamlanmadı).");
    return sonCevap.gorselUrl;
  };

  const ozellikGuncelle = (alan, deger) => {
    const guncelMeta = { ...seciliProje, ozellikler: { ...(seciliProje.ozellikler || {}), [alan]: deger } };
    setSeciliProje(guncelMeta);
    return guncelMeta;
  };

  // Künye sayfasını canvas ile çizer — AI'ye hiç gitmez, anında ve ücretsiz.
  const kunyeUret = async (hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    if (kunyeUretiliyorMu && hedefId === seciliId) return;
    if (hedefId === seciliId) { setKunyeUretiliyorMu(true); setHata(""); }
    try {
      await fontHazirla(40, "Capriola");
      const [w, h] = (p.boyut || "1024x1536").split("x").map(Number);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#18181a"; ctx.textAlign = "center";
      const oz = p.ozellikler || {};
      let y = h * 0.22;
      ctx.font = `${Math.round(w * 0.075)}px Capriola, Georgia, serif`;
      y = metniSar(ctx, p.kitapAdi || "Kitap Adı", w / 2, y, w * 0.8, w * 0.09) + w * 0.09;
      if (p.yazarAdi) {
        ctx.font = `${Math.round(w * 0.04)}px Capriola, Georgia, serif`;
        ctx.fillText(p.yazarAdi, w / 2, y); y += w * 0.09;
      }
      ctx.strokeStyle = "#cccccc"; ctx.beginPath(); ctx.moveTo(w * 0.25, y); ctx.lineTo(w * 0.75, y); ctx.stroke(); y += w * 0.09;
      ctx.textAlign = "left"; ctx.font = `${Math.round(w * 0.028)}px Capriola, Georgia, serif`;
      [
        oz.yayinevi || "MST Yayıncılık",
        oz.illustrasyonKredi ? `İllüstrasyon: ${oz.illustrasyonKredi}` : "İllüstrasyon: MST Çocuk Stüdyo",
        oz.isbn ? `ISBN: ${oz.isbn}` : null,
        oz.basimTarihi ? `Basım Tarihi: ${oz.basimTarihi}` : null,
        oz.basimAdedi ? `Basım Adedi: ${oz.basimAdedi}` : null,
        oz.baskiYeri ? `Baskı: ${oz.baskiYeri}` : null,
        (oz.genislikCm && oz.yukseklikCm) ? `Ölçü: ${oz.genislikCm} x ${oz.yukseklikCm} cm` : null,
        oz.ekNot || null,
        "Tüm hakları saklıdır.",
      ].filter(Boolean).forEach((satir) => { ctx.fillText(satir, w * 0.14, y); y += w * 0.045; });
      // DÜZELTİLDİ (15 Ağu 2026, "413 Content Too Large" hatası): gorsel-yukle
      // ucuna giden ÇIKTI görselleri artık PNG yerine yüksek kaliteli JPEG
      // (0.92) — Vercel'in sunucu isteği boyut sınırını (4.5MB) aşmamak için.
      // İçerik illüstrasyon/metin olduğu için JPEG kalite kaybı gözle
      // görülmüyor, dosya boyutu ise 3-6 kat küçülüyor.
      const b64 = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
      const url = await gorselYukle(b64, "kunye");
      const guncelMeta = { ...p, kunyeGorselUrl: url };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Künye oluşturulamadı: " + err.message); }
    finally { if (hedefId === seciliId) setKunyeUretiliyorMu(false); }
  };

  // Bir görsel URL'sini (fetch ile) indirip base64'e çevirir — kapak
  // görseline metin bindirmek için ham görsele ihtiyaç var.
  const urlDenB64Al = async (url) => {
    const r = await fetch(url);
    const blob = await r.blob();
    return new Promise((resolve, reject) => {
      const okuyucu = new FileReader();
      okuyucu.onload = () => resolve(okuyucu.result.split(",")[1]);
      okuyucu.onerror = reject;
      okuyucu.readAsDataURL(blob);
    });
  };

  // EKLENDİ (15 Ağu 2026, Bedirhan'ın talebi: "her görseli ayrıca
  // indirebilmeliyim — her görsele kredi harcıyoruz"): herhangi bir görsel
  // URL'sini, tarayıcının indirme diyaloğunu tetikleyerek diske indirir.
  const gorselIndir = async (url, dosyaAdi) => {
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const geciciUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = geciciUrl; a.download = dosyaAdi.endsWith(".png") ? dosyaAdi : dosyaAdi + ".png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(geciciUrl);
    } catch { setHata("Görsel indirilemedi."); }
  };

  // Ham kapak görselinin (b64) üzerine, alt kısma karartma bant + kitap adı
  // + yazar adı bindirir (Capriola font, metin AI'ye çizdirilmiyor).
  const onKapakMetniBindir = async (hamB64, p) => {
    await fontHazirla(48, "Capriola");
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const bant = img.height * 0.24;
        const grad = ctx.createLinearGradient(0, img.height - bant, 0, img.height);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = grad; ctx.fillRect(0, img.height - bant, img.width, bant);
        ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.round(img.width * 0.078)}px Capriola, Georgia, serif`;
        const sonY = metniSar(ctx, p.kitapAdi || "Kitap Adı", img.width / 2, img.height - bant * 0.62, img.width * 0.86, img.width * 0.09);
        if (p.yazarAdi) {
          ctx.font = `${Math.round(img.width * 0.036)}px Capriola, Georgia, serif`;
          ctx.fillText(p.yazarAdi, img.width / 2, Math.max(sonY + img.width * 0.07, img.height - img.height * 0.05));
        }
        resolve(canvas.toDataURL("image/jpeg", 0.72).split(",")[1]);
      };
      img.src = "data:image/png;base64," + hamB64;
    });
  };

  const arkaKapakMetniBindir = async (hamB64, p) => {
    await fontHazirla(32, "Capriola");
    const yazi = (p.kapakArkasiYazisi || "").trim();
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const kutuY = img.height * 0.32, kutuH = img.height * 0.36;
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(img.width * 0.08, kutuY, img.width * 0.84, kutuH);
        ctx.fillStyle = "#18181a"; ctx.textAlign = "left";
        ctx.font = `${Math.round(img.width * 0.032)}px Capriola, Georgia, serif`;
        metniSar(ctx, yazi, img.width * 0.12, kutuY + img.width * 0.06, img.width * 0.76, img.width * 0.045);
        resolve(canvas.toDataURL("image/jpeg", 0.72).split(",")[1]);
      };
      img.src = "data:image/png;base64," + hamB64;
    });
  };

  const duzZeminOlustur = (w, h) => {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#F5F0E4"; ctx.fillRect(0, 0, w, h);
    return canvas.toDataURL("image/png").split(",")[1];
  };

  const referansHavuzuTopla = (hedefId) => (projeOku(hedefId).karakterler || []).flatMap((k) => {
    const liste = [];
    if (k.gorselUrl) liste.push(k.gorselUrl);
    (k.ekPozlar || []).forEach((e) => liste.push(e.gorselUrl));
    return liste;
  });

  // ---- Güvenilirlik katmanı: maliyet tahmini + yeniden deneme ----
  const FIYAT_TABLOSU = {
    "gpt-image-2": { kare: { low: .006, medium: .053, high: .211 }, diger: { low: .005, medium: .041, high: .165 } },
    "gpt-image-1.5": { kare: { low: .009, medium: .034, high: .133 }, diger: { low: .013, medium: .05, high: .20 } },
    "gpt-image-1-mini": { kare: { low: .005, medium: .02, high: .052 }, diger: { low: .005, medium: .025, high: .06 } },
  };
  const maliyetTahminiEkle = (model, boyut, kalite, referansliMi) => {
    const tablo = FIYAT_TABLOSU[model] || FIYAT_TABLOSU["gpt-image-2"];
    const grup = boyut === "1024x1024" ? tablo.kare : tablo.diger;
    let fiyat = grup[kalite] ?? grup.medium;
    if (boyut === "1536x1024") fiyat *= 1.3;
    if (referansliMi) fiyat *= 1.15;
    setToplamMaliyet((t) => t + fiyat);
  };
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

  // gorsel-uret ucunu, hata durumunda (429'da daha uzun bekleyerek) otomatik
  // yeniden deneyerek çağırır. Tüm sahne üretimleri (kapaklar, karakterler,
  // sayfa çiftleri, ek pozlar) bu ortak fonksiyonu kullanır.
  const gorselIsteYenidenDeneyerek = async (govde, durumSetter) => {
    const tekrar = 2;
    let sonHata;
    for (let deneme = 0; deneme <= tekrar; deneme++) {
      try {
        const r = await authFetch("/api/admin/kitap-studyo/gorsel-uret", { method: "POST", body: JSON.stringify(govde) });
        const d = await r.json();
        if (!d.ok) { const h = new Error(d.error || "Görsel üretilemedi."); h.durumKodu = r.status; throw h; }
        maliyetTahminiEkle(govde.model, govde.boyut, govde.kalite, !!(govde.referansGorseller && govde.referansGorseller.length));
        return d.gorselUrl;
      } catch (err) {
        sonHata = err;
        if (deneme < tekrar) {
          const bekleSure = err.durumKodu === 429 ? 12000 : 3000 * (deneme + 1);
          if (durumSetter) durumSetter(`Hata, ${Math.round(bekleSure / 1000)} sn sonra tekrar denenecek…`);
          await bekle(bekleSure);
        }
      }
    }
    throw sonHata;
  };

  const onKapakUret = async (hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    if ((onKapakUretiliyorMu && hedefId === seciliId) || !p.onKapakSahne?.trim()) { if (!p.onKapakSahne?.trim() && hedefId === seciliId) setHata("Önce kapak görselinin ne göstermesi gerektiğini yaz."); return; }
    if (hedefId === seciliId) { setOnKapakUretiliyorMu(true); setHata(""); }
    try {
      const hamUrl = await gorselIsteYenidenDeneyerek({ karakterTanimi: p.stilTanimi, sahne: p.onKapakSahne, model: p.model, kalite: p.kalite, boyut: p.boyut, referansGorseller: referansHavuzuTopla(hedefId) });
      const hamB64 = await urlDenB64Al(hamUrl);
      const finalB64 = await onKapakMetniBindir(hamB64, p);
      const finalUrl = await gorselYukle(finalB64, "on-kapak");
      const guncelMeta = { ...p, onKapakHamUrl: hamUrl, onKapakGorselUrl: finalUrl };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setOnKapakUretiliyorMu(false); }
  };

  const onKapakYaziYenidenYerlestir = async () => {
    if (!seciliProje.onKapakHamUrl) { setHata("Önce kapağı üret."); return; }
    setOnKapakUretiliyorMu(true); setHata("");
    try {
      const hamB64 = await urlDenB64Al(seciliProje.onKapakHamUrl);
      const finalB64 = await onKapakMetniBindir(hamB64, seciliProje);
      const finalUrl = await gorselYukle(finalB64, "on-kapak");
      const guncelMeta = { ...seciliProje, onKapakGorselUrl: finalUrl };
      await projeGuncelle(seciliId, guncelMeta);
    } catch (err) { setHata("Hata: " + err.message); }
    finally { setOnKapakUretiliyorMu(false); }
  };

  const arkaKapakUret = async (hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    if (arkaKapakUretiliyorMu && hedefId === seciliId) return;
    if (hedefId === seciliId) { setArkaKapakUretiliyorMu(true); setHata(""); }
    try {
      const [w, h] = (p.boyut || "1024x1536").split("x").map(Number);
      let hamB64, hamUrl;
      if (p.arkaKapakSahne?.trim()) {
        hamUrl = await gorselIsteYenidenDeneyerek({ karakterTanimi: p.stilTanimi, sahne: p.arkaKapakSahne, model: p.model, kalite: p.kalite, boyut: p.boyut, referansGorseller: referansHavuzuTopla(hedefId) });
        hamB64 = await urlDenB64Al(hamUrl);
      } else {
        hamB64 = duzZeminOlustur(w, h);
        hamUrl = await gorselYukle(hamB64, "arka-kapak-ham");
      }
      const finalB64 = await arkaKapakMetniBindir(hamB64, p);
      const finalUrl = await gorselYukle(finalB64, "arka-kapak");
      const guncelMeta = { ...p, arkaKapakHamUrl: hamUrl, arkaKapakGorselUrl: finalUrl };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setArkaKapakUretiliyorMu(false); }
  };

  const arkaKapakYaziYenidenYerlestir = async () => {
    if (!seciliProje.arkaKapakHamUrl) { setHata("Önce arka kapağı üret."); return; }
    setArkaKapakUretiliyorMu(true); setHata("");
    try {
      const hamB64 = await urlDenB64Al(seciliProje.arkaKapakHamUrl);
      const finalB64 = await arkaKapakMetniBindir(hamB64, seciliProje);
      const finalUrl = await gorselYukle(finalB64, "arka-kapak");
      const guncelMeta = { ...seciliProje, arkaKapakGorselUrl: finalUrl };
      await projeGuncelle(seciliId, guncelMeta);
    } catch (err) { setHata("Hata: " + err.message); }
    finally { setArkaKapakUretiliyorMu(false); }
  };

  // ================= EKLENDİ (14 Ağu 2026): ③ Sahneler — 3. parça: sayfa
  // çiftleri + görsel üretimi (sahne metni/numarası bindirme dahil) =================
  // Bir sayfa çifti kartı ekler/günceller.
  const spreadEkle = () => {
    const guncelMeta = { ...seciliProje, spreadler: [...(seciliProje.spreadler || []), { sahne: "", solMetin: "", sagMetin: "", solMetinsiz: false, sagMetinsiz: false, solGorselUrl: null, sagGorselUrl: null }] };
    setSeciliProje(guncelMeta);
    metaKaydet(guncelMeta);
  };
  const spreadSil = (idx) => {
    const guncelMeta = { ...seciliProje, spreadler: seciliProje.spreadler.filter((_, i) => i !== idx) };
    setSeciliProje(guncelMeta);
    metaKaydet(guncelMeta);
  };
  const spreadAlanGuncelle = (idx, alan, deger) => {
    const yeniSpreadler = seciliProje.spreadler.map((s, i) => i === idx ? { ...s, [alan]: deger } : s);
    const guncelMeta = { ...seciliProje, spreadler: yeniSpreadler };
    setSeciliProje(guncelMeta);
    return guncelMeta;
  };
  const spreadNumaralariGetir = (idx) => { const sol = 2 + idx * 2; return { solSayfa: sol, sagSayfa: sol + 1 }; };

  // Geniş (1536x1024) sayfa çifti görselini tarayıcıda ortadan ikiye böler.
  const gorseliIkiyeBol = (b64Genis) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const yarim = img.width / 2;
      const sol = document.createElement("canvas"); sol.width = yarim; sol.height = img.height;
      sol.getContext("2d").drawImage(img, 0, 0, yarim, img.height, 0, 0, yarim, img.height);
      const sag = document.createElement("canvas"); sag.width = yarim; sag.height = img.height;
      sag.getContext("2d").drawImage(img, yarim, 0, yarim, img.height, 0, 0, yarim, img.height);
      resolve({ sol: sol.toDataURL("image/png").split(",")[1], sag: sag.toDataURL("image/png").split(",")[1] });
    };
    img.src = "data:image/png;base64," + b64Genis;
  });

  // KRİTİK ÖZELLİK (bağımsız araçta sonradan eklenen en önemli düzeltme):
  // sayfa metnini ve sayfa numarasını görsele canvas ile bindirir — önceden
  // sadece veride tutulup görsele hiç basılmıyordu.
  const sayfaMetniBindir = async (hamB64, metin, sayfaNo) => {
    await fontHazirla(28, "Capriola");
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const metniVar = metin && metin.trim();
        if (metniVar) {
          const bantH = img.height * 0.2;
          ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(0, img.height - bantH, img.width, bantH);
          ctx.fillStyle = "#18181a"; ctx.textAlign = "center";
          ctx.font = `${Math.round(img.width * 0.062)}px Capriola, Georgia, serif`;
          metniSar(ctx, metin.trim(), img.width / 2, img.height - bantH + img.width * 0.085, img.width * 0.86, img.width * 0.075);
        }
        if (sayfaNo) {
          ctx.textAlign = "center";
          ctx.fillStyle = metniVar ? "#6f6f6c" : "rgba(0,0,0,0.55)";
          ctx.font = `${Math.round(img.width * 0.03)}px Capriola, Georgia, serif`;
          ctx.fillText(String(sayfaNo), img.width / 2, img.height - img.width * 0.025);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.72).split(",")[1]);
      };
      img.src = "data:image/png;base64," + hamB64;
    });
  };

  const spreadUret = async (idx, hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    const s = p.spreadler[idx];
    if (!s.sahne?.trim()) { if (hedefId === seciliId) setHata("Önce bu sayfa çifti için bir sahne yaz."); return; }
    if (hedefId === seciliId) { setSpreadUretiliyorIdx(idx); setHata(""); }
    try {
      const genisUrl = await gorselIsteYenidenDeneyerek({ karakterTanimi: p.stilTanimi, sahne: s.sahne, model: p.model, kalite: p.kalite, boyut: "1536x1024", referansGorseller: referansHavuzuTopla(hedefId) });
      const genisB64 = await urlDenB64Al(genisUrl);
      const { sol, sag } = await gorseliIkiyeBol(genisB64);
      const { solSayfa, sagSayfa } = spreadNumaralariGetir(idx);
      const solFinal = await sayfaMetniBindir(sol, s.solMetinsiz ? "" : s.solMetin, solSayfa);
      const sagFinal = await sayfaMetniBindir(sag, s.sagMetinsiz ? "" : s.sagMetin, sagSayfa);
      const solUrl = await gorselYukle(solFinal, "sayfa");
      const sagUrl = await gorselYukle(sagFinal, "sayfa");
      // p.spreadler yerine EN GÜNCEL kopyayı (projeOku ile) tekrar okuyoruz —
      // arka planda üretim sırasında bu spread'e ait metin/sahne başka bir
      // adımda değişmiş olabilir.
      const guncelP = projeOku(hedefId);
      const yeniSpreadler = guncelP.spreadler.map((sp, i) => i === idx ? { ...sp, solGorselUrl: solUrl, sagGorselUrl: sagUrl } : sp);
      const guncelMeta = { ...guncelP, spreadler: yeniSpreadler };
      await projeGuncelle(hedefId, guncelMeta);
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setSpreadUretiliyorIdx(null); }
  };

  const spreadMetniYenidenYerlestir = async (idx) => {
    setSpreadUretiliyorIdx(idx); setHata("");
    try {
      // Ham görseller ayrı saklanmıyor (boyut için) — metin değişince sahneyi
      // yeniden üretmek gerekiyor. Bu, vanilla araçtaki "aynı oturumda"
      // sınırlamasının basitleştirilmiş hali.
      await spreadUret(idx, seciliId);
    } finally { setSpreadUretiliyorIdx(null); }
  };

  // ================= EKLENDİ: 4. parça — "Tümünü Üret" ve "Kalite değişti,
  // yeniden üretime hazırla" =================
  // EKLENDİ (14 Ağu 2026, "projeden çıkınca üretim devam etmeli"): artık
  // seciliProje state'ine bağımlı değil — hedefId'yi (proje numarasını)
  // sabit yakalar, her adımı projeOku/projeGuncelle üzerinden (backend'e
  // doğrudan authFetch ile) yürütür. Kullanıcı Proje Panosuna dönüp başka
  // projeye girse bile bu döngü doğru projeye yazmaya devam eder; ekranda
  // hâlâ bu proje açıksa arayüz de canlı güncellenir.
  const tumunuUret = async (hedefId) => {
    hedefId = hedefId || seciliId;
    if (aktifUretimIlerleme[hedefId]) return; // zaten üretimde
    // DEĞİŞTİRİLDİ (14 Ağu 2026, Balon Uçuşu tasarımı): ilerleme artık
    // {mevcut, toplam} objesi olarak tutuluyor — yüzde ve balon animasyonu
    // hesaplayabilmek için.
    setAktifUretimIlerleme((m) => ({ ...m, [hedefId]: { mevcut: 0, toplam: 1 } }));
    if (hedefId === seciliId) { setTumunuUretiliyorMu(true); setHata(""); }
    const beklemeMs = Math.max(0, (parseFloat(beklemeSn) || 0) * 1000);
    try {
      let p = projeOku(hedefId);
      if (!p.kunyeGorselUrl) { await kunyeUret(hedefId); if (beklemeMs) await bekle(beklemeMs); p = projeOku(hedefId); }
      if (p.onKapakSahne?.trim() && !p.onKapakGorselUrl) { await onKapakUret(hedefId); if (beklemeMs) await bekle(beklemeMs); p = projeOku(hedefId); }
      if (!p.arkaKapakGorselUrl) { await arkaKapakUret(hedefId); if (beklemeMs) await bekle(beklemeMs); p = projeOku(hedefId); }
      const toplamSpread = (p.spreadler || []).length;
      for (let i = 0; i < toplamSpread; i++) {
        p = projeOku(hedefId);
        if (p.spreadler[i].solGorselUrl) continue;
        setAktifUretimIlerleme((m) => ({ ...m, [hedefId]: { mevcut: i, toplam: toplamSpread } }));
        await spreadUret(i, hedefId);
        if (beklemeMs) await bekle(beklemeMs);
      }
      setAktifUretimIlerleme((m) => ({ ...m, [hedefId]: { mevcut: toplamSpread, toplam: toplamSpread } }));
    } finally {
      setAktifUretimIlerleme((m) => { const y = { ...m }; delete y[hedefId]; return y; });
      if (hedefId === seciliId) setTumunuUretiliyorMu(false);
    }
  };

  const uretimiSifirla = async () => {
    if (!window.confirm('Tüm sayfa çiftlerinin ve kapakların "tamamlandı" durumu sıfırlanacak (metinler korunur). Onaylıyor musun?')) return;
    const yeniSpreadler = (seciliProje.spreadler || []).map((s) => ({ ...s, solGorselUrl: null, sagGorselUrl: null }));
    const guncelMeta = { ...seciliProje, spreadler: yeniSpreadler, onKapakGorselUrl: null, onKapakHamUrl: null, arkaKapakGorselUrl: null, arkaKapakHamUrl: null };
    setSeciliProje(guncelMeta);
    await metaKaydet(guncelMeta);
  };

  // ================= EKLENDİ: 5. parça — kitap listesi, çevirerek önizleme,
  // PDF çıktısı ================= 
  const kitapSayfaListesiOlustur = () => {
    const liste = [];
    if (seciliProje.onKapakGorselUrl) liste.push({ url: seciliProje.onKapakGorselUrl, etiket: "Ön kapak" });
    if (seciliProje.kunyeGorselUrl) liste.push({ url: seciliProje.kunyeGorselUrl, etiket: "Künye (sayfa 1)" });
    (seciliProje.spreadler || []).forEach((s, i) => {
      const { solSayfa, sagSayfa } = spreadNumaralariGetir(i);
      if (s.solGorselUrl) liste.push({ url: s.solGorselUrl, etiket: `Sayfa ${solSayfa}` });
      if (s.sagGorselUrl) liste.push({ url: s.sagGorselUrl, etiket: `Sayfa ${sagSayfa}` });
    });
    if (seciliProje.arkaKapakGorselUrl) liste.push({ url: seciliProje.arkaKapakGorselUrl, etiket: "Arka kapak" });
    return liste;
  };

  const kitapiOnizle = () => { setOnizlemeIndex(0); setOnizlemeAcikMi(true); };

  const jspdfYukle = () => new Promise((resolve, reject) => {
    if (window.jspdf) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("jsPDF yüklenemedi"));
    document.head.appendChild(s);
  });

  const pdfIndir = async () => {
    const liste = kitapSayfaListesiOlustur();
    if (liste.length === 0) { setHata("Henüz indirilecek bir görsel yok."); return; }
    setPdfHazirlaniyorMu(true); setHata("");
    try {
      await jspdfYukle();
      const { jsPDF } = window.jspdf;
      let doc;
      for (let i = 0; i < liste.length; i++) {
        const b64 = await urlDenB64Al(liste[i].url);
        const boyut = await new Promise((resolve) => { const img = new Image(); img.onload = () => resolve({ w: img.width, h: img.height }); img.src = "data:image/png;base64," + b64; });
        if (i === 0) doc = new jsPDF({ unit: "px", format: [boyut.w, boyut.h] });
        else doc.addPage([boyut.w, boyut.h]);
        doc.addImage("data:image/png;base64," + b64, "PNG", 0, 0, boyut.w, boyut.h);
      }
      doc.save(`${(seciliProje.kitapAdi || "kitap").replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ_-]+/g, "-")}.pdf`);
    } catch (err) { setHata("PDF oluşturulamadı: " + err.message); }
    finally { setPdfHazirlaniyorMu(false); }
  };

  // ================= EKLENDİ: 6. parça — karakter ek poz/ifade ================= 
  // DÜZELTİLDİ (15 Ağu 2026): projeOku/projeGuncelle desenine geçirildi.
  const ekPozUret = async (karakterIdx, hedefId) => {
    hedefId = hedefId || seciliId;
    const p = projeOku(hedefId);
    const karakter = p.karakterler[karakterIdx];
    const tarif = (ekPozTarifleri[karakterIdx] || "").trim();
    if (!karakter.gorselUrl) { if (hedefId === seciliId) setHata("Önce bu karakterin ana referansını üret."); return; }
    if (!tarif) { if (hedefId === seciliId) setHata("Ek pozun ne olacağını yaz (örn. gülümseyen, yandan, koşarken)."); return; }
    if (hedefId === seciliId) { setEkPozUretiliyorIdx(karakterIdx); setHata(""); }
    try {
      const sahne = `Aynı karakterin farklı bir poz/ifadesi: ${tarif}. Karakter kimliği birebir korunmalı (yüz, saç, kıyafet aynı) — sadece poz, ifade ya da kamera açısı değişsin.`;
      const gorselUrl = await gorselIsteYenidenDeneyerek({ karakterTanimi: p.stilTanimi, sahne, model: p.model, kalite: p.kalite, boyut: "1024x1024", referansGorseller: [karakter.gorselUrl] });
      const guncelP = projeOku(hedefId);
      const yeniKarakterler = guncelP.karakterler.map((k, i) => i === karakterIdx ? { ...k, ekPozlar: [...(k.ekPozlar || []), { tarif, gorselUrl }] } : k);
      const guncelMeta = { ...guncelP, karakterler: yeniKarakterler };
      await projeGuncelle(hedefId, guncelMeta);
      if (hedefId === seciliId) setEkPozTarifleri((t) => ({ ...t, [karakterIdx]: "" }));
    } catch (err) { if (hedefId === seciliId) setHata("Hata: " + err.message); }
    finally { if (hedefId === seciliId) setEkPozUretiliyorIdx(null); }
  };
  const ekPozSil = async (karakterIdx, ekPozIdx) => {
    const yeniKarakterler = seciliProje.karakterler.map((k, i) => i === karakterIdx ? { ...k, ekPozlar: k.ekPozlar.filter((_, j) => j !== ekPozIdx) } : k);
    const guncelMeta = { ...seciliProje, karakterler: yeniKarakterler };
    setSeciliProje(guncelMeta);
    await metaKaydet(guncelMeta);
  };

  const yeniProjeOlustur = async () => {
    if (!yeniAd.trim() || olusturuluyor) return;
    setOlusturuluyor(true); setHata("");
    try {
      const r = await authFetch("/api/admin/kitap-studyo/projeler", {
        method: "POST", body: JSON.stringify({ kitapAdi: yeniAd.trim() }),
      });
      const d = await r.json();
      if (d.ok) { setYeniAd(""); await projeleriYukle(); projeAc(d.id); }
      else setHata(d.error || "Proje oluşturulamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setOlusturuluyor(false); }
  };

  const projeSil = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Bu projeyi kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      const r = await authFetch(`/api/admin/kitap-studyo/projeler/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.ok) { if (seciliId === id) { setSeciliId(null); setSeciliProje(null); } await projeleriYukle(); }
      else setHata(d.error || "Silinemedi.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
  };

  return (
    <div style={stil.sayfa}>
      <h2 style={stil.baslik}>🌈 MST Çocuk Stüdyo</h2>
      <p style={stil.alt}>Kitap resim atölyesi — projeler artık kalıcı, her cihazdan erişilebilir.</p>

      {hata && <div style={{ background: "#FDECEA", color: "#C0392B", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{hata}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input style={stil.input} placeholder="Yeni kitap adı (örn. Küçük Ayı'nın Büyük Günü)"
          value={yeniAd} onChange={(e) => setYeniAd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && yeniProjeOlustur()} />
        <button style={{ ...stil.buton, ...(olusturuluyor || !yeniAd.trim() ? stil.butonPasif : {}) }}
          disabled={olusturuluyor || !yeniAd.trim()} onClick={yeniProjeOlustur}>
          {olusturuluyor ? "Oluşturuluyor..." : "+ Yeni Proje"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: seciliId ? "280px 1fr" : "1fr", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, color: "#6f6f6c", marginBottom: 10 }}>
            PROJELER {projeler ? `(${projeler.length})` : ""}
          </div>
          {!projeler && <div style={{ fontSize: 13, color: "#6f6f6c" }}>Yükleniyor...</div>}
          {projeler && !projeler.length && <div style={{ fontSize: 13, color: "#6f6f6c" }}>Henüz proje yok — yukarıdan ilk kitabı oluşturun.</div>}
          {(projeler || []).map((p) => (
            <div key={p.id} style={{ ...stil.kart, ...(seciliId === p.id ? { borderColor: "#E85D75" } : {}) }}
              onClick={() => { if (seciliId === p.id) { setSeciliId(null); setSeciliProje(null); } else { projeAc(p.id); } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={stil.kartBaslik}>{p.kitap_adi}</div>
                <span onClick={(e) => projeSil(p.id, e)} style={{ color: "#C0392B", cursor: "pointer", fontSize: 12 }}>✕</span>
              </div>
              <span style={stil.rozet}>{{ metin: "Metin ve Sahneler", stil: "Stil Seçimi", karakter: "Karakter", uretim: "Kitap Üretimi" }[p.asama] || p.asama}</span>
              {/* EKLENDİ (14 Ağu 2026): projeden çıkılsa da arka planda devam
                  eden üretimi, Proje Panosunda da canlı gösterir. */}
              {aktifUretimIlerleme[p.id] && (
                <span style={{ ...stil.rozet, background: "#3E8ED0", marginLeft: 6 }}>
                  🎈 %{Math.round((aktifUretimIlerleme[p.id].mevcut / Math.max(1, aktifUretimIlerleme[p.id].toplam)) * 100)}
                </span>
              )}
              <div style={{ fontSize: 11, color: "#9a9a96", marginTop: 6 }}>{new Date(p.guncellendi).toLocaleString("tr-TR")}</div>
            </div>
          ))}
        </div>

        {seciliId && (
          <div>
            {!seciliProje && <div style={{ fontSize: 13, color: "#6f6f6c" }}>Proje açılıyor...</div>}
            {seciliProje && (
              <div style={{ background: "#FBF9F6", borderRadius: 16, border: "2px solid #F4A83E", padding: 20 }}>
                {/* EKLENDİ (15 Ağu 2026, Bedirhan'ın bildirdiği hata: "projenin
                    üstüne tıkladığımda kapanmıyor, sayfa küçülmesi olmuyor yeni
                    projeye geçmek için"): açık, tıklanır "panoya dön" linki —
                    proje kartına tekrar tıklamanın (yukarıda toggle edildi)
                    yanı sıra ikinci bir yol. */}
                <span onClick={() => { setSeciliId(null); setSeciliProje(null); }}
                  style={{ fontSize: 12, color: "#6f6f6c", cursor: "pointer", display: "inline-block", marginBottom: 10 }}>
                  ← Proje Panosuna Dön
                </span>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{seciliProje.kitapAdi}</div>
                <div style={{ fontSize: 12, color: "#6f6f6c", marginBottom: 16 }}>
                  Aşama: <b>{{ metin: "Metin ve Sahneler", stil: "Stil Seçimi", karakter: "Karakter", uretim: "Kitap Üretimi" }[seciliProje.asama] || seciliProje.asama}</b>
                  {" · "}{(seciliProje.karakterler || []).length} karakter{" · "}{(seciliProje.spreadler || []).length} sayfa çifti
                  {kaydediliyor && <span style={{ color: "#9a9a96" }}> · kaydediliyor...</span>}
                </div>

                {/* EKLENDİ (14 Ağu 2026): ① STİL SEÇİMİ aşaması — gerçek akış.
                    Bağımsız araçtaki mantıkla aynı: bir örnek sahne yazılır,
                    3 stil adayı için o sahne üretilir, biri onaylanınca
                    "onaylananStilEtiket" + "stilTanimi" kilitlenir (STYLE
                    LOCK) ve aşama karaktere geçer. */}
                {/* EKLENDİ (15 Ağu 2026, Bedirhan'ın yeni akış talebi: "önce
                    metin yüklenmeli, sahneler otomatik hazırlanıp onaylanmalı,
                    sonra stil, sonra karakter, sonra kitap üretimi"): YENİ ①
                    aşama — Metin ve Sahneler. Kitap Bilgileri + Kitap Metni +
                    "Sahneleri Otomatik Doldur" (Sahneler'den taşındı) + sayfa
                    çiftlerinin gözden geçirme/düzenleme listesi (henüz görsel
                    üretim yok — stil henüz seçilmedi) + onayla, stile geç. */}
                {seciliProje.asama === "metin" && (
                  <div>
                    <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E", marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Kitap Bilgileri</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input style={stil.input} placeholder="Yazar adı" value={seciliProje.yazarAdi || ""}
                          onChange={(e) => setSeciliProje({ ...seciliProje, yazarAdi: e.target.value })} onBlur={() => metaKaydet(seciliProje)} />
                        <select style={stil.input} value={seciliProje.model || "gpt-image-2"}
                          onChange={(e) => { const gm = { ...seciliProje, model: e.target.value }; setSeciliProje(gm); metaKaydet(gm); }}>
                          <option value="gpt-image-2">gpt-image-2 (önerilen)</option>
                          <option value="gpt-image-1-mini">gpt-image-1-mini (ucuz/deneme)</option>
                        </select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                        <select style={stil.input} value={seciliProje.kalite || "low"}
                          onChange={(e) => { const gm = { ...seciliProje, kalite: e.target.value }; setSeciliProje(gm); metaKaydet(gm); }}>
                          <option value="low">Düşük (test için)</option>
                          <option value="medium">Orta</option>
                          <option value="high">Yüksek</option>
                        </select>
                        <select style={stil.input} value={seciliProje.boyut || "1024x1536"}
                          onChange={(e) => { const gm = { ...seciliProje, boyut: e.target.value }; setSeciliProje(gm); metaKaydet(gm); }}>
                          <option value="1024x1536">1024×1536 (dikey)</option>
                          <option value="1024x1024">1024×1024 (kare)</option>
                        </select>
                        <input style={stil.input} placeholder="Genişlik (cm)" value={seciliProje.ozellikler?.genislikCm || ""}
                          onChange={(e) => ozellikGuncelle("genislikCm", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Yükseklik (cm)" value={seciliProje.ozellikler?.yukseklikCm || ""}
                          onChange={(e) => ozellikGuncelle("yukseklikCm", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                      </div>
                      <p style={{ fontSize: 11, color: "#6f6f6c", marginTop: 8, marginBottom: 0 }}>
                        Düşük kalite ile ucuza test edip beğendiğinde, Kitap Üretimi aşamasındaki "Kalite Değişti, Yeniden Üretime Hazırla" ile orta/yükseğe geçebilirsin.
                        ISBN, basım tarihi gibi diğer künye bilgileri Kitap Üretimi aşamasında.
                      </p>
                    </div>

                    <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E", marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Kitap Metni</div>
                      <div style={{ fontSize: 12, color: "#6f6f6c", marginBottom: 12 }}>
                        Tam kitap metnini yükle (.docx/.txt) ya da yapıştır. "Sahneleri otomatik doldur" metni sayfa çiftlerine böler
                        (orijinal metni bölerek, uydurmadan), karakterleri tespit eder ve arka kapak yazısını üretir.
                      </div>
                      <label style={{ display: "inline-block", fontSize: 12, color: "#18181a", border: "1.5px solid #F4A83E", borderRadius: 100, padding: "8px 16px", cursor: "pointer", marginBottom: 10 }}>
                        Dosya seç (.docx / .txt)
                        <input type="file" accept=".docx,.txt" style={{ display: "none" }} onChange={kitapMetniDosyaSecildi} />
                      </label>
                      <textarea style={{ ...stil.input, minHeight: 110, marginTop: 8 }}
                        placeholder="Ya da kitabın tam metnini buraya yapıştır…"
                        value={seciliProje.kitapMetni || ""}
                        onChange={(e) => setSeciliProje({ ...seciliProje, kitapMetni: e.target.value })}
                        onBlur={() => metaKaydet(seciliProje)} />
                      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                        <input style={{ ...stil.input, width: 160 }} type="number" placeholder="Hedef iç sayfa (örn. 32)"
                          value={seciliProje.hedefSayfaSayisi || ""}
                          onChange={(e) => setSeciliProje({ ...seciliProje, hedefSayfaSayisi: e.target.value })}
                          onBlur={() => metaKaydet(seciliProje)} />
                        <button style={{ ...stil.buton, ...(sahnelerDolduruluyorMu ? stil.butonPasif : {}) }}
                          disabled={sahnelerDolduruluyorMu} onClick={sahneleriOtomatikDoldur}>
                          {sahnelerDolduruluyorMu ? "Sahnelere ayrılıyor..." : "Sahneleri Otomatik Doldur"}
                        </button>
                      </div>
                      {sahnelerDurumMetni && <div style={{ fontSize: 12, color: "#6f6f6c", marginTop: 8 }}>{sahnelerDurumMetni}</div>}
                    </div>

                    {(seciliProje.spreadler || []).length > 0 && (
                      <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E", marginBottom: 16 }}>
                        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                          Sahneleri Gözden Geçir ve Onayla
                        </div>
                        <div style={{ fontSize: 12, color: "#6f6f6c", marginBottom: 12 }}>
                          Görsel üretimi henüz başlamadı (stil ve karakterler sonraki aşamalarda seçilecek) — burada sadece sahne
                          tarifini ve sayfa metnini gözden geçirip düzeltebilirsin. {(seciliProje.karakterler || []).length} karakter
                          otomatik tespit edildi, ② Karakter aşamasında göreceksin.
                        </div>
                        {(seciliProje.spreadler || []).map((s, idx) => {
                          const { solSayfa, sagSayfa } = spreadNumaralariGetir(idx);
                          return (
                            <div key={idx} style={{ background: "#fff", border: "1.5px solid #E4DFD1", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#6f6f6c" }}>Sayfa {solSayfa} — {sagSayfa}</div>
                              <textarea style={{ ...stil.input, minHeight: 50 }} placeholder="Sahne (iki sayfaya birden yayılan tek kompozisyon)"
                                value={s.sahne} onChange={(e) => spreadAlanGuncelle(idx, "sahne", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                                <textarea style={{ ...stil.input, minHeight: 40 }} placeholder="Sol sayfa metni" value={s.solMetin}
                                  onChange={(e) => spreadAlanGuncelle(idx, "solMetin", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                                <textarea style={{ ...stil.input, minHeight: 40 }} placeholder="Sağ sayfa metni" value={s.sagMetin}
                                  onChange={(e) => spreadAlanGuncelle(idx, "sagMetin", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                              </div>
                              <span onClick={() => spreadSil(idx)} style={{ color: "#C0392B", cursor: "pointer", fontSize: 12, display: "inline-block", marginTop: 8 }}>Bu sayfa çiftini sil</span>
                            </div>
                          );
                        })}
                        <button style={stil.buton} onClick={spreadEkle}>+ Sayfa Çifti Ekle</button>
                      </div>
                    )}

                    <button style={{ ...stil.buton, background: "#4FAF7A" }} onClick={stileGec}>
                      Sahneleri Onayla, Stile Geç →
                    </button>
                  </div>
                )}

                {/* EKLENDİ (14 Ağu 2026): ② STİL SEÇİMİ aşaması — gerçek akış.
                    Bağımsız araçtaki mantıkla aynı: bir örnek sahne yazılır,
                    3 stil adayı için o sahne üretilir, biri onaylanınca
                    "onaylananStilEtiket" + "stilTanimi" kilitlenir (STYLE
                    LOCK) ve aşama karaktere geçer. DEĞİŞTİRİLDİ (15 Ağu):
                    Kitap Bilgileri artık ① Metin aşamasında — burada sadece
                    örnek sahne + stil adayları var. */}
                {seciliProje.asama === "stil" && (
                  <div>
                    <textarea
                      value={seciliProje.ornekSahne || ""}
                      onChange={(e) => setSeciliProje({ ...seciliProje, ornekSahne: e.target.value })}
                      onBlur={() => metaKaydet()}
                      placeholder="Örnek sahne (stil testleri için) — örn. &quot;Küçük bir kahverengi ayı yavrusu güneşli bir orman açıklığında duruyor&quot;"
                      style={{ ...stil.input, minHeight: 60, resize: "vertical", marginBottom: 16 }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                      {(seciliProje.stilAdaylari || []).map((aday, idx) => (
                        <div key={idx} style={{ background: "#fff", border: "1.5px solid #E4DFD1", borderRadius: 12, padding: 12,
                          ...(seciliProje.onaylananStilEtiket === aday.etiket ? { borderColor: "#4FAF7A", borderWidth: 2 } : {}) }}>
                          <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{aday.etiket}</div>
                          <div style={{ fontSize: 11, color: "#6f6f6c", marginBottom: 8, lineHeight: 1.5, minHeight: 55 }}>{aday.stilTanimi}</div>
                          {aday.gorselUrl && <img src={aday.gorselUrl} style={{ width: "100%", borderRadius: 8, marginBottom: 8 }} />}
                          {!aday.gorselUrl ? (
                            <button style={{ ...stil.buton, width: "100%", fontSize: 11, padding: "8px 10px",
                              ...(stilUretiliyorIdx !== null ? stil.butonPasif : {}) }}
                              disabled={stilUretiliyorIdx !== null} onClick={() => stilOrnegiUret(idx)}>
                              {stilUretiliyorIdx === idx ? "Üretiliyor..." : "Örnek Üret"}
                            </button>
                          ) : seciliProje.onaylananStilEtiket === aday.etiket ? (
                            <div style={{ ...stil.rozet, width: "100%", textAlign: "center", boxSizing: "border-box" }}>✓ Onaylandı</div>
                          ) : (
                            <button style={{ ...stil.buton, width: "100%", fontSize: 11, padding: "8px 10px", background: "#4FAF7A" }}
                              onClick={() => stiliOnayla(idx)}>
                              Bu Stili Onayla
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EKLENDİ (14 Ağu 2026): ③ KARAKTER aşaması — gerçek akış.
                    Karakter ekle (isim + açıklama), her biri için onaylı
                    stille bir referans görsel üret, en az bir karakter
                    varsa sahnelere geç. */}
                {seciliProje.asama === "karakter" && (

                  <div>
                    <div style={{ fontSize: 12, color: "#4FAF7A", marginBottom: 14 }}>
                      ✓ Stil onaylandı — <b>{seciliProje.onaylananStilEtiket}</b>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <input style={stil.input} placeholder="Karakter adı (örn. Zeynep)"
                        value={yeniKarakterAd} onChange={(e) => setYeniKarakterAd(e.target.value)} />
                      <input style={stil.input} placeholder="Açıklama (örn. 7 yaşında, kısa siyah saçlı, kırmızı önlüklü)"
                        value={yeniKarakterAciklama} onChange={(e) => setYeniKarakterAciklama(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && karakterEkle()} />
                      <button style={{ ...stil.buton, whiteSpace: "nowrap" }} onClick={karakterEkle}>+ Ekle</button>
                    </div>

                    {!(seciliProje.karakterler || []).length && (
                      <div style={{ fontSize: 13, color: "#6f6f6c", marginBottom: 16 }}>Henüz karakter eklenmedi.</div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
                      {(seciliProje.karakterler || []).map((k, idx) => (
                        <div key={idx} style={{ background: "#fff", border: "1.5px solid #E4DFD1", borderRadius: 12, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13 }}>{k.ad}</div>
                            <span onClick={() => karakterSil(idx)} style={{ color: "#C0392B", cursor: "pointer", fontSize: 12 }}>✕</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#6f6f6c", margin: "4px 0 8px", minHeight: 30 }}>{k.aciklama}</div>
                          {k.gorselUrl && (
                            <div style={{ marginBottom: 8 }}>
                              <img src={k.gorselUrl} style={{ width: "100%", borderRadius: 8 }} />
                              <span onClick={() => gorselIndir(k.gorselUrl, `karakter-${k.ad}`)} style={{ fontSize: 10, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 2 }}>⬇ İndir</span>
                            </div>
                          )}
                          {!k.gorselUrl && (
                            <button style={{ ...stil.buton, width: "100%", fontSize: 11, padding: "8px 10px",
                              ...(karakterUretiliyorIdx !== null ? stil.butonPasif : {}) }}
                              disabled={karakterUretiliyorIdx !== null} onClick={() => karakterGorseliUret(idx)}>
                              {karakterUretiliyorIdx === idx ? "Üretiliyor..." : "Referans Üret"}
                            </button>
                          )}
                          {/* EKLENDİ (14 Ağu 2026): 6. parça — ek poz/ifade. Karakter
                              tutarlılığını güçlendirmek için aynı referansla farklı
                              poz/ifade üretme. */}
                          {k.gorselUrl && (
                            <div style={{ marginTop: 8 }}>
                              <input style={{ ...stil.input, fontSize: 11, padding: "6px 8px" }} placeholder="Ek poz (örn. gülümseyen, yandan)"
                                value={ekPozTarifleri[idx] || ""} onChange={(e) => setEkPozTarifleri((t) => ({ ...t, [idx]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && ekPozUret(idx)} />
                              <button style={{ ...stil.buton, width: "100%", fontSize: 11, padding: "6px 8px", marginTop: 4,
                                ...(ekPozUretiliyorIdx !== null ? stil.butonPasif : {}) }}
                                disabled={ekPozUretiliyorIdx !== null} onClick={() => ekPozUret(idx)}>
                                {ekPozUretiliyorIdx === idx ? "Üretiliyor..." : "+ Ek Poz Ekle"}
                              </button>
                              {(k.ekPozlar || []).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                  {k.ekPozlar.map((e, eIdx) => (
                                    <img key={eIdx} src={e.gorselUrl} title={e.tarif + " — kaldırmak için tıkla"} onClick={() => ekPozSil(idx, eIdx)}
                                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #E4DFD1" }} />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {(seciliProje.karakterler || []).length > 0 && (
                      <button style={{ ...stil.buton, background: "#4FAF7A" }} onClick={kitapUretimineGec}>
                        Kitap Üretimine Geç →
                      </button>
                    )}
                  </div>
                )}

                {/* DEĞİŞTİRİLDİ (15 Ağu 2026): ④ Kitap Üretimi aşaması, 1. parça —
                    kitap metni yükleme + otomatik sahne bölme. */}
                {seciliProje.asama === "uretim" && (
                  <div>
                    <div style={{ fontSize: 12, color: "#4FAF7A", marginBottom: 14 }}>
                      ✓ Stil: <b>{seciliProje.onaylananStilEtiket}</b> · Karakter: <b>{(seciliProje.karakterler || []).length}</b> · Sayfa çifti: <b>{(seciliProje.spreadler || []).length}</b>
                    </div>

                    {/* EKLENDİ (14 Ağu 2026): ④ Kitap Üretimi, 2. parça — künye + kapaklar */}
                    <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E", marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Özellikler ve Künye</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input style={stil.input} placeholder="Genişlik (cm) örn. 20" value={seciliProje.ozellikler?.genislikCm || ""}
                          onChange={(e) => ozellikGuncelle("genislikCm", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Yükseklik (cm) örn. 20" value={seciliProje.ozellikler?.yukseklikCm || ""}
                          onChange={(e) => ozellikGuncelle("yukseklikCm", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Basım tarihi örn. 2026" value={seciliProje.ozellikler?.basimTarihi || ""}
                          onChange={(e) => ozellikGuncelle("basimTarihi", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input style={stil.input} placeholder="ISBN" value={seciliProje.ozellikler?.isbn || ""}
                          onChange={(e) => ozellikGuncelle("isbn", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Yayınevi" value={seciliProje.ozellikler?.yayinevi || "MST Yayıncılık"}
                          onChange={(e) => ozellikGuncelle("yayinevi", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Basım adedi" value={seciliProje.ozellikler?.basimAdedi || ""}
                          onChange={(e) => ozellikGuncelle("basimAdedi", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input style={stil.input} placeholder="İllüstrasyon (kredi)" value={seciliProje.ozellikler?.illustrasyonKredi || "MST Çocuk Stüdyo"}
                          onChange={(e) => ozellikGuncelle("illustrasyonKredi", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                        <input style={stil.input} placeholder="Baskı yeri (matbaa)" value={seciliProje.ozellikler?.baskiYeri || ""}
                          onChange={(e) => ozellikGuncelle("baskiYeri", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                      </div>
                      <input style={{ ...stil.input, marginBottom: 10 }} placeholder="Ek not" value={seciliProje.ozellikler?.ekNot || ""}
                        onChange={(e) => ozellikGuncelle("ekNot", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                      <button style={{ ...stil.buton, ...(kunyeUretiliyorMu ? stil.butonPasif : {}) }} disabled={kunyeUretiliyorMu} onClick={kunyeUret}>
                        {kunyeUretiliyorMu ? "Oluşturuluyor..." : "Künye Sayfasını Oluştur"}
                      </button>
                      {seciliProje.kunyeGorselUrl && (
                        <div style={{ maxWidth: 220, marginTop: 12 }}>
                          <img src={seciliProje.kunyeGorselUrl} style={{ width: "100%", borderRadius: 8, display: "block" }} />
                          <span onClick={() => gorselIndir(seciliProje.kunyeGorselUrl, "kunye")} style={{ fontSize: 11, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 4 }}>⬇ İndir</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E" }}>
                        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Ön Kapak</div>
                        <textarea style={{ ...stil.input, minHeight: 70 }} placeholder="Kapak görseli ne göstermeli?"
                          value={seciliProje.onKapakSahne || ""} onChange={(e) => setSeciliProje({ ...seciliProje, onKapakSahne: e.target.value })}
                          onBlur={() => metaKaydet(seciliProje)} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button style={{ ...stil.buton, fontSize: 12, ...(onKapakUretiliyorMu ? stil.butonPasif : {}) }} disabled={onKapakUretiliyorMu} onClick={onKapakUret}>
                            {onKapakUretiliyorMu ? "Üretiliyor..." : "Ön Kapağı Üret"}
                          </button>
                          {seciliProje.onKapakHamUrl && (
                            <button style={{ ...stil.buton, fontSize: 12, ...(onKapakUretiliyorMu ? stil.butonPasif : {}) }} disabled={onKapakUretiliyorMu} onClick={onKapakYaziYenidenYerlestir}>
                              Yazıyı Yenile
                            </button>
                          )}
                        </div>
                        {seciliProje.onKapakGorselUrl && (
                          <div style={{ marginTop: 10 }}>
                            <img src={seciliProje.onKapakGorselUrl} style={{ width: "100%", borderRadius: 8 }} />
                            <span onClick={() => gorselIndir(seciliProje.onKapakGorselUrl, "on-kapak")} style={{ fontSize: 11, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 4 }}>⬇ İndir</span>
                          </div>
                        )}
                      </div>
                      <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E" }}>
                        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Arka Kapak</div>
                        <textarea style={{ ...stil.input, minHeight: 50 }} placeholder="Arka kapak görseli (opsiyonel, boşsa düz zemin)"
                          value={seciliProje.arkaKapakSahne || ""} onChange={(e) => setSeciliProje({ ...seciliProje, arkaKapakSahne: e.target.value })}
                          onBlur={() => metaKaydet(seciliProje)} />
                        <textarea style={{ ...stil.input, minHeight: 60, marginTop: 8 }} placeholder="Arka kapak yazısı"
                          value={seciliProje.kapakArkasiYazisi || ""} onChange={(e) => setSeciliProje({ ...seciliProje, kapakArkasiYazisi: e.target.value })}
                          onBlur={() => metaKaydet(seciliProje)} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button style={{ ...stil.buton, fontSize: 12, ...(arkaKapakUretiliyorMu ? stil.butonPasif : {}) }} disabled={arkaKapakUretiliyorMu} onClick={arkaKapakUret}>
                            {arkaKapakUretiliyorMu ? "Üretiliyor..." : "Arka Kapağı Üret"}
                          </button>
                          {seciliProje.arkaKapakHamUrl && (
                            <button style={{ ...stil.buton, fontSize: 12, ...(arkaKapakUretiliyorMu ? stil.butonPasif : {}) }} disabled={arkaKapakUretiliyorMu} onClick={arkaKapakYaziYenidenYerlestir}>
                              Yazıyı Yenile
                            </button>
                          )}
                        </div>
                        {seciliProje.arkaKapakGorselUrl && (
                          <div style={{ marginTop: 10 }}>
                            <img src={seciliProje.arkaKapakGorselUrl} style={{ width: "100%", borderRadius: 8 }} />
                            <span onClick={() => gorselIndir(seciliProje.arkaKapakGorselUrl, "arka-kapak")} style={{ fontSize: 11, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 4 }}>⬇ İndir</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EKLENDİ (14 Ağu 2026): ③ Sahneler, 3. parça — sayfa çiftleri */}
                    <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E", marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sayfa Çiftleri</div>
                      <div style={{ fontSize: 12, color: "#6f6f6c", marginBottom: 12 }}>
                        Her kart bir sayfa ÇİFTİ (ör. sayfa 2-3). Tek bir geniş görsel üretilip ortadan bölünüyor, kitap açıldığında kesintisiz görünsün diye.
                        Sayfa 1 künye sayfasıdır, çiftler 2. sayfadan başlar.
                      </div>
                      {(seciliProje.spreadler || []).map((s, idx) => {
                        const { solSayfa, sagSayfa } = spreadNumaralariGetir(idx);
                        return (
                          <div key={idx} style={{ background: "#fff", border: "1.5px solid #E4DFD1", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#6f6f6c" }}>Sayfa {solSayfa} — {sagSayfa}</div>
                            <textarea style={{ ...stil.input, minHeight: 60 }} placeholder="Sahne (iki sayfaya birden yayılan tek kompozisyon)"
                              value={s.sahne} onChange={(e) => spreadAlanGuncelle(idx, "sahne", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                              <div>
                                <textarea style={{ ...stil.input, minHeight: 50 }} placeholder="Sol sayfa metni" value={s.solMetin}
                                  onChange={(e) => spreadAlanGuncelle(idx, "solMetin", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                                <label style={{ fontSize: 11, color: "#6f6f6c", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                  <input type="checkbox" checked={s.solMetinsiz} onChange={(e) => metaKaydet(spreadAlanGuncelle(idx, "solMetinsiz", e.target.checked))} /> Sol sayfa metinsiz
                                </label>
                              </div>
                              <div>
                                <textarea style={{ ...stil.input, minHeight: 50 }} placeholder="Sağ sayfa metni" value={s.sagMetin}
                                  onChange={(e) => spreadAlanGuncelle(idx, "sagMetin", e.target.value)} onBlur={() => metaKaydet(seciliProje)} />
                                <label style={{ fontSize: 11, color: "#6f6f6c", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                  <input type="checkbox" checked={s.sagMetinsiz} onChange={(e) => metaKaydet(spreadAlanGuncelle(idx, "sagMetinsiz", e.target.checked))} /> Sağ sayfa metinsiz
                                </label>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              <button style={{ ...stil.buton, fontSize: 12, ...(spreadUretiliyorIdx !== null ? stil.butonPasif : {}) }}
                                disabled={spreadUretiliyorIdx !== null} onClick={() => spreadUret(idx)}>
                                {spreadUretiliyorIdx === idx ? "Üretiliyor..." : "Bu Sayfa Çiftini Üret"}
                              </button>
                              {s.solGorselUrl && (
                                <button style={{ ...stil.buton, fontSize: 12, ...(spreadUretiliyorIdx !== null ? stil.butonPasif : {}) }}
                                  disabled={spreadUretiliyorIdx !== null} onClick={() => spreadMetniYenidenYerlestir(idx)}>
                                  Metni Yenile
                                </button>
                              )}
                              <span onClick={() => spreadSil(idx)} style={{ color: "#C0392B", cursor: "pointer", fontSize: 12, alignSelf: "center" }}>Sil</span>
                            </div>
                            {s.solGorselUrl && (
                              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                <div style={{ width: "calc(50% - 3px)" }}>
                                  <img src={s.solGorselUrl} style={{ width: "100%", borderRadius: 8 }} />
                                  <span onClick={() => gorselIndir(s.solGorselUrl, `sayfa-${solSayfa}`)} style={{ fontSize: 11, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 4 }}>⬇ İndir</span>
                                </div>
                                <div style={{ width: "calc(50% - 3px)" }}>
                                  <img src={s.sagGorselUrl} style={{ width: "100%", borderRadius: 8 }} />
                                  <span onClick={() => gorselIndir(s.sagGorselUrl, `sayfa-${sagSayfa}`)} style={{ fontSize: 11, color: "#3E8ED0", cursor: "pointer", display: "inline-block", marginTop: 4 }}>⬇ İndir</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button style={stil.buton} onClick={spreadEkle}>+ Sayfa Çifti Ekle</button>
                    </div>

                    {/* EKLENDİ: 4-5. parça — Üretim (tümünü üret, maliyet, PDF, önizleme) */}
                    <div style={{ background: "#FBF9F6", borderRadius: 16, padding: 18, border: "2px solid #F4A83E" }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Üretim</div>

                      {/* EKLENDİ (14 Ağu 2026, Bedirhan'ın seçtiği "Balon Uçuşu" tasarımı):
                          üretim aktifken, tamamlanan her görsel için bir balon gökyüzüne
                          uçuyor, ortada büyük yüzde gösteriliyor. */}
                      {aktifUretimIlerleme[seciliProje.id] && (() => {
                        const ilerleme = aktifUretimIlerleme[seciliProje.id];
                        const yuzde = Math.round((ilerleme.mevcut / Math.max(1, ilerleme.toplam)) * 100);
                        const renkler = ["#E85D75", "#F4A83E", "#4FAF7A", "#3E8ED0", "#D4537E"];
                        return (
                          <div style={{ position: "relative", height: 120, borderRadius: 12, overflow: "hidden", marginBottom: 14, background: "linear-gradient(180deg,#DCEEFB,#FFFFFF)" }}>
                            <style>{`
                              @keyframes mstBalonUc { 0%{ bottom:-40px; opacity:0; } 10%{ opacity:1; } 90%{ opacity:1; } 100%{ bottom:130px; opacity:0; } }
                              .mst-balon { position:absolute; width:22px; height:28px; border-radius:50% 50% 50% 50%/60% 60% 40% 40%; animation:mstBalonUc 3.2s ease-in infinite; }
                            `}</style>
                            {Array.from({ length: Math.max(3, Math.min(6, ilerleme.toplam)) }).map((_, i) => (
                              <div key={i} className="mst-balon" style={{ left: `${10 + i * 16}%`, background: renkler[i % renkler.length], animationDelay: `${i * 0.6}s` }} />
                            ))}
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 30, color: "#18181a" }}>%{yuzde}</div>
                              <div style={{ fontSize: 12, color: "#6f6f6c", marginTop: 2 }}>{ilerleme.mevcut} / {ilerleme.toplam} sayfa çifti tamamlandı</div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#6f6f6c", display: "block" }}>İstekler arası bekleme (sn)</label>
                          <input style={{ ...stil.input, width: 80 }} value={beklemeSn} onChange={(e) => setBeklemeSn(e.target.value)} />
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <div style={{ fontSize: 11, color: "#6f6f6c" }}>Tahmini harcama (bu oturumda)</div>
                          <div style={{ fontWeight: 700 }}>${toplamMaliyet.toFixed(2)} (~₺{Math.round(toplamMaliyet * 48)})</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button style={{ ...stil.buton, background: "#4FAF7A", ...(aktifUretimIlerleme[seciliProje.id] ? stil.butonPasif : {}) }}
                          disabled={!!aktifUretimIlerleme[seciliProje.id]} onClick={() => tumunuUret()}>
                          {aktifUretimIlerleme[seciliProje.id] ? `Üretiliyor... (%${Math.round((aktifUretimIlerleme[seciliProje.id].mevcut / Math.max(1, aktifUretimIlerleme[seciliProje.id].toplam)) * 100)})` : "Eksik Olanları Üret (Sırayla)"}
                        </button>
                        <button style={stil.buton} disabled={kitapSayfaListesiOlustur().length === 0} onClick={kitapiOnizle}>Kitabı Önizle</button>
                        <button style={{ ...stil.buton, ...(pdfHazirlaniyorMu ? stil.butonPasif : {}) }}
                          disabled={pdfHazirlaniyorMu || kitapSayfaListesiOlustur().length === 0} onClick={pdfIndir}>
                          {pdfHazirlaniyorMu ? "Hazırlanıyor..." : "PDF Olarak İndir"}
                        </button>
                        <button style={{ ...stil.buton, color: "#C0392B" }} onClick={uretimiSifirla}>Kalite Değişti, Yeniden Üretime Hazırla</button>
                      </div>
                      <p style={{ fontSize: 11, color: "#6f6f6c", marginTop: 10, lineHeight: 1.6 }}>
                        Eksik olanları üret sadece görseli olmayanları üretir — tamamlananları tekrar üretip para harcamaz. Başarısız bir görsel otomatik olarak
                        2 kez tekrar denenir (hız limitinde daha uzun beklenerek). PDF, doğru sayfa sırasında baskıya gönderilebilecek tek dosyadır — ama görseller
                        ekran çözünürlüğünde (~130 DPI), gerçek baskı öncesi üst ölçekleme (upscaling) konusu ayrı konuşulmalı.
                      </p>
                    </div>

                    {onizlemeAcikMi && (() => {
                      const liste = kitapSayfaListesiOlustur();
                      const sayfa = liste[Math.min(onizlemeIndex, liste.length - 1)];
                      return (
                        <div style={{ background: "#fff", border: "2px solid #F4A83E", borderRadius: 16, padding: 18, marginTop: 16, textAlign: "center" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14 }}>Kitap Önizleme</div>
                            <span onClick={() => setOnizlemeAcikMi(false)} style={{ cursor: "pointer", fontSize: 12, color: "#6f6f6c" }}>Kapat</span>
                          </div>
                          {sayfa && <img src={sayfa.url} style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 10, border: "1px solid #E4DFD1" }} />}
                          <p style={{ fontWeight: 600, margin: "12px 0 8px" }}>{sayfa ? `${sayfa.etiket} · ${onizlemeIndex + 1} / ${liste.length}` : ""}</p>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button style={stil.buton} disabled={onizlemeIndex === 0} onClick={() => setOnizlemeIndex((i) => i - 1)}>← Önceki</button>
                            <button style={stil.buton} disabled={onizlemeIndex >= liste.length - 1} onClick={() => setOnizlemeIndex((i) => i + 1)}>Sonraki →</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function DemoHesaplar({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [yeni, setYeni] = useState({ hedefPaket: "profesyonel" });
  const [acik, setAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState("");

  const yukle = async () => {
    try {
      const r = await authFetch("/api/admin/demo/liste");
      const d = await r.json();
      if (d.ok) setVeri(d); else setSonuc(d.error || "Okunamadı.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
  };
  useEffect(() => { yukle(); }, []);

  const olustur = async () => {
    if (calisiyor || !yeni.adayAd) return;
    setCalisiyor(true); setSonuc("");
    try {
      const r = await authFetch("/api/admin/demo/olustur", { method: "POST", body: JSON.stringify(yeni) });
      const d = await r.json();
      if (d.ok) {
        setSonuc(`Demo hazır: ${d.link}`);
        setYeni({ hedefPaket: "profesyonel" }); setAcik(false); yukle();
        try { navigator.clipboard.writeText(d.link); } catch {}
      } else setSonuc(d.error || "Oluşturulamadı.");
    } catch { setSonuc("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const durumDegistir = async (id, durum) => {
    await authFetch(`/api/admin/demo/${id}/durum`, { method: "POST", body: JSON.stringify({ durum }) });
    yukle();
  };

  const inputStyle = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  if (!veri) return <div style={{ color: THEME.textMuted, fontSize: 13 }}>{sonuc || "Yükleniyor..."}</div>;
  const o = veri.ozet;

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Demo Hesaplar</h2>
      <div style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 1.55, maxWidth: 720 }}>
        Yazar adayı için kişisel bir yolculuk provası oluşturun. Aday bağlantıya tıklayınca
        kendi adı ve kitabının adıyla dolu sekiz adımlık bir deneyim görür — pano, yayın süreci,
        telif, tanıtım, danışman, paket karşılaştırması ve başvuru formu. Giriş gerekmez.
      </div>

      <div style={{ display: "flex", gap: 22, marginBottom: 16, flexWrap: "wrap" }}>
        {[["Gönderildi", o.gonderildi, THEME.textFaint], ["Açıldı", o.acildi, THEME.warn],
          ["Form doldurdu", o.formDolduruldu, THEME.danger], ["Sözleşme", o.sozlesme, THEME.success]].map(([e, v, c]) => (
          <div key={e}>
            <div style={{ fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted }}>{e}</div>
          </div>
        ))}
      </div>

      {sonuc && <div style={{ fontSize: 12.5, color: THEME.textLight, marginBottom: 14, background: THEME.panelBgAlt, padding: "10px 12px", borderRadius: 6, wordBreak: "break-all" }}>{sonuc}</div>}

      {!acik ? (
        <Btn onClick={() => setAcik(true)}>+ Yeni demo oluştur</Btn>
      ) : (
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            <input style={inputStyle} placeholder="Aday adı soyadı *" value={yeni.adayAd || ""} onChange={(e) => setYeni({ ...yeni, adayAd: e.target.value })} />
            <input style={inputStyle} placeholder="Eserinin adı" value={yeni.kitapAdi || ""} onChange={(e) => setYeni({ ...yeni, kitapAdi: e.target.value })} />
            <input style={inputStyle} placeholder="Türü (roman, şiir...)" value={yeni.kitapTuru || ""} onChange={(e) => setYeni({ ...yeni, kitapTuru: e.target.value })} />
            <input style={inputStyle} placeholder="Telefon" value={yeni.telefon || ""} onChange={(e) => setYeni({ ...yeni, telefon: e.target.value })} />
            <select style={inputStyle} value={yeni.hedefPaket} onChange={(e) => setYeni({ ...yeni, hedefPaket: e.target.value })}>
              <option value="standart">Başlangıç paketine yönlendir</option>
              <option value="profesyonel">Profesyonel paketine yönlendir</option>
              <option value="vip">VIP paketine yönlendir</option>
            </select>
            <input style={inputStyle} placeholder="İç not (adaya görünmez)" value={yeni.notlar || ""} onChange={(e) => setYeni({ ...yeni, notlar: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn small disabled={calisiyor || !yeni.adayAd} onClick={olustur}>{calisiyor ? "Oluşturuluyor..." : "Oluştur ve linki kopyala"}</Btn>
            <Btn small variant="ghost" onClick={() => setAcik(false)}>Vazgeç</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
        {veri.demolar.map((x) => {
          const dd = DEMO_DURUM[x.durum] || DEMO_DURUM.gonderildi;
          const fv = x.form_verisi || {};
          return (
            <div key={x.id} style={{ background: THEME.panelBg, border: `1px solid ${x.durum === "form_dolduruldu" ? dd.renk : THEME.border}`, borderRadius: 8, padding: "13px 15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: THEME.textLight, fontWeight: 600 }}>{x.aday_ad}</div>
                  {x.kitap_adi && <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 2 }}>{x.kitap_adi}</div>}
                  <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 5 }}>
                    {x.goruntulenme > 0
                      ? `${x.goruntulenme} kez açıldı · ${DEMO_ADIMLAR[x.ulasilan_adim] || "başlangıç"} adımına kadar geldi`
                      : "Henüz açılmadı"}
                    {x.telefon ? ` · ${x.telefon}` : ""}
                  </div>
                  {x.notlar && <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 4, fontStyle: "italic" }}>{x.notlar}</div>}
                  {x.form_tarihi && (
                    <div style={{ fontSize: 12, color: THEME.success, marginTop: 6, lineHeight: 1.5 }}>
                      Form: {fv.adSoyad} · {fv.telefon}{fv.eposta ? ` · ${fv.eposta}` : ""}
                      {x.secilen_paket ? ` · ${x.secilen_paket} paketi` : ""}
                      {fv.mesaj ? <div style={{ color: THEME.textMuted, marginTop: 3 }}>"{fv.mesaj}"</div> : null}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 10.5, color: dd.renk, border: `1px solid ${dd.renk}`, borderRadius: 12, padding: "3px 9px", whiteSpace: "nowrap" }}>{dd.ad}</span>
                  <div style={{ marginTop: 8, display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <Btn small variant="ghost" onClick={() => { try { navigator.clipboard.writeText(x.link); setSonuc("Link kopyalandı: " + x.link); } catch {} }}>Link</Btn>
                    {x.durum === "form_dolduruldu" && <Btn small onClick={() => durumDegistir(x.id, "sozlesmeye_gecti")}>Sözleşmeye geçti</Btn>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {veri.demolar.length === 0 && <div style={{ color: THEME.textFaint, fontSize: 13 }}>Henüz demo oluşturulmadı.</div>}
      </div>
    </div>
  );
}

// ============ Kreatif Üretim Motoru ============
// Sistem video üretemez ama üretim ihtiyacını azaltır: organik içeriği
// reklama çevirir, varyasyon önerir, ne üretileceğini kesin söyler.
function KreatifUretim({ authFetch }) {
  const [sekme, setSekme] = useState("organik");
  const [organik, setOrganik] = useState(null);
  const [brief, setBrief] = useState(null);
  const [kuyruk, setKuyruk] = useState(null);
  const [metinler, setMetinler] = useState(null);
  const [secilenMetinler, setSecilenMetinler] = useState([]);
  const [senaryo, setSenaryo] = useState(null);
  const [senaryoAci, setSenaryoAci] = useState("duygusal");
  const [performans, setPerformans] = useState(null);
  const [calisiyor, setCalisiyor] = useState("");
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  // EKLENDİ (8 Ağu 2026, kullanıcı talebi — "ben sistemden görseli kendim
  // yükleyebileyim o çok önemli"): önceden Meta'ya hiç görsel gönderilmiyordu,
  // hedef sayfanın önizleme görseli olmadığı için Meta alakasız bir görsel
  // kullanmıştı. Artık görsel yükleme zorunlu ve admin kendi seçiyor.
  // GENİŞLETİLDİ (9 Ağu 2026, "story formatına ayrı, gönderi formatı ayrı
  // oluyor... öyle basit yükle geçle olmaz" geri bildirimi): artık Feed
  // (1:1/4:5) ve Story/Reels (9:16) için AYRI görsel yükleniyor, oran
  // kontrolü ve gerçek Meta önizlemesiyle birlikte — bkz. admin.js
  // formatOranKontrol / kreatifGovdesiOlustur / /admin/reklam/onizleme.
  const [gorselFeed, setGorselFeed] = useState(null); // { dataUrl, dosyaAdi, genislik, yukseklik }
  const [gorselFeedHash, setGorselFeedHash] = useState(null);
  const [gorselFeedUyari, setGorselFeedUyari] = useState(null);
  const [gorselFeedYukleniyor, setGorselFeedYukleniyor] = useState(false);
  const [gorselStory, setGorselStory] = useState(null);
  const [gorselStoryHash, setGorselStoryHash] = useState(null);
  const [gorselStoryUyari, setGorselStoryUyari] = useState(null);
  const [gorselStoryYukleniyor, setGorselStoryYukleniyor] = useState(false);
  const [onizlemeler, setOnizlemeler] = useState(null); // { feed, story }
  const [onizlemeYukleniyor, setOnizlemeYukleniyor] = useState(false);

  const cagir = async (yol, ayar, etiket) => {
    setCalisiyor(etiket); setHata(""); setMesaj("");
    try {
      const r = await authFetch(yol, ayar);
      const d = await r.json();
      if (!d.ok) { setHata(d.error || "İşlem başarısız."); return null; }
      if (d.mesaj) setMesaj(d.mesaj);
      return d;
    } catch { setHata("Sunucuya ulaşılamadı."); return null; }
    finally { setCalisiyor(""); }
  };

  const organikTara = async () => { const d = await cagir("/api/admin/reklam/organik-tara", {}, "organik"); if (d) setOrganik(d); };
  const briefAl = async () => { const d = await cagir("/api/admin/reklam/kreatif-brief", {}, "brief"); if (d) setBrief(d); };
  const kuyrukAl = async () => { const d = await cagir("/api/admin/reklam/kuyruk", {}, "kuyruk"); if (d) setKuyruk(d); };
  const metinUret = async () => { const d = await cagir("/api/admin/reklam/metin-uret?adet=8", {}, "metin"); if (d) { setMetinler(d); setSecilenMetinler([]); } };
  const senaryoAl = async (aci) => { setSenaryoAci(aci); const d = await cagir(`/api/admin/reklam/senaryo?aci=${aci}&sure=20`, {}, "senaryo"); if (d) setSenaryo(d); };
  const performansAl = async () => { const d = await cagir("/api/admin/reklam/metin-performans", {}, "performans"); if (d) setPerformans(d); };

  // Görsel seçildiğinde hem dosya okunur hem GERÇEK piksel boyutu (naturalWidth/
  // Height) öğrenilir — tarayıcı zaten decode ediyor, sunucuya ekstra bir
  // görsel kütüphanesi eklemeye gerek kalmadan oran kontrolü yapılabiliyor.
  const gorselSecOlustur = (format) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const setHashFn = format === "feed" ? setGorselFeedHash : setGorselStoryHash;
    const setUyariFn = format === "feed" ? setGorselFeedUyari : setGorselStoryUyari;
    const setOnizlemeFn = format === "feed" ? setGorselFeed : setGorselStory;
    setHashFn(null); setUyariFn(null); setOnizlemeler(null); setHata("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setOnizlemeFn({ dataUrl: reader.result, dosyaAdi: f.name, genislik: img.naturalWidth, yukseklik: img.naturalHeight });
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  };
  const gorselSecFeed = gorselSecOlustur("feed");
  const gorselSecStory = gorselSecOlustur("story");

  const gorseliYukleOlustur = (format) => async () => {
    const gorsel = format === "feed" ? gorselFeed : gorselStory;
    if (!gorsel) return;
    const setYukleniyorFn = format === "feed" ? setGorselFeedYukleniyor : setGorselStoryYukleniyor;
    const setHashFn = format === "feed" ? setGorselFeedHash : setGorselStoryHash;
    const setUyariFn = format === "feed" ? setGorselFeedUyari : setGorselStoryUyari;
    setYukleniyorFn(true); setHata(""); setMesaj(""); setOnizlemeler(null);
    try {
      const r = await authFetch("/api/admin/reklam/gorsel-yukle", {
        method: "POST", body: JSON.stringify({
          dataUrl: gorsel.dataUrl, format, genislik: gorsel.genislik, yukseklik: gorsel.yukseklik,
        }) });
      const d = await r.json();
      if (!d.ok) { setHata(d.error || "Görsel yüklenemedi."); return; }
      setHashFn(d.imageHash);
      setUyariFn(d.oranUyarisi || null);
      setMesaj(d.mesaj);
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setYukleniyorFn(false); }
  };
  const gorseliYukleFeed = gorseliYukleOlustur("feed");
  const gorseliYukleStory = gorseliYukleOlustur("story");

  // Reklamı yayınlamadan önce Meta'nın KENDİ render motorundan gerçek
  // önizleme ister — tahmin değil, Meta'nın /generatepreviews API'si.
  const onizlemeGetir = async () => {
    if (!gorselFeedHash || !secilenMetinler.length) return;
    setOnizlemeYukleniyor(true); setHata(""); setOnizlemeler(null);
    try {
      const secilen = metinler.metinler[secilenMetinler[0]];
      const r = await authFetch("/api/admin/reklam/onizleme", {
        method: "POST", body: JSON.stringify({
          imageHashFeed: gorselFeedHash, imageHashStory: gorselStoryHash || undefined,
          mesaj: secilen.metin, baslik: secilen.baslik, aciklama: secilen.aciklama,
        }) });
      const d = await r.json();
      if (!d.ok) { setHata(d.error || "Önizleme alınamadı."); return; }
      setOnizlemeler(d.onizlemeler);
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setOnizlemeYukleniyor(false); }
  };

  const metinleriYayinla = async () => {
    if (!secilenMetinler.length) { setHata("En az bir metin seçin."); return; }
    if (!gorselFeedHash) { setHata("Önce Feed görselini yükleyin — görselsiz reklam yayınlanamıyor."); return; }
    const storyNotu = gorselStoryHash ? "" : "\n\nNot: Story/Reels görseli yüklemediniz — Meta, Feed görselinizi otomatik kırparak kullanacak.";
    if (!window.confirm(`${secilenMetinler.length} kreatif tek reklam setinde yayına alınacak.\n\nGünlük 300 ₺, 14 gün. Meta hangisinin kazandığını kendisi bulacak.${storyNotu}\n\nOnaylıyor musun?`)) return;
    const secilen = metinler.metinler.filter((_, i) => secilenMetinler.includes(i));
    const d = await cagir("/api/admin/reklam/metinden-reklam", {
      method: "POST", body: JSON.stringify({
        metinler: secilen, gunlukButce: 300, gun: 14,
        imageHashFeed: gorselFeedHash, imageHashStory: gorselStoryHash || undefined,
      }) }, "yayinla");
    if (d) setSecilenMetinler([]);
  };

  const reklamlastir = async (g) => {
    if (!window.confirm(`Bu Instagram gönderisi reklama çevrilecek.\n\nMevcut ${g.begeni} beğeni ve ${g.yorum} yorum reklamla birlikte taşınacak.\n\nGünlük 200 ₺, 14 gün. Onaylıyor musun?`)) return;
    const d = await cagir("/api/admin/reklam/organik-reklamlastir", {
      method: "POST", body: JSON.stringify({ gonderiId: g.id, gunlukButce: 200, gun: 14 }) }, "reklamlastir");
    if (d) organikTara();
  };

  const kuyrugaAl = async (b) => {
    const d = await cagir("/api/admin/reklam/kuyruga-al", { method: "POST", body: JSON.stringify({ brief: b }) }, "kuyruga");
    if (d) kuyrukAl();
  };

  const durumDegistir = async (id, durum) => {
    await cagir(`/api/admin/reklam/kuyruk/${id}/durum`, { method: "POST", body: JSON.stringify({ durum }) }, "durum");
    kuyrukAl();
  };

  useEffect(() => { if (sekme === "kuyruk" && !kuyruk) kuyrukAl(); }, [sekme]);

  const oncelikRenk = { 1: THEME.danger, 2: THEME.warn, 3: THEME.warn, 4: THEME.cyan, 5: THEME.textFaint };
  const durumAd = { bekliyor: "Bekliyor", uretiliyor: "Üretiliyor", hazir: "Hazır", yayinda: "Yayında" };
  const durumRenk = { bekliyor: THEME.warn, uretiliyor: THEME.cyan, hazir: THEME.success, yayinda: THEME.textFaint };

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(46,125,50,.08), rgba(0,0,0,0))", border: `2px solid ${THEME.success}`, borderRadius: 8, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: THEME.textLight }}>Kreatif Üretim Motoru</div>
        <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.65, maxWidth: 700 }}>
          Performansın büyük kısmı kreatiften geliyor ve sistem video üretemez. Ama üretim
          <b style={{ color: THEME.success }}> ihtiyacını azaltabilir</b>: Instagram'da zaten yayınlanmış
          içeriğinizi reklama çevirir, kazanan kreatiften varyasyon önerir ve ne üretileceğini
          tahminle değil veriyle söyler.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["organik", "Instagram → Reklam"], ["metin", "Metin üret"], ["senaryo", "Video senaryosu"],
          ["brief", "Ne üretmeli?"], ["performans", "Hangi açı kazanıyor?"], ["kuyruk", "Üretim kuyruğu"]].map(([k, ad]) => (
          <Btn key={k} small variant={sekme === k ? undefined : "ghost"} onClick={() => {
            setSekme(k);
            if (k === "organik" && !organik) organikTara();
            if (k === "brief" && !brief) briefAl();
            if (k === "kuyruk") kuyrukAl();
            if (k === "metin" && !metinler) metinUret();
            if (k === "senaryo" && !senaryo) senaryoAl("duygusal");
            if (k === "performans") performansAl();
          }}>{ad}</Btn>
        ))}
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginBottom: 10 }}>{hata}</div>}
      {mesaj && <div style={{ fontSize: 12.5, color: THEME.success, marginBottom: 10, lineHeight: 1.6 }}>{mesaj}</div>}
      {calisiyor && <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 10 }}>Yükleniyor...</div>}

      {/* ── ORGANİK → REKLAM ── */}
      {sekme === "organik" && organik && (
        <div>
          {!organik.bagli ? (
            <div style={{ fontSize: 12.5, color: THEME.textMuted }}>{organik.mesaj}</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.6, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px" }}>
                {organik.aciklama}
                <div style={{ marginTop: 6, color: THEME.textFaint }}>{organik.olcut}</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {organik.gonderiler.slice(0, 10).map((g) => (
                  <div key={g.id} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px", display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {g.kapak && <img src={g.kapak} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: g.reklamaUygunluk >= 60 ? THEME.success : g.reklamaUygunluk >= 45 ? THEME.warn : THEME.textFaint,
                          border: `1px solid ${g.reklamaUygunluk >= 60 ? THEME.success : g.reklamaUygunluk >= 45 ? THEME.warn : THEME.border}`,
                          borderRadius: 9, padding: "2px 7px" }}>
                          uygunluk {Math.round(g.reklamaUygunluk)}
                        </span>
                        <span style={{ fontSize: 11, color: THEME.textFaint }}>{g.tur === "VIDEO" ? "video" : g.tur === "CAROUSEL_ALBUM" ? "karusel" : "görsel"}</span>
                        {g.yasGun != null && <span style={{ fontSize: 11, color: THEME.textFaint }}>{g.yasGun} gün önce</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: THEME.textLight, marginTop: 5, lineHeight: 1.5 }}>{g.metin.slice(0, 120)}...</div>
                      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 4, fontFamily: FONT_MONO }}>
                        {g.begeni} beğeni · {g.yorum} yorum
                        {g.kaydetme ? ` · ${g.kaydetme} kaydetme` : ""}
                        {g.etkilesimOrani != null ? ` · etkileşim %${g.etkilesimOrani}` : ""}
                      </div>
                    </div>
                    <Btn small disabled={!!calisiyor} onClick={() => reklamlastir(g)}>Reklama çevir</Btn>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BRIEF ── */}
      {sekme === "brief" && brief && (
        <div>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.6, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px" }}>
            {brief.aciklama}
            <div style={{ marginTop: 6, color: THEME.textLight }}>
              {brief.durum.aktifKreatif} aktif kreatif · önerilen {brief.durum.gerekliKreatif} ·
              {" "}{brief.durum.zayifKanca} zayıf kanca · {brief.durum.gucluKanca} güçlü kanca
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {brief.briefler.map((b, i) => (
              <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px", borderLeft: `3px solid ${oncelikRenk[b.oncelik] || THEME.border}` }}>
                <div style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600 }}>{b.baslik}</div>
                <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6 }}>{b.gerekce}</div>
                <div style={{ marginTop: 9, background: THEME.bg, borderRadius: 5, padding: "10px 12px" }}>
                  {Object.entries(b.brief || {}).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, marginBottom: 5, lineHeight: 1.55 }}>
                      <span style={{ color: THEME.cyan }}>{k}:</span>{" "}
                      <span style={{ color: THEME.textLight }}>{Array.isArray(v) ? v.join(" · ") : String(v)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn small disabled={!!calisiyor} onClick={() => kuyrugaAl(b)}>Üretim kuyruğuna al</Btn>
                </div>
              </div>
            ))}
            {brief.briefler.length === 0 && <div style={{ fontSize: 13, color: THEME.success }}>Kreatif tarafında acil bir eksik görünmüyor.</div>}
          </div>
        </div>
      )}

      {/* ── METİN ÜRET ── */}
      {sekme === "metin" && metinler && (
        <div>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.6, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px" }}>
            {metinler.aciklama}
            <div style={{ marginTop: 5, color: THEME.textFaint }}>{metinler.not}</div>
          </div>

          {/* ── GÖRSEL YÜKLEME: FEED + STORY AYRI (9 Ağu 2026 genişletildi) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { format: "feed", baslikMetin: "Feed görseli (kare, 1:1)", zorunlu: true,
                gorsel: gorselFeed, hash: gorselFeedHash, uyari: gorselFeedUyari, yukleniyor: gorselFeedYukleniyor,
                secFn: gorselSecFeed, yukleFn: gorseliYukleFeed },
              { format: "story", baslikMetin: "Story / Reels görseli (dikey, 9:16)", zorunlu: false,
                gorsel: gorselStory, hash: gorselStoryHash, uyari: gorselStoryUyari, yukleniyor: gorselStoryYukleniyor,
                secFn: gorselSecStory, yukleFn: gorseliYukleStory },
            ].map((g) => (
              <div key={g.format} style={{ background: g.hash ? "rgba(46,125,50,.08)" : THEME.panelBgAlt, border: `1px solid ${g.hash ? THEME.success : THEME.border}`, borderRadius: 6, padding: "12px 14px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME.textLight, marginBottom: 4 }}>
                  {g.baslikMetin} {g.hash ? "✓" : g.zorunlu ? <span style={{ color: THEME.warn }}>— zorunlu</span> : <span style={{ color: THEME.textFaint }}>— opsiyonel</span>}
                </div>
                <div style={{ fontSize: 10.5, color: THEME.textFaint, marginBottom: 8, lineHeight: 1.5 }}>
                  {g.format === "feed"
                    ? "Facebook/Instagram akışında (Feed) gösterilir."
                    : "Yüklenmezse Meta, Feed görselinizi kırparak kullanır — logo/başlık kesilebilir."}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={g.secFn}
                  style={{ display: "block", width: "100%", fontSize: 12, color: THEME.textLight, marginBottom: g.gorsel ? 8 : 0 }} />
                {g.gorsel && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ position: "relative", width: g.format === "story" ? 62 : 84, height: 84, borderRadius: 6, overflow: "hidden", border: `1px solid ${THEME.border}` }}>
                      <img src={g.gorsel.dataUrl} alt="Önizleme" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {g.format === "story" && (
                        <>
                          <div title="Meta arayüzü (profil/altyazı) bu bölgeyi kaplar" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "14%", background: "rgba(224,144,128,.55)" }} />
                          <div title="Meta arayüzü (CTA/altyazı) bu bölgeyi kaplar" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "rgba(224,144,128,.55)" }} />
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 10.5, color: THEME.textFaint, marginTop: 4 }}>{g.gorsel.genislik}×{g.gorsel.yukseklik}px</div>
                    {g.format === "story" && <div style={{ fontSize: 9.5, color: "rgba(224,144,128,.9)", marginTop: 2 }}>Kırmızı alanlar Meta arayüzünün kapladığı bölge</div>}
                    {g.uyari && <div style={{ fontSize: 10.5, color: THEME.warn, marginTop: 5, lineHeight: 1.5, background: "rgba(255,180,60,.08)", padding: "5px 7px", borderRadius: 4 }}>⚠ {g.uyari}</div>}
                    {!g.hash && (
                      <Btn small disabled={g.yukleniyor} onClick={g.yukleFn} style={{ marginTop: 6 }}>
                        {g.yukleniyor ? "Yükleniyor…" : "Meta'ya Yükle"}
                      </Btn>
                    )}
                    {g.hash && <div style={{ fontSize: 11, color: THEME.success, marginTop: 4 }}>Meta'ya yüklendi</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── GERÇEK META ÖNİZLEMESİ (9 Ağu 2026 eklendi) — mockup değil,
               Meta'nın kendi /generatepreviews API'sinden gelen render ── */}
          {gorselFeedHash && secilenMetinler.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Btn small variant="ghost" disabled={onizlemeYukleniyor} onClick={onizlemeGetir}>
                {onizlemeYukleniyor ? "Meta'dan önizleme isteniyor…" : "Yayınlamadan önce gerçek önizlemeyi gör"}
              </Btn>
              {onizlemeler && (
                <div style={{ display: "grid", gridTemplateColumns: onizlemeler.story ? "1fr 1fr" : "1fr", gap: 10, marginTop: 10 }}>
                  {onizlemeler.feed && (
                    <div>
                      <div style={{ fontSize: 10.5, color: THEME.textFaint, marginBottom: 4 }}>FEED'DE BÖYLE GÖRÜNECEK</div>
                      <div style={{ border: `1px solid ${THEME.border}`, borderRadius: 6, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}
                        dangerouslySetInnerHTML={{ __html: onizlemeler.feed }} />
                    </div>
                  )}
                  {onizlemeler.story && (
                    <div>
                      <div style={{ fontSize: 10.5, color: THEME.textFaint, marginBottom: 4 }}>STORY/REELS'TE BÖYLE GÖRÜNECEK</div>
                      <div style={{ border: `1px solid ${THEME.border}`, borderRadius: 6, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}
                        dangerouslySetInnerHTML={{ __html: onizlemeler.story }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {secilenMetinler.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "rgba(46,125,50,.10)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "10px 13px", marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12.5, color: THEME.success }}>{secilenMetinler.length} metin seçildi</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small disabled={!!calisiyor || !gorselFeedHash} onClick={metinleriYayinla}>Seçilenleri yayına al</Btn>
                <Btn small variant="ghost" onClick={() => setSecilenMetinler([])}>Temizle</Btn>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 9 }}>
            {metinler.metinler.map((m, i) => {
              const secili = secilenMetinler.includes(i);
              return (
                <div key={i} onClick={() => setSecilenMetinler(secili ? secilenMetinler.filter((x) => x !== i) : [...secilenMetinler, i])}
                  style={{ background: secili ? "rgba(46,125,50,.10)" : THEME.panelBgAlt, borderRadius: 6, padding: "12px 14px",
                    border: `1px solid ${secili ? THEME.success : "transparent"}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9.5, color: THEME.cyan, border: `1px solid ${THEME.cyan}`, borderRadius: 9, padding: "2px 7px" }}>{m.aciAdi}</span>
                    <span style={{ fontSize: 9.5, color: THEME.textMuted, border: `1px solid ${THEME.border}`, borderRadius: 9, padding: "2px 7px" }}>{m.yapiAdi}</span>
                    {m.denenmeSayisi === 0 && <span style={{ fontSize: 10, color: THEME.warn }}>hiç denenmemiş</span>}
                    {secili && <span style={{ fontSize: 11, color: THEME.success, marginLeft: "auto" }}>✓ seçildi</span>}
                  </div>
                  <div style={{ fontSize: 13, color: THEME.textLight, marginTop: 8, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.metin}</div>
                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 7 }}>
                    {m.uzunluk} karakter · {m.yapiAciklamasi}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn small variant="ghost" disabled={!!calisiyor} onClick={metinUret}>Yeni metinler üret</Btn>
          </div>
        </div>
      )}

      {/* ── VİDEO SENARYOSU ── */}
      {sekme === "senaryo" && senaryo && (
        <div>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.6, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px" }}>
            {senaryo.aciklama}
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
            {[["duygusal", "Duygusal"], ["merak", "Merak"], ["sosyal_kanit", "Sosyal kanıt"],
              ["mantik", "Mantık"], ["korku_giderme", "Korku giderme"], ["otorite", "Otorite"]].map(([k, ad]) => (
              <Btn key={k} small variant={senaryoAci === k ? undefined : "ghost"} onClick={() => senaryoAl(k)}>{ad}</Btn>
            ))}
          </div>

          <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600, marginBottom: 10 }}>
            {senaryo.senaryo.aci} · {senaryo.senaryo.toplamSure} · {senaryo.senaryo.format}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {senaryo.senaryo.sahneler.map((sh, i) => (
              <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "12px 14px", borderLeft: `3px solid ${i === 0 ? THEME.danger : THEME.border}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: THEME.cyan, fontFamily: FONT_MONO }}>{sh.zaman}</span>
                  <span style={{ fontSize: 12.5, color: THEME.textLight, fontWeight: 700 }}>{sh.ad}</span>
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
                  <div style={{ fontSize: 12.5, color: THEME.textLight }}>
                    <span style={{ color: THEME.textMuted }}>Ekranda:</span> {sh.ekranMetni}
                  </div>
                  <div style={{ fontSize: 12.5, color: THEME.textLight }}>
                    <span style={{ color: THEME.textMuted }}>Görüntü:</span> {sh.goruntu}
                  </div>
                  <div style={{ fontSize: 12.5, color: THEME.textLight, lineHeight: 1.55 }}>
                    <span style={{ color: THEME.textMuted }}>Ses:</span> {sh.ses}
                  </div>
                  <div style={{ fontSize: 11.5, color: THEME.warn, lineHeight: 1.5, marginTop: 2 }}>{sh.not}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div style={{ background: "rgba(46,125,50,.08)", borderRadius: 6, padding: "11px 13px" }}>
              <div style={{ fontSize: 11.5, color: THEME.success, marginBottom: 6 }}>Zorunlular</div>
              {senaryo.senaryo.zorunlular.map((z, i) => (
                <div key={i} style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 3 }}>· {z}</div>
              ))}
            </div>
            <div style={{ background: "rgba(192,57,43,.08)", borderRadius: 6, padding: "11px 13px" }}>
              <div style={{ fontSize: 11.5, color: THEME.danger, marginBottom: 6 }}>Kaçınılacaklar</div>
              {senaryo.senaryo.kacinilacaklar.map((z, i) => (
                <div key={i} style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 3 }}>· {z}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HANGİ AÇI KAZANIYOR ── */}
      {sekme === "performans" && performans && (
        <div>
          <div style={{ background: performans.yeterliVeri ? "rgba(46,125,50,.10)" : THEME.panelBgAlt,
            border: `1px solid ${performans.yeterliVeri ? THEME.success : THEME.border}`,
            borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: performans.yeterliVeri ? THEME.success : THEME.textMuted, fontWeight: 600, lineHeight: 1.6 }}>
              {performans.mesaj}
            </div>
          </div>

          {performans.olcutAciklamasi && (
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10, lineHeight: 1.6, background: THEME.panelBgAlt, borderRadius: 6, padding: "9px 12px" }}>
              {performans.olcutAciklamasi}
            </div>
          )}

          {performans.aciSirasi.length > 0 && (
            <div style={{ display: "grid", gap: 7 }}>
              {performans.aciSirasi.map((a, i) => (
                <div key={a.aci} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px",
                  borderLeft: `3px solid ${i === 0 ? THEME.success : THEME.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>
                      {i === 0 && performans.yeterliVeri ? "🏆 " : ""}{a.aciAdi}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.textMuted, fontFamily: FONT_MONO }}>
                      {a.ctr != null ? `CTR %${a.ctr}` : ""}
                      {a.ortSkor != null ? ` · ${a.ortSkor} ₺/tıklama` : ""}
                      {a.harcamaPayi != null ? ` · bütçe payı %${a.harcamaPayi}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 4 }}>
                    {a.adet} metin · {Number(a.gosterim).toLocaleString("tr-TR")} gösterim · {a.tiklama} tıklama
                  </div>
                </div>
              ))}
            </div>
          )}
          {performans.aciSirasi.length === 0 && (
            <div style={{ fontSize: 12.5, color: THEME.textMuted }}>
              Henüz ölçülebilir metin yok. "Metin üret" sekmesinden metin üretip yayına alın.
            </div>
          )}
        </div>
      )}

      {/* ── KUYRUK ── */}
      {sekme === "kuyruk" && kuyruk && (
        <div>
          <div style={{ display: "flex", gap: 18, marginBottom: 12, flexWrap: "wrap" }}>
            {[["Bekliyor", kuyruk.ozet.bekliyor, THEME.warn], ["Üretiliyor", kuyruk.ozet.uretiliyor, THEME.cyan],
              ["Hazır", kuyruk.ozet.hazir, THEME.success]].map(([e, v, c]) => (
              <div key={e}>
                <div style={{ fontSize: 18, fontFamily: FONT_MONO, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 10.5, color: THEME.textMuted }}>{e}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {kuyruk.kuyruk.map((k) => (
              <div key={k.id} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{k.baslik}</div>
                    {k.gerekce && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3, lineHeight: 1.5 }}>{k.gerekce}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: durumRenk[k.durum], border: `1px solid ${durumRenk[k.durum]}`, borderRadius: 9, padding: "2px 8px", whiteSpace: "nowrap" }}>{durumAd[k.durum]}</span>
                    {k.durum === "bekliyor" && <Btn small variant="ghost" onClick={() => durumDegistir(k.id, "uretiliyor")}>Başla</Btn>}
                    {k.durum === "uretiliyor" && <Btn small onClick={() => durumDegistir(k.id, "hazir")}>Hazır</Btn>}
                  </div>
                </div>
              </div>
            ))}
            {kuyruk.kuyruk.length === 0 && <div style={{ fontSize: 12.5, color: THEME.textMuted }}>Kuyruk boş. "Ne üretmeli?" sekmesinden brief ekleyin.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Kreatif Teşhisi ============
// Uzmanların yukarıdan aşağı okuma sırası: kanca → tutma → tıklama → dönüşüm.
// Zayıf kanca ilk basamakta görünür; gerisini iyileştirmenin anlamı yoktur.
function KreatifTeshisi({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");

  const yukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata("");
    try {
      const r = await authFetch("/api/admin/reklam/kreatif-teshis?gun=30");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Teşhis yapılamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const seviyeRenk = { ustun: THEME.success, iyi: THEME.success, orta: THEME.warn, zayif: THEME.danger };
  const seviyeAd = { ustun: "ÜSTÜN", iyi: "İYİ", orta: "ORTA", zayif: "ZAYIF" };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.warn}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.textLight }}>Kreatif Teşhisi — Kanca Merdiveni</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6, maxWidth: 660 }}>
            Uzmanlar veriyi yukarıdan aşağı okur: <b>kanca</b> (3 saniyeyi geçen izleyici) →
            <b> tutma</b> → <b>tıklama</b> → <b>dönüşüm</b>. Zayıf kanca ilk basamakta görünür;
            gerisini iyileştirmenin anlamı yoktur. Bu ayrım nereye müdahale edeceğinizi söyler.
          </div>
        </div>
        <Btn small disabled={calisiyor} onClick={yukle}>{calisiyor ? "İnceleniyor..." : "Kreatifleri incele"}</Btn>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}

      {veri && (
        <div style={{ marginTop: 14 }}>
          <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{veri.ozet.degerlendirme}</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 4 }}>
              {veri.ozet.videoluReklam} video reklam
              {veri.ozet.ortalamaKanca != null ? ` · ortalama kanca %${veri.ozet.ortalamaKanca}` : ""}
              {" · ölçüt: "}{veri.olcutler.kanca}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {veri.reklamlar.map((r, i) => (
              <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px",
                borderLeft: `3px solid ${seviyeRenk[r.seviye] || THEME.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{r.ad}</div>
                  {r.seviye && (
                    <span style={{ fontSize: 9.5, color: seviyeRenk[r.seviye], border: `1px solid ${seviyeRenk[r.seviye]}`, borderRadius: 9, padding: "2px 7px" }}>
                      {seviyeAd[r.seviye]}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 5, fontFamily: FONT_MONO }}>
                  {r.kancaOrani != null ? `kanca %${r.kancaOrani}` : "video değil"}
                  {r.tutmaOrani != null ? ` · tutma %${r.tutmaOrani}` : ""}
                  {" · CTR %"}{r.ctr.toFixed(2)}
                  {r.cpc ? ` · ${r.cpc.toFixed(2)} ₺/tıklama` : ""}
                </div>
                {r.teshis && (
                  <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 6, fontWeight: 500 }}>{r.teshis}</div>
                )}
                {r.oneri && (
                  <div style={{ fontSize: 12.5, color: THEME.textLight, marginTop: 4, lineHeight: 1.55 }}>
                    <b style={{ color: THEME.success }}>→</b> {r.oneri}
                  </div>
                )}
              </div>
            ))}
            {veri.reklamlar.length === 0 && (
              <div style={{ fontSize: 12.5, color: THEME.textMuted }}>Yeterli gösterim alan reklam bulunamadı.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Birleşik Karar ============
// İki motorun ortak çıktısı. Kurallar yerleşik uzmanlık, deneyler kendi verinden
// keşif. "kural+deney" etiketli maddeler ikisiyle birden doğrulanmış — en güvenilir.
function BirlesikKarar({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [uygulanan, setUygulanan] = useState(null);
  const [sonuc, setSonuc] = useState(null);

  const yukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/karar");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Karar üretilemedi.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const uygula = async (k, i) => {
    if (uygulanan !== null) return;
    if (!window.confirm(`Meta'da değişiklik yapılacak:\n\n${k.aksiyon}\n\nOnaylıyor musun?`)) return;
    setUygulanan(i); setHata("");
    try {
      const r = await authFetch("/api/admin/reklam/aksiyon-uygula", {
        method: "POST", body: JSON.stringify({ aksiyon: k }) });
      const d = await r.json();
      if (d.ok) { setSonuc(d); yukle(); } else setHata(d.error || "Uygulanamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setUygulanan(null); }
  };

  const kaynakRozet = {
    "kural+deney": { ad: "KURAL + DENEY", renk: THEME.success, not: "Hem genel uzmanlık hem kendi verinizle doğrulandı" },
    kural: { ad: "KURAL", renk: THEME.cyan, not: "Yerleşik uzmanlık — sıfır veriyle bile geçerli" },
    deney: { ad: "DENEY", renk: THEME.warn, not: "Kendi verinizden çıkan bulgu" },
  };
  const guvenAd = { yuksek: "yüksek güven", orta: "orta güven", dusuk: "düşük güven", yerlesik_bilgi: "yerleşik bilgi" };
  const t = (x) => Number(x || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(201,162,75,.10), rgba(0,0,0,0))", border: `2px solid ${THEME.warn}`, borderRadius: 8, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: THEME.textLight }}>Birleşik Karar</div>
          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.65, maxWidth: 700 }}>
            İki motor birlikte çalışır. <b style={{ color: THEME.cyan }}>100 kural</b> yerleşik uzmanlıktır —
            hesap sıfır veriyken bile geçerli. <b style={{ color: THEME.warn }}>Deney motoru</b> kendi verinizden
            keşfeder — veri biriktikçe güçlenir. Kurallar sınır koyar, deney o sınırın içinde arar.
            Çelişirlerse yeterli veri varsa <b>kendi veriniz</b> kazanır.
          </div>
        </div>
        <Btn disabled={calisiyor} onClick={yukle}>{calisiyor ? "Karar veriliyor..." : "Kararları getir"}</Btn>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}
      {sonuc && (
        <div style={{ marginTop: 12, background: "rgba(46,125,50,.12)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "11px 13px" }}>
          {(sonuc.sonuclar || []).map((x, i) => <div key={i} style={{ fontSize: 12.5, color: THEME.success, lineHeight: 1.6 }}>✓ {x}</div>)}
        </div>
      )}

      {veri && (
        <div style={{ marginTop: 16 }}>
          {/* Motor durumu */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 13px", flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: THEME.cyan, letterSpacing: "0.08em" }}>KURAL MOTORU</div>
              <div style={{ fontSize: 13, color: THEME.textLight, marginTop: 4 }}>
                {veri.motorDurumu.kural.ihlal} ihlal · {veri.motorDurumu.kural.temiz} temiz
              </div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>{veri.motorDurumu.kural.toplam} kural kayıtlı</div>
            </div>
            <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 13px", flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: THEME.warn, letterSpacing: "0.08em" }}>DENEY MOTORU</div>
              <div style={{ fontSize: 13, color: THEME.textLight, marginTop: 4 }}>
                {veri.motorDurumu.deney.yeterliVeri
                  ? `${veri.motorDurumu.deney.bulguSayisi} bulgu`
                  : "veri birikiyor"}
              </div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>{veri.motorDurumu.deney.deneySayisi} deney</div>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.6 }}>{veri.aciklama}</div>

          {/* Çelişkiler — en dikkat çekici kısım */}
          {veri.celiskiler.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: THEME.danger, marginBottom: 7 }}>
                Genel kural ile kendi veriniz çelişiyor
              </div>
              {veri.celiskiler.map((c, i) => (
                <div key={i} style={{ background: "rgba(192,57,43,.10)", border: `1px solid ${THEME.danger}`, borderRadius: 6, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, color: THEME.textMuted, lineHeight: 1.6 }}>{c.kural}</div>
                  <div style={{ fontSize: 12.5, color: THEME.warn, marginTop: 5, lineHeight: 1.6 }}>{c.deney}</div>
                  <div style={{ fontSize: 13, color: THEME.success, marginTop: 7, fontWeight: 600 }}>{c.karar}</div>
                  <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 3, lineHeight: 1.5 }}>{c.gerekce}</div>
                </div>
              ))}
            </div>
          )}

          {/* Kararlar */}
          <div style={{ display: "grid", gap: 10 }}>
            {veri.kararlar.map((k, i) => {
              const kr = kaynakRozet[k.kaynak] || kaynakRozet.kural;
              return (
                <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px", borderLeft: `3px solid ${kr.renk}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9.5, letterSpacing: "0.08em", color: kr.renk, border: `1px solid ${kr.renk}`, borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>{kr.ad}</span>
                    {(k.kuralNo || []).length > 0 && (
                      <span style={{ fontSize: 10.5, color: THEME.textFaint, fontFamily: FONT_MONO }}>
                        {k.kuralNo.map((n) => "#" + n).join(" ")}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: THEME.textFaint }}>{guvenAd[k.guvenSeviyesi]}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600, marginTop: 7 }}>{k.baslik}</div>
                  <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 5, fontFamily: FONT_MONO, lineHeight: 1.5 }}>{k.olcum}</div>
                  <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.6 }}>{k.neden}</div>

                  {k.deneyDestegi && (
                    <div style={{ fontSize: 12, color: THEME.success, marginTop: 7, background: "rgba(46,125,50,.10)", borderRadius: 4, padding: "6px 9px", lineHeight: 1.5 }}>
                      {k.deneyDestegi.not}
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, color: THEME.textLight, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                      <b style={{ color: THEME.success }}>Yapılacak:</b> {k.aksiyon}
                      {k.etki && <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 3, fontStyle: "italic" }}>{k.etki}</div>}
                    </div>
                    {k.uygulanabilir
                      ? <Btn small disabled={uygulanan !== null} onClick={() => uygula(k, i)}>{uygulanan === i ? "Uygulanıyor..." : "Uygula"}</Btn>
                      : <span style={{ fontSize: 11, color: THEME.textFaint, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "3px 9px", whiteSpace: "nowrap" }}>elle</span>}
                  </div>
                </div>
              );
            })}
            {veri.kararlar.length === 0 && (
              <div style={{ fontSize: 13, color: THEME.success }}>İki motor da müdahale gerektiren bir durum bulmadı.</div>
            )}
          </div>

          {veri.sonrakiDeneyOnerisi && (
            <div style={{ marginTop: 14, background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 14px" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: THEME.warn, marginBottom: 4 }}>SIRADAKİ DENEY</div>
              <div style={{ fontSize: 13, color: THEME.textLight, lineHeight: 1.6 }}>
                Test edilecek değişken: <b style={{ color: THEME.warn }}>{veri.sonrakiDeneyOnerisi}</b> —
                kural motorunun bulguları ve deney geçmişi birlikte bunu işaret ediyor.
              </div>
            </div>
          )}

          {veri.ozet && (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${THEME.border}` }}>
              {[["Harcama", t(veri.ozet.harcama) + " ₺"], ["CPM", t(veri.ozet.cpm) + " ₺"],
                ["CTR", "%" + t(veri.ozet.ctr)], ["Frekans", t(veri.ozet.frekans)]].map(([e, x]) => (
                <div key={e}>
                  <div style={{ fontSize: 14, fontFamily: FONT_MONO, fontWeight: 700, color: THEME.textLight }}>{x}</div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>{e}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Deney Motoru ============
// Kural uygulamaz, ÖĞRENİR. Her kampanya bir deney; sonuçlardan hangi
// kurgunun kazandığı çıkar; yeni kampanya kazanandan + bir meydan okuyandan kurulur.
function DeneyMotoru({ authFetch }) {
  const [ogrenme, setOgrenme] = useState(null);
  const [calisiyor, setCalisiyor] = useState("");
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [kurAcik, setKurAcik] = useState(false);
  const [yeniDeney, setYeniDeney] = useState({ gunlukButce: 200, gun: 14 });
  const [gozlemAcik, setGozlemAcik] = useState(false);
  const [gozlem, setGozlem] = useState({});

  const cagir = async (yol, ayar, etiket) => {
    setCalisiyor(etiket); setHata(""); setMesaj("");
    try {
      const r = await authFetch(yol, ayar);
      const d = await r.json();
      if (!d.ok) { setHata(d.error + (d.detay ? " — " + d.detay : "") + (d.oneri ? " " + d.oneri : "")); return null; }
      if (d.mesaj) setMesaj(d.mesaj);
      return d;
    } catch { setHata("Sunucuya ulaşılamadı."); return null; }
    finally { setCalisiyor(""); }
  };

  const ogren = async () => {
    await cagir("/api/admin/reklam/deney-esitle", { method: "POST", body: "{}" }, "esitle");
    const d = await cagir("/api/admin/reklam/ogrenilenler", {}, "ogren");
    if (d) setOgrenme(d);
  };

  const deneyKur = async () => {
    if (!yeniDeney.metin) { setHata("Reklam metni gerekli."); return; }
    if (!window.confirm("Meta'da yeni bir deney kampanyası açılacak: bir ŞAMPİYON, bir MEYDAN OKUYAN set.\n\nBütçe ikiye bölünecek. Onaylıyor musun?")) return;
    const d = await cagir("/api/admin/reklam/deney-kur", { method: "POST", body: JSON.stringify(yeniDeney) }, "kur");
    if (d) { setKurAcik(false); ogren(); }
  };

  const sonucla = async () => {
    const d = await cagir("/api/admin/reklam/deney-sonucla", { method: "POST", body: "{}" }, "sonuc");
    if (d && d.sonuclar) {
      setMesaj(d.mesaj + " " + d.sonuclar.map((x) => x.not || "").join(" "));
      ogren();
    }
  };

  const gozlemKaydet = async () => {
    if (!gozlem.yayinevi) { setHata("Yayınevi adı gerekli."); return; }
    const d = await cagir("/api/admin/reklam/rakip-gozlem", { method: "POST", body: JSON.stringify(gozlem) }, "gozlem");
    if (d) { setGozlem({}); setGozlemAcik(false); ogren(); }
  };

  const inp = { background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "8px 11px", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
  const guvenRenk = { guvenilir: THEME.success, erken: THEME.warn, yetersiz: THEME.textFaint };

  return (
    <div style={{ background: "linear-gradient(135deg, rgba(91,33,182,.10), rgba(0,0,0,0))", border: `2px solid ${THEME.cyan}`, borderRadius: 8, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: THEME.textLight }}>Deney Motoru — Öğrenen Sistem</div>
          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.65, maxWidth: 680 }}>
            Kural uygulamaz, <b style={{ color: THEME.cyan }}>öğrenir</b>. Her kampanya bir deneydir:
            değişkenleri ve sonucu kaydedilir. Biriken sonuçlardan hangi kurgunun kazandığı çıkar.
            Yeni kampanya <b>şampiyon</b> (kazanan kurgu) ve <b>meydan okuyan</b> (tek değişkeni
            değiştirilmiş hali) olarak kurulur — sistem yanılabilir, o yüzden her zaman test eder.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Btn small disabled={!!calisiyor} onClick={ogren}>{calisiyor === "ogren" || calisiyor === "esitle" ? "Öğreniyor..." : "Öğren"}</Btn>
          <Btn small variant="ghost" disabled={!!calisiyor} onClick={sonucla}>Deneyleri sonuçlandır</Btn>
        </div>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12, lineHeight: 1.6 }}>{hata}</div>}
      {mesaj && <div style={{ fontSize: 12.5, color: THEME.success, marginTop: 12, lineHeight: 1.6 }}>{mesaj}</div>}

      {ogrenme && (
        <div style={{ marginTop: 16 }}>
          {!ogrenme.yeterliVeri ? (
            <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px" }}>
              <div style={{ fontSize: 13, color: THEME.warn, fontWeight: 600 }}>Henüz öğrenecek kadar veri yok</div>
              <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6 }}>{ogrenme.mesaj}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 10 }}>
                {ogrenme.deneySayisi} ölçülebilir deney incelendi
              </div>

              {ogrenme.sampiyon && (
                <div style={{ background: "rgba(46,125,50,.10)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", color: THEME.success, marginBottom: 5 }}>ŞU ANKİ ŞAMPİYON</div>
                  <div style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600 }}>{ogrenme.sampiyon.ad}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4, fontFamily: FONT_MONO }}>
                    tıklama başına {ogrenme.sampiyon.skor} ₺ ·
                    {" "}{Object.entries(ogrenme.sampiyon.degiskenler || {}).filter(([, v]) => v != null).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </div>
                </div>
              )}

              {ogrenme.bulgular.length > 0 && (
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 11.5, color: THEME.textMuted }}>Sistemin öğrendikleri</div>
                  {ogrenme.bulgular.map((b, i) => (
                    <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{b.degisken}</span>
                        <span style={{ fontSize: 9.5, color: guvenRenk[b.guven], border: `1px solid ${guvenRenk[b.guven]}`, borderRadius: 9, padding: "1px 7px" }}>{b.guven}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6 }}>
                        <b style={{ color: THEME.success }}>{b.kazananDeger}</b> ({b.kazananSkor} ₺) ·
                        <b style={{ color: THEME.danger }}> {b.kaybedenDeger}</b> ({b.kaybedenSkor} ₺) —
                        <b> %{b.farkYuzde} fark</b>, {b.deneySayisi} deneyde
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {ogrenme.rakipDersleri && (
                <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11.5, color: THEME.cyan, marginBottom: 7 }}>
                    Rakiplerden öğrenilenler — {ogrenme.rakipDersleri.gozlemSayisi} gözlem
                  </div>
                  {ogrenme.rakipDersleri.desenler.map((r, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 4, lineHeight: 1.55 }}>
                      · <b style={{ color: THEME.textLight }}>{r.aci || "?"} + {r.format || "?"}</b> —
                      ortalama {r.ortalamaGun} gün yayında, {r.ortalamaVaryant} varyant. {r.yorum}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12.5, color: THEME.textLight, background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 13px", marginBottom: 12 }}>
                Sıradaki test: <b style={{ color: THEME.cyan }}>{ogrenme.sonrakiTest}</b> —
                sistem bu değişken hakkında en az bilgiye sahip.
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Btn small onClick={() => setKurAcik(!kurAcik)}>Yeni deney kur</Btn>
            <Btn small variant="ghost" onClick={() => setGozlemAcik(!gozlemAcik)}>Rakip gözlemi ekle</Btn>
            <Btn small variant="ghost" disabled={!!calisiyor} onClick={async () => {
              const metin = window.prompt("Advantage+ kampanya için reklam metni:");
              if (!metin) return;
              if (!window.confirm("Meta'nın Advantage+ kampanyası kurulacak — hedefleme, yerleşim ve bütçe dağıtımını Meta yönetecek.\n\nOnaylıyor musun?")) return;
              const d = await cagir("/api/admin/reklam/advantage-kur", {
                method: "POST", body: JSON.stringify({ metin, gunlukButce: 300, gun: 30, amac: "lead" }) }, "asc");
              if (d) ogren();
            }}>Advantage+ kampanya kur</Btn>
          </div>
        </div>
      )}

      {kurAcik && (
        <div style={{ marginTop: 14, background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
            İki set açılır: <b style={{ color: THEME.success }}>ŞAMPİYON</b> (öğrenilen en iyi kurgu) ve
            <b style={{ color: THEME.warn }}> MEYDAN OKUYAN</b> (tek değişkeni farklı). Bütçe ikiye bölünür.
            Aralarındaki TEK fark test edilen değişkendir — böylece sonucu neyin değiştirdiği kesin bilinir.
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <textarea style={{ ...inp, resize: "vertical" }} rows={3} placeholder="Reklam metni *"
              value={yeniDeney.metin || ""} onChange={(e) => setYeniDeney({ ...yeniDeney, metin: e.target.value })} />
            <input style={inp} placeholder="Başlık" value={yeniDeney.baslik || ""} onChange={(e) => setYeniDeney({ ...yeniDeney, baslik: e.target.value })} />
            <input style={inp} placeholder="Yönlendirme adresi" value={yeniDeney.hedefAdres || ""} onChange={(e) => setYeniDeney({ ...yeniDeney, hedefAdres: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <input style={inp} placeholder="Günlük bütçe (₺)" value={yeniDeney.gunlukButce} onChange={(e) => setYeniDeney({ ...yeniDeney, gunlukButce: e.target.value.replace(/[^0-9]/g, "") })} />
              <input style={inp} placeholder="Süre (gün)" value={yeniDeney.gun} onChange={(e) => setYeniDeney({ ...yeniDeney, gun: e.target.value.replace(/[^0-9]/g, "") })} />
            </div>
          </div>
          <div style={{ marginTop: 11, display: "flex", gap: 7 }}>
            <Btn small disabled={!!calisiyor} onClick={deneyKur}>{calisiyor === "kur" ? "Kuruluyor..." : "Deneyi başlat"}</Btn>
            <Btn small variant="ghost" onClick={() => setKurAcik(false)}>Vazgeç</Btn>
          </div>
        </div>
      )}

      {gozlemAcik && (
        <div style={{ marginTop: 14, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
            Reklam Kütüphanesi'nde gördüğünüz rakip reklamı buraya kaydedin. Sistem bu desenlerden de öğrenir —
            özellikle <b>kaç gündür yayında</b> olduğu değerli: uzun süre = çalışan reklam.
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <input style={inp} placeholder="Yayınevi adı *" value={gozlem.yayinevi || ""} onChange={(e) => setGozlem({ ...gozlem, yayinevi: e.target.value })} />
            <textarea style={{ ...inp, resize: "vertical" }} rows={2} placeholder="Reklam metni" value={gozlem.reklamMetni || ""} onChange={(e) => setGozlem({ ...gozlem, reklamMetni: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <select style={inp} value={gozlem.format || ""} onChange={(e) => setGozlem({ ...gozlem, format: e.target.value })}>
                <option value="">Format</option><option value="video">Video</option>
                <option value="gorsel">Görsel</option><option value="karusel">Karusel</option>
              </select>
              <select style={inp} value={gozlem.aci || ""} onChange={(e) => setGozlem({ ...gozlem, aci: e.target.value })}>
                <option value="">Açı</option><option value="duygusal">Duygusal</option>
                <option value="merak">Merak</option><option value="sosyal_kanit">Sosyal kanıt</option>
                <option value="mantik">Mantık</option><option value="otorite">Otorite</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <input style={inp} placeholder="Kaç gündür yayında" value={gozlem.gunSayisi || ""} onChange={(e) => setGozlem({ ...gozlem, gunSayisi: e.target.value.replace(/[^0-9]/g, "") })} />
              <input style={inp} placeholder="Varyant sayısı" value={gozlem.varyantSayisi || ""} onChange={(e) => setGozlem({ ...gozlem, varyantSayisi: e.target.value.replace(/[^0-9]/g, "") })} />
            </div>
            <input style={inp} placeholder="Öne çıkan vaat" value={gozlem.vaat || ""} onChange={(e) => setGozlem({ ...gozlem, vaat: e.target.value })} />
          </div>
          <div style={{ marginTop: 11, display: "flex", gap: 7 }}>
            <Btn small disabled={!!calisiyor} onClick={gozlemKaydet}>Kaydet</Btn>
            <Btn small variant="ghost" onClick={() => setGozlemAcik(false)}>Vazgeç</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Otomatik Optimizasyon ============
// Kullanıcı reklamcılıktan anlamak zorunda değil. Tek düğme: sistem denetler,
// güvenli düzeltmeleri doğru sırayla uygular, ne yaptığını sade dille anlatır.
function OtomatikOptimizasyon({ authFetch }) {
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState("");

  const optimize = async () => {
    if (calisiyor) return;
    if (!window.confirm(
      "Sistem reklamlarınızı inceleyip GEREKLİ DÜZELTMELERİ Meta'da uygulayacak.\n\n" +
      "Sadece güvenli değişiklikler yapılır: kötü reklamları durdurma, kitleyi genişletme.\n" +
      "Bütçe artırma bu turda yapılmaz.\n\nBaşlatalım mı?")) return;
    setCalisiyor(true); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/otomatik-optimize", { method: "POST", body: "{}" });
      const d = await r.json();
      if (d.ok) setSonuc(d); else setHata(d.error || "Çalıştırılamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const t = (x) => Number(x || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(46,125,50,.10), rgba(0,0,0,0))",
      border: `2px solid ${THEME.success}`, borderRadius: 8, padding: "18px 20px", marginBottom: 18,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: THEME.textLight }}>Reklamlarımı Otomatik Optimize Et</div>
          <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.65, maxWidth: 640 }}>
            Reklamcılıktan anlamanıza gerek yok. Düğmeye basın — sistem hesabınızı inceler,
            sorunları bulur ve <b style={{ color: THEME.success }}>düzeltir</b>. Sonra ne yaptığını
            sade dille anlatır. Yapay zekâ gerektirmez, her zaman çalışır.
          </div>
        </div>
        <Btn disabled={calisiyor} onClick={optimize}>
          {calisiyor ? "Optimize ediliyor..." : "Optimize et"}
        </Btn>
      </div>

      {calisiyor && (
        <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 14 }}>
          Meta'dan veri çekiliyor, kurallar kontrol ediliyor, düzeltmeler uygulanıyor... (20-40 sn)
        </div>
      )}

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 14 }}>{hata}</div>}

      {sonuc && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, color: THEME.textLight, fontWeight: 600, marginBottom: 12 }}>{sonuc.mesaj}</div>

          {sonuc.yapilanlar.map((y, i) => (
            <div key={i} style={{ background: "rgba(46,125,50,.10)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "13px 15px", marginBottom: 9 }}>
              <div style={{ fontSize: 14, color: THEME.success, fontWeight: 600 }}>✓ {y.ne}</div>
              <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 5, lineHeight: 1.6 }}>{y.detay}</div>
              {y.kazanc && <div style={{ fontSize: 12.5, color: THEME.textLight, marginTop: 5 }}>{y.kazanc}</div>}
              {y.uyari && <div style={{ fontSize: 11.5, color: THEME.warn, marginTop: 6, lineHeight: 1.5 }}>{y.uyari}</div>}
            </div>
          ))}

          {sonuc.sonrakiAdim && (
            <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "12px 14px", marginTop: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: THEME.cyan, marginBottom: 5 }}>SIRADAKİ ADIM</div>
              <div style={{ fontSize: 13, color: THEME.textLight, lineHeight: 1.6 }}>{sonuc.sonrakiAdim}</div>
            </div>
          )}

          {sonuc.olceklemeNotu && (
            <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 10, lineHeight: 1.6, paddingLeft: 11, borderLeft: `2px solid ${THEME.border}` }}>
              {sonuc.olceklemeNotu}
            </div>
          )}

          {sonuc.atlananlar.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 6 }}>Bu turda yapılmayanlar ve sebepleri</div>
              {sonuc.atlananlar.map((a, i) => (
                <div key={i} style={{ fontSize: 12.5, color: THEME.textMuted, marginBottom: 4, lineHeight: 1.55 }}>· {a}</div>
              ))}
            </div>
          )}

          {sonuc.insanIsleri.length > 0 && (
            <div style={{ marginTop: 14, background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px" }}>
              <div style={{ fontSize: 12.5, color: THEME.cyan, fontWeight: 600, marginBottom: 8 }}>
                Sistemin yapamadığı, sizin yapmanız gerekenler
              </div>
              {sonuc.insanIsleri.map((x, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 500 }}>{x.ne}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 3, lineHeight: 1.55 }}>{x.neden}</div>
                  <div style={{ fontSize: 12.5, color: THEME.success, marginTop: 4 }}>→ {x.yapilacak}</div>
                </div>
              ))}
            </div>
          )}

          {sonuc.hatalar.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {sonuc.hatalar.map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: THEME.danger, marginBottom: 3 }}>{h}</div>
              ))}
            </div>
          )}

          {sonuc.ozet && (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${THEME.border}` }}>
              {[["Harcama", t(sonuc.ozet.harcama) + " ₺"], ["CPM", t(sonuc.ozet.cpm) + " ₺"],
                ["CTR", "%" + t(sonuc.ozet.ctr)], ["Frekans", t(sonuc.ozet.frekans)]].map(([e, x]) => (
                <div key={e}>
                  <div style={{ fontSize: 14, fontFamily: FONT_MONO, fontWeight: 700, color: THEME.textLight }}>{x}</div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>{e}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ 100 Altın Kural Denetimi ============
// Her kural kayıtlı, kontrol edilebilenler ölçülüyor, ihlaller aksiyona bağlı.
function YuzKuralDenetimi({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [uygulanan, setUygulanan] = useState(null);
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState(null);
  const [gorunum, setGorunum] = useState("ihlal");

  const yukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/kural-denetimi?gun=30");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Denetim yapılamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const uygula = async (i, idx) => {
    if (uygulanan !== null) return;
    if (i.tur === "kitle_kur") { setHata("Bu kural için aşağıdaki Yeniden Hedefleme bölümünü kullanın."); return; }
    if (!window.confirm(`Kural ${i.no} gereği Meta'da değişiklik yapılacak:\n\n${i.aksiyon}\n\nOnaylıyor musun?`)) return;
    setUygulanan(idx); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/aksiyon-uygula", {
        method: "POST", body: JSON.stringify({ aksiyon: i }) });
      const d = await r.json();
      if (d.ok) { setSonuc(d); yukle(); } else setHata(d.error || "Uygulanamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setUygulanan(null); }
  };

  const katRenk = { otomatik: THEME.success, izlenen: THEME.warn, insan: THEME.cyan, ilke: THEME.textFaint };
  const katAd = { otomatik: "otomatik", izlenen: "izlenen", insan: "insan işi", ilke: "ilke" };
  const t = (x) => Number(x || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  return (
    <div style={{ background: THEME.panelBg, border: `2px solid ${THEME.danger}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textLight }}>100 Altın Kural Denetimi</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 4, maxWidth: 660, lineHeight: 1.6 }}>
            2026 Meta reklamcılığının 100 kuralı sisteme işlendi. Ölçülebilenler canlı veriyle
            kontrol edilir, ihlaller aksiyona bağlanır. <b style={{ color: THEME.success }}>Otomatik</b> etiketli
            kurallar tek tıkla düzeltilir; <b style={{ color: THEME.cyan }}>insan işi</b> olanlar sizin yapmanız gerekenler.
          </div>
        </div>
        <Btn small disabled={calisiyor} onClick={yukle}>{calisiyor ? "Denetleniyor..." : "100 kuralı denetle"}</Btn>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}
      {sonuc && (
        <div style={{ marginTop: 12, background: "rgba(46,125,50,.12)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "11px 13px" }}>
          {(sonuc.sonuclar || []).map((x, i) => <div key={i} style={{ fontSize: 12.5, color: THEME.success, lineHeight: 1.6 }}>✓ {x}</div>)}
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 6 }}>{sonuc.mesaj}</div>
        </div>
      )}

      {veri && (
        <div style={{ marginTop: 14 }}>
          {veri.ozet && (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px", marginBottom: 12 }}>
              {[["Harcama", t(veri.ozet.harcama)+" ₺"], ["Erişim", t(veri.ozet.erisim)], ["Tıklama", t(veri.ozet.tiklama)],
                ["CPM", t(veri.ozet.cpm)+" ₺"], ["CTR", "%"+t(veri.ozet.ctr)], ["Frekans", t(veri.ozet.frekans)]].map(([e,x]) => (
                <div key={e}><div style={{ fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700, color: THEME.textLight }}>{x}</div>
                <div style={{ fontSize: 10, color: THEME.textMuted }}>{e}</div></div>
              ))}
            </div>
          )}

          {/* Skor tablosu */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(veri.gruplar).map(([g, k]) => (
              <div key={g} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "8px 11px", minWidth: 96 }}>
                <div style={{ fontSize: 12, color: THEME.textLight, fontWeight: 600 }}>{g}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
                  {k.toplam} kural{k.kontrollu ? ` · ${k.kontrollu} ölçülür` : ""}
                </div>
                {k.ihlal > 0 && <div style={{ fontSize: 11.5, color: THEME.danger, marginTop: 2 }}>{k.ihlal} ihlal</div>}
                {k.ihlal === 0 && k.kontrollu > 0 && <div style={{ fontSize: 11.5, color: THEME.success, marginTop: 2 }}>temiz</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {[["ihlal", `İhlaller (${veri.ihlalSayisi})`], ["temiz", `Temiz (${veri.temizSayisi})`],
              ["ilke", `İlkeler (${veri.olculemez.length})`]].map(([k, ad]) => (
              <Btn key={k} small variant={gorunum === k ? undefined : "ghost"} onClick={() => setGorunum(k)}>{ad}</Btn>
            ))}
          </div>

          {gorunum === "ihlal" && (
            <div style={{ display: "grid", gap: 10 }}>
              {veri.ihlaller.map((i, idx) => (
                <div key={i.no} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px", borderLeft: `3px solid ${katRenk[i.kat]}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, color: THEME.textFaint, fontFamily: FONT_MONO }}>#{i.no}</span>
                    <span style={{ fontSize: 9.5, letterSpacing: "0.08em", color: katRenk[i.kat], border: `1px solid ${katRenk[i.kat]}`, borderRadius: 10, padding: "2px 7px" }}>{katAd[i.kat]}</span>
                    <span style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{i.metin}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 7, fontFamily: FONT_MONO }}>{i.olcum}</div>
                  <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.6 }}>{i.neden}</div>
                  {i.gecmisSonuc && (
                    <div style={{ fontSize: 11.5, marginTop: 7, padding: "6px 9px", borderRadius: 4,
                      background: i.gecmisSonuc.basariOrani >= 60 ? "rgba(46,125,50,.12)" : "rgba(192,57,43,.12)",
                      color: i.gecmisSonuc.basariOrani >= 60 ? THEME.success : THEME.danger }}>{i.gecmisSonuc.not}</div>
                  )}
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, color: THEME.textLight, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                      <b style={{ color: THEME.success }}>Yapılacak:</b> {i.aksiyon}
                      {i.etki && <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 3, fontStyle: "italic" }}>{i.etki}</div>}
                    </div>
                    {i.uygulanabilir
                      ? <Btn small disabled={uygulanan !== null} onClick={() => uygula(i, idx)}>{uygulanan === idx ? "Uygulanıyor..." : "Uygula"}</Btn>
                      : <span style={{ fontSize: 11, color: THEME.textFaint, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "3px 9px", whiteSpace: "nowrap" }}>elle</span>}
                  </div>
                </div>
              ))}
              {veri.ihlaller.length === 0 && <div style={{ fontSize: 13, color: THEME.success }}>Ölçülebilen kuralların hepsi temiz.</div>}
            </div>
          )}

          {gorunum === "temiz" && (
            <div style={{ display: "grid", gap: 5 }}>
              {veri.temizler.map((k) => (
                <div key={k.no} style={{ fontSize: 12.5, color: THEME.textMuted, display: "flex", gap: 8 }}>
                  <span style={{ color: THEME.success }}>✓</span>
                  <span style={{ color: THEME.textFaint, fontFamily: FONT_MONO, minWidth: 26 }}>#{k.no}</span>
                  <span>{k.metin}</span>
                </div>
              ))}
            </div>
          )}

          {gorunum === "ilke" && (
            <div style={{ display: "grid", gap: 5 }}>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 5 }}>
                Bu kurallar doğrudan ölçülmez — motorun kararlarını ve önerilerini şekillendirirler.
              </div>
              {veri.olculemez.map((k) => (
                <div key={k.no} style={{ fontSize: 12.5, color: THEME.textMuted, display: "flex", gap: 8 }}>
                  <span style={{ color: THEME.textFaint, fontFamily: FONT_MONO, minWidth: 26 }}>#{k.no}</span>
                  <span style={{ fontSize: 9.5, color: katRenk[k.kat], border: `1px solid ${katRenk[k.kat]}`, borderRadius: 8, padding: "1px 6px", height: "fit-content", whiteSpace: "nowrap" }}>{katAd[k.kat]}</span>
                  <span>{k.metin}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Yeniden Hedefleme Kitleleri ============
// Siteye gelip almayan kişiye tekrar ulaşmak, soğuk kitleye ulaşmaktan
// kat kat ucuz. "Aynı bütçeyle daha çok müşteri"nin en doğrudan yolu.
function YenidenHedefleme({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [kuruluyor, setKuruluyor] = useState(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");

  const yukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata("");
    try {
      const r = await authFetch("/api/admin/reklam/kitleler");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Kitleler okunamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const olustur = async (kod, ad) => {
    if (kuruluyor) return;
    if (!window.confirm(`"${ad}" kitlesi Meta'da oluşturulacak. Onaylıyor musun?`)) return;
    setKuruluyor(kod); setHata(""); setMesaj("");
    try {
      const r = await authFetch("/api/admin/reklam/kitle-olustur", {
        method: "POST", body: JSON.stringify({ kod }),
      });
      const d = await r.json();
      if (d.ok) { setMesaj(d.mesaj); yukle(); } else setHata(d.error || "Oluşturulamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setKuruluyor(null); }
  };

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.success}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>Yeniden Hedefleme Kitleleri</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 4, maxWidth: 640, lineHeight: 1.6 }}>
            Siteye gelip satın almayan kişiye tekrar ulaşmak, hiç tanımayan birine ulaşmaktan
            belirgin şekilde ucuzdur. <b style={{ color: THEME.success }}>Aynı bütçeyle daha çok müşteri</b>
            {" "}hedefinin en doğrudan yolu bu havuzlardır.
          </div>
        </div>
        <Btn small disabled={calisiyor} onClick={yukle}>{calisiyor ? "Okunuyor..." : "Kitleleri getir"}</Btn>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}
      {mesaj && <div style={{ fontSize: 12.5, color: THEME.success, marginTop: 12, lineHeight: 1.5 }}>{mesaj}</div>}

      {veri && (
        <div style={{ marginTop: 14 }}>
          {veri.mevcut.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 7 }}>Kurulu kitleler</div>
              {veri.mevcut.map((k) => (
                <div key={k.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: THEME.panelBgAlt, borderRadius: 5, padding: "8px 11px", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: THEME.textLight }}>{k.ad}</span>
                  <span style={{ fontSize: 11.5, color: THEME.textMuted, fontFamily: FONT_MONO }}>
                    {k.boyut ? Number(k.boyut).toLocaleString("tr-TR") + " kişi" : (k.durum || "hazırlanıyor")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {veri.eksikler.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, color: THEME.warn, marginBottom: 7 }}>
                Kurulmamış havuzlar — {veri.eksikler.length} tane
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {veri.eksikler.map((o) => {
                  const otomatik = ["site_180", "urun_bakan", "sepet"].includes(o.kod);
                  return (
                    <div key={o.kod} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{o.ad}</div>
                        <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2, lineHeight: 1.5 }}>{o.aciklama}</div>
                      </div>
                      {otomatik ? (
                        <Btn small disabled={kuruluyor !== null} onClick={() => olustur(o.kod, o.ad)}>
                          {kuruluyor === o.kod ? "Oluşturuluyor..." : "Oluştur"}
                        </Btn>
                      ) : (
                        <span style={{ fontSize: 11, color: THEME.textFaint, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "3px 9px", whiteSpace: "nowrap" }}>Meta arayüzünden</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Reklam Aksiyon Motoru ============
// Teşhis "sorun var" der; bu motor sorunu ÇÖZER. Meta'da gerçek değişiklik
// yapar: kitle genişletir, bütçe kaydırır, zayıf reklamı duraklatır.
// Her müdahale onay ister ve öğrenme defterine yazılır.
function ReklamAksiyonMotoru({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [uygulanan, setUygulanan] = useState(null);
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState(null);

  const yukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/aksiyonlar?gun=30");
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Aksiyonlar alınamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const uygula = async (a, i) => {
    if (uygulanan !== null) return;
    if (!window.confirm(
      `Bu değişiklik Meta'da GERÇEKTEN uygulanacak:\n\n${a.aksiyon}\n\nOnaylıyor musun?`)) return;
    setUygulanan(i); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/aksiyon-uygula", {
        method: "POST", body: JSON.stringify({ aksiyon: a }),
      });
      const d = await r.json();
      if (d.ok) { setSonuc(d); yukle(); } else setHata(d.error || "Uygulanamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setUygulanan(null); }
  };

  // Geçmiş müdahalelerin 7 günlük etkisini ölç — öğrenme döngüsünün kapanması
  const etkiOlc = async () => {
    if (calisiyor) return;
    setCalisiyor(true); setHata(""); setSonuc(null);
    try {
      const r = await authFetch("/api/admin/reklam/etki-olc", { method: "POST", body: "{}" });
      const d = await r.json();
      if (d.ok) {
        setSonuc({ sonuclar: (d.olculen || []).map((x) => `${x.baslik}: ${x.sonuc}`), mesaj: d.mesaj });
        yukle();
      } else setHata(d.error || "Ölçülemedi.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const onemRenk = { kritik: THEME.danger, uyari: THEME.warn };
  const onemAd = { kritik: "KRİTİK", uyari: "UYARI" };

  return (
    <div style={{ background: THEME.panelBg, border: `2px solid ${THEME.cyan}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textLight }}>Reklam Aksiyon Motoru</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 4, maxWidth: 660, lineHeight: 1.6 }}>
            Sorunu bulmakla kalmaz, <b style={{ color: THEME.cyan }}>çözer</b> — Meta'da kitleyi genişletir,
            bütçeyi kazanan sete kaydırır, bütçe yakan reklamı duraklatır.
            Bütçe artışları %18 ile sınırlı: %20'yi geçmek öğrenme evresini sıfırlar ve bir hafta kaybettirir.
            Her müdahale öğrenme defterine yazılır, etkisi 7 gün sonra ölçülür.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Btn small disabled={calisiyor} onClick={yukle}>{calisiyor ? "İnceleniyor..." : "Aksiyonları getir"}</Btn>
          <Btn small variant="ghost" disabled={calisiyor} onClick={etkiOlc}>Etkileri ölç</Btn>
        </div>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}

      {sonuc && (
        <div style={{ marginTop: 12, background: "rgba(46,125,50,.12)", border: `1px solid ${THEME.success}`, borderRadius: 6, padding: "11px 13px" }}>
          {(sonuc.sonuclar || []).map((x, i) => (
            <div key={i} style={{ fontSize: 12.5, color: THEME.success, lineHeight: 1.6 }}>✓ {x}</div>
          ))}
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.5 }}>{sonuc.mesaj}</div>
        </div>
      )}

      {veri && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>
            {veri.aksiyonlar.length} bulgu · {veri.uygulanabilirSayi} tanesi tek tıkla uygulanabilir
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {veri.aksiyonlar.map((a, i) => (
              <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px", borderLeft: `3px solid ${onemRenk[a.onem]}` }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9.5, letterSpacing: "0.1em", color: onemRenk[a.onem], border: `1px solid ${onemRenk[a.onem]}`, borderRadius: 10, padding: "2px 7px" }}>{onemAd[a.onem]}</span>
                  <span style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600 }}>{a.baslik}</span>
                </div>
                <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 7, fontFamily: FONT_MONO }}>{a.olcum}</div>
                <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.6 }}>{a.neden}</div>
                {a.gecmisSonuc && (
                  <div style={{ fontSize: 11.5, marginTop: 7, padding: "6px 9px", borderRadius: 4,
                    background: a.gecmisSonuc.basariOrani >= 60 ? "rgba(46,125,50,.12)" : "rgba(192,57,43,.12)",
                    color: a.gecmisSonuc.basariOrani >= 60 ? THEME.success : THEME.danger }}>
                    {a.gecmisSonuc.not}{a.gecmisSonuc.guven === "erken" ? " (az veri)" : ""}
                  </div>
                )}

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, color: THEME.textLight, lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                    <b style={{ color: THEME.success }}>Yapılacak:</b> {a.aksiyon}
                    {a.etki && <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 3, fontStyle: "italic" }}>{a.etki}</div>}
                  </div>
                  {a.uygulanabilir ? (
                    <Btn small disabled={uygulanan !== null} onClick={() => uygula(a, i)}>
                      {uygulanan === i ? "Uygulanıyor..." : "Uygula"}
                    </Btn>
                  ) : (
                    <span style={{ fontSize: 11, color: THEME.textFaint, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "3px 9px", whiteSpace: "nowrap" }}>elle yapılır</span>
                  )}
                </div>
              </div>
            ))}
            {veri.aksiyonlar.length === 0 && (
              <div style={{ fontSize: 13, color: THEME.textMuted }}>İncelenen kurallarda müdahale gerektiren bir durum yok.</div>
            )}
          </div>

          {veri.gecmis && veri.gecmis.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>Öğrenme defteri — yapılan müdahaleler</div>
              {veri.gecmis.map((g, i) => (
                <div key={i} style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>
                  <span style={{ color: THEME.textFaint }}>{new Date(g.uygulanma_tarihi).toLocaleDateString("tr-TR")}</span>
                  {" · "}{g.baslik}
                  {g.sonuc_notu && <span style={{ color: THEME.success }}> → {g.sonuc_notu}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Reklam Teşhisi — kural tabanlı ============
// AI'a bağlı DEĞİL. Meta'dan canlı veri çeker, uzman eşiklerine göre
// somut bulgular üretir: ne oluyor · neden · ne yap.
function ReklamTeshisi({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [gun, setGun] = useState(30);

  const calistir = async (g) => {
    if (calisiyor) return;
    setCalisiyor(true); setHata(""); setVeri(null);
    try {
      const r = await authFetch(`/api/admin/reklam/teshis?gun=${g || gun}`);
      const d = await r.json();
      if (d.ok) setVeri(d); else setHata(d.error || "Teşhis alınamadı.");
    } catch { setHata("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const onemRenk = { kritik: THEME.danger, uyari: THEME.warn, bilgi: THEME.cyan };
  const onemAd = { kritik: "KRİTİK", uyari: "UYARI", bilgi: "BİLGİ" };
  const t = (x) => Number(x || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  return (
    <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.danger}`, borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textLight }}>Reklam Teşhisi</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3, maxWidth: 620, lineHeight: 1.55 }}>
            Meta'dan canlı veri çekilir, uzman eşiklerine göre incelenir. Yapay zekâ gerektirmez —
            aynı veri her zaman aynı teşhisi verir. Her bulgu: ne oluyor, neden, ne yapmalı.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select value={gun} onChange={(e) => { setGun(Number(e.target.value)); calistir(Number(e.target.value)); }}
            style={{ background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: "7px 9px", fontSize: 12.5, fontFamily: "inherit" }}>
            <option value={7}>Son 7 gün</option>
            <option value={14}>Son 14 gün</option>
            <option value={30}>Son 30 gün</option>
          </select>
          <Btn small disabled={calisiyor} onClick={() => calistir()}>{calisiyor ? "İnceleniyor..." : "Teşhis çalıştır"}</Btn>
        </div>
      </div>

      {hata && <div style={{ fontSize: 12.5, color: THEME.danger, marginTop: 12 }}>{hata}</div>}

      {veri && (
        <div style={{ marginTop: 14 }}>
          {veri.ozet && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", background: THEME.panelBgAlt, borderRadius: 6, padding: "11px 13px", marginBottom: 14 }}>
              {[["Harcama", t(veri.ozet.harcama) + " ₺"], ["Erişim", t(veri.ozet.erisim)],
                ["Tıklama", t(veri.ozet.tiklama)], ["CPM", t(veri.ozet.cpm) + " ₺"],
                ["CTR", "%" + t(veri.ozet.ctr)], ["Frekans", t(veri.ozet.frekans)]].map(([e, v]) => (
                <div key={e}>
                  <div style={{ fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700, color: THEME.textLight }}>{v}</div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>{e}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 10 }}>
            {veri.donem} · {veri.reklamSetiSayisi} reklam seti · {veri.reklamSayisi} reklam incelendi
          </div>

          {veri.mesaj && <div style={{ fontSize: 13, color: THEME.textMuted }}>{veri.mesaj}</div>}

          <div style={{ display: "grid", gap: 9 }}>
            {(veri.bulgular || []).map((b, i) => (
              <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "13px 15px", borderLeft: `3px solid ${onemRenk[b.onem]}` }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9.5, letterSpacing: "0.1em", color: onemRenk[b.onem], border: `1px solid ${onemRenk[b.onem]}`, borderRadius: 10, padding: "2px 7px" }}>{onemAd[b.onem]}</span>
                  <span style={{ fontSize: 13.5, color: THEME.textLight, fontWeight: 600 }}>{b.baslik}</span>
                </div>
                <div style={{ fontSize: 12.5, color: THEME.cyan, marginTop: 7, fontFamily: FONT_MONO }}>{b.olcum}</div>
                <div style={{ fontSize: 12.5, color: THEME.textMuted, marginTop: 6, lineHeight: 1.6 }}>{b.neden}</div>
                <div style={{ fontSize: 13, color: THEME.textLight, marginTop: 8, lineHeight: 1.6, paddingLeft: 11, borderLeft: `2px solid ${THEME.border}` }}>
                  <b style={{ color: THEME.success }}>Ne yapmalı:</b> {b.eylem}
                </div>
                {b.kazanc && <div style={{ fontSize: 11.5, color: THEME.textFaint, marginTop: 5, fontStyle: "italic" }}>{b.kazanc}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

      {/* BİRLEŞİK KARAR — iki motorun ortak çıktısı, en üstte */}
      <BirlesikKarar authFetch={authFetch} />

      {/* KREATİF ÜRETİM MOTORU — en büyük boşluğun kapatılması */}
      <KreatifUretim authFetch={authFetch} />

      {/* KREATİF TEŞHİSİ — kanca merdiveni */}
      <KreatifTeshisi authFetch={authFetch} />

      {/* DENEY MOTORU — öğrenen sistem */}
      <DeneyMotoru authFetch={authFetch} />

      {/* OTOMATİK OPTİMİZASYON — tek düğme */}
      <OtomatikOptimizasyon authFetch={authFetch} />

      {/* 100 kural denetimi — tam tablo */}
      <YuzKuralDenetimi authFetch={authFetch} />

      {/* Aksiyon motoru — sadece teşhis değil, müdahale */}
      <ReklamAksiyonMotoru authFetch={authFetch} />

      {/* Yeniden hedefleme — aynı bütçeyle daha çok müşteri */}
      <YenidenHedefleme authFetch={authFetch} />

      {/* Teşhis — kural tabanlı, AI gerektirmez */}
      <ReklamTeshisi authFetch={authFetch} />

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
            {cevap.cevap ? (
              <div style={{ fontSize: 13.5, color: THEME.textLight, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{cevap.cevap}</div>
            ) : (
              <div style={{ fontSize: 13, color: THEME.warn, lineHeight: 1.6 }}>
                Danışman cevap üretemedi.
                {cevap.hataDetay && <div style={{ color: THEME.textMuted, marginTop: 6, fontFamily: FONT_MONO, fontSize: 11.5 }}>{cevap.hataDetay}</div>}
              </div>
            )}
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
            <div style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>{rakipler.aciklama}</div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 8, lineHeight: 1.6 }}>
                <b style={{ color: THEME.cyan }}>Neye bakmalı:</b> {rakipler.neyeBakmali}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {(rakipler.aramalar || []).map((a) => (
                <a key={a.terim} href={a.link} target="_blank" rel="noopener noreferrer"
                   style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: THEME.panelBgAlt, borderRadius: 6, padding: "10px 12px",
                            textDecoration: "none", border: `1px solid ${THEME.border}` }}>
                  <span style={{ fontSize: 13, color: THEME.textLight }}>"{a.terim}"</span>
                  <span style={{ fontSize: 11.5, color: THEME.cyan }}>Reklam Kütüphanesi'nde aç →</span>
                </a>
              ))}
            </div>

            {rakipler.apiSonuc && rakipler.apiSonuc.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 8 }}>
                  API'den dönen kayıtlar (siyasi/toplumsal kategoride olanlar):
                </div>
                {rakipler.apiSonuc.map((x, i) => (
                  <div key={i} style={{ background: THEME.panelBgAlt, borderRadius: 6, padding: "9px 11px", marginBottom: 5 }}>
                    <div style={{ fontSize: 12.5, color: THEME.textLight, fontWeight: 600 }}>{x.sayfa}</div>
                    {x.metin && <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 3, fontStyle: "italic" }}>"{x.metin}"</div>}
                  </div>
                ))}
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

      <h2 style={{ color: THEME.textLight, fontFamily: FONT, fontSize: 20, marginBottom: 6 }}>Reklam Başvuruları <span style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 400 }}>(eski sistem — arşiv)</span></h2>
      <div style={{ background: "rgba(201,162,75,.10)", border: `1px solid ${THEME.warn}`, borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: THEME.textLight, lineHeight: 1.6 }}>
        Bu sistem artık yeni başvuru almıyor — yazarlar artık "Kitabımı Reklama Aç" ile <b>Yazar Kampanyaları</b>'ndan
        doğrudan kampanya açıyor. Aşağıdakiler daha önce gelmiş, henüz kapanmamış başvurular — istersen elle işleyebilirsin.
      </div>
      {liste.length === 0 && <div style={{ color: THEME.textFaint, fontSize: 13 }}>Bekleyen eski başvuru yok.</div>}
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

// EKLENDİ (6 Ağu 2026, kullanıcı talebi — "yazar getirmelerinde 2000 TL
// ödül mekanizması"): önceden bu özellik yalnızca görünüşte vardı, yazar
// uygulamasındaki form hiçbir yere kaydetmiyordu. Artık gerçek bir akış:
// admin burada "paket aldı" işaretlediğinde, getiren yazara otomatik
// 2000₺ kredi + kutlama verilir (backend'de tek noktadan, iki kez
// verilmez).
// EKLENDİ (6 Ağu 2026, kullanıcı talebi — "panelde bir özet ekran
// istiyorum"): ai_kullanim_log tablosundan GERÇEK (tahmini değil,
// gerçekleşen) token kullanımına dayalı maliyet özeti. Gerçek zamanlı
// değil — Anthropic Console'daki resmi rakamlarla karşılaştırıp
// doğruluğunu teyit etmek iyi bir alışkanlıktır.
function AiMaliyetOzeti({ authFetch }) {
  const [veri, setVeri] = useState(null);
  const [gun, setGun] = useState(30);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = async (g) => {
    setYukleniyor(true);
    try {
      const r = await authFetch(`/api/admin/ai-maliyet-ozeti?gun=${g}`);
      setVeri(await r.json());
    } catch { setVeri(null); }
    finally { setYukleniyor(false); }
  };
  useEffect(() => { yukle(gun); }, [gun]);

  const ozellikAdi = { eser_inceleme: "Eser İnceleme", editoryal_analiz: "Editöryal Analiz", ai_menajer: "AI Menajer",
    ai_takip_sorusu: "AI Takip Sorusu", admin_arac: "Panel Araçları (diğer)" };
  const kutu = { background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 16 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: 0 }}>AI Maliyet Özeti</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 30, 90].map(g => (
            <button key={g} onClick={() => setGun(g)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                       border: gun === g ? "none" : `1px solid ${THEME.border}`, background: gun === g ? THEME.cyan : THEME.panelBg,
                       color: gun === g ? "#fff" : THEME.textLight }}>
              {g} gün
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 18 }}>
        Gerçek Anthropic API kullanımına dayalı tahmini maliyet — gerçek zamanlı değil, hesaplanmış. Anthropic Console'daki resmi rakamlarla karşılaştırmanı öneririz.
      </div>

      {yukleniyor && <div style={{ fontSize: 13, color: THEME.textMuted }}>Yükleniyor…</div>}

      {veri && !yukleniyor && (
        <>
          <div style={{ ...kutu, textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: ".15em", color: THEME.textFaint, marginBottom: 8 }}>SON {veri.gunAraligi} GÜN TOPLAM TAHMİNİ MALİYET</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, color: THEME.cyan }}>${veri.toplamDolar.toFixed(2)}</div>
          </div>

          {!veri.ozellikler.length && <div style={{ fontSize: 13, color: THEME.textMuted }}>Bu dönemde kayıtlı AI kullanımı yok.</div>}

          {veri.ozellikler.map(o => (
            <div key={o.ozellik} style={kutu}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: THEME.textLight }}>{ozellikAdi[o.ozellik] || o.ozellik}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: THEME.cyan }}>${o.tahminiDolar.toFixed(4)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontSize: 12, color: THEME.textMuted }}>
                <div>Çağrı: <b style={{ color: THEME.textLight }}>{o.cagri_sayisi}</b></div>
                <div>Input: <b style={{ color: THEME.textLight }}>{Number(o.input_token).toLocaleString("tr-TR")}</b></div>
                <div>Output: <b style={{ color: THEME.textLight }}>{Number(o.output_token).toLocaleString("tr-TR")}</b></div>
                {(Number(o.cache_okuma_token) > 0 || Number(o.cache_yazma_token) > 0) &&
                  <div>Cache: <b style={{ color: THEME.success }}>{Number(o.cache_okuma_token).toLocaleString("tr-TR")} okuma</b></div>}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 8 }}>
            Fiyatlandırma (Sonnet 4.6, Ağu 2026): ${veri.fiyatlandirma.input}/MTok input · ${veri.fiyatlandirma.output}/MTok output · cache okuma ${veri.fiyatlandirma.cacheOku}/MTok
          </div>
        </>
      )}
    </div>
  );
}

function ReferanslarView({ authFetch }) {
  const [list, setList] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);

  const yukle = async () => {
    setYukleniyor(true);
    try {
      const r = await authFetch("/api/admin/referanslar");
      setList((await r.json()).referanslar || []);
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setYukleniyor(false); }
  };
  useEffect(() => { yukle(); }, []);

  const durumGuncelle = async (id, durum) => {
    if (calisiyor) return; setCalisiyor(true); setMesaj("");
    try {
      const r = await authFetch(`/api/admin/referanslar/${id}/durum`, { method: "POST", body: JSON.stringify({ durum }) });
      const d = await r.json();
      if (d.ok) { setMesaj(durum === "paket_aldi" ? "İşaretlendi — ödül otomatik verildi." : "Güncellendi."); yukle(); }
      else setMesaj(d.error || "Güncellenemedi.");
    } catch { setMesaj("Sunucuya ulaşılamadı."); }
    finally { setCalisiyor(false); }
  };

  const kutu = { background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 };
  const btn = (dolu, renk) => ({ padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: dolu ? "none" : `1px solid ${THEME.border}`, background: dolu ? (renk || THEME.cyan) : THEME.panelBg, color: dolu ? "#fff" : THEME.textLight });
  const durumEtiket = { bekliyor: "Beklemede", kayit_oldu: "Kayıt Oldu", paket_aldi: "Paket Aldı" };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontSize: 22, margin: "0 0 6px" }}>Yazar Getirme</h2>
      <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 18 }}>
        Yazarların önerdiği kişiler. "Paket Aldı" işaretlendiğinde getiren yazara otomatik 2.000₺ kredi verilir — bu işlem geri alınamaz ve aynı öneriye iki kez uygulanmaz.
      </div>
      {mesaj && <div style={{ ...kutu, color: THEME.cyan }}>{mesaj}</div>}
      {yukleniyor && <div style={{ fontSize: 13, color: THEME.textMuted }}>Yükleniyor…</div>}
      {!yukleniyor && !list.length && <div style={{ fontSize: 13, color: THEME.textMuted }}>Henüz hiç öneri yok.</div>}
      {list.map(r => (
        <div key={r.id} style={kutu}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.getirilen_ad} <span style={{ color: THEME.textMuted, fontWeight: 400, fontSize: 12 }}>({r.getirilen_telefon || "telefon yok"})</span></div>
              <div style={{ color: THEME.textMuted, fontSize: 12, marginTop: 2 }}>
                Öneren: <b>{r.getiren_adi}</b> · {new Date(r.created_at).toLocaleDateString("tr-TR")}
                {r.odul_verildi && <span style={{ color: THEME.success }}> · 2.000₺ ödül verildi</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: THEME.textMuted, marginRight: 4 }}>{durumEtiket[r.durum] || r.durum}</span>
              {r.durum === "bekliyor" && <button disabled={calisiyor} style={btn(false)} onClick={() => durumGuncelle(r.id, "kayit_oldu")}>Kayıt Oldu İşaretle</button>}
              {r.durum !== "paket_aldi" && <button disabled={calisiyor} style={btn(true, THEME.success)} onClick={() => durumGuncelle(r.id, "paket_aldi")}>Paket Aldı — Ödül Ver</button>}
            </div>
          </div>
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
    if (!window.confirm("Bu duyuru KALICI olarak silinsin mi? (Geçmiş kaydı da gider — genelde 'Durdur' daha güvenlidir.)")) return;
    await authFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  };
  // EKLENDİ (6 Ağu 2026, kullanıcı talebi — "iptal edebilmeli,
  // durdurabilmeliyiz"): Sil'in aksine geçmiş kaydı korunur, sadece
  // yazarlara artık gösterilmez.
  const durdurAcVeyaKapat = async (id, yeniAktif) => {
    await authFetch(`/api/admin/announcements/${id}/durdur`, { method: "POST", body: JSON.stringify({ aktif: yeniAktif }) });
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
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: THEME.panelBg, border: `1px solid ${a.aktif === false ? THEME.border : THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10, gap: 14, opacity: a.aktif === false ? 0.6 : 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{a.baslik}</div>
              <Badge fg={a.hedef === "all" ? THEME.cyan : THEME.warn} bg={a.hedef === "all" ? "rgba(27,95,168,0.08)" : THEME.warnBg}>{a.hedef === "all" ? "Herkes" : (a.author_name || "Yazar")}</Badge>
              {a.aktif === false && <Badge fg={THEME.textFaint} bg={THEME.panelBgAlt || "rgba(0,0,0,.04)"}>Durduruldu</Badge>}
            </div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{a.icerik}</div>
            <div style={{ color: THEME.textFaint, fontSize: 10.5, marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString("tr-TR")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {a.aktif === false
              ? <Btn small variant="ghost" onClick={() => durdurAcVeyaKapat(a.id, true)}>Tekrar Aç</Btn>
              : <Btn small variant="ghost" onClick={() => durdurAcVeyaKapat(a.id, false)}>Durdur</Btn>}
            <Btn small variant="danger" onClick={() => sil(a.id)}>Sil</Btn>
          </div>
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
      else setMsg({ ok: true, text: `${d.senkronize ?? 0} kampanya senkronlandı (${d.eslesmeyaen ?? 0} eşleşmeyen).` });
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
  useEffect(() => { fontlariYukle(); }, []);
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
      // GERÇEK HATA (5 Ağu 2026, kullanıcı raporu — "destek bildirimi
      // geliyor ama Destek & Şikayet ekranında hiçbir şey görünmüyor"):
      // backend bu ucu { requests: [...] } olarak döndürüyor, burada ise
      // data.talepler okunuyordu. İsim uyuşmadığı için liste HER ZAMAN
      // boş kalıyordu — "Henüz destek talebi yok" yazıyordu, oysa talep
      // vardı. Her iki adı da kabul ediyoruz (ileride uç değişse de bozulmasın).
      .then((data) => setDestekTalepleri(data.requests || data.talepler || []))
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
    ["destek", "Destek & Şikayet"], ["duyurular", "Duyurular"], ["referanslar", "Yazar Getirme"], ["aiMaliyet", "AI Maliyet Özeti"], ["meta", "Meta Reklam"],
    ["oyun", "Görev & Ödül"],
    ["demoHesap", "Demo Hesaplar"],
    ["adayKokpiti", "Aday Kokpiti"],
    ["adayKazanimOgrenme", "Aday Kazanım Öğrenmeleri"],
    ["akademiUzman", "Akademi Uzman Kapısı"],
    ["menajerDirektif", "AI Menajer Direktifleri"],
    ["reklamLtv", "Reklam LTV Zinciri"],
    ["gorusmePlani", "Görüşme Oyun Planı"],
    ["teklifMerkezi", "Teklif Merkezi"],
    ["vaatYonetimi", "Vaat Yönetimi"],
    ["labKuyrugu", "Laboratuvar Kuyruğu"],
    ["senkronUyarilari", "Senkron Uyarıları"],
    ["versiyonTest", "Versiyon Testi"],
    ["reklamMerkezi", "Reklam Merkezi"],
    ["yazarKampanya", "Yazar Kampanyaları"],
    ["reklamTeklif", "Reklam Başvuruları"],
    ["eslesme", "Eşleşme Teşhisi"],
    ["isbn", "Toplu ISBN"],
    ["kitapStudyo", "Kitap Resim Stüdyosu"],
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
        {view === "referanslar" && <ReferanslarView authFetch={authFetch} />}
        {view === "aiMaliyet" && <AiMaliyetOzeti authFetch={authFetch} />}
        {view === "meta" && <MetaReklamView authFetch={authFetch} />}
        {view === "oyun" && <OyunView authFetch={authFetch} authors={authors} />}
        {view === "demoHesap" && <DemoHesaplar authFetch={authFetch} />}
        {view === "adayKokpiti" && <AdayKokpiti authFetch={authFetch} />}
        {view === "adayKazanimOgrenme" && <AdayKazanimOgrenmeleri authFetch={authFetch} />}
        {view === "akademiUzman" && <AkademiUzmanKapisi authFetch={authFetch} />}
        {view === "menajerDirektif" && <MenajerDirektifleri authFetch={authFetch} />}
        {view === "reklamLtv" && <ReklamLtv authFetch={authFetch} />}
        {view === "gorusmePlani" && <GorusmeOyunPlani authFetch={authFetch} />}
        {view === "teklifMerkezi" && <TeklifMerkezi authFetch={authFetch} />}
        {view === "vaatYonetimi" && <VaatYonetimi authFetch={authFetch} />}
        {view === "labKuyrugu" && <LaboratuvarKuyrugu authFetch={authFetch} />}
        {view === "senkronUyarilari" && <SenkronUyarilari authFetch={authFetch} />}
        {view === "reklamMerkezi" && <ReklamMerkezi authFetch={authFetch} />}
        {view === "yazarKampanya" && <YazarKampanyalari authFetch={authFetch} />}
        {view === "reklamTeklif" && <ReklamBasvurulari authFetch={authFetch} />}
        {view === "eslesme" && <EslesmeTeshisi authFetch={authFetch} onSelectAuthor={(id) => { setView("authors"); setSelectedId(id); }} />}
        {view === "isbn" && <BulkIsbnUpload onSubmit={bulkIsbn} />}
        {view === "kitapStudyo" && <KitapStudyo authFetch={authFetch} token={session?.token} />}
        {view === "kullanicilar" && <KullaniciYonetimi authFetch={authFetch} />}
      </div>

      {showAddModal && <AddAuthorModal onClose={() => setShowAddModal(false)} onAdd={addAuthor} />}
    </div>
  );
}
