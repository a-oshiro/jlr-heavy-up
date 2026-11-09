import { ROWS as R } from "./data.js";

const KEY = "jlr.code";
let code = null;
try { code = sessionStorage.getItem(KEY); } catch {}
const r = R.find(x => x[3] === code);
if (!r) location.replace("index.html");

const F = { name: 2, code: 3, pkg: 18, budget: 19, search: 20, social: 21, prog: 22 };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => "$" + Math.round(n).toLocaleString("en-US");
const pname = { "$3K": "Demand Capture Plan", "$5K": "Growth Plan", "$7.5K": "Acceleration Plan" }[r[F.pkg]] || "Heavy Up Plan";

const items = [["Paid search", r[F.search]], ["Paid social", r[F.social]], ["Programmatic", r[F.prog]]].filter(([, v]) => v > 0);
const total = r[F.budget] ?? items.reduce((a, [, v]) => a + v, 0);

const field = ({ id, label, type = "text", value = "", autocomplete = "off", extra = "" }) => `
  <div class="en-field">
    <label for="${id}" class="en-label"><span>${label}</span><span aria-hidden="true">*</span></label>
    <input class="en-input" id="${id}" name="${id}" type="${type}" value="${esc(value)}" autocomplete="${autocomplete}" ${extra} required>
    <span class="en-err" data-for="${id}"></span>
  </div>`;

let extra = 0;
const contactRows = (n, removable) => `
  <div class="en-contact" data-contact="${n}">
    ${removable ? `<button type="button" class="en-remove" data-remove="${n}">Remove contact</button>` : ""}
    <div class="en-row">
      ${field({ id: `fn${n}`, label: "First Name", autocomplete: "given-name" })}
      ${field({ id: `ln${n}`, label: "Last Name", autocomplete: "family-name" })}
    </div>
    ${field({ id: `em${n}`, label: "Email Address", type: "email", autocomplete: "email" })}
    ${field({ id: `ph${n}`, label: "Phone Number", type: "tel", autocomplete: "tel-national", extra: 'inputmode="numeric" maxlength="14"' })}
  </div>`;

document.title = `${r[F.name]} · Enrollment`;
document.getElementById("app").innerHTML = `
<header class="top">
  <a class="en-back" href="diagnosis.html"><img src="assets/arrow-left.svg" alt="" width="16" height="16"><span>BACK</span></a>
  <div class="center"><img class="mark" src="assets/jlr-logo.svg" alt="JLR"><span>RETAILER DIGITAL PROGRAM</span></div>
  <span class="right-label">POWERED BY CONSTELLATION</span>
</header>
<main class="en px" id="main">
  <div class="en-head">
    <h1>Retailer Information</h1>
    <p>Confirm your retailer details and submit your program enrollment. Constellation will reach out within 24 hours to complete activation.</p>
  </div>
  <form class="en-grid" id="form" novalidate>
    <div class="en-content">
      <section class="en-group">
        <div class="en-sec"><span>DEALERSHIP</span></div>
        ${field({ id: "dcode", label: "Dealer Code", value: r[F.code] })}
        ${field({ id: "dname", label: "Dealership Name", value: r[F.name] })}
      </section>
      <section class="en-group">
        <div class="en-sec"><span>DEALERSHIP CONTACT</span></div>
        <div id="contacts">${contactRows(0, false)}</div>
        <button type="button" class="en-add" id="addContact"><span class="en-plus" aria-hidden="true">+</span><span>Add another contact</span></button>
      </section>
      <div class="en-terms">
        <label class="en-check"><input type="checkbox" id="terms" required><span class="en-box" aria-hidden="true"></span>
          <span>Dealer agrees to pay the fees for the Services in the amounts set forth in the online registration process or, if an order form was used, on the order form. The fees for the Services shall be billed to and Dealer agrees to pay the media for the Services through Constellation directly. Cancellations that occur on or before the 10th day of each calendar month will be billed for the remainder of that month.</span>
        </label>
        <span class="en-err" data-for="terms"></span>
      </div>
      <div class="en-foot">
        <a href="diagnosis.html">← Back to Program</a>
        <span>* Required fields</span>
      </div>
    </div>
    <aside class="en-side">
      <span class="en-side-k">YOUR PROGRAM</span>
      <hr>
      <div class="en-items">
        <div class="en-item en-plan"><span>${esc(pname)}</span><span>${esc(r[F.pkg])}</span></div>
        ${items.map(([l, v]) => `<div class="en-item"><span>${l}</span><strong>${money(v)}</strong></div>`).join("")}
      </div>
      <hr>
      <div class="en-total"><div><span class="en-side-k">TOTAL</span><b>${money(total)}</b></div><span class="en-side-k">PER MONTH</span></div>
      <button class="en-submit" type="submit">SUBMIT ENROLLMENT →</button>
    </aside>
  </form>
</main>
<footer><span>LAND ROVER HEAVY UP PROGRAM</span><span>PROGRAM SUPPORT: JLR@HELLOCONSTELLATION.COM</span></footer>`;

