import { useState, useRef, useEffect } from "react";

// ─── DEFAULT CONFIG (editable like a Gem) ─────────────────────────────────────
const DEFAULT_CONFIG = {
  botName: "Food Photo Prompt Bot",
  platform: "Zomato",
  imageSize: "145×145",
  imageSizePreset: "zomato_thumb",
  cuisineStyle: "North Indian",
  mandatoryItems: "Matte-black ceramic bowls (250-300ml), 4 Butter Chapati, Left window light, Steam rising, Dark walnut table",
  extraInstructions: "",
  quickChips: [
    "Punjabi Chole + Mix Dal + Rice",
    "Paneer Makhani + Naan",
    "Dal Makhani + Roti",
    "Veg Biryani + Raita",
    "Masala Dosa + Sambhar",
    "Pav Bhaji",
    "Kadai Paneer + Paratha",
    "Rajma Chawal",
  ],
};

const SIZE_PRESETS = [
  { label: "Zomato Thumbnail", value: "zomato_thumb", size: "145×145" },
  { label: "Zomato Banner", value: "zomato_banner", size: "1184×864" },
  { label: "Instagram Post", value: "instagram", size: "1080×1080" },
  { label: "Instagram Story", value: "insta_story", size: "1080×1920" },
  { label: "Swiggy Item", value: "swiggy", size: "320×320" },
  { label: "Custom", value: "custom", size: "" },
];

const PLATFORMS = ["Zomato", "Swiggy", "Instagram", "Restaurant Menu", "Food Blog", "WhatsApp"];
const CUISINES = ["North Indian", "South Indian", "Punjabi", "Mughlai", "Street Food", "Continental", "Chinese", "Multi-Cuisine"];

// ─── BUILD SYSTEM PROMPT from config ─────────────────────────────────────────
function buildSystemPrompt(cfg) {
  return `You are an expert AI food photography prompt writer for ${cfg.platform} and Indian food delivery apps.

When the user gives any food item or description, generate ONE ultra-detailed realistic food photography prompt.

STRICT TEMPLATE TO FOLLOW:
"Ultra-realistic premium natural food photography of a complete ${cfg.cuisineStyle} combo meal featuring [DISH NAMES]; [for each dish: matte-black ceramic bowl 250-300ml, preparation style, gravy/texture details, garnish, steam]; Butter Chapati (4 pieces) slightly folded and neatly stacked with golden roasted spots and melted butter shine; [salad/side if applicable in small minimal bowl]; [dessert if applicable]; entire setup on a large white ceramic plate on a dark walnut wooden table; warm natural window light from the left side; cozy restaurant background with golden bokeh blur; cinematic shallow depth-of-field; 50mm lens f/2.0; rich warm tones; ultra-detailed textures visible; gentle steam from hot dishes; no hands, no steel thali, no extra props; eye-level angle; optimized for ${cfg.platform}; final output size ${cfg.imageSize} pixels; 8K resolution, hyper-realistic commercial food photography."

MANDATORY ELEMENTS (always include):
${cfg.mandatoryItems}

IMAGE OUTPUT SIZE: Always mention "${cfg.imageSize} pixels" in the prompt near the end.

${cfg.extraInstructions ? `ADDITIONAL INSTRUCTIONS:\n${cfg.extraInstructions}\n` : ""}
RULES:
1. OUTPUT ONLY the prompt — no intro, no explanation, no markdown, no surrounding quotes
2. 180-220 words
3. Bowl always matte-black ceramic
4. Chapati always 4 pieces
5. Always end with: "8K resolution, hyper-realistic commercial food photography."`;
}

