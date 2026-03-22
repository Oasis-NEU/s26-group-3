import { useState } from "react";

const CATEGORIES = ["Clothing", "Misc", "Textbooks", "Dorm"];
const CAT_ICONS = { Clothing: "👕", Misc: "🎮", Textbooks: "📚", Dorm: "🛏️" };

const SAMPLE = [
  { id: 1, name: "Calculus Textbook 3rd Ed.", price: "35", category: "Textbooks", delivery: "pickup", description: "Barely used, no highlights.", img: null },
  { id: 2, name: "Blue Nike Hoodie XL", price: "22", category: "Clothing", delivery: "dropoff", description: "Good condition, worn twice.", img: null },
  { id: 3, name: "Mini Fridge", price: "60", category: "Dorm", delivery: "pickup", description: "Works great, fits a whole shelf.", img: null },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [listings, setListings] = useState(SAMPLE);
  const [filterCat, setFilterCat] = useState("All");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", delivery: "pickup", category: "Textbooks", img: null });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const filtered = filterCat === "All" ? listings : listings.filter(l => l.category === filterCat);

  function handleUpload() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.price.trim() || isNaN(form.price)) e.price = "Enter a valid number";
    setErrors(e);
    if (Object.keys(e).length) return;
    setListings(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ name: "", price: "", description: "", delivery: "pickup", category: "Textbooks", img: null });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setPage("home"); }, 1400);
  }

  function handleImg(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, img: ev.target.result }));
    reader.readAsDataURL(file);
  }

  const s = {
    root: { fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f3f3f3" },
    nav: { background: "#8B0000", color: "#fff", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontWeight: 900, fontSize: 22, letterSpacing: 3, cursor: "pointer" },
    navBtn: { background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
    wrap: { maxWidth: 1080, margin: "0 auto", padding: "28px 18px" },
    catRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 },
    catBtn: (active) => ({
      padding: "7px 18px", borderRadius: 20, border: "2px solid #8B0000",
      background: active ? "#8B0000" : "#fff", color: active ? "#fff" : "#8B0000",
      fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all .15s"
    }),
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 18 },
    card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.09)", cursor: "pointer", transition: "transform .18s" },
    cardImg: { background: "#8B0000", height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 },
    cardBody: { padding: 14 },
    price: { color: "#8B0000", fontWeight: 800, fontSize: 18, margin: "6px 0" },
    badge: (color) => ({ display: "inline-block", background: color || "#eee", borderRadius: 10, fontSize: 12, padding: "2px 9px", marginRight: 5, marginTop: 4 }),

    // form
    formWrap: { background: "#fff", borderRadius: 14, padding: 32, maxWidth: 680, margin: "0 auto", boxShadow: "0 2px 14px rgba(0,0,0,.1)" },
    formTitle: { color: "#8B0000", fontWeight: 800, fontSize: 22, marginBottom: 24 },
    label: { display: "block", fontWeight: 600, marginBottom: 5, fontSize: 14, color: "#333" },
    input: (err) => ({
      width: "100%", padding: "10px 12px", borderRadius: 8,
      border: `2px solid ${err ? "#e74c3c" : "#ddd"}`,
      fontSize: 14, outline: "none", marginBottom: 4
    }),
    textarea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #ddd", fontSize: 14, minHeight: 90, resize: "vertical", outline: "none" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    select: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #ddd", fontSize: 14, background: "#fff" },
    delivRow: { display: "flex", gap: 12, marginTop: 4 },
    delivOpt: (active) => ({
      flex: 1, padding: "12px 0", borderRadius: 10, border: `2px solid ${active ? "#8B0000" : "#ddd"}`,
      background: active ? "#8B0000" : "#fff", color: active ? "#fff" : "#555",
      fontWeight: 700, cursor: "pointer", textAlign: "center", fontSize: 14, transition: "all .15s"
    }),
    submitBtn: { width: "100%", marginTop: 22, padding: "13px 0", background: "#8B0000", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: "pointer" },
    imgBox: { border: "2px dashed #c0392b", borderRadius: 10, height: 130, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fdf3f3", marginBottom: 4, overflow: "hidden", position: "relative" },
    err: { color: "#e74c3c", fontSize: 12, marginBottom: 8 },
    successBanner: { background: "#27ae60", color: "#fff", borderRadius: 10, padding: "14px 20px", textAlign: "center", fontWeight: 700, fontSize: 16, marginBottom: 20 },

    // detail
    detailBack: { color: "#8B0000", fontWeight: 700, cursor: "pointer", marginBottom: 18, fontSize: 14 },
    detailCard: { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,.1)", maxWidth: 700, margin: "0 auto" },
    detailImg: { background: "#8B0000", height: 240, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 },
    detailBody: { padding: 28 },
  };

  // ── Pages ──────────────────────────────────────────────────────────────────

  if (page === "detail" && detail) return (
    <div style={s.root}>
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => setPage("home")}>🐾 PAWSWAP</span>
        <button style={s.navBtn} onClick={() => setPage("upload")}>+ List Item</button>
      </nav>
      <div style={s.wrap}>
        <div style={s.detailBack} onClick={() => setPage("home")}>← Back to listings</div>
        <div style={s.detailCard}>
          <div style={s.detailImg}>
            {detail.img ? <img src={detail.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : CAT_ICONS[detail.category]}
          </div>
          <div style={s.detailBody}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>{detail.name}</h2>
            <div style={s.price}>${detail.price}</div>
            <div style={{ marginTop: 10 }}>
              <span style={s.badge("#fdecea")}>{detail.category}</span>
              <span style={s.badge(detail.delivery === "pickup" ? "#e8f8f5" : "#fef9e7")}>
                {detail.delivery === "pickup" ? "📍 Pick Up" : "🚚 Drop Off"}
              </span>
            </div>
            {detail.description && <p style={{ marginTop: 16, color: "#555", lineHeight: 1.6 }}>{detail.description}</p>}
            <button style={{ ...s.submitBtn, marginTop: 24 }}>💬 Message Seller</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (page === "upload") return (
    <div style={s.root}>
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => setPage("home")}>🐾 PAWSWAP</span>
        <button style={s.navBtn} onClick={() => setPage("home")}>← Back</button>
      </nav>
      <div style={s.wrap}>
        <div style={s.formWrap}>
          <div style={s.formTitle}>📦 Upload New Product</div>
          {submitted && <div style={s.successBanner}>✅ Listing posted!</div>}

          {/* Image */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Product Image</label>
            <label style={s.imgBox}>
              {form.img
                ? <img src={form.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#c0392b", fontWeight: 600 }}>📷 Click to upload image</span>}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
            </label>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Item Name</label>
            <input
              style={s.input(errors.name)}
              placeholder='e.g. "Blue Nike Hoodie" or "Calculus Textbook 3rd Ed."'
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <div style={s.err}>{errors.name}</div>}
          </div>

          {/* Price + Category */}
          <div style={{ ...s.row2, marginBottom: 14 }}>
            <div>
              <label style={s.label}>Price ($)</label>
              <input
                style={s.input(errors.price)}
                placeholder="e.g. 25"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
              {errors.price && <div style={s.err}>{errors.price}</div>}
            </div>
            <div>
              <label style={s.label}>Category</label>
              <select style={s.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              placeholder="Tell buyers about your item! Mention condition, size, color, brand, and any wear or damage."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Delivery */}
          <div style={{ marginBottom: 8 }}>
            <label style={s.label}>Delivery Method</label>
            <div style={s.delivRow}>
              {["pickup", "dropoff"].map(d => (
                <div key={d} style={s.delivOpt(form.delivery === d)} onClick={() => setForm(f => ({ ...f, delivery: d }))}>
                  {d === "pickup" ? "📍 Pick Up" : "🚚 Drop Off"}
                </div>
              ))}
            </div>
          </div>

          <button style={s.submitBtn} onClick={handleUpload}>Post Listing</button>
        </div>
      </div>
    </div>
  );

  // Homepage
  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <span style={s.logo}>🐾 PAWSWAP</span>
        <button style={s.navBtn} onClick={() => setPage("upload")}>+ List Item</button>
      </nav>
      <div style={s.wrap}>
        <div style={s.catRow}>
          {["All", ...CATEGORIES].map(c => (
            <button key={c} style={s.catBtn(filterCat === c)} onClick={() => setFilterCat(c)}>
              {CAT_ICONS[c] || "🔍"} {c}
            </button>
          ))}
        </div>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>No listings yet. Be the first!</div>
          : <div style={s.grid}>
              {filtered.map(item => (
                <div key={item.id} style={s.card}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  onClick={() => { setDetail(item); setPage("detail"); }}>
                  <div style={s.cardImg}>
                    {item.img ? <img src={item.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : CAT_ICONS[item.category]}
                  </div>
                  <div style={s.cardBody}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                    <div style={s.price}>${item.price}</div>
                    <span style={s.badge("#fdecea")}>{item.category}</span>
                    <span style={s.badge(item.delivery === "pickup" ? "#e8f8f5" : "#fef9e7")}>
                      {item.delivery === "pickup" ? "📍 Pickup" : "🚚 Drop Off"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}