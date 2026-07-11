import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://mst-backend-mauve.vercel.app";

// ============ Ortak tema (mobil yazar uygulamasıyla aynı marka dili) ============
const THEME = {
  bg: "#03040A",
  panelBg: "#0B0F1C",
  panelBgAlt: "#0E1424",
  sidebarBg: "#080B14",
  border: "#1C2438",
  divider: "#161C2E",
  cyan: "#7CE7FF",
  secondary: "#B25CFF",
  textLight: "#EAF2FF",
  textMuted: "#7683A6",
  textFaint: "#4A5578",
  success: "#59E39D",
  successBg: "rgba(89,227,157,0.12)",
  warn: "#FF8A3D",
  warnBg: "rgba(255,138,61,0.12)",
  danger: "#FF6B6B",
  dangerBg: "rgba(255,107,107,0.12)",
};

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
          <div style={{ fontSize: 20, fontWeight: 800, color: k.renk, fontFamily: "monospace", lineHeight: 1 }}>{k.deger}</div>
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
  { key: "mst", label: "MST Yayıncılık", badgeBg: THEME.cyan, badgeFg: "#0A0E1A" },
  { key: "trendyol", label: "Trendyol", badgeBg: "#0A0A0A", badgeFg: "#FF6A00" },
  { key: "n11", label: "N11", badgeBg: "#5B21B6", badgeFg: "#FFFFFF" },
  { key: "hepsiburada", label: "Hepsiburada", badgeBg: "#FFFFFF", badgeFg: "#FF6000" },
  { key: "pazarama", label: "Pazarama", badgeBg: "#0F2A5C", badgeFg: "#FF2D87" },
];

const PIPELINE_STAGES = [
  { key: "teslim", label: "Kitap Teslim Alındı" }, { key: "editor", label: "Editör Hizmeti" }, { key: "kapak", label: "Kapak Tasarımı" },
  { key: "isbn", label: "Bandrol Alımı" }, { key: "sosyal", label: "Sosyal Medya Tanıtımı" }, { key: "baski", label: "Baskı" },
  { key: "satis", label: "Satışa Sunum" }, { key: "yayin", label: "Yayında" },
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
    primary: { bg: THEME.cyan, fg: "#0A0E1A" },
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
    <div style={{ minHeight: "100vh", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope',sans-serif" }}>
      <div style={{ width: 360, background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 28 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: THEME.textLight, marginBottom: 2 }}>MST Yayıncılık</div>
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
function Overview({ authors, onSyncAll }) {
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
        const adet = data.updated ?? data.count ?? data.synced;
        setSyncMsg({ ok: true, text: adet != null ? `Senkronizasyon tamamlandı — ${adet} kayıt güncellendi.` : "Senkronizasyon tamamlandı." });
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
        <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, margin: 0 }}>Genel Bakış</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {syncMsg && (
            <span style={{ fontSize: 12, color: syncMsg.ok ? THEME.gold : THEME.warn, maxWidth: 320 }}>{syncMsg.text}</span>
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
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Space Mono',monospace", color: c.warn ? THEME.warn : THEME.textLight }}>{c.value}</div>
            <div style={{ fontSize: 10.5, color: THEME.textMuted, marginTop: 4, letterSpacing: "0.04em" }}>{c.label}</div>
          </div>
        ))}
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

  const inp = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt || "#1a2332", color: THEME.textLight, fontSize: 13, marginBottom: 8 };

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>Kullanıcı Yönetimi</h2>
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 6 }}>İndirimli Alım Özeti</h2>
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
          <div style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace", fontSize: 16, fontWeight: 700 }}>{o.toplam_indirimli_adet} adet</div>
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
  const [mNote, setMNote] = React.useState("");
  const [mMsg, setMMsg] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Seçili yazarın kitapları (kitap seçimi için)
  const seciliYazar = (authors || []).find((a) => String(a.id) === String(mAuthor));
  const yazarKitaplari = seciliYazar?.books || [];

  const kaydet = async () => {
    if (!mAuthor) { setMMsg({ ok: false, text: "Yazar seçin." }); return; }
    if (!mBook) { setMMsg({ ok: false, text: "Kitap seçin. İndirimli alım hangi kitaba ait olduğu belirtilmeli." }); return; }
    if (!mQty) { setMMsg({ ok: false, text: "Adet girin." }); return; }
    setSaving(true); setMMsg(null);
    const r = await onManualAdd({ authorId: mAuthor, bookId: mBook, quantity: parseInt(mQty, 10), note: mNote });
    setSaving(false);
    if (r?.ok) { setMMsg({ ok: true, text: r.mesaj || "Kaydedildi." }); setMQty(""); setMNote(""); setMAuthor(""); setMBook(""); }
    else setMMsg({ ok: false, text: r?.error || "Kaydedilemedi." });
  };

  // Yazar değişince kitap seçimini sıfırla
  React.useEffect(() => { setMBook(""); }, [mAuthor]);

  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>İndirimli Kitap Talepleri</h2>

      {/* MANUEL GİRİŞ — telefon/yüz yüze indirimli satışlar için */}
      <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 10, padding: 18, marginBottom: 22 }}>
        <div style={{ color: THEME.cyan, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>+ Manuel İndirimli Alım Girişi</div>
        <div style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 14 }}>
          Telefon/yüz yüze indirimli satılan kitapları buradan gir. Bu adetler yazarın telif, puan ve ödül hesabına <b>sayılmaz</b> (çifte kazanç önlenir).
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Yazar</label>
            <select value={mAuthor} onChange={(e) => setMAuthor(e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt || "#1a2332", color: THEME.textLight, fontSize: 13 }}>
              <option value="">Yazar seç...</option>
              {(authors || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Kitap</label>
            <select value={mBook} onChange={(e) => setMBook(e.target.value)} disabled={!mAuthor} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt || "#1a2332", color: mAuthor ? THEME.textLight : THEME.textFaint, fontSize: 13 }}>
              <option value="">{mAuthor ? (yazarKitaplari.length ? "Kitap seç..." : "Bu yazarın kitabı yok") : "Önce yazar seçin"}</option>
              {yazarKitaplari.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 90px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Adet</label>
            <input type="number" min="1" value={mQty} onChange={(e) => setMQty(e.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt || "#1a2332", color: THEME.textLight, fontSize: 13 }} />
          </div>
          <div style={{ flex: "2 1 160px" }}>
            <label style={{ color: THEME.textMuted, fontSize: 11, display: "block", marginBottom: 4 }}>Not (opsiyonel)</label>
            <input value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="Örn: imza günü" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 7, border: `1px solid ${THEME.border}`, background: THEME.panelBgAlt || "#1a2332", color: THEME.textLight, fontSize: 13 }} />
          </div>
          <Btn small variant="success" onClick={kaydet} disabled={saving}>{saving ? "..." : "Kaydet"}</Btn>
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
              {r.book_title || "Kitap belirtilmemiş"} · <span style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>{r.quantity} adet</span>
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

