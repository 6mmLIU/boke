/* global React */

// ─────────────────────────────────────────────────────────
// Shared sample data — so every page looks cohesive
// ─────────────────────────────────────────────────────────

const ARTICLES = [
  {
    id: 'a1',
    title: '在喧嚣中保留一方砚台',
    titleEn: 'Keeping an Inkwell in the Noise',
    excerpt: '当整个互联网都在抢夺你的注意力,慢写作成了一种抵抗。不为流量,只为把一个想法讲清楚 —— 这是一种温柔的倔强。',
    cover: 'warm',
    author: { name: '沈既白', handle: 'shenjibai', avatar: '沈' },
    tags: ['写作', '慢生活'],
    readTime: 8,
    views: 12483,
    likes: 894,
    comments: 62,
    date: '2026 · 04 · 12',
  },
  {
    id: 'a2',
    title: '我把博客搬离了平台',
    titleEn: 'I Moved My Blog Off the Platform',
    excerpt: '三年、十七万字、一次迁移。为什么我选择自建,又为什么最后还是回到了 RSS。',
    cover: 'moss',
    author: { name: '林知夏', handle: 'linzhixia', avatar: '林' },
    tags: ['独立博客', 'RSS'],
    readTime: 12,
    views: 9821,
    likes: 721,
    comments: 48,
    date: '2026 · 04 · 09',
  },
  {
    id: 'a3',
    title: '设计师如何阅读一张旧照片',
    titleEn: 'How a Designer Reads an Old Photograph',
    excerpt: '一张照片里藏着三层时间:拍摄的那一刻、冲洗出来的那一刻、被重新看到的这一刻。',
    cover: 'indigo',
    author: { name: '苏砚秋', handle: 'suyanqiu', avatar: '苏' },
    tags: ['设计', '摄影'],
    readTime: 6,
    views: 7340,
    likes: 512,
    comments: 29,
    date: '2026 · 04 · 06',
  },
  {
    id: 'a4',
    title: '关于专注,我最近改变的三个习惯',
    titleEn: 'Three Habits I Changed About Focus',
    excerpt: '不是番茄钟,不是屏蔽软件。是更底层的一些东西 —— 重新学会等待。',
    cover: 'cream',
    author: { name: '周砚之', handle: 'zhouyanzhi', avatar: '周' },
    tags: ['专注', '习惯'],
    readTime: 9,
    views: 15230,
    likes: 1104,
    comments: 87,
    date: '2026 · 04 · 03',
  },
  {
    id: 'a5',
    title: '程序员的书房,放什么书',
    titleEn: 'What Books Belong in a Programmer\'s Study',
    excerpt: '十年前我的书架上全是技术书。现在一半是文学。这件事本身就是一种注解。',
    cover: 'warm',
    author: { name: '陈墨言', handle: 'chenmoyan', avatar: '陈' },
    tags: ['阅读', '书架'],
    readTime: 7,
    views: 6890,
    likes: 478,
    comments: 34,
    date: '2026 · 03 · 30',
  },
  {
    id: 'a6',
    title: '一杯好茶的七个变量',
    titleEn: 'Seven Variables of a Good Cup of Tea',
    excerpt: '水温、投茶量、器皿、水质、时间 —— 还有两个变量你可能没想到。',
    cover: 'moss',
    author: { name: '叶竹', handle: 'yezhu', avatar: '叶' },
    tags: ['茶', '仪式'],
    readTime: 5,
    views: 4320,
    likes: 289,
    comments: 18,
    date: '2026 · 03 · 28',
  },
];

const AUTHORS = [
  { name: '沈既白', handle: 'shenjibai', avatar: '沈', articles: 42, followers: 8920, likes: 23104 },
  { name: '周砚之', handle: 'zhouyanzhi', avatar: '周', articles: 67, followers: 12840, likes: 38920 },
  { name: '林知夏', handle: 'linzhixia', avatar: '林', articles: 28, followers: 5412, likes: 14200 },
  { name: '苏砚秋', handle: 'suyanqiu', avatar: '苏', articles: 31, followers: 4830, likes: 11960 },
  { name: '陈墨言', handle: 'chenmoyan', avatar: '陈', articles: 54, followers: 9210, likes: 19840 },
];