const form = document.getElementById("form");
const contacts = document.getElementById("contacts");

document.getElementById("addContact").addEventListener("click", () => {
  extra += 1;
  contacts.insertAdjacentHTML("beforeend", contactRows(extra, true));
  contacts.querySelector(`#fn${extra}`).focus();
});
contacts.addEventListener("click", e => {
  const b = e.target.closest("[data-remove]");
  if (b) contacts.querySelector(`[data-contact="${b.dataset.remove}"]`).remove();
});

const setErr = (el, msg) => {
  const slot = form.querySelector(`.en-err[data-for="${el.id}"]`);
  if (slot) slot.textContent = msg;
  el.classList.toggle("bad", !!msg);
  el.setAttribute("aria-invalid", msg ? "true" : "false");
};
const check = el => {
  const v = el.type === "checkbox" ? el.checked : el.value.trim();
  let msg = "";
  if (!v) msg = el.type === "checkbox" ? "Please accept the terms to continue." : "This field is required.";
  else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Enter a valid email address.";
  else if (el.type === "tel" && v.replace(/\D/g, "").length < 10) msg = "Enter a 10-digit phone number.";
  setErr(el, msg);
  return !msg;
};
form.addEventListener("focusout", e => { if (e.target.matches("input[required]")) check(e.target); });
const maskPhone = v => {
  const d = v.replace(/\D/g, "").slice(0, 10);
  return d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d.length ? `(${d}` : "";
};
form.addEventListener("input", e => {
  if (e.target.type === "tel") e.target.value = maskPhone(e.target.value);
});
form.addEventListener("input", e => { if (e.target.classList.contains("bad")) check(e.target); });
form.addEventListener("change", e => { if (e.target.id === "terms") check(e.target); });

form.addEventListener("submit", e => {
  e.preventDefault();
  const bad = [...form.querySelectorAll("input[required]")].filter(el => !check(el));
  if (bad.length) { bad[0].focus(); return; }
  const main = document.getElementById("main");
  main.className = "ok px";
  main.innerHTML = `
    <div class="ok-head">
      <span class="ok-kicker">ENROLLMENT CONFIRMED</span>
      <h1>Your program<br>is being activated.</h1>
      <p>Constellation will reach out within 24 hours to complete your setup.</p>
    </div>
    <section class="ok-card">
      <h2>ENROLLED SERVICES</h2>
      <div class="ok-total"><span>TOTAL MONTHLY INVESTMENT</span><div><b>${money(total)}</b><span>/mo</span></div></div>
    </section>
    <section class="ok-card">
      <h2>WHAT HAPPENS NEXT</h2>
      <ol class="ok-steps">
        <li><span>01</span><p>Constellation reviews your enrollment and confirms service selection.</p></li>
        <li><span>02</span><p>Your account manager reaches out to complete onboarding.</p></li>
        <li><span>03</span><p>Campaigns go-live and run always on</p></li>
      </ol>
    </section>
    <a class="ok-return" href="diagnosis.html">← Return to Program Home</a>`;
  window.scrollTo(0, 0);
});