// ============ Toplu ISBN yükleme ============
// ============ Mağaza Siparişleri ============
function ServiceOrdersView({ orders, loading, onUpdateStatus }) {
  return (
    <div>
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>Mağaza Siparişleri</h2>
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
              {o.bookTitle && <>{o.bookTitle} · </>}{o.detail && <>{o.detail} · </>}{o.price != null ? <span style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>{Number(o.price).toLocaleString("tr-TR")}₺</span> : "Ücretsiz başvuru"}
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 8 }}>Reklam Talepleri</h2>
      {loading && requests.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Yükleniyor...</div>}

      <div style={{ fontSize: 11, letterSpacing: "0.05em", color: THEME.textMuted, margin: "16px 0 10px" }}>YÖNETİLEN TALEPLER (STANDART/PROFESYONEL)</div>
      {talepler.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13 }}>Bekleyen talep yok.</div>}
      {talepler.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 10 }}>
          <div>
            <div style={{ color: THEME.textLight, fontWeight: 700, fontSize: 14 }}>{r.author_name}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>{r.bookTitle} · Bütçe <span style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>{Number(r.budget).toLocaleString("tr-TR")}₺</span></div>
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
            <div style={{ color: THEME.textMuted, fontSize: 12.5, marginTop: 2 }}>{c.bookTitle} · {c.platform} · <span style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>{Number(c.budget).toLocaleString("tr-TR")}₺</span> · {c.duration} gün</div>
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>Çeviri Talepleri</h2>
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>Destek & Şikayet Talepleri</h2>
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
              <Badge fg={r.kategori === "sikayet" ? THEME.warn : THEME.cyan} bg={r.kategori === "sikayet" ? THEME.warnBg : "rgba(124,231,255,.08)"}>{KAT[r.kategori] || r.kategori}</Badge>
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
          <div style={{ fontSize: 13, color: THEME.textLight }}>{o.gorsel} {o.baslik} <span style={{ fontSize: 11, color: THEME.warn, fontFamily: "monospace" }}>{Number(o.kredi_fiyat)}₺</span> <span style={{ fontSize: 10, color: THEME.textFaint }}>(sv{o.min_seviye})</span></div>
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 18 }}>Duyurular</h2>
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
              <Badge fg={a.hedef === "all" ? THEME.cyan : THEME.warn} bg={a.hedef === "all" ? "rgba(124,231,255,.08)" : THEME.warnBg}>{a.hedef === "all" ? "Herkes" : (a.author_name || "Yazar")}</Badge>
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
        <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, margin: 0 }}>Meta Reklam</h2>
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
                    <span style={{ color: THEME.textMuted }}>Harcama <span style={{ color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>{Number(c.spend).toLocaleString("tr-TR")}₺</span></span>
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
      <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, marginBottom: 8 }}>Toplu ISBN Yükleme</h2>
      <div style={{ color: THEME.textMuted, fontSize: 12.5, marginBottom: 14, lineHeight: 1.6 }}>
        Her satıra bir kitap: <strong style={{ color: THEME.textLight }}>Kitap Adı,ISBN</strong> formatında yapıştırın.
        Örnek: <code style={{ color: THEME.cyan }}>Meçhul Tren,9786258758153</code><br />
        Kitap adı, sistemde kayıtlı en yakın başlıkla otomatik eşleştirilir; ISBN 13 haneli olmalıdır (tireler önemli değil).
      </div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"Meçhul Tren,978-625-8758-15-3\nBlue Sandal,9786258758016"}
        rows={10}
        style={{ width: "100%", boxSizing: "border-box", padding: 12, border: `1px solid ${THEME.border}`, borderRadius: 6, background: THEME.panelBgAlt, color: THEME.textLight, fontFamily: "'Space Mono',monospace", fontSize: 13, resize: "vertical", marginBottom: 10 }}
      />
      {error && <div style={{ color: THEME.danger, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <Btn onClick={submit} disabled={busy}>{busy ? "Yükleniyor..." : "Toplu Yükle"}</Btn>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>TOPLAM</div>
              <div style={{ fontSize: 18, color: THEME.textLight, fontFamily: "'Space Mono',monospace" }}>{result.toplam}</div>
            </div>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>EŞLEŞEN</div>
              <div style={{ fontSize: 18, color: THEME.success, fontFamily: "'Space Mono',monospace" }}>{result.eslesen}</div>
            </div>
            <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontSize: 10.5, color: THEME.textMuted }}>EŞLEŞMEYEN</div>
              <div style={{ fontSize: 18, color: result.eslesmeyen > 0 ? THEME.danger : THEME.textLight, fontFamily: "'Space Mono',monospace" }}>{result.eslesmeyen}</div>
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
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, margin: 0 }}>Yazarlar</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn small variant="ghost" onClick={onTogglePassive}>{showPassive ? "Aktifleri Göster" : "Pasifleri Göster"}</Btn>
          <Btn onClick={onAddClick}>+ Yeni Yazar Ekle</Btn>
        </div>
      </div>
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
            {authors.map((a) => {
              const sold = a.books.reduce((s, b) => s + b.totalSold, 0);
              const pending = a.wallet.pendingReceipts.length;
              const pasif = a.status === "pasif";
              return (
                <tr key={a.id} style={{ borderTop: `1px solid ${THEME.divider}`, opacity: pasif ? 0.5 : 1 }}>
                  <td style={{ padding: "12px 14px", color: THEME.textLight, fontWeight: 600 }}>
                    {a.name}{pasif && <span style={{ marginLeft: 8, fontSize: 10, color: THEME.textFaint, letterSpacing: "0.05em" }}>PASİF</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: THEME.textMuted }}>{a.email}</td>
                  <td style={{ padding: "12px 14px" }}><Badge fg={THEME.cyan} bg="rgba(124,231,255,.1)">{PLAN_LABELS[a.plan]}</Badge></td>
                  <td style={{ padding: "12px 14px", color: THEME.textLight }}>{a.books.length}</td>
                  <td style={{ padding: "12px 14px", color: THEME.textLight, fontFamily: "'Space Mono',monospace" }}>{sold}</td>
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
        <h3 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", marginTop: 0 }}>Yeni Yazar Ekle</h3>

        {result ? (
          <>
            <div style={{ color: THEME.success, fontSize: 13, marginBottom: 14 }}>✓ Yazar oluşturuldu. Bu bilgileri yazara iletin:</div>
            <Field label="KULLANICI ADI">
              <div style={{ ...inputStyle, fontFamily: "'Space Mono',monospace", color: THEME.cyan }}>{result.username}</div>
            </Field>
            <Field label="GEÇİCİ ŞİFRE">
              <div style={{ ...inputStyle, fontFamily: "'Space Mono',monospace", color: THEME.cyan }}>{result.tempPassword}</div>
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
                <input style={{ ...inputStyle, fontFamily: "'Space Mono',monospace", borderColor: isbnGecerli ? undefined : THEME.danger }}
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
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: THEME.textMuted, fontFamily: "'Space Mono',monospace" }}>
            {formulMaliyet != null ? `${formulMaliyet.toFixed(2)}₺` : "—"}
          </div>
        </Field>
      </div>
      <Field label="İSTİSNA MALİYET (elle) — boş bırakılırsa formül kullanılır">
        <input style={{ ...inputStyle, borderColor: override !== "" ? THEME.warn : undefined }} value={override}
          onChange={(e) => setOverride(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="örn. 80 (özel baskı maliyeti)" />
      </Field>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ fontSize: 12, color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>
          Etkin maliyet: {etkinMaliyet != null ? `${Number(etkinMaliyet).toFixed(2)}₺` : "—"}
          {override !== "" && <span style={{ color: THEME.warn, fontSize: 10, marginLeft: 8 }}>(istisna)</span>}
        </div>
        <Btn small disabled={saving} onClick={kaydet}>{saving ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
    </div>
  );
}

// ============ Telif Özeti göstergesi (kilitli/çekilebilir) ============
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
            <div style={{ fontSize: 15, fontWeight: 700, color: k.renk, fontFamily: "'Space Mono',monospace" }}>{Number(k.deger).toLocaleString("tr-TR")}₺</div>
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
          <div style={{ fontSize: 12.5, color: THEME.textMuted, fontFamily: "'Space Mono',monospace" }}>{kalan[p.key] != null ? kalan[p.key] : "—"}</div>
          <input style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, fontFamily: "'Space Mono',monospace" }} value={kodlar[p.key]} onChange={(e) => setKodlar({ ...kodlar, [p.key]: e.target.value })} placeholder="ISBN kullanılır" />
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
  const [username, setUsername] = useState(author.username || "");
  const [email, setEmail] = useState(author.email || "");
  const [yeniSifre, setYeniSifre] = useState("");
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    setBusy(true);
    try {
      const body = {};
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
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>GİRİŞ BİLGİLERİ</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="KULLANICI ADI"><input style={{ ...inputStyle, fontFamily: "'Space Mono',monospace" }} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        <Field label="E-POSTA"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      </div>
      <Field label="YENİ ŞİFRE (belirlemek için yaz, boş bırakırsan değişmez)">
        <input style={{ ...inputStyle, fontFamily: "'Space Mono',monospace" }} value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} placeholder="En az 4 hane" />
      </Field>
      <div style={{ fontSize: 11, color: THEME.textFaint, margin: "-4px 0 12px" }}>Not: Şifreler güvenlik için gizli tutulur; eskisini göremezsin ama yenisini belirleyebilirsin.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" small onClick={onClose}>Kapat</Btn>
        <Btn disabled={busy} onClick={kaydet}>{busy ? "Kaydediliyor..." : "Kaydet"}</Btn>
      </div>
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
      <div style={{ fontSize: 13, color: THEME.textLight, marginBottom: 14 }}>Cüzdan bakiyesi: <span style={{ fontFamily: "'Space Mono',monospace", color: THEME.cyan }}>{bakiye.toLocaleString("tr-TR")}₺</span></div>

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

function AuthorDetail({ author, onBack, onAdvanceStage, onApproveCover, onEditStock, onApprovePayment, onRejectPayment, onEditIsbn, onEditCover, onSyncStock, onAddBook, onDeleteAuthor, onUpdateCredentials, onPayout, onUpdateRoyalty, onUpdateWallet, onUpdateContract, onUpdateMatching, onUpdateMaliyet, authFetch }) {
  const [editingStock, setEditingStock] = useState(null); // {bookId, key}
  const [stockDraft, setStockDraft] = useState("");
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

  const saveNewBook = async () => {
    setNbSaving(true); setNbMsg(null);
    try {
      const data = await onAddBook(author.id, {
        title: nbTitle.trim(),
        isbn: nbIsbnClean || null,
        salePrice: nbPrice ? Number(nbPrice) : null,
        kitapTuru: nbTuru,
        sayfaSayisi: nbSayfa ? Number(nbSayfa) : null,
      });
      if (data && data.ok) {
        setNbMsg({ ok: true, text: data.mesaj || "Kitap eklendi." });
        setNbTitle(""); setNbIsbn(""); setNbPrice(""); setNbTuru("roman"); setNbSayfa("");
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
          <h2 style={{ color: THEME.textLight, fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, margin: "0 0 4px" }}>{author.name}</h2>
          <div style={{ color: THEME.textMuted, fontSize: 13 }}>{author.email} · <Badge fg={THEME.cyan} bg="rgba(124,231,255,.1)">{PLAN_LABELS[author.plan]}</Badge>{author.status === "pasif" && <span style={{ marginLeft: 8, fontSize: 10, color: THEME.textFaint }}>PASİF</span>}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "cred" ? null : "cred"); setMsg(null); }}>Giriş Bilgileri</Btn>
          <Btn small variant="ghost" onClick={() => { setMgmtTab(mgmtTab === "telif" ? null : "telif"); setMsg(null); }}>Kazanç & Telif</Btn>
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
      {/* Sözleşme yönetimi */}
      {mgmtTab === "sozlesme" && <SozlesmePanel author={author} onSave={onUpdateContract} flash={flash} />}


      {/* Yeni kitap ekleme formu */}
      {showBookForm && (
        <div style={{ background: THEME.panelBg, border: `1px solid ${THEME.cyan}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 12 }}>YENİ KİTAP — {author.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr", gap: 12 }}>
            <Field label="KİTAP ADI"><input style={inputStyle} value={nbTitle} onChange={(e) => setNbTitle(e.target.value)} placeholder="Kitap adı" /></Field>
            <Field label="ISBN (13 HANE)"><input style={{ ...inputStyle, fontFamily: "'Space Mono',monospace", borderColor: nbIsbnOk ? undefined : THEME.danger }} value={nbIsbn} onChange={(e) => setNbIsbn(e.target.value)} placeholder="9786250000000" /></Field>
            <Field label="FİYAT (₺)"><input style={inputStyle} value={nbPrice} onChange={(e) => setNbPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="180" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 2fr", gap: 12, marginTop: 10 }}>
            <Field label="KİTAP TÜRÜ">
              <select style={inputStyle} value={nbTuru} onChange={(e) => setNbTuru(e.target.value)}>
                <option value="roman">Roman (siyah-beyaz)</option>
                <option value="cocuk">Çocuk kitabı</option>
              </select>
            </Field>
            <Field label="SAYFA SAYISI"><input style={inputStyle} value={nbSayfa} onChange={(e) => setNbSayfa(e.target.value.replace(/[^0-9]/g, ""))} placeholder="200" /></Field>
            <Field label="TAHMİNİ BASKI MALİYETİ">
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: THEME.cyan, fontFamily: "'Space Mono',monospace" }}>
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

      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>CÜZDAN BAKİYESİ</div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 20, color: THEME.cyan, marginBottom: 12 }}>{author.wallet.balance.toLocaleString("tr-TR")}₺</div>
      <CuzdanGecmisi authorId={author.id} authFetch={authFetch} />

      {/* Kitaplar */}
      <div style={{ fontSize: 12, letterSpacing: "0.05em", color: THEME.textMuted, marginBottom: 10 }}>KİTAPLAR</div>
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
              {published
                ? <Badge fg={THEME.success} bg={THEME.successBg}>✓ Yayınlandı</Badge>
                : <Badge fg={THEME.warn} bg={THEME.warnBg}>{book.pipeline[activeStageIdx].label}</Badge>}
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
                  placeholder="978..." style={{ background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.cyan}`, borderRadius: 4, padding: "4px 8px", fontSize: 12.5, fontFamily: "'Space Mono',monospace", width: 160 }}
                />
              ) : (
                <span onClick={() => { setEditingIsbn(book.id); setIsbnDraft(book.isbn || ""); }} style={{ fontFamily: "'Space Mono',monospace", fontSize: 12.5, color: book.isbn ? THEME.textLight : THEME.textFaint, cursor: "pointer", borderBottom: `1px dashed ${THEME.border}` }}>
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
            </div>

            {/* Telif özeti — her kitapta görünür */}
            <TelifOzetiKutu book={book} />

            {maliyetBook === book.id && onUpdateMaliyet && (
              <MaliyetEditor book={book} onSave={onUpdateMaliyet} flash={(ok, t) => setMsg({ ok, text: t })} />
            )}

            {matchingBook === book.id && (
              <MatchingEditor book={book} onSave={onUpdateMatching} flash={(ok, t) => setMsg({ ok, text: t })} />
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
                        style={{ width: "100%", background: THEME.bg, color: THEME.textLight, border: `1px solid ${THEME.cyan}`, borderRadius: 4, textAlign: "center", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                      />
                    ) : (
                      <div onClick={() => { setEditingStock({ bookId: book.id, key: p.key }); setStockDraft(String(book.stock[p.key] ?? 0)); }}
                        style={{ fontFamily: "'Space Mono',monospace", fontSize: 15, fontWeight: 700, color: THEME.textLight, cursor: "pointer" }}>
                        {book.stock[p.key] ?? 0}
                      </div>
                    )}
                  </div>
                );
              })}
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
  const manualDiscountAdd = async ({ authorId, bookId, quantity, note }) => {
    try {
      const res = await authFetch("/api/admin/discount-manual", {
        method: "POST",
        body: JSON.stringify({ authorId: parseInt(authorId, 10), bookId: bookId ? parseInt(bookId, 10) : null, quantity, note }),
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
    ["overview", "Genel Bakış"], ["authors", "Yazarlar"], ["discounts", "İndirimli Talepler"],
    ["indirimliOzet", "İndirimli Özet"],
    ["orders", "Mağaza Siparişleri"], ["ads", "Reklam Talepleri"], ["translations", "Çeviri Talepleri"],
    ["destek", "Destek & Şikayet"], ["duyurular", "Duyurular"], ["meta", "Meta Reklam"],
    ["oyun", "Görev & Ödül"],
    ["isbn", "Toplu ISBN"],
    ["kullanicilar", "Kullanıcı Yönetimi"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, display: "flex", fontFamily: "'Manrope',sans-serif" }}>
      <div style={{ width: 220, background: THEME.sidebarBg, borderRight: `1px solid ${THEME.border}`, padding: "20px 14px", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: THEME.textLight, fontSize: 15, marginBottom: 2 }}>MST Yayıncılık</div>
        <div style={{ fontSize: 10.5, color: THEME.textMuted, letterSpacing: "0.05em", marginBottom: 4 }}>YÖNETİM PANELİ</div>
        <div style={{ fontSize: 10, color: THEME.cyan, marginBottom: 24 }}>{session.admin?.name || session.admin?.email}</div>
        {nav.map(([key, label]) => (
          <div key={key} onClick={() => { setView(key); setSelectedId(null); }} style={{
            padding: "9px 12px", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 13,
            background: view === key ? "rgba(124,231,255,.08)" : "transparent",
            color: view === key ? THEME.cyan : THEME.textMuted, fontWeight: view === key ? 700 : 500,
            display: "flex", alignItems: "center", justifyContent: "space-between",
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
            style={{ position: "relative", cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: bildirimAcik ? "rgba(124,231,255,.08)" : "transparent", display: "flex", alignItems: "center", gap: 6 }}
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,231,255,.05)")}
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
        {view === "overview" && <Overview authors={authors} onSyncAll={syncAll} />}
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
        {view === "indirimliOzet" && <IndirimliOzet session={session} authFetch={authFetch} />}
        {view === "orders" && <ServiceOrdersView orders={serviceOrders} loading={loadingOrders} onUpdateStatus={updateOrderStatus} />}
        {view === "ads" && <AdRequestsView requests={adRequests} loading={loadingAdRequests} onUpdateStatus={updateAdRequestStatus} />}
        {view === "translations" && <TranslationRequestsView requests={translationRequests} loading={loadingTranslations} onUpdateStatus={updateTranslationStatus} />}
        {view === "destek" && <DestekTalepleriView requests={destekTalepleri} loading={loadingDestek} onUpdateStatus={updateDestekStatus} />}
        {view === "duyurular" && <DuyurularView authFetch={authFetch} authors={authors} />}
        {view === "meta" && <MetaReklamView authFetch={authFetch} />}
        {view === "oyun" && <OyunView authFetch={authFetch} authors={authors} />}
        {view === "isbn" && <BulkIsbnUpload onSubmit={bulkIsbn} />}
        {view === "kullanicilar" && <KullaniciYonetimi authFetch={authFetch} />}
      </div>

      {showAddModal && <AddAuthorModal onClose={() => setShowAddModal(false)} onAdd={addAuthor} />}
    </div>
  );
}
