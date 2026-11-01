// مكونات React (مكتوبة بـ React.createElement عشان تشتغل بدبل كليك من غير Babel أو سيرفر)
const { useState, useMemo, useEffect, useRef, Fragment } = React;
const h = React.createElement;

// رسالة صغيرة "اتضاف للسلة" + حفظ السلة والعنوان في المتصفح
const toast = msg => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2000); };
const store = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

// أنيميشن: نقطة دهبية بتطير من الصنف لزرار الفاتورة
const fly = e => {
  const b = e && e.currentTarget, c = document.querySelector(".cartbtn"); if (!b || !c) return;
  const a = b.getBoundingClientRect(), z = c.getBoundingClientRect(), d = document.createElement("i");
  d.className = "fly"; d.style.cssText = `left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px`; document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = `translate(${z.left + z.width / 2 - a.left - a.width / 2}px,${z.top + z.height / 2 - a.top - a.height / 2}px) scale(.3)`; d.style.opacity = ".15"; });
  setTimeout(() => d.remove(), 700);
};

function Item({ it, sizes, icon, cat, qtys, onAdd, onDec }) {
  const [name, prices, desc, isNew] = it;
  const tot = prices.reduce((s, p, i) => s + (qtys[cat + " - " + name + "|" + sizes[i]] || 0), 0);
  return h("article", { className: "item" + (tot ? " inc" : ""), "data-i": icon || "" },
    tot ? h("span", { className: "ribbon", key: tot }, "في طلبك ×" + tot) : null,
    h("h3", null, name, isNew ? h("span", { className: "badge" }, "جديد") : null),
    desc ? h("p", null, desc) : null,
    h("div", { className: "sizes" },
      prices.map((p, i) => {
        if (!p) return null;
        const k = cat + " - " + name + "|" + sizes[i], q = qtys[k] || 0;
        return h("div", { key: i, className: "szw" + (q ? " on" : "") },
          h("button", { className: "sz", onClick: e => onAdd(cat + " - " + name, sizes[i], p, e), "aria-label": `أضف ${name} ${sizes[i]}` }, h("span", null, sizes[i]), h("b", null, p + " ج")),
          q ? h("span", { className: "qb", key: q }, q) : null,
          q ? h("button", { className: "mi", onClick: () => onDec(k), "aria-label": "إنقاص" }, "−") : null);
      })));
}

// رقم أوردر فريد: التاريخ + الملي ثانية في اليوم (base36) + حرف عشوائي. بيتولد مرة لكل أوردر.
const newNo = () => {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  const ms = ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000 + d.getMilliseconds();
  return "MM-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + ms.toString(36).toUpperCase().padStart(6, "0") + Math.floor(Math.random() * 36).toString(36).toUpperCase();
};

