// مكونات React (مكتوبة بـ React.createElement عشان تشتغل بدبل كليك من غير Babel أو سيرفر)
const { useState, useMemo, Fragment } = React;
const h = React.createElement;

function Item({ it, sizes, onAdd }) {
  const [name, prices, desc, isNew] = it;
  return h("article", { className: "item" },
    h("h3", null, name, isNew ? h("span", { className: "badge" }, "جديد") : null),
    desc ? h("p", null, desc) : null,
    h("div", { className: "sizes" },
      prices.map((p, i) => p ? h("button", { key: i, className: "sz", onClick: () => onAdd(name, sizes[i], p), "aria-label": `أضف ${name} ${sizes[i]}` },
        h("span", null, sizes[i]), h("b", null, p + " ج")) : null)));
}

function Cart({ open, setOpen, cart, change }) {
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const send = () => {
    const body = cart.map(l => `• ${l.name} (${l.size}) × ${l.qty} = ${l.price * l.qty} ج`).join("\n");
    const msg = `أهلاً ماكس مام، عايز أطلب:\n${body}\n\nالإجمالي: ${total} ج\nالعنوان:`;
    window.open(`https://wa.me/${window.PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  return h("aside", { className: "drawer" + (open ? " open" : ""), "aria-hidden": !open },
    h("header", null, h("span", null, "طلبك"), h("button", { onClick: () => setOpen(false), "aria-label": "إغلاق" }, "×")),
    h("div", { className: "lines" },
      cart.length === 0
        ? h("p", { className: "empty" }, "السلة فاضية. اختار حاجة من المنيو 🍕")
        : cart.map(l => h("div", { className: "line", key: l.key },
            h("div", null, l.name, h("small", null, `${l.size} - ${l.price} ج`)),
            h("div", { className: "qty" },
              h("button", { onClick: () => change(l.key, 1) }, "+"), l.qty,
              h("button", { onClick: () => change(l.key, -1) }, "−"))))),
    cart.length > 0 && h(Fragment, null,
      h("div", { className: "total" }, h("span", null, "الإجمالي"), h("span", null, total + " ج")),
      h("button", { className: "btn", onClick: send }, "ابعت الطلب واتساب")));
}

function App() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  const add = (name, size, price) => {
    const key = name + "|" + size;
    setCart(c => c.some(l => l.key === key)
      ? c.map(l => l.key === key ? { ...l, qty: l.qty + 1 } : l)
      : [...c, { key, name, size, price, qty: 1 }]);
    setBump(true); setTimeout(() => setBump(false), 400);
  };
  const change = (key, d) => setCart(c => c.map(l => l.key === key ? { ...l, qty: l.qty + d } : l).filter(l => l.qty > 0));

  const cats = useMemo(() => window.MENU
    .filter(c => tab === "all" || c.id === tab)
    .map(c => ({ ...c, items: c.items.filter(i => i[0].includes(q.trim())) }))
    .filter(c => c.items.length), [tab, q]);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  return h(Fragment, null,
    h("div", { className: "tabs", role: "tablist" },
      h("button", { className: "tab" + (tab === "all" ? " on" : ""), onClick: () => setTab("all") }, "الكل"),
      window.MENU.map(c => h("button", { key: c.id, className: "tab" + (tab === c.id ? " on" : ""), onClick: () => setTab(c.id) }, c.name))),
    h("input", { className: "search", placeholder: "دوّر على صنف... (مثلاً: شاورما)", value: q, onChange: e => setQ(e.target.value) }),
    cats.length === 0 && h("p", { className: "empty" }, "مفيش صنف بالاسم ده. جرب كلمة تانية."),
    cats.map(c => h("section", { className: "cat", key: c.id },
      h("h2", null, c.name),
      c.note && h("span", { className: "note" }, c.note),
      h("div", { className: "grid" }, c.items.map(it => h(Item, { key: it[0], it, sizes: c.sizes, onAdd: (n, s, p) => add(c.name + " - " + n, s, p) }))))),
    h("button", { className: "cartbtn" + (bump ? " bump" : ""), onClick: () => setOpen(true) }, `🛒 السلة (${count})`),
    h(Cart, { open, setOpen, cart, change }));
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));