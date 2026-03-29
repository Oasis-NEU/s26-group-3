import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";

const CATEGORIES = ["Clothing", "Misc", "Textbooks", "Dorm"];
const CAT_ICONS = { Clothing: "👕", Misc: "🎮", Textbooks: "📚", Dorm: "🛏️" };
const CONDITIONS = ["Any", "New", "Like New", "Good", "Fair"];
const DELIVERY_OPTS = ["Any", "Pickup", "Drop Off"];
const SORT_OPTS = ["Newest", "Price: Low to High", "Price: High to Low", "Name A–Z"];

const SCIFI = {
  bg: "#070b14", surface: "#0d1420", surface2: "#111b2e",
  border: "#1e3a5f", borderGlow: "#2563eb",
  accent: "#c0392b", accentGlow: "#e74c3c", accentSoft: "#2d0a0a",
  blue: "#2563eb", blueSoft: "#0a1628",
  text: "#e2e8f0", textMuted: "#64748b", textDim: "#334155",
  green: "#10b981", yellow: "#f59e0b", white: "#ffffff",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${SCIFI.bg}; color: ${SCIFI.text}; font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${SCIFI.surface}; }
  ::-webkit-scrollbar-thumb { background: ${SCIFI.border}; border-radius: 2px; }
  .card-hover:hover { border-color: ${SCIFI.borderGlow} !important; transform: translateY(-3px); transition: all .2s; }
  .btn-glow:hover { box-shadow: 0 0 20px rgba(197,48,48,0.4) !important; }
  input, textarea, select {
    background: ${SCIFI.surface2} !important; color: ${SCIFI.text} !important;
    border: 1px solid ${SCIFI.border} !important; border-radius: 8px !important;
    padding: 10px 14px !important; font-family: 'Inter', sans-serif !important;
    outline: none !important; font-size: 14px !important;
  }
  input:focus, textarea:focus, select:focus { border-color: ${SCIFI.blue} !important; }
  option { background: ${SCIFI.surface2}; }
