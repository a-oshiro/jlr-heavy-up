import { ROWS as R, PACKAGES as P, NEEDS as N } from "./data.js";

const KEY = "jlr.code";
let code = null;
try { code = sessionStorage.getItem(KEY); } catch {}
const r = R.find(x => x[3] === code);
if (!r) location.replace("index.html");

const F = { name: 2, code: 3, sales: 4, cohort: 5, visits: 6, vlp: 7, ul: 8, ap: 9, close: 10, score: 13, ready: 14, reach: 15, seg: 16, need: 17, pkg: 18, budget: 19, search: 20, social: 21, prog: 22, status: 23, conf: 24, reason: 25, needs: 26, split: 27, gate: 28 };

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => n == null ? "—" : Math.round(n).toLocaleString("en-US");
const pct = n => n == null ? "—" : (n * 100).toFixed(1).replace(/\.0$/, "") + "%";
const median = a => { a = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; };

const withSales = R.filter(x => x[F.sales] != null);
const MD = Object.fromEntries(["visits", "vlp", "ul", "ap", "sales", "close"].map(k => [k, median(withSales.map(x => x[F[k]]))]));
const rank = k => r[F[k]] == null ? "—" : `#${withSales.filter(x => x[F[k]] != null && x[F[k]] > r[F[k]]).length + 1} of ${withSales.length}`;
const status = (v, m) => {
  if (v == null) return { s: "NO DATA", c: "#5C5C5C", b: "#EEEEEE", k: 0 };
  const d = (v - m) / m;
  return d < -0.05 ? { s: "BELOW NETWORK", c: "#B3261E", b: "#F8E9E7", k: -1, d }
    : d > 0.05 ? { s: "AHEAD OF NETWORK", c: "#2F6B3B", b: "#E8F1EA", k: 1, d }
    : { s: "IN LINE", c: "#4A4A4A", b: "#EEEEEE", k: 0, d };
};
const sgn = d => d == null ? "—" : (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(Math.round(d * 100)) + "%";

const defs = [
  { k: "ul", label: "Unique leads", eyebrow: "LEAD CAPTURE", rho: "0.89", desc: "Unduplicated shoppers who raised their hand: forms, calls and chats.", f: fmt, take: ["Too few shoppers become unique leads. Simplify high-intent CTAs and reconcile forms, calls and chats.", "Lead capture is in line with the network. Hold it steady as media scales.", "Lead capture is a strength. Your website turns shoppers into leads better than most."] },
  { k: "vlp", label: "VLP views", eyebrow: "INVENTORY DEMAND", rho: "0.75", desc: "Vehicle listing page views: how much shoppers browse your inventory.", f: fmt, take: ["Shoppers aren't browsing enough inventory. More qualified, model-specific traffic should land on matching inventory.", "Inventory browsing is in line with the network.", "Inventory browsing is a strength. Shoppers are actively shopping your stock."] },
  { k: "close", label: "Close rate", eyebrow: "SOLD OUTCOMES", rho: "0.25", desc: "Share of leads that become sold vehicles.", f: pct, take: ["Sold outcomes lag. Inspect lead quality and sales follow-up before adding media.", "Close rate is in line with the network.", "Close rate is a strength. Leads you capture turn into sales."] }
];

const metricCard = m => {
  const v = r[F[m.k]], md = MD[m.k], s = status(v, md);
  return `<div class="card">
    <div class="row"><span class="eyebrow" style="font-size:10px">${m.eyebrow}</span><span class="muted" style="font-size:12px">ρ ${m.rho} with sales</span></div>
    <div><span class="lbl">${m.label}</span><span class="desc">${m.desc}</span></div>
    <div class="row" style="align-items:center"><span class="val">${m.f(v)}</span><span class="pill" style="background:${s.b};color:${s.c}">${s.s}</span></div>
    <div class="bar"><i style="width:${v == null ? 0 : Math.min(100, v / md * 50).toFixed(1)}%;background:${s.c}"></i><b></b></div>
    <div>
      <div class="kv"><span class="muted">Network median</span><span>${m.f(md)}</span></div>
      <div class="kv"><span class="muted">Difference</span><span style="color:${s.c}">${sgn(s.d)}</span></div>
      <div class="kv"><span class="muted">Network rank</span><span>${rank(m.k)}</span></div>
      <div class="take">${m.take[s.k + 1]}</div>
    </div></div>`;
};

const funnel = [["Total visits", "visits"], ["VLP views", "vlp"], ["Unique leads", "ul"], ["Appointments", "ap"], ["Retail sales", "sales"]]
  .map(([label, k]) => { const s = status(r[F[k]], MD[k]); return `<div><span style="font-size:13px;font-weight:600">${label}</span><span class="v">${fmt(r[F[k]])}</span><span class="m">Median ${fmt(MD[k])} · <b style="color:${s.c}">${sgn(s.d)}</b></span></div>`; }).join("");

const pk = P[r[F.pkg]] || P["$3K"];
const pname = { "$3K": "Demand Capture Plan", "$5K": "Growth Plan", "$7.5K": "Acceleration Plan" }[r[F.pkg]] || "Heavy Up Plan";
const channels = [["Paid search", r[F.search]], ["Paid social", r[F.social]], ["Programmatic", r[F.prog]]].map(([label, v]) =>
  `<div class="ch"><div class="t" style="color:${v ? "#0E0E0E" : "#9A9A9A"}"><span>${v ? label : label + " · off at this tier"}</span><span>$${fmt(v)}</span></div><div class="b"><i style="width:${(v / r[F.budget] * 100).toFixed(1)}%"></i></div></div>`).join("");

const need = N[r[F.need]];
const sents = (r[F.reason] || "").split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
const lead = sents[0] || "";
const gateS = sents.find(s => /^Gate\(s\) to fix:/.test(s));
const others = sents.slice(1).filter(s => !/^Observed funnel|^Weakest multiplier|^Gate\(s\) to fix:/.test(s));
const reasons = [];
if (gateS) reasons.push(gateS.replace(/^Gate\(s\) to fix:\s*/, "To unlock the next tier, fix: ").replace(/;\s*programmatic stays off\.?$/, ". Programmatic stays off until then."));
reasons.push(...others);
if (r[F.visits] != null && r[F.sales] != null) {
  const ulk = r[F.ul] / r[F.visits] * 1000, apk = r[F.ap] / r[F.visits] * 1000;
  reasons.push(`${fmt(r[F.visits])} visits against a ${fmt(MD.visits)} network median, producing ${ulk.toFixed(1)} unique leads and ${apk.toFixed(1)} appointments per 1,000 visits, with a ${pct(r[F.close])} close rate.`);
}
const m2 = lead.match(/^Assigned (\$[\d.]+K), not (\$[\d.]+K)\.$/);
const why = m2 ? `Assigned ${m2[1]} rather than ${m2[2]}. Your Heavy Up Score clears the growth threshold, but at least one acceleration gate still needs work, so this plan grows qualified demand while that gate is repaired.` : [lead, ...others.slice(0, 1)].join(" ");
const nm = r[F.name].toUpperCase(), price = "$" + fmt(r[F.budget]), st = (r[F.status] || "").toUpperCase();
const f1 = n => n == null ? "—" : n.toFixed(1);
const opts = R.slice().sort((a, b) => a[F.name].localeCompare(b[F.name])).map(x => ({ code: x[F.code], label: `${x[F.name]} · ${x[F.code]} · ${x[F.pkg]}` }));
const li = t => `<li>${esc(t)}</li>`;

document.title = `${r[F.name]} · Heavy Up Diagnosis`;
document.getElementById("app").innerHTML = `
<header class="top">
  <span class="logo">JLR</span>
  <div class="center"><b>JLR</b><span>RETAILER DIGITAL PROGRAM</span></div>
  <div class="right"><span>${esc(r[F.code])}</span><button class="btn out" id="out">SIGN OUT</button><button class="btn sm">ENROLL NOW</button></div>
</header>
<div class="am">
  <div class="am-in">
    <span class="am-k">AREA MANAGER VIEW</span>
    <div class="am-ctl">
      <select id="dealerSel" aria-label="Select dealer">${opts.map(o => `<option value="${esc(o.code)}"${o.code === code ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>
      <div class="am-arrows">
        <button class="am-btn" id="prevDealer" aria-label="Previous dealer"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6H1M6 1L1 6l5 5"/></svg></button>
        <button class="am-btn" id="nextDealer" aria-label="Next dealer"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h14M10 1l5 5-5 5"/></svg></button>
      </div>
    </div>
    <span class="am-n">${R.length} retailers · March–August 2026 source period</span>
  </div>
</div>
<section class="hd px">
  <div class="rule"></div>
  <span class="eyebrow">HEAVY UP DIAGNOSIS · MARCH–AUGUST 2026</span>
  <h1>${esc(nm)}</h1>
  <div class="facts"><span>Retailer code <strong>${esc(r[F.code])}</strong></span><span>Retail sales <strong>${fmt(r[F.sales])}</strong></span><span>Sales cohort <strong>${esc(r[F.cohort])}</strong></span></div>
</section>
<section class="sec-h px">
  <span class="eyebrow">START HERE</span>
  <h2>THE THREE METRICS THAT MOVE SALES</h2>
  <span class="sub">Your results against the median of the ${withSales.length} Land Rover retailers with sales data. The vertical line marks the network median.</span>
</section>
<section class="metrics px">${defs.map(metricCard).join("")}</section>
<section class="banner">
  <div><span class="k">YOUR HEAVY UP PLAN · ${esc(nm)}</span><div class="nm"><span>${pname.toUpperCase()}</span><span class="tag">${esc(st)}</span></div></div>
  <div class="amt"><b>${price}</b><span>working media / month</span></div>
  <div class="acts"><button class="btn ghost" id="seePlan" style="height:48px">SEE PLAN DETAILS ↓</button><button class="btn light" style="height:48px">ENROLL IN THIS PLAN</button></div>
</section>
<section class="ov px">
  <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:8px"><span class="eyebrow">OVERVIEW</span><h2>YOUR STORE AT A GLANCE</h2><span class="sub">Your Heavy Up Score, what the data says is limiting growth, and your full funnel against the network.</span></div>
  <div class="grid">
    <div class="score">
      <span class="k">HEAVY UP SCORE</span>
      <div class="big"><b>${f1(r[F.score])}</b><span>/ 100</span></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="track"><i style="width:${r[F.score] || 0}%"></i><u style="left:45%"></u><u style="left:67%"></u></div>
        <div class="ticks"><span style="left:45%">$5K · 45</span><span style="left:67%">$7.5K · 67</span></div>
      </div>
      <div style="border-top:1px solid #333">
        <div class="r"><span>Funnel readiness</span><span>${f1(r[F.ready])}</span></div>
        <div class="r"><span>Reach score</span><span>${f1(r[F.reach])}</span></div>
        <div class="r"><span>Data confidence</span><span>${esc(r[F.conf])}</span></div>
      </div>
    </div>
    <div class="panel">
      <span class="eyebrow" style="font-size:10px">THE DIAGNOSIS</span>
      <div class="chips"><span class="chip">${esc(r[F.seg])}</span><span class="chip need">Primary need · ${esc(r[F.need])}</span></div>
      <span class="says">${esc(need ? need.says : "No sales record appears in the supplied sales file, so the funnel can't be scored yet.")}</span>
      <ul class="sq">${reasons.map(li).join("")}</ul>
    </div>
  </div>
  <div class="panel" style="padding:32px 36px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="eyebrow" style="font-size:10px">YOUR FUNNEL VS. NETWORK MEDIAN</span><span class="muted" style="font-size:12px">March–August 2026</span></div>
    <div class="funnel">${funnel}</div>
  </div>
</section>
<section class="plan px" id="plan">
  <div class="left">
    <div class="rule"></div>
    <span class="eyebrow">YOUR RECOMMENDED PLAN</span>
    <h2>${pname.toUpperCase()}</h2>
    <span class="why">${esc(why)}</span>
    <div class="facts4">
      <div><span class="eyebrow" style="font-size:10px">BEST FIT</span>${esc(pk.fit)}</div>
      <div><span class="eyebrow" style="font-size:10px">PRIMARY KPI</span>${esc(pk.kpi)}</div>
      <div><span class="eyebrow" style="font-size:10px">DEFENDER EMPHASIS</span>${esc(pk.def)}</div>
      <div><span class="eyebrow" style="font-size:10px">RANGE ROVER SPORT EMPHASIS</span>${esc(pk.rrs)}</div>
    </div>
    <div class="how"><h3>How we address your primary need</h3>
      <ul class="sq">
        <li><span><strong>Media tactics:</strong> ${esc(r[F.needs])}</span></li>
        <li><span><strong>In your store:</strong> ${esc(need ? need.resp : "Reconcile the sales identity and sold feed before activation.")}</span></li>
        <li><span><strong>Defender / Range Rover Sport split:</strong> ${esc(r[F.split])}</span></li>
      </ul></div>
  </div>
  <aside class="quote">
    <div style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow" style="font-size:10px">${esc(r[F.pkg])} · ${esc(pk.purpose.toUpperCase())}</span><span style="font-size:22px;font-weight:600">${pname}</span></div>
    <div style="display:flex;align-items:baseline;gap:8px"><span class="price">${price}</span><span class="muted" style="font-size:14px">/ month</span></div>
    <div style="display:flex;flex-direction:column;gap:16px"><span class="eyebrow" style="font-size:10px">CHANNEL MIX</span>${channels}</div>
    <button class="btn" style="height:52px;margin-top:8px">ENROLL IN ${pname.toUpperCase()}</button>
    <span class="muted" style="font-size:12px;text-align:center">All amounts are monthly working media.</span>
  </aside>
</section>
<section class="gate"><span>BEFORE ACTIVATION</span><span>${esc(r[F.gate])}</span></section>
<footer><span>LAND ROVER HEAVY UP PROGRAM</span><span>PROGRAM SUPPORT: JLR@HELLOCONSTELLATION.COM</span></footer>`;

document.getElementById("out").addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch {} location.href = "index.html"; });

const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
document.getElementById("seePlan").addEventListener("click", () => {
  const to = document.getElementById("plan").getBoundingClientRect().top + window.scrollY - 24, from = window.scrollY, dist = to - from;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return window.scrollTo(0, to);
  const dur = Math.min(1400, 600 + Math.abs(dist) * 0.4), t0 = performance.now();
  const step = now => { const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, from + dist * easeInOut(p)); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

const goDealer = c => { try { sessionStorage.setItem(KEY, c); } catch {} location.reload(); };
const idx = opts.findIndex(o => o.code === code);
document.getElementById("dealerSel").addEventListener("change", e => goDealer(e.target.value));
document.getElementById("prevDealer").addEventListener("click", () => goDealer(opts[(idx - 1 + opts.length) % opts.length].code));
document.getElementById("nextDealer").addEventListener("click", () => goDealer(opts[(idx + 1) % opts.length].code));
