"use strict";
const CFG = window.KK_CONFIG;
const $ = (id) => document.getElementById(id);

const I18N = {
  ja: {
    login_title: "ログイン", login: "ログイン", signup: "新規登録", logout: "ログアウト",
    demo_mode: "デモモード（この端末にだけ保存されます）",
    add_title: "今日のページ", photo_btn: "写真から測る", add: "追加",
    manual_hint: "インク量は「万」の単位で手入力もできます",
    records: "記録", zukan: "図鑑",
    privacy: "日記の中身は読みません。測るのはインクの量だけ。写真は保存されません。",
    stage: "ステージ", no_records: "まだ記録がありません",
    month_stats: (days, man, kg) => `今月は ${days} 日書いて ${(man).toFixed(1)} 万インク ・ ${kg} kg級`,
    measured: (man) => `測れました： ${(man).toFixed(1)} 万インク。このまま追加しました`,
    measuring: "測っています…",
    save_error: (m) => `保存できませんでした： ${m}`,
    zukan_stats: (days, man, kg, st) => `${days} 日 ・ ${(man).toFixed(1)} 万インク ・ ${kg} kg級 ・ 到達ステージ ${st}`,
    judge: (maxStage, days) => maxStage >= 10 ? "燃え尽きた月。文句なし。" :
      maxStage >= 8 ? "よく燃えた月。あと少しで全開。" :
      maxStage >= 5 ? "熱の入った月。波に乗れてきた。" :
      days >= 8 ? "静かに続いた月。それも力。" : "助走の月。ここから熱くなる。",
    auth_ok: "ログインしました", auth_check: "確認メールを見てください", auth_ng: "うまくいきませんでした",
    del_confirm: "この記録を消しますか？"
  },
  en: {
    login_title: "Log in", login: "Log in", signup: "Sign up", logout: "Log out",
    demo_mode: "Demo mode (saved on this device only)",
    add_title: "Today's page", photo_btn: "Measure from a photo", add: "Add",
    manual_hint: "You can also type the ink amount (unit: 10k px)",
    records: "Records", zukan: "Collection",
    privacy: "We never read your diary. We only count the ink. Photos are never stored.",
    stage: "Stage", no_records: "No records yet",
    month_stats: (days, man, kg) => `${days} days written this month · ${(man).toFixed(1)}0k ink · class ${kg} kg`,
    measured: (man) => `Measured: ${(man).toFixed(1)}0k ink. Added.`,
    measuring: "Measuring…",
    save_error: (m) => `Could not save: ${m}`,
    zukan_stats: (days, man, kg, st) => `${days} days · ${(man).toFixed(1)}0k ink · class ${kg} kg · reached stage ${st}`,
    judge: (maxStage, days) => maxStage >= 10 ? "A month burned to the end. No notes." :
      maxStage >= 8 ? "A hot month. Almost full blaze." :
      maxStage >= 5 ? "A month with real heat in it." :
      days >= 8 ? "A quiet, steady month. That counts too." : "A warm-up month. It heats up from here.",
    auth_ok: "Logged in", auth_check: "Check your email to confirm", auth_ng: "Something went wrong",
    del_confirm: "Delete this record?"
  }
};
let lang = localStorage.getItem("kk_lang") || "ja";
const t = (k, ...a) => { const v = I18N[lang][k]; return typeof v === "function" ? v(...a) : v; };

const WORDS = { ja: ["", "まだ静か", "まだ静か", "集中してきた", "集中してきた", "熱くなってきた", "熱くなってきた", "燃えてる", "燃えてる", "全開", "全開"],
                en: ["", "Still quiet", "Still quiet", "Focusing", "Focusing", "Heating up", "Heating up", "Burning", "Burning", "FULL BLAZE", "FULL BLAZE"] };

// ---------- growth ----------
function scoreOf(monthTotal, dayInk) {
  const m = CFG.MONTH_WEIGHT * Math.min(Math.sqrt(monthTotal / CFG.MONTH_FULL_INK), 1);
  const d = CFG.DAY_WEIGHT * Math.sqrt(dayInk / CFG.DAY_FULL_INK);
  return Math.min(m + d, 1);
}
function stageOf(score) { return 1 + Math.floor(Math.min(Math.max(score, 0), 1) * 9.999); }
function monthKey(dateStr) { return dateStr.slice(0, 7); }
function kgOf(monthTotal) { return (monthTotal / CFG.KG_DIVISOR).toFixed(1); }

// stage reached by each entry, considering entries in the same month up to it
function computeStages(entriesAsc) {
  const out = new Map(); const run = {};
  for (const e of entriesAsc) {
    const mk = monthKey(e.date);
    run[mk] = (run[mk] || 0) + e.ink;
    out.set(e.id, stageOf(scoreOf(run[mk], e.ink)));
  }
  return out;
}

// ---------- storage ----------
const DEMO = !CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY;
let sb = null;
if (!DEMO && window.supabase) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
else if (!DEMO) console.warn("supabase library failed to load; running without backend");
let user = null;
let entries = []; // ascending by date

async function loadEntries() {
  if (DEMO) {
    entries = JSON.parse(localStorage.getItem("kk_entries") || "[]");
  } else {
    const { data, error } = await sb.from("entries").select("id,date,ink").order("date", { ascending: true });
    if (error) throw new Error(error.message);
    entries = data || [];
  }
  entries.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}