`;

const DEFAULT_FILTERS = {
  query: "", category: "All", condition: "Any", delivery: "Any",
  minPrice: "", maxPrice: "", sort: "Newest", sellerOnly: false,
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

const threadForUsers = (a, b) => [a, b].sort().join("__");

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState("home");
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", delivery: "pickup", category: "Textbooks", condition: "Good", img: null });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [profileTab, setProfileTab] = useState("listings");

  const setF = (k) => (v) => setFilters(f => ({ ...f, [k]: v }));

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data?.session?.user || null;
      if (mounted) {
        setUser(
          authUser
            ? {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Husky",
              }
            : null
        );
        setAuthReady(true);
      }
    };

    syncSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user || null;
      setUser(
        authUser
          ? {
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Husky",
            }
          : null
      );
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadListings = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }

    const sellerIds = [...new Set((data || []).map((r) => r.seller_id).filter(Boolean))];
    let sellerNameMap = { ...profiles };
    if (sellerIds.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", sellerIds);
      if (profileRows) {
        profileRows.forEach((p) => {
          sellerNameMap[p.id] = p.display_name || p.id?.slice(0, 6);
        });
        setProfiles((prev) => {
          const next = { ...prev };
          profileRows.forEach((p) => {
            next[p.id] = p.display_name || p.id?.slice(0, 6);
          });
          return next;
        });
      }
    }

    const mapped = (data || []).map((row) => {
      const normalizedCategory =
        CATEGORIES.find((c) => c.toLowerCase() === String(row.category || "").toLowerCase()) || "Misc";
      return {
      id: row.id,
      name: row.title || "Untitled item",
      price: Number(row.price || 0),
      category: normalizedCategory,
      delivery: row.delivery || "pickup",
      condition: row.condition || "Good",
      description: row.description || "",
      img: Array.isArray(row.images) && row.images.length ? row.images[0] : null,
      seller: sellerNameMap[row.seller_id] || row.seller_id?.slice(0, 6) || "seller",
      sellerId: row.seller_id,
      createdAt: new Date(row.created_at || Date.now()).getTime(),
      };
    });
    setListings(mapped);
  };

  const loadChats = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }

    const byThread = new Map();
    for (const msg of data || []) {
      if (!byThread.has(msg.thread_id)) byThread.set(msg.thread_id, msg);
    }

    const otherIds = [...new Set((data || []).map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id)).filter(Boolean))];
    let nameMap = { ...profiles };
    if (otherIds.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", otherIds);
      if (profileRows) {
        profileRows.forEach((p) => {
          nameMap[p.id] = p.display_name || p.id?.slice(0, 6);
        });
        setProfiles((prev) => {
          const next = { ...prev };
          profileRows.forEach((p) => {
            next[p.id] = p.display_name || p.id?.slice(0, 6);
          });
          return next;
        });
      }
    }

    const convos = [...byThread.values()].map((msg) => {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      return {
        id: msg.thread_id,
        userId: otherId,
        from: nameMap[otherId] || otherId?.slice(0, 6) || "Husky",
        item: "Conversation",
        text: msg.body,
        time: timeAgo(msg.created_at),
        unread: msg.recipient_id === user.id,
      };
    });
    setChats(convos);
    if (!activeChatId && convos.length) setActiveChatId(convos[0].id);
  };

  const loadThreadMessages = async (threadId) => {
    if (!threadId) return setThreadMessages([]);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setThreadMessages(data || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadListings();
    loadChats();

    const channel = supabase
      .channel("pawswap-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadListings())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadChats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (activeChatId) loadThreadMessages(activeChatId);
  }, [activeChatId]);

  if (!authReady) {
    return <div style={{ color: "#fff", padding: 24 }}>Loading...</div>;
  }
  if (!user) return <Auth onLogin={setUser} />;

  // ── Filter + search logic ──
  const filtered = useMemo(() => {
    let res = [...listings];
    const q = filters.query.trim().toLowerCase();
    if (q) res = res.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      (l.seller || "").toLowerCase().includes(q)
    );
    if (filters.category !== "All") res = res.filter(l => l.category === filters.category);
    if (filters.condition !== "Any") res = res.filter(l => l.condition === filters.condition);
    if (filters.delivery !== "Any") res = res.filter(l =>
      filters.delivery === "Pickup" ? l.delivery === "pickup" : l.delivery === "dropoff"
    );
    if (filters.minPrice !== "") res = res.filter(l => l.price >= Number(filters.minPrice));
    if (filters.maxPrice !== "") res = res.filter(l => l.price <= Number(filters.maxPrice));
    if (filters.sellerOnly && user) res = res.filter(l => l.sellerId === user.id);
    switch (filters.sort) {
      case "Price: Low to High": res.sort((a, b) => a.price - b.price); break;
      case "Price: High to Low": res.sort((a, b) => b.price - a.price); break;
      case "Name A–Z": res.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: res.sort((a, b) => b.createdAt - a.createdAt);
    }
    return res;
  }, [listings, filters, user]);

  const activeFilterCount = [
    filters.query, filters.category !== "All", filters.condition !== "Any",
    filters.delivery !== "Any", filters.minPrice, filters.maxPrice, filters.sellerOnly
  ].filter(Boolean).length;

  const myListings = listings.filter((l) => l.sellerId === user.id);
  const favListings = listings.filter(l => favorites.includes(l.id));
  const unreadCount = chats.filter(c => c.unread).length;

  function toggleFav(id) { setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]); }

  async function handleUpload() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.price || isNaN(form.price)) e.price = "Valid number required";
    setErrors(e);
    if (Object.keys(e).length) return;

    const { error } = await supabase.from("products").insert({
      seller_id: user.id,
      title: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      condition: form.condition,
      delivery: form.delivery,
      images: form.img ? [form.img] : [],
      tags: [],
    });
    if (error) {
      setErrors({ form: error.message });
      return;
    }

    await loadListings();
    setForm({ name: "", price: "", description: "", delivery: "pickup", category: "Textbooks", condition: "Good", img: null });
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

  async function sendMessage() {
    if (!msgText.trim() || !detail?.sellerId || detail.sellerId === user.id) return;
    const threadId = threadForUsers(user.id, detail.sellerId);
    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      recipient_id: detail.sellerId,
      body: msgText.trim(),
    });
    if (error) {
      console.error(error);
      return;
    }
    await loadChats();
    setMsgSent(true);
    setTimeout(() => {
      setMsgSent(false);
      setMsgOpen(false);
      setMsgText("");
      setPage("profile");
      setProfileTab("messages");
      setActiveChatId(threadId);
    }, 900);
  }

  async function sendChat() {
    if (!chatInput.trim() || !activeChatId || !activeChat?.userId) return;
    const { error } = await supabase.from("messages").insert({
      thread_id: activeChatId,
      sender_id: user.id,
      recipient_id: activeChat.userId,
      body: chatInput.trim(),
    });
    if (error) {
      console.error(error);
      return;
    }
    await loadThreadMessages(activeChatId);
    await loadChats();
    setChatInput("");
  }

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const avatarColors = ["#c0392b", "#2563eb", "#7c3aed", "#059669", "#d97706"];
  const getColor = (name = "U") => avatarColors[name.charCodeAt(0) % avatarColors.length];

  const s = {
    root: { fontFamily: "'Inter',sans-serif", minHeight: "100vh", width: "100%", background: SCIFI.bg, color: SCIFI.text },
    nav: { background: SCIFI.surface, borderBottom: `1px solid ${SCIFI.border}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logoWrap: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
    logoMark: { width: 32, height: 32, background: SCIFI.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" },
    logoText: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: SCIFI.white, letterSpacing: 2 },
    logoSub: { fontSize: 9, color: SCIFI.textMuted, letterSpacing: 3, marginTop: -2 },
    navLinks: { display: "flex", gap: 4 },
    navLink: (active) => ({ padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, color: active ? SCIFI.white : SCIFI.textMuted, background: active ? SCIFI.surface2 : "transparent", border: active ? `1px solid ${SCIFI.border}` : "1px solid transparent", cursor: "pointer" }),
    navRight: { display: "flex", alignItems: "center", gap: 10 },
    avatar: { width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${SCIFI.accent}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", border: `2px solid ${SCIFI.border}` },
    unreadBadge: { background: SCIFI.accent, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginLeft: -8, marginTop: -8 },
    btnPrimary: { background: SCIFI.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13, letterSpacing: 0.5, transition: "all .2s" },
    btnSecondary: { background: "transparent", color: SCIFI.textMuted, border: `1px solid ${SCIFI.border}`, borderRadius: 8, padding: "7px 14px", fontWeight: 500, cursor: "pointer", fontSize: 13 },
    btnGhost: (active) => ({ background: active ? SCIFI.accentSoft : "transparent", color: active ? "#f87171" : SCIFI.textMuted, border: `1px solid ${active ? SCIFI.accent : SCIFI.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s" }),

    // search bar area
    searchBar: { background: SCIFI.surface, borderBottom: `1px solid ${SCIFI.border}`, padding: "16px 40px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    searchInput: { width: "100%", padding: "10px 16px 10px 40px", borderRadius: 10, border: `1px solid ${SCIFI.border}`, background: SCIFI.surface2, color: SCIFI.text, fontSize: 14, outline: "none", fontFamily: "'Inter',sans-serif" },
    searchWrap: { position: "relative", flex: "1 1 400px", minWidth: 0 },
    searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" },
    filterBtn: (count) => ({ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: `1px solid ${count > 0 ? SCIFI.accent : SCIFI.border}`, background: count > 0 ? SCIFI.accentSoft : "transparent", color: count > 0 ? "#f87171" : SCIFI.textMuted, fontWeight: 500, cursor: "pointer", fontSize: 13, transition: "all .15s" }),
    filterCount: { background: SCIFI.accent, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 },
    sortSelect: { padding: "9px 14px", borderRadius: 10, border: `1px solid ${SCIFI.border}`, background: SCIFI.surface2, color: SCIFI.text, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif" },

    // filter panel
    filterPanel: { background: SCIFI.surface, borderBottom: `1px solid ${SCIFI.border}`, padding: "20px 40px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" },
    filterGroup: { display: "flex", flexDirection: "column", gap: 6, minWidth: 140 },
    filterLabel: { fontSize: 10, fontWeight: 600, color: SCIFI.textMuted, letterSpacing: 2, textTransform: "uppercase" },
    filterSelect: { padding: "8px 12px", borderRadius: 8, border: `1px solid ${SCIFI.border}`, background: SCIFI.surface2, color: SCIFI.text, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif" },
    priceRow: { display: "flex", gap: 8, alignItems: "center" },
    priceInput: { width: 80, padding: "8px 10px", borderRadius: 8, border: `1px solid ${SCIFI.border}`, background: SCIFI.surface2, color: SCIFI.text, fontSize: 13, outline: "none", fontFamily: "'Inter',sans-serif" },
    clearBtn: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${SCIFI.border}`, background: "transparent", color: SCIFI.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", marginLeft: "auto" },

    // category tabs
    catTabs: { background: SCIFI.surface2, borderBottom: `1px solid ${SCIFI.border}`, padding: "0 40px", display: "flex", gap: 2, overflowX: "auto" },
    catTab: (active) => ({ padding: "12px 18px", fontSize: 13, fontWeight: 500, color: active ? SCIFI.white : SCIFI.textMuted, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", background: "transparent", border: "none", borderBottom: active ? `2px solid ${SCIFI.accent}` : "2px solid transparent" }),

    // hero
    hero: { background: SCIFI.surface, borderBottom: `1px solid ${SCIFI.border}`, padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
    heroTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: SCIFI.white, marginBottom: 4 },
    heroSub: { fontSize: 13, color: SCIFI.textMuted, letterSpacing: 1 },
    statCard: { background: SCIFI.surface2, border: `1px solid ${SCIFI.border}`, borderRadius: 10, padding: "10px 18px", textAlign: "center" },
    statNum: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: SCIFI.accent },
    statLabel: { fontSize: 10, color: SCIFI.textMuted, letterSpacing: 2, marginTop: 2, textTransform: "uppercase" },

    wrap: { maxWidth: 1300, margin: "0 auto", padding: "24px 32px" },
    sectionLabel: { fontSize: 10, fontWeight: 600, color: SCIFI.textMuted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 18 },
    card: { background: SCIFI.surface, borderRadius: 12, border: `1px solid ${SCIFI.border}`, overflow: "hidden", cursor: "pointer", transition: "all .2s", position: "relative" },
    cardImg: { height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, position: "relative", background: `linear-gradient(135deg, ${SCIFI.surface2}, ${SCIFI.accentSoft})` },
    cardBody: { padding: "14px 16px 16px" },
    cardName: { fontWeight: 600, fontSize: 14, color: SCIFI.white, marginBottom: 6, lineHeight: 1.4 },
    cardPrice: { color: SCIFI.accent, fontWeight: 700, fontSize: 20, marginBottom: 10, fontFamily: "'Space Grotesk',sans-serif" },
    badgeRow: { display: "flex", gap: 6, flexWrap: "wrap" },
    badge: (bg, col) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: bg, color: col, fontWeight: 500, letterSpacing: 0.3 }),
    favBtn: (isFav) => ({ position: "absolute", top: 10, right: 10, background: isFav ? SCIFI.accent : "rgba(0,0,0,0.5)", border: `1px solid ${isFav ? SCIFI.accent : SCIFI.border}`, borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "#fff", transition: "all .15s" }),

    // detail
    detailCard: { background: SCIFI.surface, borderRadius: 16, border: `1px solid ${SCIFI.border}`, maxWidth: 760, margin: "0 auto" },
    detailImg: { height: 280, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90, background: `linear-gradient(135deg, ${SCIFI.surface2}, ${SCIFI.accentSoft})`, borderRadius: "16px 16px 0 0" },
    detailBody: { padding: "28px 32px" },

    // upload
    formCard: { background: SCIFI.surface, borderRadius: 16, border: `1px solid ${SCIFI.border}`, padding: "36px 40px", maxWidth: 720, margin: "0 auto" },
    label: { display: "block", fontSize: 11, fontWeight: 600, color: SCIFI.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
    inputStyle: { width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid ${SCIFI.border}`, fontSize: 14, outline: "none", background: SCIFI.surface2, color: SCIFI.text, marginBottom: 4, boxSizing: "border-box" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
    row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 },
    delivRow: { display: "flex", gap: 12, marginTop: 4 },
    delivOpt: (active) => ({ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${active ? SCIFI.accent : SCIFI.border}`, background: active ? SCIFI.accentSoft : "transparent", color: active ? "#fff" : SCIFI.textMuted, fontWeight: 600, cursor: "pointer", textAlign: "center", fontSize: 13, transition: "all .15s" }),
    imgBox: { border: `1px dashed ${SCIFI.border}`, borderRadius: 10, height: 130, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: SCIFI.surface2, marginBottom: 4, overflow: "hidden" },
    err: { color: "#f87171", fontSize: 12, marginBottom: 8 },
    successBanner: { background: "#064e3b", border: "1px solid #10b981", color: "#6ee7b7", borderRadius: 8, padding: "12px 16px", textAlign: "center", fontWeight: 600, fontSize: 14, marginBottom: 20 },

    // modal
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(8px)" },
    modal: { background: SCIFI.surface, borderRadius: 16, padding: "32px 36px", width: "100%", maxWidth: 460, border: `1px solid ${SCIFI.border}` },

    // profile
    profileHeader: { background: SCIFI.surface, border: `1px solid ${SCIFI.border}`, borderRadius: 16, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 },
    bigAvatar: { width: 72, height: 72, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${SCIFI.accent}, #7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", border: `3px solid ${SCIFI.border}` },
    profileTabs: { display: "flex", gap: 4, marginBottom: 24, background: SCIFI.surface, borderRadius: 10, padding: 4, border: `1px solid ${SCIFI.border}`, width: "fit-content" },
    profileTab: (active) => ({ padding: "8px 20px", borderRadius: 7, fontSize: 13, fontWeight: 500, background: active ? SCIFI.surface2 : "transparent", color: active ? SCIFI.white : SCIFI.textMuted, border: active ? `1px solid ${SCIFI.border}` : "1px solid transparent", cursor: "pointer", transition: "all .15s" }),
    msgList: { display: "flex", flexDirection: "column", gap: 10 },
    msgRow: (unread) => ({ background: SCIFI.surface, border: `1px solid ${unread ? SCIFI.accent : SCIFI.border}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all .15s" }),
    msgAvatar: (color) => ({ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }),
    chatBox: { background: SCIFI.surface, border: `1px solid ${SCIFI.border}`, borderRadius: 16, display: "flex", flexDirection: "column", height: 460 },
    chatHeader: { padding: "14px 18px", borderBottom: `1px solid ${SCIFI.border}`, display: "flex", alignItems: "center", gap: 12 },
    chatMessages: { flex: 1, padding: "16px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
    chatBubble: (mine) => ({ maxWidth: "70%", padding: "9px 14px", borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: mine ? SCIFI.accent : SCIFI.surface2, color: "#fff", fontSize: 13, alignSelf: mine ? "flex-end" : "flex-start", border: mine ? "none" : `1px solid ${SCIFI.border}` }),
    chatInputRow: { padding: "12px 16px", borderTop: `1px solid ${SCIFI.border}`, display: "flex", gap: 10 },
  };

  const Nav = ({ back }) => (
    <nav style={s.nav}>
      <div style={s.logoWrap} onClick={() => setPage("home")}>
        <div style={s.logoMark}>PS</div>
        <div>
          <div style={s.logoText}>PAWSWAP</div>
          <div style={s.logoSub}>NORTHEASTERN · BOSTON</div>
        </div>
      </div>
      <div style={s.navLinks}>
        {!back && <>
          <button style={s.navLink(page === "home")} onClick={() => setPage("home")}>Marketplace</button>
          <button style={s.navLink(page === "profile")} onClick={() => setPage("profile")}>My Profile</button>
        </>}
      </div>
      <div style={s.navRight}>
        {unreadCount > 0 && (
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => { setPage("profile"); setProfileTab("messages"); }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <div style={s.unreadBadge}>{unreadCount}</div>
          </div>
        )}
        {back
          ? <button style={s.btnSecondary} onClick={() => setPage("home")}>← Back</button>
          : <button style={{ ...s.btnPrimary }} className="btn-glow" onClick={() => setPage("upload")}>+ List Item</button>
        }
        <div style={s.avatar} onClick={() => setPage("profile")}>{(user.name || "U")[0].toUpperCase()}</div>
        <button
          style={s.btnSecondary}
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setListings([]);
            setChats([]);
            setThreadMessages([]);
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  const MessageModal = () => (
    <div style={s.overlay} onClick={() => setMsgOpen(false)}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {msgSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: SCIFI.green }}>Message Sent!</div>
            <div style={{ fontSize: 13, color: SCIFI.textMuted, marginTop: 6 }}>The seller will get back to you soon.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: SCIFI.white, marginBottom: 4 }}>Message Seller</div>
            <div style={{ fontSize: 12, color: SCIFI.textMuted, marginBottom: 20 }}>Re: <span style={{ color: SCIFI.accent }}>{detail?.name}</span></div>
            <textarea style={{ ...s.inputStyle, minHeight: 110, resize: "vertical", marginBottom: 14 }} placeholder="Hey! Is this still available?" value={msgText} onChange={e => setMsgText(e.target.value)} />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnPrimary, flex: 1, padding: "11px 0" }} onClick={sendMessage}>Send</button>
              <button style={{ ...s.btnSecondary, flex: 1, padding: "11px 0" }} onClick={() => setMsgOpen(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const CardGrid = ({ items }) => (
    items.length === 0
      ? <div style={{ textAlign: "center", padding: 80, color: SCIFI.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No listings found</div>
          <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
          {activeFilterCount > 0 && <button style={{ ...s.btnSecondary, marginTop: 16 }} onClick={() => setFilters(DEFAULT_FILTERS)}>Clear all filters</button>}
        </div>
      : <div style={s.grid}>
          {items.map(item => (
            <div key={item.id} className="card-hover" style={s.card}>
              <div style={s.cardImg}>
                {item.img ? <img src={item.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{CAT_ICONS[item.category]}</span>}
                <button style={s.favBtn(favorites.includes(item.id))} onClick={e => { e.stopPropagation(); toggleFav(item.id); }}>
                  {favorites.includes(item.id) ? "♥" : "♡"}
                </button>
              </div>
              <div style={s.cardBody} onClick={() => { setDetail(item); setPage("detail"); }}>
                <div style={s.cardName}>{item.name}</div>
                <div style={s.cardPrice}>${item.price}</div>
                <div style={s.badgeRow}>
                  <span style={s.badge(SCIFI.accentSoft, "#f87171")}>{item.category}</span>
                  <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{item.condition}</span>
                  <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{item.delivery === "pickup" ? "📍 Pickup" : "🚚 Drop Off"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
  );

  // ── Profile ──
  if (page === "profile") return (
    <div style={s.root}>
      <style>{css}</style>
      <Nav />
      <div style={s.wrap}>
        <div style={s.profileHeader}>
          <div style={s.bigAvatar}>{(user.name || "U")[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: SCIFI.white, marginBottom: 4 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: SCIFI.textMuted, marginBottom: 12 }}>{user.email}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={s.badge(SCIFI.accentSoft, SCIFI.accent)}>🏫 Northeastern</span>
              <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{myListings.length} listings</span>
              <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{favListings.length} saved</span>
            </div>
          </div>
          <button style={s.btnPrimary} onClick={() => setPage("upload")}>+ New Listing</button>
        </div>
        <div style={s.profileTabs}>
          {[["listings", "My Listings"], ["favorites", "Saved"], ["messages", `Messages${unreadCount > 0 ? ` (${unreadCount})` : ""}`]].map(([k, v]) => (
            <button key={k} style={s.profileTab(profileTab === k)} onClick={() => setProfileTab(k)}>{v}</button>
          ))}
        </div>
        {profileTab === "listings" && <CardGrid items={myListings} />}
        {profileTab === "favorites" && (
          favListings.length === 0
            ? <div style={{ textAlign: "center", padding: 60, color: SCIFI.textMuted }}>No saved items yet.</div>
            : <CardGrid items={favListings} />
        )}
        {profileTab === "messages" && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
            <div style={s.msgList}>
              {chats.map(c => (
                <div key={c.id} className="card-hover" style={{ ...s.msgRow(c.unread), background: activeChatId === c.id ? SCIFI.surface2 : SCIFI.surface }}
                  onClick={() => setActiveChatId(c.id)}>
                  <div style={s.msgAvatar(getColor(c.from))}>{c.from[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: SCIFI.white }}>{c.from}</span>
                      <span style={{ fontSize: 11, color: SCIFI.textMuted }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: SCIFI.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.item}</div>
                    <div style={{ fontSize: 12, color: c.unread ? SCIFI.white : SCIFI.textDim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.text}</div>
                  </div>
                  {c.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: SCIFI.accent, flexShrink: 0 }} />}
                </div>
              ))}
            </div>
            <div style={s.chatBox}>
              {activeChat ? <>
                <div style={s.chatHeader}>
                  <div style={s.msgAvatar(getColor(activeChat.from))}>{activeChat.from[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: SCIFI.white }}>{activeChat.from}</div>
                    <div style={{ fontSize: 11, color: SCIFI.textMuted }}>Re: {activeChat.item}</div>
                  </div>
                </div>
                <div style={s.chatMessages}>
                  {threadMessages.length === 0 ? (
                    <div style={{ color: SCIFI.textMuted, fontSize: 13 }}>No messages yet. Start the conversation.</div>
                  ) : (
                    threadMessages.map((m) => (
                      <div key={m.id} style={s.chatBubble(m.sender_id === user.id)}>
                        {m.body}
                      </div>
                    ))
                  )}
                </div>
                <div style={s.chatInputRow}>
                  <input style={{ ...s.inputStyle, flex: 1, marginBottom: 0 }} placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
                  <button style={s.btnPrimary} onClick={sendChat}>Send</button>
                </div>
              </> : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: SCIFI.textMuted, fontSize: 14 }}>Select a conversation</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Detail ──
  if (page === "detail" && detail) return (
    <div style={s.root}>
      <style>{css}</style>
      {msgOpen && <MessageModal />}
      <Nav back />
      <div style={s.wrap}>
        <div style={{ color: SCIFI.accent, fontWeight: 600, cursor: "pointer", marginBottom: 20, fontSize: 13 }} onClick={() => setPage("home")}>← Back</div>
        <div style={s.detailCard}>
          <div style={s.detailImg}>
            {detail.img ? <img src={detail.img} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px 16px 0 0" }} /> : <span>{CAT_ICONS[detail.category]}</span>}
          </div>
          <div style={s.detailBody}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: SCIFI.white, marginBottom: 8 }}>{detail.name}</div>
            <div style={{ color: SCIFI.accent, fontWeight: 700, fontSize: 30, marginBottom: 16, fontFamily: "'Space Grotesk',sans-serif" }}>${detail.price}</div>
            <div style={s.badgeRow}>
              <span style={s.badge(SCIFI.accentSoft, "#f87171")}>{detail.category}</span>
              <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{detail.condition}</span>
              <span style={s.badge(detail.delivery === "pickup" ? "#022c22" : "#2d1a00", detail.delivery === "pickup" ? SCIFI.green : SCIFI.yellow)}>
                {detail.delivery === "pickup" ? "📍 Pickup" : "🚚 Drop Off"}
              </span>
              <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>👤 {detail.seller}</span>
            </div>
            {detail.description && <p style={{ marginTop: 20, color: SCIFI.textMuted, lineHeight: 1.7, fontSize: 14 }}>{detail.description}</p>}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button style={{ ...s.btnPrimary, flex: 1, padding: "13px 0", fontSize: 14 }} className="btn-glow" onClick={() => setMsgOpen(true)}>💬 Message Seller</button>
              <button style={{ ...s.btnSecondary, padding: "13px 20px" }} onClick={() => toggleFav(detail.id)}>
                {favorites.includes(detail.id) ? "♥ Saved" : "♡ Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Upload ──
  if (page === "upload") return (
    <div style={s.root}>
      <style>{css}</style>
      <Nav back />
      <div style={s.wrap}>
        <div style={s.formCard}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: SCIFI.white, marginBottom: 28 }}>New Listing</div>
          {submitted && <div style={s.successBanner}>✅ Posted! Redirecting...</div>}
          {errors.form && <div style={s.err}>{errors.form}</div>}
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Product Image</label>
            <label style={s.imgBox}>
              {form.img ? <img src={form.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: SCIFI.textMuted, fontSize: 13 }}>📷 Click to upload</span>}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
            </label>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={s.label}>Item Name</label>
            <input style={s.inputStyle} placeholder='e.g. "Blue Nike Hoodie"' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            {errors.name && <div style={s.err}>{errors.name}</div>}
          </div>
          <div style={{ ...s.row3, marginBottom: 18 }}>
            <div>
              <label style={s.label}>Price ($)</label>
              <input style={s.inputStyle} placeholder="25" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              {errors.price && <div style={s.err}>{errors.price}</div>}
            </div>
            <div>
              <label style={s.label}>Category</label>
              <select style={s.inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Condition</label>
              <select style={s.inputStyle} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                {CONDITIONS.filter(c => c !== "Any").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Description</label>
            <textarea style={{ ...s.inputStyle, minHeight: 100, resize: "vertical" }} placeholder="Condition, size, color, brand..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Delivery</label>
            <div style={s.delivRow}>
              {["pickup", "dropoff"].map(d => (
                <div key={d} style={s.delivOpt(form.delivery === d)} onClick={() => setForm(f => ({ ...f, delivery: d }))}>
                  {d === "pickup" ? "📍 Pickup" : "🚚 Drop Off"}
                </div>
              ))}
            </div>
          </div>
          <button style={{ ...s.btnPrimary, width: "100%", padding: "14px 0", fontSize: 15 }} className="btn-glow" onClick={handleUpload}>Post Listing</button>
        </div>
      </div>
    </div>
  );

  // ── Homepage ──
  return (
    <div style={s.root}>
      <style>{css}</style>
      <Nav />

      {/* Hero */}
      <div style={s.hero}>
        <div>
          <div style={s.heroTitle}>The Husky Marketplace</div>
          <div style={s.heroSub}>BUY · SELL · SWAP · NORTHEASTERN ONLY</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[{ n: listings.length, l: "Listings" }, { n: filtered.length, l: "Showing" }, { n: favListings.length, l: "Saved" }].map(({ n, l }) => (
            <div key={l} style={s.statCard}><div style={s.statNum}>{n}</div><div style={s.statLabel}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div style={s.searchBar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search listings, sellers, categories..."
            value={filters.query}
            onChange={e => setF("query")(e.target.value)}
          />
        </div>
        <button style={s.filterBtn(activeFilterCount)} onClick={() => setShowFilters(v => !v)}>
          ⚙ Filters {activeFilterCount > 0 && <div style={s.filterCount}>{activeFilterCount}</div>}
        </button>
        <select style={s.sortSelect} value={filters.sort} onChange={e => setF("sort")(e.target.value)}>
          {SORT_OPTS.map(o => <option key={o}>{o}</option>)}
        </select>
        {activeFilterCount > 0 && (
          <button style={s.clearBtn} onClick={() => setFilters(DEFAULT_FILTERS)}>✕ Clear all</button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={s.filterPanel}>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Condition</div>
            <select style={s.filterSelect} value={filters.condition} onChange={e => setF("condition")(e.target.value)}>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Delivery</div>
            <select style={s.filterSelect} value={filters.delivery} onChange={e => setF("delivery")(e.target.value)}>
              {DELIVERY_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Price Range</div>
            <div style={s.priceRow}>
              <input style={s.priceInput} placeholder="Min" value={filters.minPrice} onChange={e => setF("minPrice")(e.target.value)} />
              <span style={{ color: SCIFI.textMuted, fontSize: 12 }}>–</span>
              <input style={s.priceInput} placeholder="Max" value={filters.maxPrice} onChange={e => setF("maxPrice")(e.target.value)} />
            </div>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Seller</div>
            <button style={s.btnGhost(filters.sellerOnly)} onClick={() => setF("sellerOnly")(!filters.sellerOnly)}>
              {filters.sellerOnly ? "✓ My listings only" : "My listings only"}
            </button>
          </div>
          <button style={s.clearBtn} onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
        </div>
      )}

      {/* Category tabs */}
      <div style={s.catTabs}>
        {["All", ...CATEGORIES].map(c => (
          <button key={c} style={s.catTab(filters.category === c)} onClick={() => setF("category")(c)}>
            {CAT_ICONS[c] || "◈"} {c}
          </button>
        ))}
      </div>

      <div style={s.wrap}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={s.sectionLabel}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}{filters.query ? ` for "${filters.query}"` : ""}</div>
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filters.query && <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>🔍 {filters.query} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setF("query")("")}>✕</span></span>}
              {filters.category !== "All" && <span style={s.badge(SCIFI.accentSoft, "#f87171")}>{filters.category} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setF("category")("All")}>✕</span></span>}
              {filters.condition !== "Any" && <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>{filters.condition} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setF("condition")("Any")}>✕</span></span>}
              {filters.minPrice && <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>Min ${filters.minPrice} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setF("minPrice")("")}>✕</span></span>}
              {filters.maxPrice && <span style={s.badge(SCIFI.surface2, SCIFI.textMuted)}>Max ${filters.maxPrice} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setF("maxPrice")("")}>✕</span></span>}
            </div>
          )}
        </div>
        <CardGrid items={filtered} />
      </div>
    </div>
  );
}