const COMMENTS = [
  { id: 'c1', author: '周砚之', avatar: '周', handle: 'zhouyanzhi', time: '2 小时前', likes: 24, text: '“不为流量,只为把一个想法讲清楚” —— 这句话我想抄下来贴在我工位上。共鸣了。' },
  { id: 'c2', author: '林知夏', avatar: '林', handle: 'linzhixia', time: '5 小时前', likes: 12, text: '慢写作是真的难,尤其在发出去之后没什么反馈的时候。但我依然觉得值得。' },
  { id: 'c3', author: '陈墨言', avatar: '陈', handle: 'chenmoyan', time: '昨天', likes: 8, text: '好奇作者平时用什么编辑器?最近在找一个能支持双向链接又不太重的工具。' },
  { id: 'c4', author: '叶竹', avatar: '叶', handle: 'yezhu', time: '昨天', likes: 5, text: '关于“温柔的倔强”那段,读了三遍。' },
];

// ─────────────────────────────────────────────────────────
// Icons — simple strokey SVG set
// ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, style = {} }) => {
  const paths = {
    home: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V10z" />,
    feather: <><path d="M20 4c-5 1-9 4-11 9l-4 4 1 1h5l7-7c2-2 3-5 2-7z"/><path d="M5 19l4-4" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M6 5H4a2 2 0 0 0 0 4h2"/><path d="M18 5h2a2 2 0 0 1 0 4h-2"/><path d="M9 14h6l-1 4H10l-1-4z"/><path d="M8 18h8"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>,
    chat: <path d="M4 5h16v10H8l-4 4V5z"/>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3z"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    arrow: <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    arrowUp: <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>,
    check: <path d="M4 12l5 5L20 6"/>,
    moon: <path d="M20 15A8 8 0 1 1 9 4a6 6 0 0 0 11 11z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    bold: <><path d="M6 4h7a4 4 0 0 1 0 8H6V4z"/><path d="M6 12h8a4 4 0 0 1 0 8H6v-8z"/></>,
    italic: <><path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4l-6 16"/></>,
    link: <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></>,
    code: <><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></>,
    quote: <><path d="M7 7h4v6H5v-3c0-2 1-3 2-3zM15 7h4v6h-6v-3c0-2 1-3 2-3z"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
    more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    edit: <><path d="M11 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L13 14l-4 1 1-4 8.5-8.5z"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/></>,
    doc: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    fire: <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3 0 2 1 3 2 3 0-3-1-5-1-8 1 0 2 0 2 0zM8 15c0 3 2 5 4 5s4-2 4-5"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {paths[name]}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────
const Avatar = ({ char, size = 36, accent = false }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: accent ? 'var(--accent-wash)' : 'var(--paper-3)',
    color: accent ? 'var(--accent-deep)' : 'var(--ink-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--serif)', fontSize: size * 0.42, fontWeight: 500,
    flexShrink: 0,
    border: '1px solid var(--border)',
  }}>{char}</div>
);