function Cart({ open, setOpen, cart, change, clear }) {
  const [c, setC] = useState(() => store.get("mm_cust", { name: "", phone: "", addr: "" }));
  const [err, setErr] = useState({});
  const [sent, setSent] = useState(false);
  const [no, setNo] = useState(() => store.get("mm_no", null) || newNo());
  useEffect(() => store.set("mm_no", no), [no]);
  const reset = () => { clear(); setNo(newNo()); };
  const now = useMemo(() => new Date().toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }), [open]);
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const cnt = cart.reduce((s, l) => s + l.qty, 0);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const f = e => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [open]);
  const set = (k, v) => { setC(x => ({ ...x, [k]: v })); setErr(x => ({ ...x, [k]: 0 })); };
  const fld = (k, ph, type) => h("input", { className: "fld" + (err[k] && !c[k].trim() ? " err" : ""), placeholder: ph, type, value: c[k], onChange: e => set(k, e.target.value) });
  const send = () => {
    const miss = { phone: !c.phone.trim(), addr: !c.addr.trim() };
    if (miss.phone || miss.addr) {
      setErr(miss); toast("⚠ اكتب رقم الموبايل والعنوان الأول");
      const t = document.querySelectorAll(".drawer .fld")[miss.phone ? 1 : 2];
      if (t) { t.scrollIntoView({ block: "center", behavior: "smooth" }); t.focus(); }
      return;
    }
    store.set("mm_cust", c);
    const body = cart.map(l => `• ${l.name} (${l.size}) × ${l.qty} = ${l.price * l.qty} ج`).join("\n");
    const msg = `🧾 فاتورة طلب - ماكس مام\nرقم: ${no}\nالتاريخ: ${now}\n━━━━━━━━━━\n${body}\n━━━━━━━━━━\nعدد القطع: ${cnt}\nالإجمالي: ${total} ج (التوصيل حسب المنطقة)\n\n👤 ${c.name || "-"}\n📞 ${c.phone}\n📍 ${c.addr}`;
    const url = (window.waLink || (t => "https://api.whatsapp.com/send?phone=" + window.PHONE + "&text=" + encodeURIComponent(t)))(msg); if (!window.open(url, "_blank")) location.href = url;
    setSent(true); setTimeout(() => { setSent(false); setNo(newNo()); }, 3500);
  };
  return h(Fragment, null,
    h("div", { className: "backdrop" + (open ? " show" : ""), onClick: () => setOpen(false) }),
    h("aside", { className: "drawer" + (open ? " open" : ""), "aria-hidden": !open },
      h("header", null, h("span", null, "🧾 فاتورة الطلب"), h("button", { onClick: () => setOpen(false), "aria-label": "إغلاق" }, "×")),
      h("div", { className: "lines" },
        h("div", { className: "inv" },
          sent && h("div", { className: "paid" }, "تم الإرسال ✓"),
          h("div", { className: "inv-h" }, h("b", null, "ماكس مام"), h("small", null, "MAXIMMUM RESTAURANT")),
          h("div", { className: "inv-meta" }, h("span", null, "رقم: " + no), h("span", null, now)),
          cart.length === 0
            ? h("p", { className: "empty" }, "الفاتورة فاضية.\nاختار حاجة من المنيو 🍕")
            : h(Fragment, null,
                h("div", { className: "inv-c" }, fld("name", "الاسم (اختياري)", "text"), fld("phone", "رقم الموبايل *", "tel"), fld("addr", "العنوان بالتفصيل *", "text")),
                h("div", { className: "ih" }, h("span", null, "الصنف"), h("span", null, "الكمية"), h("span", null, "المبلغ")),
                cart.map(l => {
                  const [cat, ...r] = l.name.split(" - ");
                  return h("div", { className: "il", key: l.key },
                    h("div", null, r.join(" - ") || cat, h("small", null, `${cat} · ${l.size} · ${l.price} ج`)),
                    h("div", { className: "qty" }, h("button", { onClick: () => change(l.key, -1) }, "−"), l.qty, h("button", { onClick: () => change(l.key, 1) }, "+")),
                    h("span", { className: "lt" }, l.price * l.qty + " ج"));
                }),
                h("div", { className: "irow" }, h("span", null, "عدد القطع"), h("span", null, cnt)),
                h("div", { className: "irow" }, h("span", null, "التوصيل"), h("span", null, "حسب المنطقة")),
                h("div", { className: "itot" }, h("span", null, "الإجمالي"), h("b", null, total + " ج")),
                h("div", { className: "bar" }), h("p", { className: "thx" }, "شكراً لاختياركم ماكس مام ❤")))),
      cart.length > 0 && h("div", { className: "dfoot" },
        h("button", { className: "btn", onClick: send }, "ابعت الفاتورة واتساب"),
        h("button", { className: "clear", onClick: reset }, "فضّي الفاتورة"))));
}

// تطبيع النص العربي: تشكيل، همزات، ة/ه، ى/ي
const norm = s => String(s || "").toLowerCase().replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();

