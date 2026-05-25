import { useState, useEffect, useRef } from "react";

// ── 持久化存储工具 ──────────────────────────────────────
const STORE_KEY = "lovesushi-menu-data";
const SHOP_ID_KEY = "lovesushi-shop-id";

function generateShopId() {
  return "ls-" + Math.random().toString(36).slice(2, 10);
}

const DEFAULT_MENU = [
  {
    id: "item-1", category: "sets",
    zh: { name: "豪华套餐 A", desc: "三文鱼·金枪鱼·虾·玉子卷 共20件" },
    it: { name: "Menu Deluxe A", desc: "Salmone·Tonno·Gamberi·Tamago, 20 pezzi" },
    price: 28.9, image: null, badge: "popolare"
  },
  {
    id: "item-2", category: "sets",
    zh: { name: "情侣双人套餐", desc: "精选30件，含刺身·寿司·卷物·味噌汤×2" },
    it: { name: "Menu Coppia", desc: "30 pezzi selezionati, sashimi·sushi·roll·miso soup x2" },
    price: 52.0, image: null, badge: "consigliato"
  },
  {
    id: "item-3", category: "nigiri",
    zh: { name: "三文鱼握寿司 (2件)", desc: "新鲜挪威三文鱼，入口即化" },
    it: { name: "Nigiri Salmone (2 pz)", desc: "Salmone norvegese fresco, si scioglie in bocca" },
    price: 9.5, image: null, badge: ""
  },
  {
    id: "item-4", category: "nigiri",
    zh: { name: "金枪鱼握寿司 (2件)", desc: "大西洋金枪鱼，色泽鲜红饱满" },
    it: { name: "Nigiri Tonno (2 pz)", desc: "Tonno atlantico, colore rosso vivo" },
    price: 10.5, image: null, badge: "novità"
  },
  {
    id: "item-5", category: "rolls",
    zh: { name: "彩虹卷 (8件)", desc: "金枪鱼·三文鱼·牛油果·黄瓜" },
    it: { name: "Rainbow Roll (8 pz)", desc: "Tonno·Salmone·Avocado·Cetriolo" },
    price: 18.5, image: null, badge: "speciale"
  },
  {
    id: "item-6", category: "drinks",
    zh: { name: "抹茶拿铁", desc: "日本宇治抹茶，浓郁顺滑" },
    it: { name: "Matcha Latte", desc: "Matcha Uji giapponese, cremoso" },
    price: 5.5, image: null, badge: ""
  },
];

const CATEGORIES = [
  { id: "sets",   zh: "套餐",   it: "Menu" },
  { id: "nigiri", zh: "握寿司", it: "Nigiri" },
  { id: "rolls",  zh: "卷物",   it: "Roll" },
  { id: "drinks", zh: "饮品",   it: "Bevande" },
];

const BADGES_IT = ["", "popolare", "novità", "speciale", "consigliato", "pranzo"];
const BADGES_ZH = ["", "热销",    "新品",   "招牌",     "推荐",         "午餐"];