// ─────────────────────────────────────────────────────────
// Cover illustration — striped/washed abstract
// ─────────────────────────────────────────────────────────
const Cover = ({ variant = 'warm', height = 160, children, rounded = true }) => {
  const palettes = {
    warm:   ['#E8B89E', '#C5704A', '#9E5636'],
    moss:   ['#BFCCB3', '#6F8560', '#4E6343'],
    indigo: ['#A9BCCE', '#4A6A8A', '#2F4A66'],
    cream:  ['#E8E1D4', '#D9D0BE', '#A89A82'],
  };
  const [a, b, c] = palettes[variant] || palettes.warm;
  return (
    <div style={{
      height, width: '100%', position: 'relative', overflow: 'hidden',
      borderRadius: rounded ? 'var(--r-lg) var(--r-lg) 0 0' : 0,
      background: `linear-gradient(135deg, ${a} 0%, ${b} 65%, ${c} 100%)`,
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3, mixBlendMode: 'soft-light' }}>
        <defs>
          <pattern id={`stripe-${variant}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="3" stroke="#fff" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#stripe-${variant})`}/>
      </svg>
      <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="320" cy="40" r="60" fill="#fff" opacity="0.12"/>
        <circle cx="60" cy="180" r="90" fill="#000" opacity="0.08"/>
      </svg>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Top nav — used on every public page
// ─────────────────────────────────────────────────────────
const TopNav = ({ active, onNav, user }) => {
  const u = user || (window.Auth && window.Auth.user) || null;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const initial = u && u.name ? u.name[0] : '游';
  return (
  <nav style={{
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(247, 243, 237, 0.82)',
    backdropFilter: 'blur(16px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
    borderBottom: '1px solid var(--border)',
  }}>
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '16px 48px',
      display: 'flex', alignItems: 'center', gap: 40,
    }}>
      <a href="#home" onClick={e=>{e.preventDefault(); onNav && onNav('home');}} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500,
        color: 'var(--ink)',
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 17,
        }}>砚</span>
        <span>Inkwell</span>
      </a>
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        {[
          { k: 'home', l: '首页', le: 'Feed' },
          { k: 'ranking', l: '排行榜', le: 'Rankings' },
          { k: 'profile', l: '书房', le: 'Study' },
        ].map(item => (
          <a key={item.k} href={'#'+item.k}
            onClick={e=>{e.preventDefault(); onNav && onNav(item.k);}}
            style={{
              padding: '8px 14px',
              fontSize: 14,
              color: active === item.k ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: active === item.k ? 500 : 400,
              borderRadius: 'var(--r-pill)',
              background: active === item.k ? 'var(--paper-2)' : 'transparent',
              transition: 'all var(--d-fast) var(--ease-out)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {item.l}
            <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{item.le}</span>
          </a>
        ))}
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: 'var(--paper-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-pill)',
        color: 'var(--ink-4)',
        fontSize: 13,
        width: 220,
      }}>
        <Icon name="search" size={15}/>
        <span>搜索文章、作者…</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11,
          padding: '2px 6px',
          border: '1px solid var(--border)',
          borderRadius: 4, fontFamily: 'var(--mono)',
        }}>⌘K</span>
      </div>
      {u ? (
        <a href="#admin-editor" onClick={e=>{e.preventDefault(); onNav && onNav('admin-editor', null);}}
          className="btn btn-ghost" style={{ fontSize: 13 }}>
          <Icon name="feather" size={15}/>
          写作
        </a>
      ) : (
        <a href="#auth" onClick={e=>{e.preventDefault(); onNav && onNav('auth');}}
          className="btn btn-ghost" style={{ fontSize: 13 }}>
          登录
        </a>
      )}
      <div style={{ position: 'relative' }}>
        <div onClick={()=>{ if (u) setMenuOpen(v=>!v); else onNav && onNav('auth'); }} style={{ cursor: 'pointer' }}>
          <Avatar char={initial} size={34} accent={!!u}/>
        </div>
        {menuOpen && u && (
          <>
            <div onClick={()=>setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }}/>
            <div style={{
              position: 'absolute', right: 0, top: 44, zIndex: 70,
              minWidth: 220,
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>@{u.handle}</div>
              </div>
              <button onClick={()=>{setMenuOpen(false); onNav && onNav('profile');}} style={menuItemStyle}>个人书房</button>
              <button onClick={()=>{setMenuOpen(false); onNav && onNav('admin');}} style={menuItemStyle}>后台 · Studio</button>
              <button onClick={()=>{setMenuOpen(false); onNav && onNav('admin-editor', null);}} style={menuItemStyle}>写新文章</button>
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }}/>
              <button onClick={()=>{
                setMenuOpen(false);
                window.Auth && window.Auth.logout();
                onNav && onNav('auth');
              }} style={{...menuItemStyle, color: 'var(--danger)'}}>登出</button>
            </div>
          </>
        )}
      </div>
    </div>
  </nav>
  );
};

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 12px',
  background: 'transparent', border: 'none',
  fontFamily: 'inherit', fontSize: 13, color: 'var(--ink-2)',
  cursor: 'pointer', borderRadius: 6,
};