function App() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState(() => store.get("mm_cart", []));
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  const add = (name, size, price, e) => {
    fly(e); if (navigator.vibrate) navigator.vibrate(12);
    const key = name + "|" + size;
    setCart(c => c.some(l => l.key === key)
      ? c.map(l => l.key === key ? { ...l, qty: l.qty + 1 } : l)
      : [...c, { key, name, size, price, qty: 1 }]);
    setBump(true); setTimeout(() => setBump(false), 400);
    toast("✓ " + name.split(" - ").slice(1).join(" - ") + " (" + size + ")");
  };
  const change = (key, d) => setCart(c => c.map(l => l.key === key ? { ...l, qty: l.qty + d } : l).filter(l => l.qty > 0));

  const qtys = useMemo(() => Object.fromEntries(cart.map(l => [l.key, l.qty])), [cart]);
  const toks = norm(q).split(" ").filter(Boolean);
  const cats = useMemo(() => window.MENU
    .filter(c => toks.length || tab === "all" || c.id === tab)
    .map(c => ({ ...c, items: c.items.filter(i => !toks.length || toks.every(t => norm(i[0] + " " + (i[2] || "") + " " + c.name).includes(t))) }))
    .filter(c => c.items.length), [tab, q]);
  const found = cats.reduce((s, c) => s + c.items.length, 0);
  const tabsRef = useRef(null), first = useRef(true);
  const scrollTabs = d => tabsRef.current && tabsRef.current.scrollBy({ left: d, behavior: "smooth" });
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const on = tabsRef.current && tabsRef.current.querySelector(".on");
    if (on) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);
  useEffect(() => store.set("mm_cart", cart), [cart]);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const sum = cart.reduce((s, l) => s + l.price * l.qty, 0);
  useEffect(() => { const f = e => { setTab(e.detail); setQ(""); }; window.addEventListener("settab", f); return () => window.removeEventListener("settab", f); }, []);

  return h(Fragment, null,
    h("div", { className: "navwrap" },
      h("button", { className: "navarrow r", onClick: () => scrollTabs(300), "aria-label": "السابق" }, "›"),
      h("div", { className: "tabs", role: "tablist", ref: tabsRef },
        h("button", { className: "tab" + (tab === "all" && !toks.length ? " on" : ""), onClick: () => setTab("all") }, h("span", { className: "ti" }, "✦"), h("span", { className: "tl" }, "الكل")),
        window.MENU.map(c => h("button", { key: c.id, className: "tab" + (tab === c.id && !toks.length ? " on" : ""), onClick: () => setTab(c.id) }, h("span", { className: "ti" }, c.icon || ""), h("span", { className: "tl" }, c.name)))),
      h("button", { className: "navarrow l", onClick: () => scrollTabs(-300), "aria-label": "التالي" }, "‹")),
    h("div", { className: "searchbox" }, h("span", null, "🔍"),
    h("input", { className: "search", placeholder: "دوّر على صنف... (مثلاً: شاورما)", value: q, onChange: e => { setQ(e.target.value); if (e.target.value) setTab("all"); } }),
      q && h("button", { className: "clr", onClick: () => setQ(""), "aria-label": "مسح" }, "×")),
    q && h("p", { className: "hint" }, found ? `لقينا ${found} صنف` : ""),
    cats.length === 0 && h("p", { className: "empty" }, "مفيش صنف بالاسم ده. جرب كلمة تانية."),
    cats.map(c => h("section", { className: "cat", key: c.id },
      h("h2", null, h("span", { className: "ci" }, c.icon || ""), c.name, h("small", { className: "cnt" }, c.items.length + " صنف")),
      c.note && h("span", { className: "note" }, c.note),
      h("div", { className: "grid" }, c.items.map(it => h(Item, { key: it[0], it, sizes: c.sizes, icon: c.icon, cat: c.name, qtys, onAdd: add, onDec: k => change(k, -1) }))))),
    h("button", { className: "cartbtn" + (bump ? " bump" : ""), onClick: () => setOpen(true) }, `🧾 فاتورتك (${count})` + (count ? ` · ${sum} ج` : "")),
    h(Cart, { open, setOpen, cart, change, clear: () => setCart([]) }));
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