async function addEntry(date, ink) {
  if (DEMO) {
    entries = entries.filter(e => e.date !== date);
    entries.push({ id: "d" + Date.now(), date, ink });
    localStorage.setItem("kk_entries", JSON.stringify(entries));
  } else {
    const { error } = await sb.from("entries").upsert({ user_id: user.id, date, ink }, { onConflict: "user_id,date" });
    if (error) throw new Error(error.message);
    await loadEntries();
  }
  entries.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}
async function deleteEntry(id) {
  if (DEMO) {
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem("kk_entries", JSON.stringify(entries));
  } else {
    const { error } = await sb.from("entries").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await loadEntries();
  }
}

// ---------- frozen months (collection) ----------
function frozenMonths() { return JSON.parse(localStorage.getItem("kk_frozen") || "{}"); }
function freezePastMonths() {
  const now = new Date(); const curMk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const frozen = frozenMonths(); const stages = computeStages(entries); let changed = false;
  const byMonth = {};
  for (const e of entries) { (byMonth[monthKey(e.date)] = byMonth[monthKey(e.date)] || []).push(e); }
  for (const mk of Object.keys(byMonth)) {
    if (mk >= curMk || frozen[mk]) continue;
    const list = byMonth[mk]; const total = list.reduce((s, e) => s + e.ink, 0);
    const maxStage = Math.max(...list.map(e => stages.get(e.id)));
    frozen[mk] = { stage: maxStage, days: new Set(list.map(e => e.date)).size, totalInk: total, kg: kgOf(total), judge: t("judge", maxStage, list.length) };
    changed = true;
  }
  if (changed) localStorage.setItem("kk_frozen", JSON.stringify(frozen));
  return frozen;
}

// ---------- ink measurement ----------
function measureInk(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1536 / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0, w, h);
      const px = cx.getImageData(0, 0, w, h).data;
      const lum = new Float32Array(w * h);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) lum[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      // Lighting-robust ink count: per 64px block, estimate the paper brightness
      // (85th percentile) and count pixels darker than half of it. A flat
      // threshold breaks under shadows and room light; this tracks the paper.
      const BS = 64; let ink = 0;
      for (let by = 0; by < h; by += BS) {
        for (let bx = 0; bx < w; bx += BS) {
          const bw = Math.min(BS, w - bx), bh = Math.min(BS, h - by);
          const vals = [];
          for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) vals.push(lum[(by + y) * w + bx + x]);
          vals.sort((a, b) => a - b);
          const paper = Math.max(vals[Math.floor(vals.length * 0.85)], 40);
          const thr = paper * 0.5;
          for (let i = 0; i < vals.length; i++) if (vals[i] < thr) ink++;
        }
      }
      URL.revokeObjectURL(url); resolve(ink);
    };
    img.onerror = reject; img.src = url;
  });
}

// ---------- events ----------
$("langToggle").addEventListener("click", () => { lang = lang === "ja" ? "en" : "ja"; localStorage.setItem("kk_lang", lang); render(); });
$("photoInput").addEventListener("change", async (ev) => {
  const f = ev.target.files[0]; if (!f) return;
  $("measureMsg").textContent = t("measuring");
  try {
    const ink = await measureInk(f);
    await addEntry(todayStr(), ink);
    $("measureMsg").textContent = t("measured", ink / 10000);
    render();
  } catch (e) { $("measureMsg").textContent = t("save_error", e.message || "error"); }
  ev.target.value = "";
});
$("manualAdd").addEventListener("click", async () => {
  const date = $("manualDate").value || todayStr();
  const man = parseFloat($("manualInk").value);
  if (!man || man <= 0) return;
  try {
    await addEntry(date, Math.round(man * 10000));
    $("manualInk").value = ""; render();
  } catch (e) { $("measureMsg").textContent = t("save_error", e.message || "error"); }
});

// ---------- auth ----------
async function initAuth() {
  if (DEMO) { $("demoBadge").classList.remove("hidden"); return; }
  const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null;
  const showAuth = !user;
  $("authSection").classList.toggle("hidden", !showAuth);
  $("authButton").classList.toggle("hidden", showAuth);
  if (user) { $("authButton").textContent = t("logout"); await loadEntries(); }
  sb.auth.onAuthStateChange(async (_e, session) => {
    user = session ? session.user : null;
    $("authSection").classList.toggle("hidden", !!user);
    $("authButton").classList.toggle("hidden", !user);
    if (user) { $("authButton").textContent = t("logout"); await loadEntries(); } else entries = [];
    render();
  });
}
$("loginBtn").addEventListener("click", async () => {
  const { error } = await sb.auth.signInWithPassword({ email: $("authEmail").value, password: $("authPassword").value });
  $("authMsg").textContent = error ? t("auth_ng") : t("auth_ok");
});
$("signupBtn").addEventListener("click", async () => {
  const { error } = await sb.auth.signUp({ email: $("authEmail").value, password: $("authPassword").value });
  $("authMsg").textContent = error ? t("auth_ng") : t("auth_check");
});
$("authButton").addEventListener("click", async () => { if (sb) await sb.auth.signOut(); });

// ---------- init ----------
(async () => {
  $("manualDate").value = todayStr();
  await initAuth();
  if (DEMO) await loadEntries();
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