// ─────────────────────────────────────────────────────────
// Page transition wrapper
// ─────────────────────────────────────────────────────────
const PageTransition = ({ pageKey, children }) => {
  const [visibleKey, setVisibleKey] = React.useState(pageKey);
  const [phase, setPhase] = React.useState('in'); // 'in' | 'out'
  React.useEffect(() => {
    if (pageKey === visibleKey) return;
    setPhase('out');
    const t = setTimeout(() => {
      setVisibleKey(pageKey);
      setPhase('in');
    }, 240);
    return () => clearTimeout(t);
  }, [pageKey]);
  return (
    <div style={{
      opacity: phase === 'in' ? 1 : 0,
      transform: phase === 'in' ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 360ms var(--ease-out), transform 360ms var(--ease-out)',
    }}>
      {React.cloneElement(children, { pageKey: visibleKey })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Tweaks panel — elegant icon toolbar, animated entrance,
// theme-aware, with animated pill indicator per group.
// ─────────────────────────────────────────────────────────
const TweaksPanel = ({ state, set, visible, onClose }) => {
  const [mounted, setMounted] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setLeaving(false);
      requestAnimationFrame(() => setMounted(true));
    } else if (mounted) {
      setLeaving(true);
      const t = setTimeout(() => { setMounted(false); setLeaving(false); }, 280);
      return () => clearTimeout(t);
    }
  }, [visible]);
  if (!visible && !mounted) return null;

  const show = mounted && !leaving;

  // A group is a segmented control of icon-buttons
  // options: [{ key, label, icon, swatch }]
  const Group = ({ label, subtitle, options, value, onChange }) => {
    const idx = Math.max(0, options.findIndex(o => o.key === value));
    const pct = 100 / options.length;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8,
          paddingLeft: 2,
        }}>
          <span style={{
            fontSize: 11, color: 'var(--ink-4)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontWeight: 500,
          }}>{label}</span>
          {subtitle && (
            <span style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic',
              fontSize: 11, color: 'var(--ink-5)',
            }}>{subtitle}</span>
          )}
        </div>
        <div style={{
          position: 'relative',
          display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          background: 'var(--paper-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-pill)',
          padding: 4,
          gap: 0,
        }}>
          {/* Sliding indicator */}
          <div style={{
            position: 'absolute', top: 4, bottom: 4,
            left: `calc(4px + ${idx * pct}% - ${idx * 8 / options.length}px)`,
            width: `calc(${pct}% - 8px / ${options.length})`,
            background: 'var(--surface)',
            borderRadius: 'var(--r-pill)',
            boxShadow: '0 1px 2px rgba(74,66,58,0.08), 0 2px 6px rgba(74,66,58,0.06)',
            transition: 'left 380ms var(--ease-spring)',
          }}/>
          {options.map(o => {
            const active = o.key === value;
            return (
              <button key={o.key} onClick={()=>onChange(o.key)}
                title={o.label}
                style={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '7px 8px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: active ? 'var(--ink)' : 'var(--ink-4)',
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  transition: 'color 200ms var(--ease-out)',
                  minHeight: 26,
                }}>
                {o.swatch && (
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: o.swatch,
                    boxShadow: active
                      ? `0 0 0 2px var(--surface), 0 0 0 3px ${o.swatch}`
                      : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 240ms var(--ease-out)',
                  }}/>
                )}
                {o.icon && (
                  <span style={{
                    display: 'inline-flex',
                    transition: 'transform 320ms var(--ease-spring)',
                    transform: active ? 'scale(1.08)' : 'scale(1)',
                  }}>
                    {o.icon}
                  </span>
                )}
                <span style={{ whiteSpace: 'nowrap' }}>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Little inline SVG icons for the groups
  const I = {
    sun:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
    moon:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 15A8 8 0 1 1 9 4a6 6 0 0 0 11 11z"/></svg>,
    serif:  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fontWeight="500">A</text></svg>,
    sans:   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="600">A</text></svg>,
    loose:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="13" width="18" height="5" rx="1"/></svg>,
    compact:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="9" width="18" height="3" rx="1"/><rect x="3" y="14" width="18" height="3" rx="1"/></svg>,
    solid:  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>,
    paper:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M5 7h14M5 11h14M5 15h14M5 19h14" opacity=".5"/></svg>,
  };

  return (
    <div
      style={{
        position: 'fixed', top: 88, right: 24, zIndex: 100,
        width: 320,
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(42, 38, 34, 0.14), 0 2px 8px rgba(42, 38, 34, 0.06)',
        padding: '18px 18px 14px',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
        transformOrigin: '90% 0%',
        transition: 'opacity 280ms var(--ease-out), transform 320ms var(--ease-spring)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
      }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingBottom: 12, marginBottom: 14,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--accent-wash)',
          color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500,
            color: 'var(--ink)', lineHeight: 1.2,
          }}>书斋调校</div>
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 11, color: 'var(--ink-4)',
          }}>Tweak your study</div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, padding: 0,
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer',
          color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--d-fast) var(--ease-out)',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--paper-2)'; e.currentTarget.style.color='var(--ink)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink-3)';}}>
          <Icon name="x" size={13}/>
        </button>
      </div>

      <Group label="模式" subtitle="Mode" value={state.theme} onChange={v=>set({theme:v})}
        options={[
          { key: 'light', label: '白昼', icon: I.sun },
          { key: 'dark',  label: '夜读', icon: I.moon },
        ]}/>
      <Group label="字体" subtitle="Typeface" value={state.font} onChange={v=>set({font:v})}
        options={[
          { key: 'serif', label: '衬线', icon: I.serif },
          { key: 'sans',  label: '无衬', icon: I.sans },
        ]}/>
      <Group label="主色" subtitle="Accent" value={state.accent} onChange={v=>set({accent:v})}
        options={[
          { key: 'terracotta', label: '赤陶', swatch: '#C5704A' },
          { key: 'moss',       label: '墨绿', swatch: '#6F8560' },
          { key: 'indigo',     label: '藏青', swatch: '#4A6A8A' },
        ]}/>
      <Group label="密度" subtitle="Density" value={state.density} onChange={v=>set({density:v})}
        options={[
          { key: 'loose',   label: '疏朗', icon: I.loose },
          { key: 'compact', label: '紧凑', icon: I.compact },
        ]}/>
      <Group label="纹理" subtitle="Texture" value={state.texture} onChange={v=>set({texture:v})}
        options={[
          { key: 'solid', label: '纯色', icon: I.solid },
          { key: 'paper', label: '纸质', icon: I.paper },
        ]}/>

      <div style={{
        marginTop: 4, paddingTop: 10, borderTop: '1px dashed var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--ink-4)',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: 'var(--success)',
          animation: 'pulseDot 2s infinite var(--ease-in-out)',
        }}/>
        实时生效 · 已自动保存
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:.4; transform:scale(1.6);} }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Date / time helpers
// ─────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y} · ${m} · ${day}`;
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
  return formatDate(iso);
};

