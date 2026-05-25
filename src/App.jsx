import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs, getDoc
} from "firebase/firestore";

const SHOP_ID_KEY = "lovesushi-shop-id";

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function generateShopId() { return "ls-" + Math.random().toString(36).slice(2, 10); }

const DEFAULT_MENU = [
  { id: "item-1", category: "sets", zh: { name: "豪华套餐 A", desc: "三文鱼·金枪鱼·虾·玉子卷 共20件" }, it: { name: "Menu Deluxe A", desc: "Salmone·Tonno·Gamberi·Tamago, 20 pezzi" }, price: 28.9, image: null, badge: "popolare", status: "active" },
  { id: "item-2", category: "sets", zh: { name: "情侣双人套餐", desc: "精选30件，含刺身·寿司·卷物·味噌汤×2" }, it: { name: "Menu Coppia", desc: "30 pezzi selezionati, sashimi·sushi·roll·miso soup x2" }, price: 52.0, image: null, badge: "consigliato", status: "active" },
  { id: "item-3", category: "nigiri", zh: { name: "三文鱼握寿司 (2件)", desc: "新鲜挪威三文鱼，入口即化" }, it: { name: "Nigiri Salmone (2 pz)", desc: "Salmone norvegese fresco, si scioglie in bocca" }, price: 9.5, image: null, badge: "", status: "active" },
  { id: "item-4", category: "nigiri", zh: { name: "金枪鱼握寿司 (2件)", desc: "大西洋金枪鱼，色泽鲜红饱满" }, it: { name: "Nigiri Tonno (2 pz)", desc: "Tonno atlantico, colore rosso vivo" }, price: 10.5, image: null, badge: "novità", status: "active" },
  { id: "item-5", category: "rolls", zh: { name: "彩虹卷 (8件)", desc: "金枪鱼·三文鱼·牛油果·黄瓜" }, it: { name: "Rainbow Roll (8 pz)", desc: "Tonno·Salmone·Avocado·Cetriolo" }, price: 18.5, image: null, badge: "speciale", status: "active" },
  { id: "item-6", category: "drinks", zh: { name: "抹茶拿铁", desc: "日本宇治抹茶，浓郁顺滑" }, it: { name: "Matcha Latte", desc: "Matcha Uji giapponese, cremoso" }, price: 5.5, image: null, badge: "", status: "active" },
];

const DEFAULT_SHOP_INFO = {
  name: "LoveSushi",
  address: "Via Roma 1, Milano",
  phone: "+39 02 1234567",
};

const CATEGORIES = [
  { id: "sets", zh: "套餐", it: "Menu" },
  { id: "nigiri", zh: "握寿司", it: "Nigiri" },
  { id: "sashimi", zh: "刺身", it: "Sashimi" },
  { id: "rolls", zh: "卷物", it: "Roll" },
  { id: "chinese", zh: "中餐", it: "Cinese" },
  { id: "drinks", zh: "饮品", it: "Bevande" },
];

const BADGES_IT = ["", "popolare", "novità", "speciale", "consigliato", "pranzo"];
const BADGES_ZH = ["", "热销", "新品", "招牌", "推荐", "午餐"];

// ── QR CODE ─────────────────────────────────────────────
function loadQRScript() {
  return new Promise((resolve) => {
    if (window.QRCode) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = resolve; s.onerror = resolve;
    document.head.appendChild(s);
  });
}