// ─── COPY ────────────────────────────────────────────────────────────────────
function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;top:0;left:0;width:1px;height:1px";
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [config, setConfig]       = useState(DEFAULT_CONFIG);
  const [draft, setDraft]         = useState(DEFAULT_CONFIG);   // editing draft
  const [panel, setPanel]         = useState(null);             // null | "config"
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [chipInput, setChipInput] = useState("");
  const [saved, setSaved]         = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: buildSystemPrompt(config),
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Error aaya. Dobara try karo.";
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...newMsgs, { role: "assistant", content: "⚠️ " + (e.message || "Network error") }]);
    } finally { setLoading(false); }
  };

  const handleCopy = (text, idx) => {
    if (copyText(text)) { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2200); }
  };

  // ── Config panel ─────────────────────────────────────────────────────────
  const openConfig = () => { setDraft({ ...config, quickChips: [...config.quickChips] }); setPanel("config"); };
  const saveConfig = () => {
    setConfig({ ...draft });
    setPanel(null);
    setSaved(true);
    setMessages([]);
    setTimeout(() => setSaved(false), 2500);
  };
  const updateDraft = (key, val) => setDraft(p => ({ ...p, [key]: val }));
  const addChip = () => {
    if (!chipInput.trim()) return;
    setDraft(p => ({ ...p, quickChips: [...p.quickChips, chipInput.trim()] }));
    setChipInput("");
  };
  const removeChip = (i) => setDraft(p => ({ ...p, quickChips: p.quickChips.filter((_, idx) => idx !== i) }));

  const systemPromptPreview = buildSystemPrompt(config);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,500;0,700;0,900;1,300;1,500&family=Instrument+Sans:wght@400;500;600&display=swap');

        :root {
          --bg: #0e0b08;
          --surface: #141009;
          --surface2: #1c160e;
          --border: rgba(255,200,100,.08);
          --border2: rgba(255,200,100,.14);
          --amber: #f5a623;
          --amber-dim: rgba(245,166,35,.12);
          --amber-glow: rgba(245,166,35,.06);
          --red: #e05c2a;
          --text: #f0e6d3;
          --text2: #9a8672;
          --text3: #5a4e42;
          --green: #5ec989;
        }

        *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
        body { background:var(--bg); font-family:'Instrument Sans',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }

        .app { width:100%; max-width:760px; height:100vh; display:flex; flex-direction:column; background:var(--surface); position:relative; overflow:hidden; }

        /* Grain */
        .app::after { content:''; position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:50; }

        /* Ambient lights */
        .amb1 { position:absolute; top:-140px; left:-80px; width:420px; height:420px; background:radial-gradient(circle, rgba(245,166,35,.07) 0%, transparent 65%); pointer-events:none; z-index:0; }
        .amb2 { position:absolute; bottom:0; right:-100px; width:350px; height:350px; background:radial-gradient(circle, rgba(224,92,42,.05) 0%, transparent 65%); pointer-events:none; z-index:0; }

        /* ── HEADER ── */
        .hdr { padding:14px 22px; border-bottom:1px solid var(--border); z-index:10; position:relative; display:flex; align-items:center; gap:14px; background:rgba(14,11,8,.85); backdrop-filter:blur(24px); }
        .logo { width:40px; height:40px; background:linear-gradient(135deg, var(--amber), var(--red)); border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:19px; box-shadow:0 4px 20px rgba(245,166,35,.22); flex-shrink:0; }
        .hdr-text { flex:1; }
        .hdr-title { font-family:'Fraunces',serif; font-size:15.5px; font-weight:700; color:var(--text); letter-spacing:-.2px; }
        .hdr-sub { font-size:11px; color:var(--text3); margin-top:1px; font-style:italic; }
        .config-btn { display:flex; align-items:center; gap:6px; padding:7px 13px; background:var(--amber-dim); border:1px solid var(--border2); border-radius:9px; color:var(--amber); font-size:11.5px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'Instrument Sans',sans-serif; }
        .config-btn:hover { background:rgba(245,166,35,.2); }
        .live-dot { width:7px; height:7px; background:var(--green); border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* ── CONTEXT BAR ── */
        .ctx-bar { padding:8px 22px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; flex-wrap:wrap; z-index:5; position:relative; background:rgba(20,16,9,.7); }
        .ctx-pill { padding:4px 10px; border-radius:20px; font-size:10.5px; font-weight:600; border:1px solid; display:flex; align-items:center; gap:4px; }
        .ctx-pill.amber { color:var(--amber); border-color:rgba(245,166,35,.25); background:var(--amber-glow); }
        .ctx-pill.red { color:#e07a5a; border-color:rgba(224,122,90,.25); background:rgba(224,122,90,.06); }
        .ctx-pill.green { color:var(--green); border-color:rgba(94,201,137,.25); background:rgba(94,201,137,.06); }
        .ctx-pill.blue { color:#7eb8e8; border-color:rgba(126,184,232,.25); background:rgba(126,184,232,.06); }
        .saved-toast { margin-left:auto; padding:4px 10px; border-radius:20px; font-size:10.5px; font-weight:600; color:var(--green); border:1px solid rgba(94,201,137,.25); background:rgba(94,201,137,.06); animation:fadeIn .3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

        /* ── MESSAGES ── */
        .msgs { flex:1; overflow-y:auto; padding:20px 20px 10px; display:flex; flex-direction:column; gap:18px; scrollbar-width:thin; scrollbar-color:var(--border2) transparent; position:relative; z-index:1; }
        .msgs::-webkit-scrollbar { width:3px; }
        .msgs::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

        /* Empty state */
        .empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px; }
        .empty-icon { font-size:52px; filter:drop-shadow(0 0 24px rgba(245,166,35,.3)); animation:float 4s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        .empty h2 { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:var(--text); line-height:1.25; font-style:italic; }
        .empty p { font-size:12.5px; color:var(--text2); line-height:1.65; max-width:280px; }
        .empty-tags { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .e-tag { padding:6px 12px; background:var(--surface2); border:1px solid var(--border2); border-radius:8px; font-size:11.5px; color:var(--text2); }
        .e-tag span { color:var(--amber); font-weight:600; }

        /* Messages */
        .msg-row { display:flex; gap:10px; animation:slideUp .3s ease forwards; opacity:0; }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .msg-row.user { flex-direction:row-reverse; }
        .av { width:33px; height:33px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; margin-top:3px; }
        .av.bot { background:linear-gradient(135deg,var(--amber),var(--red)); box-shadow:0 2px 12px rgba(245,166,35,.25); }
        .av.user { background:var(--surface2); border:1px solid var(--border2); }
        .mc { max-width:86%; display:flex; flex-direction:column; gap:7px; }

        .b-user { padding:11px 15px; background:linear-gradient(135deg, rgba(245,166,35,.16), rgba(224,92,42,.12)); border:1px solid rgba(245,166,35,.22); border-radius:14px 3px 14px 14px; font-size:13px; color:var(--text); line-height:1.6; font-weight:500; text-align:right; }

        .b-bot { padding:15px 17px; background:var(--surface2); border:1px solid var(--border); border-radius:3px 14px 14px 14px; font-size:12.5px; color:rgba(240,230,211,.78); line-height:1.9; font-family:'Instrument Sans',sans-serif; letter-spacing:.01em; }

        .btn-row { display:flex; gap:6px; flex-wrap:wrap; }
        .abtn { display:flex; align-items:center; gap:5px; padding:6px 12px; border:1px solid rgba(255,255,255,.09); border-radius:7px; font-size:10.5px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'Instrument Sans',sans-serif; background:rgba(255,255,255,.04); color:var(--text3); letter-spacing:.02em; }
        .abtn:hover { background:var(--amber-dim); border-color:var(--border2); color:var(--amber); }
        .abtn.copied { background:rgba(94,201,137,.08); border-color:rgba(94,201,137,.25); color:var(--green); }
        .abtn.sz { background:var(--amber-glow); border-color:var(--border2); color:var(--amber); cursor:default; pointer-events:none; }

        /* Typing */
        .typing-row { display:flex; gap:10px; }
        .typing-b { padding:13px 16px; background:var(--surface2); border:1px solid var(--border); border-radius:3px 14px 14px 14px; display:flex; align-items:center; gap:5px; }
        .da { width:6px; height:6px; background:rgba(245,166,35,.6); border-radius:50%; animation:db 1.2s ease infinite; }
        .da:nth-child(2){animation-delay:.18s} .da:nth-child(3){animation-delay:.36s}
        @keyframes db { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-6px);opacity:1} }

        /* ── CHIPS ── */
        .chips-wrap { padding:8px 20px 6px; border-top:1px solid var(--border); z-index:5; position:relative; background:rgba(14,11,8,.6); }
        .cl { font-size:9px; color:var(--text3); font-weight:600; letter-spacing:1.2px; text-transform:uppercase; margin-bottom:7px; }
        .chips { display:flex; gap:6px; flex-wrap:wrap; }
        .chip { padding:5px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:18px; font-size:11px; color:var(--text2); cursor:pointer; transition:all .18s; white-space:nowrap; }
        .chip:hover { background:var(--amber-dim); border-color:var(--border2); color:var(--amber); transform:translateY(-1px); }

        /* ── INPUT ── */
        .inp-zone { padding:10px 20px 16px; border-top:1px solid var(--border); z-index:10; position:relative; background:rgba(14,11,8,.92); backdrop-filter:blur(20px); }
        .inp-row { display:flex; gap:9px; align-items:center; }
        .inp-box { flex:1; background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:12px 16px; display:flex; align-items:center; transition:all .2s; }
        .inp-box:focus-within { border-color:rgba(245,166,35,.4); box-shadow:0 0 0 3px rgba(245,166,35,.06); }
        .inp-box input { flex:1; background:none; border:none; outline:none; color:var(--text); font-family:'Instrument Sans',sans-serif; font-size:13px; }
        .inp-box input::placeholder { color:var(--text3); font-style:italic; }
        .send { width:43px; height:43px; background:linear-gradient(135deg,var(--amber),var(--red)); border:none; border-radius:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px; box-shadow:0 4px 16px rgba(245,166,35,.28); transition:all .18s; flex-shrink:0; }
        .send:hover:not(:disabled) { transform:scale(1.07); box-shadow:0 6px 24px rgba(245,166,35,.38); }
        .send:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
        .hint { font-size:10px; color:var(--text3); margin-top:6px; text-align:center; letter-spacing:.02em; font-style:italic; }

        /* ══════════════════════════════════════════════
           CONFIG PANEL (Gem-style)
        ══════════════════════════════════════════════ */
        .panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:100; backdrop-filter:blur(6px); animation:fadeIn .2s ease; }
        .panel { position:fixed; top:0; right:0; bottom:0; width:min(500px,100vw); background:#130f0a; border-left:1px solid var(--border2); z-index:101; display:flex; flex-direction:column; animation:slideIn .3s ease; overflow:hidden; }
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

        .panel-hdr { padding:18px 22px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; flex-shrink:0; }
        .panel-icon { width:36px; height:36px; background:linear-gradient(135deg,var(--amber),var(--red)); border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .panel-title { font-family:'Fraunces',serif; font-size:16px; font-weight:700; color:var(--text); flex:1; }
        .panel-sub { font-size:11px; color:var(--text3); margin-top:1px; font-style:italic; }
        .close-btn { width:32px; height:32px; background:var(--surface2); border:1px solid var(--border); border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--text2); transition:all .2s; }
        .close-btn:hover { background:rgba(255,255,255,.08); color:var(--text); }

        .panel-body { flex:1; overflow-y:auto; padding:18px 22px; display:flex; flex-direction:column; gap:20px; scrollbar-width:thin; scrollbar-color:var(--border2) transparent; }
        .panel-body::-webkit-scrollbar{width:3px}
        .panel-body::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

        .field-group { display:flex; flex-direction:column; gap:8px; }
        .field-label { font-size:10px; font-weight:600; color:var(--text3); letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:6px; }
        .field-label .lbadge { padding:2px 7px; background:var(--amber-glow); border:1px solid var(--border2); border-radius:4px; color:var(--amber); font-size:9px; text-transform:none; letter-spacing:0; }
        .field-input { background:var(--surface2); border:1px solid var(--border); border-radius:9px; padding:10px 13px; color:var(--text); font-family:'Instrument Sans',sans-serif; font-size:13px; outline:none; transition:all .2s; width:100%; }
        .field-input:focus { border-color:rgba(245,166,35,.4); box-shadow:0 0 0 3px rgba(245,166,35,.06); }
        .field-input::placeholder { color:var(--text3); font-style:italic; }
        textarea.field-input { min-height:88px; resize:vertical; line-height:1.6; }

        .select-input { background:var(--surface2); border:1px solid var(--border); border-radius:9px; padding:10px 13px; color:var(--text); font-family:'Instrument Sans',sans-serif; font-size:13px; outline:none; width:100%; cursor:pointer; transition:all .2s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235a4e42' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 13px center; padding-right:36px; }
        .select-input:focus { border-color:rgba(245,166,35,.4); }
        .select-input option { background:#1c160e; }

        .row2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        /* Size presets */
        .size-presets { display:flex; flex-wrap:wrap; gap:6px; }
        .size-btn { padding:6px 11px; background:var(--surface2); border:1px solid var(--border); border-radius:7px; font-size:11px; font-weight:600; color:var(--text2); cursor:pointer; transition:all .2s; font-family:'Instrument Sans',sans-serif; }
        .size-btn:hover { border-color:var(--border2); color:var(--amber); }
        .size-btn.active { background:var(--amber-dim); border-color:var(--border2); color:var(--amber); }

        /* Chips editor */
        .chip-list { display:flex; flex-wrap:wrap; gap:6px; }
        .chip-edit { display:flex; align-items:center; gap:5px; padding:5px 10px; background:var(--surface2); border:1px solid var(--border); border-radius:16px; font-size:11px; color:var(--text2); }
        .chip-del { width:16px; height:16px; border-radius:50%; background:rgba(255,255,255,.06); border:none; cursor:pointer; color:var(--text3); display:flex; align-items:center; justify-content:center; font-size:10px; transition:all .2s; }
        .chip-del:hover { background:rgba(239,68,68,.18); color:#f87171; }
        .chip-add-row { display:flex; gap:7px; }
        .chip-add-input { flex:1; background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:8px 12px; color:var(--text); font-family:'Instrument Sans',sans-serif; font-size:12px; outline:none; }
        .chip-add-input:focus { border-color:rgba(245,166,35,.4); }
        .chip-add-btn { padding:8px 14px; background:var(--amber-dim); border:1px solid var(--border2); border-radius:8px; color:var(--amber); font-family:'Instrument Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap; }
        .chip-add-btn:hover { background:rgba(245,166,35,.2); }

        /* Divider */
        .divider { height:1px; background:var(--border); margin:0 -22px; }

        /* Preview box */
        .preview-box { background:rgba(0,0,0,.3); border:1px solid var(--border); border-radius:9px; padding:12px 14px; font-size:11px; color:var(--text2); line-height:1.7; font-style:italic; max-height:100px; overflow:hidden; position:relative; }
        .preview-box::after { content:''; position:absolute; bottom:0; left:0; right:0; height:30px; background:linear-gradient(transparent, rgba(19,15,10,.9)); }
        .preview-label { font-size:9.5px; font-weight:600; color:var(--text3); letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }

        /* Panel footer */
        .panel-footer { padding:14px 22px; border-top:1px solid var(--border); display:flex; gap:10px; flex-shrink:0; background:#130f0a; }
        .cancel-btn { flex:1; padding:12px; background:var(--surface2); border:1px solid var(--border); border-radius:10px; color:var(--text2); font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
        .cancel-btn:hover { border-color:var(--border2); color:var(--text); }
        .save-btn { flex:2; padding:12px; background:linear-gradient(135deg,var(--amber),var(--red)); border:none; border-radius:10px; color:#fff; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; box-shadow:0 4px 18px rgba(245,166,35,.28); }
        .save-btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(245,166,35,.38); }

        /* Reset note */
        .reset-note { font-size:10.5px; color:var(--text3); text-align:center; font-style:italic; }
      `}</style>

      <div className="app">
        <div className="amb1"/><div className="amb2"/>

        {/* HEADER */}
        <div className="hdr">
          <div className="logo">🍛</div>
          <div className="hdr-text">
            <div className="hdr-title">{config.botName}</div>
            <div className="hdr-sub">Dish likho → {config.platform}-ready prompt</div>
          </div>
          <div className="live-dot" style={{marginRight:4}}/>
          <button className="config-btn" onClick={openConfig}>⚙ Configure</button>
        </div>

        {/* CONTEXT BAR */}
        <div className="ctx-bar">
          <div className="ctx-pill amber">📐 {config.imageSize}</div>
          <div className="ctx-pill red">🍽 {config.cuisineStyle}</div>
          <div className="ctx-pill blue">📱 {config.platform}</div>
          {config.extraInstructions && <div className="ctx-pill green">✎ Custom instructions</div>}
          {saved && <div className="saved-toast">✓ Config saved! Chat reset.</div>}
        </div>

        {/* MESSAGES */}
        <div className="msgs">
          {messages.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📸</div>
              <h2>Dish ka naam ya<br/>description type karo</h2>
              <p>Ultra-detailed food photography prompt generate hoga — {config.platform} listing ke liye ready</p>
              <div className="empty-tags">
                <div className="e-tag">📐 <span>{config.imageSize} px</span></div>
                <div className="e-tag">🍽 <span>{config.cuisineStyle}</span></div>
                <div className="e-tag">📱 <span>{config.platform}</span></div>
              </div>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className={`av ${msg.role === "assistant" ? "bot" : "user"}`}>
                {msg.role === "assistant" ? "🍛" : "👤"}
              </div>
              <div className="mc">
                {msg.role === "user" ? (
                  <div className="b-user">{msg.content}</div>
                ) : <>
                  <div className="b-bot">{msg.content}</div>
                  <div className="btn-row">
                    <button className={`abtn ${copiedIdx === i ? "copied" : ""}`}
                      onClick={() => handleCopy(msg.content, i)}>
                      {copiedIdx === i ? "✓ Copied!" : "⎘ Copy Prompt"}
                    </button>
                    <span className="abtn sz">📐 {config.imageSize}</span>
                  </div>
                </>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="typing-row">
              <div className="av bot">🍛</div>
              <div className="typing-b"><div className="da"/><div className="da"/><div className="da"/></div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* CHIPS */}
        <div className="chips-wrap">
          <div className="cl">Quick Try</div>
          <div className="chips">
            {config.quickChips.map(item => (
              <button key={item} className="chip"
                onClick={() => { setInput(item); inputRef.current?.focus(); }}>{item}</button>
            ))}
          </div>
        </div>

        {/* INPUT */}
        <div className="inp-zone">
          <div className="inp-row">
            <div className="inp-box">
              <input ref={inputRef} type="text"
                placeholder="e.g. Paneer Makhani + Garlic Naan + Gulab Jamun..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
            </div>
            <button className="send" onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
          </div>
          <div className="hint">Enter dabao ya ↑ click karo · AI-powered prompt generation</div>
        </div>
      </div>

      {/* ══ CONFIG PANEL ══ */}
      {panel === "config" && <>
        <div className="panel-overlay" onClick={() => setPanel(null)}/>
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-icon">⚙</div>
            <div>
              <div className="panel-title">Configure Bot</div>
              <div className="panel-sub">Gemini Gem jaise — apne hisaab se customize karo</div>
            </div>
            <button className="close-btn" onClick={() => setPanel(null)}>✕</button>
          </div>

          <div className="panel-body">

            {/* Bot Name */}
            <div className="field-group">
              <div className="field-label">Bot Name</div>
              <input className="field-input" value={draft.botName}
                onChange={e => updateDraft("botName", e.target.value)}
                placeholder="e.g. DingDing Food Prompt Bot"/>
            </div>

            <div className="row2">
              {/* Platform */}
              <div className="field-group">
                <div className="field-label">Platform</div>
                <select className="select-input" value={draft.platform}
                  onChange={e => updateDraft("platform", e.target.value)}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {/* Cuisine */}
              <div className="field-group">
                <div className="field-label">Cuisine Style</div>
                <select className="select-input" value={draft.cuisineStyle}
                  onChange={e => updateDraft("cuisineStyle", e.target.value)}>
                  {CUISINES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Image Size */}
            <div className="field-group">
              <div className="field-label">Image Size <span className="lbadge">Prompt mein automatically add hoga</span></div>
              <div className="size-presets">
                {SIZE_PRESETS.map(p => (
                  <button key={p.value}
                    className={`size-btn ${draft.imageSizePreset === p.value ? "active" : ""}`}
                    onClick={() => {
                      updateDraft("imageSizePreset", p.value);
                      if (p.value !== "custom") updateDraft("imageSize", p.size);
                    }}>
                    {p.label}{p.size ? ` (${p.size})` : ""}
                  </button>
                ))}
              </div>
              {draft.imageSizePreset === "custom" && (
                <input className="field-input" style={{marginTop:8}}
                  value={draft.imageSize}
                  onChange={e => updateDraft("imageSize", e.target.value)}
                  placeholder="e.g. 800×600"/>
              )}
            </div>

            <div className="divider"/>

            {/* Mandatory Items */}
            <div className="field-group">
              <div className="field-label">Mandatory Elements <span className="lbadge">Har prompt mein</span></div>
              <textarea className="field-input" value={draft.mandatoryItems}
                onChange={e => updateDraft("mandatoryItems", e.target.value)}
                placeholder="e.g. Matte-black bowls, 4 Chapati, left window light..."/>
            </div>

            {/* Extra Instructions */}
            <div className="field-group">
              <div className="field-label">Extra Instructions <span className="lbadge">Optional</span></div>
              <textarea className="field-input" value={draft.extraInstructions}
                onChange={e => updateDraft("extraInstructions", e.target.value)}
                placeholder="e.g. Always mention DingDing Daily branding style, use earthy tones, mention eco-friendly packaging..."/>
            </div>

            <div className="divider"/>

            {/* Quick Chips */}
            <div className="field-group">
              <div className="field-label">Quick Try Chips</div>
              <div className="chip-list">
                {draft.quickChips.map((c, i) => (
                  <div key={i} className="chip-edit">
                    {c}
                    <button className="chip-del" onClick={() => removeChip(i)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="chip-add-row">
                <input className="chip-add-input" placeholder="New chip add karo..."
                  value={chipInput}
                  onChange={e => setChipInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addChip()}/>
                <button className="chip-add-btn" onClick={addChip}>+ Add</button>
              </div>
            </div>

            <div className="divider"/>

            {/* Preview */}
            <div className="field-group">
              <div className="preview-label">System Prompt Preview</div>
              <div className="preview-box">{buildSystemPrompt(draft)}</div>
            </div>

            <div className="reset-note">Save karne par current chat reset ho jaayegi</div>
          </div>

          <div className="panel-footer">
            <button className="cancel-btn" onClick={() => setPanel(null)}>Cancel</button>
            <button className="save-btn" onClick={saveConfig}>✓ Save & Apply</button>
          </div>
        </div>
      </>}
    </>
  );
}