// Decorate API article -> shape used by ArticleCard / pages
const adaptArticle = (a) => ({
  ...a,
  date: a.date || formatDate(a.createdAt),
  views: a.views ?? 0,
  likes: typeof a.likes === 'number' ? a.likes : (a._count?.likes ?? 0),
  comments: typeof a.comments === 'number' ? a.comments : (a._count?.comments ?? 0),
  tags: a.tags || [],
  cover: a.cover || 'warm',
  author: a.author && typeof a.author === 'object' ? {
    name: a.author.name || '匿名',
    handle: a.author.handle || '',
    avatar: a.author.avatar || (a.author.name ? a.author.name[0] : '匿'),
  } : { name: '匿名', handle: '', avatar: '匿' },
});

// Empty state — used across pages when API returns no data
const EmptyState = ({ icon = 'feather', title = '此处暂无内容', subtitle = 'Nothing here yet.', action }) => (
  <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--ink-4)' }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'var(--paper-2)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-4)', marginBottom: 16,
    }}>
      <Icon name={icon} size={24}/>
    </div>
    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink-2)', marginBottom: 6 }}>{title}</div>
    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }}>{subtitle}</div>
    {action && <div style={{ marginTop: 20 }}>{action}</div>}
  </div>
);

const Loading = ({ label = '加载中…' }) => (
  <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-4)',
          animation: `bounce 900ms ${i*120}ms infinite var(--ease-in-out)`,
        }}/>
      ))}
    </span>
    <div style={{ marginTop: 10, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{label}</div>
  </div>
);

Object.assign(window, {
  ARTICLES, AUTHORS, COMMENTS,
  Icon, Avatar, Cover, TopNav, PageTransition, TweaksPanel,
  formatDate, formatRelative, adaptArticle, EmptyState, Loading,
});