function QRDisplay({ shopId }) {
  const ref = useRef(null);
  const menuUrl = `${window.location.origin}${window.location.pathname}?shop=${shopId}&view=menu`;

  useEffect(() => {
    loadQRScript().then(() => {
      if (!ref.current) return;
      ref.current.innerHTML = "";
      if (window.QRCode) {
        new window.QRCode(ref.current, {
          text: menuUrl, width: 200, height: 200,
          colorDark: "#1a1008", colorLight: "#FAF6F0",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    });
  }, [shopId]);

return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div ref={ref} style={{ background: "#FAF6F0", padding: 14, borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
      <div style={{ fontSize: "0.72rem", color: "#C9A84C", fontStyle: "italic", fontWeight: 600 }}>
        店铺唯一ID / ID Negozio: {shopId}
      </div>
      <div style={{ fontSize: "0.68rem", color: "#aaa", wordBreak: "break-all", textAlign: "center", maxWidth: 240, lineHeight: 1.5 }}>
        {menuUrl}
      </div>
    </div>
  );
}

// ── CUSTOMER MENU VIEW ───────────────────────────────────
function MenuView({ menu, lang, setLang, shopInfo, onLogoTap }) {
  const [activeCat, setActiveCat] = useState("sets");
  const filtered = menu.filter(i => i.category === activeCat && i.status !== "hidden");

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F0", fontFamily: "'Noto Serif SC', serif", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        padding: "28px 20px 20px", textAlign: "center",
        background: "linear-gradient(160deg, #1a1008 60%, #2d1a0e)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 50% -20%, rgba(192,57,43,0.35) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div onClick={onLogoTap} style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", color: "#fff", letterSpacing: "0.04em", userSelect: "none", cursor: "default" }}>
            {shopInfo.name.replace("LoveSushi", "Love").includes("Love")
              ? <>{shopInfo.name.replace("LoveSushi","Love")}<span style={{ color: "#C9A84C" }}>Sushi</span></>
              : shopInfo.name
            }
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", marginTop: 6, lineHeight: 1.8 }}>
            <div>📍 {shopInfo.address}</div>
            <div>📞 {shopInfo.phone}</div>
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
            borderBottom: lang === l ? "2px solid #C9A84C" : "2px solid transparent",
            fontWeight: lang === l ? 600 : 400, transition: "all 0.2s"
          }}>{l === "zh" ? "中文" : "Italiano"}</button>
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
          }}>{lang === "zh" ? cat.zh : cat.it}</button>
        ))}
      </div>

      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 10px", borderBottom: "1px solid #e8ddd5", margin: "0 16px", fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#C0392B" }}>
        <div style={{ width: 4, height: 18, background: "#C9A84C", borderRadius: 2 }} />
        {lang === "zh" ? CATEGORIES.find(c => c.id === activeCat)?.zh : CATEGORIES.find(c => c.id === activeCat)?.it}
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
          const isSoldout = item.status === "soldout";
          return (
            <div key={item.id} style={{
              background: "#fff", borderRadius: 14, display: "flex", overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.07)", opacity: isSoldout ? 0.65 : 1,
              animation: `fadeUp 0.35s ease ${idx * 0.05}s both`
            }}>
              <div style={{ width: 90, minHeight: 90, flexShrink: 0, overflow: "hidden", background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {item.image
                  ? <img src={item.image} alt={info.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: isSoldout ? "grayscale(60%)" : "none" }} />
                  : <span style={{ fontSize: "2rem" }}>🍣</span>
                }
                {isSoldout && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>{lang === "zh" ? "售罄" : "ESAURITO"}</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, padding: "12px 12px 12px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: isSoldout ? "#aaa" : "#1a1008", lineHeight: 1.3 }}>{info.name}</div>
                  <div style={{ fontSize: "0.73rem", color: "#999", marginTop: 4, lineHeight: 1.5 }}>{info.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 4 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: isSoldout ? "#bbb" : "#C0392B", fontWeight: 700 }}>
                    €{item.price.toFixed(2)}
                  </div>
                            <div style={{ display: "flex", gap: 6 }}>
                    {isSoldout && <div style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: 999, background: "#fff3e0", color: "#e65100", fontWeight: 600 }}>{lang === "zh" ? "售罄" : "Esaurito"}</div>}
                    {badgeLabel && badgeIdx > 0 && !isSoldout && (
                      <div style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: 999, background: item.badge === "novità" ? "#fff8e1" : "#f8eaea", color: item.badge === "novità" ? "#b8860b" : "#C0392B" }}>{badgeLabel}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          );
        })}

      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "28px 20px", background: "#1a1008", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.1em", marginTop: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1rem", marginBottom: 6 }}>{shopInfo.name}</div>
        <div>{shopInfo.address}</div>
        <div style={{ marginTop: 4 }}>{shopInfo.phone}</div>
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────
function AdminPanel({ menu, shopId, saving, shopInfo, setShopInfo, onExit }) {
  const [tab, setTab] = useState("menu");
  const [editItem, setEditItem] = useState(null);
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState(shopInfo);

  const blank = { id: "item-" + Date.now(), category: "sets", zh: { name: "", desc: "" }, it: { name: "", desc: "" }, price: 0, image: null, badge: "", status: "active" };

  async function saveItem(item) {
    await setDoc(doc(db, "menu", item.id), item);
    setEditItem(null);
  }

  async function deleteItem(id) {
    if (window.confirm("确认删除？/ Confermi eliminazione?")) {
      await deleteDoc(doc(db, "menu", id));
    }
  }

  async function toggleStatus(item, newStatus) {
    await setDoc(doc(db, "menu", item.id), { ...item, status: newStatus });
  }

  async function saveShopInfo() {
    await setDoc(doc(db, "settings", "shopInfo"), shopForm);
    setShopInfo(shopForm);
    setEditingShop(false);
  }

  const statusColor = { active: "#27ae60", soldout: "#e65100", hidden: "#bbb" };
  const statusLabel = { active: "正常", soldout: "售罄", hidden: "下架" };

  const inp = (style = {}) => ({
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #e0d8d0", fontFamily: "'Noto Serif SC', serif",
    fontSize: "0.85rem", background: "#faf6f0", outline: "none",
    boxSizing: "border-box", ...style
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0eb", fontFamily: "'Noto Serif SC', serif", paddingBottom: 80 }}>
      <div style={{ background: "#1a1008", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1.4rem" }}>
            LoveSushi <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontFamily: "sans-serif" }}>后台</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "0.7rem", color: saving ? "#C9A84C" : "#27ae60" }}>
              {saving ? "⏳ 同步中..." : "☁️ 已同步"}
            </div>
            <button onClick={onExit} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Noto Serif SC', serif" }}>
              退出
            </button>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 16 }}>
          {[["menu", "🍱 菜单"], ["shop", "🏪 店铺"], ["qr", "📲 二维码"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "10px 16px", border: "none", cursor: "pointer",
              background: tab === id ? "#FAF6F0" : "transparent",
              color: tab === id ? "#1a1008" : "rgba(255,255,255,0.6)",
              fontFamily: "'Noto Serif SC', serif", fontSize: "0.82rem",
              borderRadius: tab === id ? "8px 8px 0 0" : 0,
              fontWeight: tab === id ? 600 : 400
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* 店铺信息 */}
        {tab === "shop" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>店铺信息 / Info Negozio</div>
            {!editingShop ? (
              <div>
                <div style={{ marginBottom: 12, padding: "12px 14px", background: "#faf6f0", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#C9A84C", marginBottom: 4 }}>店铺名称 / Nome</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{shopInfo.name}</div>
                </div>
                <div style={{ marginBottom: 12, padding: "12px 14px", background: "#faf6f0", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#C9A84C", marginBottom: 4 }}>地址 / Indirizzo</div>
                  <div style={{ fontSize: "0.9rem" }}>{shopInfo.address}</div>
                </div>
                <div style={{ marginBottom: 20, padding: "12px 14px", background: "#faf6f0", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#C9A84C", marginBottom: 4 }}>电话 / Telefono</div>
                  <div style={{ fontSize: "0.9rem" }}>{shopInfo.phone}</div>
                </div>
                <button onClick={() => { setShopForm(shopInfo); setEditingShop(true); }} style={{
                  width: "100%", background: "#1a1008", color: "#fff", border: "none",
                  padding: "12px", borderRadius: 12, fontFamily: "'Noto Serif SC', serif",
                  fontSize: "0.9rem", cursor: "pointer"
                }}>✏️ 编辑店铺信息</button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>店铺名称 / Nome negozio</div>
                  <input style={inp()} value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} placeholder="LoveSushi" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>地址 / Indirizzo</div>
                  <input style={inp()} value={shopForm.address} onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} placeholder="Via Roma 1, Milano" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>电话 / Telefono</div>
                  <input style={inp()} value={shopForm.phone} onChange={e => setShopForm(f => ({ ...f, phone: e.target.value }))} placeholder="+39 02 1234567" />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEditingShop(false)} style={{
                    flex: 1, background: "#f0e8e0", color: "#666", border: "none",
                    padding: "12px", borderRadius: 12, fontFamily: "'Noto Serif SC', serif",
                    fontSize: "0.9rem", cursor: "pointer"
                  }}>取消</button>
                  <button onClick={saveShopInfo} style={{
                    flex: 2, background: "#C0392B", color: "#fff", border: "none",
                    padding: "12px", borderRadius: 12, fontFamily: "'Noto Serif SC', serif",
                    fontSize: "0.9rem", cursor: "pointer", fontWeight: 600
                  }}>保存 / Salva</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 二维码 */}
        {tab === "qr" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 6 }}>专属二维码 / QR Code Unico</div>
            <div style={{ fontSize: "0.78rem", color: "#999", marginBottom: 20, lineHeight: 1.7 }}>
              每家店铺有唯一固定ID<br />
              <span style={{ color: "#C0392B" }}>修改菜单价格后，二维码无需重新生成</span><br />
              顾客扫码永远看到最新菜单
            </div>
            <QRDisplay shopId={shopId} />
            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f8eaea", borderRadius: 10, fontSize: "0.78rem", color: "#C0392B", lineHeight: 1.7 }}>
              💡 此ID唯一且永久绑定您的店铺<br />
              即使重新部署网站，ID也不会改变
            </div>
          </div>
        )}

        {/* 菜单管理 */}
        {tab === "menu" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>共 {menu.length} 道菜品</div>
              <button onClick={() => setEditItem({ ...blank })} style={{
                background: "#C0392B", color: "#fff", border: "none",
                padding: "9px 18px", borderRadius: 999, cursor: "pointer",
                fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem"
              }}>+ 添加菜品</button>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 14, fontSize: "0.72rem" }}>
              <span style={{ color: "#27ae60" }}>🟢 正常</span>
              <span style={{ color: "#e65100" }}>🟠 售罄</span>
              <span style={{ color: "#bbb" }}>⚫ 下架</span>
            </div>

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
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 10,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                      opacity: item.status === "hidden" ? 0.5 : 1
                    }}>
                      <div style={{ width: 46, height: 46, borderRadius: 8, overflow: "hidden", background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.3rem" }}>🍣</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.zh.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "#999" }}>{item.it.name}</div>
                        <div style={{ fontSize: "0.7rem", color: statusColor[item.status || "active"], marginTop: 2 }}>
                          ● {statusLabel[item.status || "active"]}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[["active", "正"], ["soldout", "罄"], ["hidden", "架"]].map(([s, label]) => (
                            <button key={s} onClick={() => toggleStatus(item, s)} style={{
                              width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer",
                              background: (item.status || "active") === s ? statusColor[s] : "#f0e8e0",
                              color: (item.status || "active") === s ? "#fff" : "#aaa",
                              fontSize: "0.62rem", fontWeight: 600
                            }}>{label}</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setEditItem(item)} style={{ background: "#f0e8e0", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: "0.75rem", color: "#1a1008" }}>编辑</button>
                          <button onClick={() => deleteItem(item.id)} style={{ background: "#f8eaea", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: "0.75rem", color: "#C0392B" }}>删</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editItem && <EditModal item={editItem} onSave={saveItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}

// ── EDIT MODAL ───────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(item)));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const inp = (style = {}) => ({
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #e0d8d0", fontFamily: "'Noto Serif SC', serif",
    fontSize: "0.85rem", background: "#faf6f0", outline: "none",
    boxSizing: "border-box", ...style
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem" }}>{item.zh?.name ? "编辑菜品" : "添加菜品"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        {/* 图片 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>菜品图片 / Immagine</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", background: "#f0e8e0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {form.image ? <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.8rem" }}>🍣</span>}
            </div>
            <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: "10px", border: "1.5px dashed #C9A84C", borderRadius: 10, background: "#fffbf0", cursor: "pointer", color: "#C9A84C", fontSize: "0.82rem", fontFamily: "'Noto Serif SC', serif" }}>
              📷 上传图片 / Carica immagine
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          </div>
        </div>

        {/* 状态 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>状态 / Stato</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["active", "🟢 正常"], ["soldout", "🟠 售罄"], ["hidden", "⚫ 下架"]].map(([s, label]) => (
              <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{
                flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                background: form.status === s ? "#1a1008" : "#f0e8e0",
                color: form.status === s ? "#fff" : "#666",
                fontSize: "0.75rem", fontFamily: "'Noto Serif SC', serif"
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 分类 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>分类 / Categoria</div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp()}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.zh} / {c.it}</option>)}
          </select>
        </div>

        {/* 中文 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>中文名称</div>
          <input style={inp({ marginBottom: 6 })} value={form.zh.name} onChange={e => setForm(f => ({ ...f, zh: { ...f.zh, name: e.target.value } }))} placeholder="例：三文鱼握寿司 (2件)" />
          <input style={inp()} value={form.zh.desc} onChange={e => setForm(f => ({ ...f, zh: { ...f.zh, desc: e.target.value } }))} placeholder="例：新鲜挪威三文鱼，入口即化" />
        </div>

        {/* 意大利语 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>Italiano</div>
          <input style={inp({ marginBottom: 6 })} value={form.it.name} onChange={e => setForm(f => ({ ...f, it: { ...f.it, name: e.target.value } }))} placeholder="Es: Nigiri Salmone (2 pz)" />
          <input style={inp()} value={form.it.desc} onChange={e => setForm(f => ({ ...f, it: { ...f.it, desc: e.target.value } }))} placeholder="Es: Salmone norvegese fresco" />
        </div>

        {/* 价格 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>价格 / Prezzo (€)</div>
          <input style={inp()} type="number" step="0.5" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
        </div>

        {/* 标签 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 6 }}>标签 / Badge</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {BADGES_IT.map((b, i) => (
              <button key={b} onClick={() => setForm(f => ({ ...f, badge: b }))} style={{
                padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                background: form.badge === b ? "#C0392B" : "#f0e8e0",
                color: form.badge === b ? "#fff" : "#666",
                fontSize: "0.78rem", fontFamily: "'Noto Serif SC', serif"
              }}>{i === 0 ? "无" : `${BADGES_ZH[i]} / ${b}`}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", background: saving ? "#aaa" : "#C0392B", color: "#fff", border: "none",
          padding: "14px", borderRadius: 12, fontFamily: "'Noto Serif SC', serif",
          fontSize: "1rem", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600
        }}>{saving ? "保存中..." : "保存 / Salva"}</button>
      </div>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("customer");
  const [lang, setLang] = useState("it");
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopInfo, setShopInfo] = useState(DEFAULT_SHOP_INFO);

  // 唯一且永久的店铺ID，存在localStorage
  const [shopId] = useState(() => {
    let id = safeGet(SHOP_ID_KEY);
    if (!id) { id = generateShopId(); safeSet(SHOP_ID_KEY, id); }
    return id;
  });

  // 初始化默认菜单
  useEffect(() => {
    async function init() {
      try {
        const snap = await getDocs(collection(db, "menu"));
if (snap.empty) {
          setSaving(true);
          for (const item of DEFAULT_MENU) {
            await setDoc(doc(db, "menu", item.id), item);
          }
          setSaving(false);
        }
      } catch (e) { console.error(e); }
    }
    init();
  }, []);

  // 加载店铺信息
  useEffect(() => {
    async function loadShopInfo() {
      try {
        const snap = await getDoc(doc(db, "settings", "shopInfo"));
        if (snap.exists()) setShopInfo(snap.data());
      } catch (e) { console.error(e); }
    }
    loadShopInfo();
  }, []);

  // 实时监听菜单
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menu"), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const catOrder = CATEGORIES.map(c => c.id);
      items.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category));
      setMenu(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setMenu(DEFAULT_MENU);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "menu") setView("customer");
  }, []);

  const SECRET_PIN = "love";
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  function handleLogoTap() {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setShowPin(true);
      setPinInput("");
      setPinError(false);
    }
  }

  function handlePinSubmit() {
    if (pinInput === SECRET_PIN) {
      setAdminUnlocked(true);
      setShowPin(false);
      setView("admin");
    } else {
      setPinError(true);
      setPinInput("");
      setTimeout(() => setPinError(false), 1500);
    }
  }

  function handleAdminExit() {
    setAdminUnlocked(false);
    setView("customer");
  }
if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF6F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", gap: 16 }}>
        <div style={{ fontSize: "2.5rem" }}>🍣</div>
        <div style={{ color: "#C0392B", fontSize: "1.1rem" }}>LoveSushi</div>
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>加载中... / Caricamento...</div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Serif+SC:wght@300;400;600&display=swap" rel="stylesheet" />

      {showPin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowPin(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 280, textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: "#1a1008", marginBottom: 6 }}>🔐 后台入口</div>
            <div style={{ fontSize: "0.8rem", color: "#999", marginBottom: 20 }}>请输入密码 / Inserisci password</div>
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
              autoFocus
              style={{
                width: "100%", padding: "12px", borderRadius: 10, textAlign: "center",
                border: pinError ? "2px solid #C0392B" : "2px solid #e0d8d0",
                fontSize: "1.2rem", letterSpacing: "0.3em", outline: "none",
                background: pinError ? "#fff0f0" : "#faf6f0", boxSizing: "border-box",
                transition: "all 0.2s"
              }}
              placeholder="••••"
            />
            {pinError && <div style={{ color: "#C0392B", fontSize: "0.78rem", marginTop: 8 }}>密码错误 / Password errata</div>}
            <button onClick={handlePinSubmit} style={{
              width: "100%", marginTop: 16, background: "#1a1008", color: "#C9A84C",
              border: "none", padding: "12px", borderRadius: 10, cursor: "pointer",
              fontFamily: "'Playfair Display', serif", fontSize: "1rem"
            }}>进入 / Entra</button>
          </div>
        </div>
      )}

      {view === "customer" && (
        <MenuView menu={menu} lang={lang} setLang={setLang} shopInfo={shopInfo} onLogoTap={handleLogoTap} />
      )}

      {view === "admin" && adminUnlocked && (
        <AdminPanel menu={menu} shopId={shopId} saving={saving} shopInfo={shopInfo} setShopInfo={setShopInfo} onExit={handleAdminExit} />
      )}
    </>
  );
}