// ── QR CODE (inline SVG via qrcode library from CDN) ────
function QRDisplay({ shopId }) {
  const ref = useRef(null);
  const menuUrl = `${window.location.origin}${window.location.pathname}?shop=${shopId}&view=menu`;

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    // use qrcode-svg approach via canvas
    const size = 180;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    ref.current.appendChild(canvas);

    // Simple QR using qrcodejs loaded from CDN script tag
    if (window.QRCode) {
      ref.current.innerHTML = "";
      new window.QRCode(ref.current, {
        text: menuUrl,
        width: size, height: size,
        colorDark: "#1a1008",
        colorLight: "#FAF6F0",
        correctLevel: window.QRCode.CorrectLevel.M,
      });
    }
  }, [shopId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div ref={ref} style={{ background: "#FAF6F0", padding: 12, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
      <div style={{ fontSize: 10, color: "#aaa", wordBreak: "break-all", textAlign: "center", maxWidth: 220 }}>
        {menuUrl}
      </div>
      <div style={{ fontSize: 11, color: "#C9A84C", fontStyle: "italic" }}>
        ID: {shopId}
      </div>
    </div>
  );
}
// ── CUSTOMER MENU VIEW ───────────────────────────────────
function MenuView({ menu, lang, setLang }) {
  const [activeCat, setActiveCat] = useState("sets");

  const filtered = menu.filter(i => i.category === activeCat);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F0", fontFamily: "'Noto Serif SC', serif" }}>
      {/* Header */}
      <div style={{
         padding: "28px 20px 18px", textAlign: "center",
        background: "linear-gradient(160deg, #1a1008 60%, #2d1a0e)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at 50% -20%, rgba(192,57,43,0.35) 0%, transparent 70%)"
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "#fff", letterSpacing: "0.04em" }}>
            Love<span style={{ color: "#C9A84C" }}>Sushi</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", letterSpacing: "0.2em", marginTop: 4 }}>
            {lang === "zh" ? "外卖寿司 · Consegna a domicilio" : "Consegna sushi a domicilio"}
          </div>
        </div>
      </div>

      {/* Lang toggle */}
      <div style={{ background: "#C0392B", display: "flex", justifyContent: "center" }}>
        {["zh", "it"].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            flex: 1, maxWidth: 140, padding: "10px 0", border: "none",
            background: "transparent", cursor: "pointer",
            color: lang === l ? "#fff" : "rgba(255,255,255,0.5)",
            fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem",
            letterSpacing: "0.1em",
            borderBottom: lang === l ? "2px solid #C9A84C" : "2px solid transparent",
            fontWeight: lang === l ? 600 : 400, transition: "all 0.2s"
          }}>
            {l === "zh" ? "中文" : "Italiano"}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", overflowX: "auto", gap: 8, padding: "14px 16px 8px", scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
            whiteSpace: "nowrap", padding: "7px 18px", borderRadius: 999,
            border: activeCat === cat.id ? "1.5px solid #C0392B" : "1.5px solid #ddd",
            background: activeCat === cat.id ? "#C0392B" : "#fff",
            color: activeCat === cat.id ? "#fff" : "#666",
            fontFamily: "'Noto Serif SC', serif", fontSize: "0.82rem",
            cursor: "pointer", transition: "all 0.2s"
          }}>
            {lang === "zh" ? cat.zh : cat.it}
          </button>
        ))}
      </div>

      {/* Section title */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px 16px 10px", borderBottom: "1px solid #e8ddd5", margin: "0 16px",
        fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#C0392B"
      }}>
        <div style={{ width: 4, height: 18, background: "#C9A84C", borderRadius: 2 }} />
        {lang === "zh"
          ? CATEGORIES.find(c => c.id === activeCat)?.zh
          : CATEGORIES.find(c => c.id === activeCat)?.it}
      </div>

      {/* Items */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#bbb", padding: 40, fontSize: "0.85rem" }}>
            {lang === "zh" ? "暂无菜品" : "Nessun piatto disponibile"}
          </div>
        )}
        {filtered.map((item, idx) => {
          const info = item[lang] || item.zh;
          const badgeIdx = BADGES_IT.indexOf(item.badge);
          const badgeLabel = lang === "zh" ? BADGES_ZH[badgeIdx] : BADGES_IT[badgeIdx];
          return (
            <div key={item.id} style={{
              background: "#fff", borderRadius: 14, display: "flex", overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
              animation: `fadeUp 0.35s ease ${idx * 0.05}s both`
            }}>
              {/* Image */}
              <div style={{
                width: 90, minHeight: 90, flexShrink: 0, overflow: "hidden",
                background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {item.image
                  ? <img src={item.image} alt={info.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "2rem" }}>🍣</span>
                }
              </div>
              {/* Info */}
              <div style={{ flex: 1, padding: "12px 12px 12px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                                   <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1008", lineHeight: 1.3 }}>{info.name}</div>
                  <div style={{ fontSize: "0.73rem", color: "#999", marginTop: 4, lineHeight: 1.5 }}>{info.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#C0392B", fontWeight: 700 }}>
                    €{item.price.toFixed(2)}
                  </div>
                  {badgeLabel && badgeIdx > 0 && (
                    <div style={{
                      fontSize: "0.65rem", padding: "3px 8px", borderRadius: 999,
                      background: item.badge === "novità" ? "#fff8e1" : "#f8eaea",
                      color: item.badge === "novità" ? "#b8860b" : "#C0392B"
                    }}>
                      {badgeLabel}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", padding: "28px 20px", background: "#1a1008", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.1em", marginTop: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1rem", marginBottom: 6 }}>LoveSushi</div>
        Fresco ogni giorno · 新鲜每一天
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────
function AdminPanel({ menu, setMenu, shopId }) {
  const [tab, setTab] = useState("menu"); // menu | qr
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const blank = {
    id: "item-" + Date.now(), category: "sets",
    zh: { name: "", desc: "" }, it: { name: "", desc: "" },
    price: 0, image: null, badge: ""
  };

  function saveItem(item) {
    setMenu(prev => {
      const exists = prev.find(i => i.id === item.id);
      return exists ? prev.map(i => i.id === item.id ? item : i) : [...prev, item];
    });
    setEditItem(null); setShowAdd(false);
  }

  function deleteItem(id) {
    if (window.confirm("确认删除？/ Confermi eliminazione?")) {
      setMenu(prev => prev.filter(i => i.id !== id));
    }
  }
return (
    <div style={{ minHeight: "100vh", background: "#f5f0eb", fontFamily: "'Noto Serif SC', serif" }}>
      {/* Admin header */}
      <div style={{ background: "#1a1008", padding: "20px 20px 0" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1.4rem" }}>
          LoveSushi <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontFamily: "sans-serif" }}>后台管理</span>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
          {[["menu", "🍱 菜单管理"], ["qr", "📲 二维码"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "10px 20px", border: "none", cursor: "pointer",
              background: tab === id ? "#FAF6F0" : "transparent",
              color: tab === id ? "#1a1008" : "rgba(255,255,255,0.6)",
              fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem",
              borderRadius: tab === id ? "8px 8px 0 0" : 0,
              fontWeight: tab === id ? 600 : 400
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* QR TAB */}
        {tab === "qr" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 6 }}>你的专属二维码</div>
            <div style={{ fontSize: "0.78rem", color: "#999", marginBottom: 20 }}>
              打印后放在桌上，顾客扫码即可查看菜单<br/>
              <span style={{ color: "#C0392B" }}>修改菜单或价格，二维码无需重新生成</span>
            </div>
            <QRDisplay shopId={shopId} />
            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f8eaea", borderRadius: 10, fontSize: "0.78rem", color: "#C0392B", lineHeight: 1.7 }}>
              💡 每个店铺的二维码ID是唯一且永久的<br/>
              顾客扫码永远看到最新菜单
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {tab === "menu" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>共 {menu.length} 道菜品</div>
              <button onClick={() => { setEditItem({ ...blank }); setShowAdd(true); }} style={{
                background: "#C0392B", color: "#fff", border: "none",
                padding: "9px 18px", borderRadius: 999, cursor: "pointer",
                fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem"
              }}>+ 添加菜品</button></div>

            {CATEGORIES.map(cat => {
              const items = menu.filter(i => i.category === cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.8rem", color: "#C9A84C", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>
                    {cat.zh} / {cat.it}
                  </div>
                  {items.map(item => (
                    <div key={item.id} style={{
                      background: "#fff", borderRadius: 12, padding: "12px 14px",
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.06)"
                    }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 8, overflow: "hidden",
                        background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {item.image
                          ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: "1.4rem" }}>🍣</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.zh.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#999" }}>{item.it.name}</div>
                      </div>
                      <div style={{ fontFamily: "'Playfair Display', serif", color: "#C0392B", fontSize: "1rem", fontWeight: 700, flexShrink: 0 }}>
                        €{item.price.toFixed(2)}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditItem(item)} style={{
                          background: "#f0e8e0", border: "none", borderRadius: 8,
                          padding: "6px 12px", cursor: "pointer", fontSize: "0.78rem", color: "#1a1008"
                        }}>编辑</button>
                        <button onClick={() => deleteItem(item.id)} style={{
                          background: "#f8eaea", border: "none", borderRadius: 8,
                          padding: "6px 10px", cursor: "pointer", fontSize: "0.78rem", color: "#C0392B"
                        }}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
{/* Edit modal */}
  {editItem && <EditModal item={editItem} onSave={saveItem} onClose={() => { setEditItem(null); setShowAdd(false); }} />}
    </div>
  );
}

// ── EDIT MODAL ───────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(item)));
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  }

  const inp = (style = {}) => ({
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #e0d8d0", fontFamily: "'Noto Serif SC', serif",
    fontSize: "0.85rem", background: "#faf6f0", outline: "none",
    boxSizing: "border-box", ...style
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", zIndex: 200
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "20px 20px 0 0", padding: 20,
        width: "100%", maxHeight: "90vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>
            {item.zh.name ? "编辑菜品" : "添加菜品"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>菜品图片 / Immagine</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 70, height: 70, borderRadius: 10, overflow: "hidden",
              background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {form.image
                ? <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "1.8rem" }}>🍣</span>
              }
            </div>
  <button onClick={() => fileRef.current.click()} style={{
              flex: 1, padding: "10px", border: "1.5px dashed #C9A84C",
              borderRadius: 10, background: "#fffbf0", cursor: "pointer",
              color: "#C9A84C", fontSize: "0.82rem", fontFamily: "'Noto Serif SC', serif"
            }}>
              📷 上传图片 / Carica immagine
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>分类 / Categoria</div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp()}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.zh} / {c.it}</option>)}
          </select>
        </div>

        {/* Chinese */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>中文名称</div>
          <input style={inp({ marginBottom: 6 })} value={form.zh.name}
            onChange={e => setForm(f => ({ ...f, zh: { ...f.zh, name: e.target.value } }))}
            placeholder="例：三文鱼握寿司 (2件)" />
          <input style={inp()} value={form.zh.desc}
            onChange={e => setForm(f => ({ ...f, zh: { ...f.zh, desc: e.target.value } }))}
            placeholder="例：新鲜挪威三文鱼，入口即化" />
        </div>

        {/* Italian */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>Italiano</div>
          <input style={inp({ marginBottom: 6 })} value={form.it.name}
            onChange={e => setForm(f => ({ ...f, it: { ...f.it, name: e.target.value } }))}
            placeholder="Es: Nigiri Salmone (2 pz)" />
          <input style={inp()} value={form.it.desc}
            onChange={e => setForm(f => ({ ...f, it: { ...f.it, desc: e.target.value } }))}
            placeholder="Es: Salmone norvegese fresco" />
        </div>

     {/* Price */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>价格 / Prezzo (€)</div>
          <input style={inp()} type="number" step="0.5" min="0" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
        </div>
        {/* Badge */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>标签 / Badge</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {BADGES_IT.map((b, i) => (
              <button key={b} onClick={() => setForm(f => ({ ...f, badge: b }))} style={{
                padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                background: form.badge === b ? "#C0392B" : "#f0e8e0",
                color: form.badge === b ? "#fff" : "#666",
                fontSize: "0.78rem", fontFamily: "'Noto Serif SC', serif"
              }}>
                {i === 0 ? "无" : `${BADGES_ZH[i]} / ${b}`}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(form)} style={{
          width: "100%", background: "#C0392B", color: "#fff", border: "none",
          padding: "14px", borderRadius: 12, fontFamily: "'Noto Serif SC', serif",
          fontSize: "1rem", cursor: "pointer", fontWeight: 600
        }}>
          保存 / Salva
        </button>
      </div>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("customer"); // customer | admin
  const [lang, setLang] = useState("it");
  const [menu, setMenu] = useState(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_MENU;
    } catch { return DEFAULT_MENU; }
  });
  const [shopId] = useState(() => {
    let id = localStorage.getItem(SHOP_ID_KEY);
    if (!id) { id = generateShopId(); localStorage.setItem(SHOP_ID_KEY, id); }
    return id;
  });

  // Persist menu
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(menu)); } catch {}
  }, [menu]);
  // Check URL for view=menu
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "menu") setView("customer");
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Serif+SC:wght@300;400;600&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" />

      {/* Mode switcher */}
      <div style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        background: "#1a1008", borderRadius: 999, padding: "6px 8px",
        display: "flex", gap: 4, zIndex: 300, boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        {[["customer", "👁 菜单预览"], ["admin", "⚙️ 商家后台"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
            background: view === v ? "#C0392B" : "transparent",
            color: view === v ? "#fff" : "rgba(255,255,255,0.5)",
            fontFamily: "'Noto Serif SC', serif", fontSize: "0.8rem",
            transition: "all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {view === "customer"
        ? <MenuView menu={menu} lang={lang} setLang={setLang} />
        : <AdminPanel menu={menu} setMenu={setMenu} shopId={shopId} />
      }
    </>
  );
}
