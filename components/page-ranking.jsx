/* global React, ARTICLES, AUTHORS, Icon, Avatar, Cover, TopNav */

// Number with rolling animation
const RollingNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = React.useState(0);
  const startRef = React.useRef(0);
  React.useEffect(() => {
    const start = performance.now();
    const from = startRef.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else startRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display.toLocaleString()}</span>;
};

const PageRanking = ({ onNav }) => {
  const [range, setRange] = React.useState('week');
  const [kind, setKind] = React.useState('article'); // 'article' | 'author'
  const [seed, setSeed] = React.useState(0);
  // Rank multipliers by range — simulate rank changes
  const mults = {
    day:   [1.0, 0.6, 1.3, 0.8, 1.1, 0.5],
    week:  [1.2, 1.0, 1.0, 1.4, 0.9, 0.8],
    month: [1.8, 1.5, 1.2, 2.2, 1.3, 1.0],
    all:   [3.4, 2.8, 2.1, 4.6, 2.2, 1.7],
  };
  const rows = React.useMemo(() => {
    const base = ARTICLES.map((a, i) => ({
      ...a,
      score: Math.round((a.views + a.likes*10 + a.comments*20) * mults[range][i]),
    }));
    return base.sort((a,b) => b.score - a.score);
  }, [range, seed]);

  return (
    <div>
      <TopNav active="ranking" onNav={onNav}/>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 100px' }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 15, marginBottom: 10 }}>
            — 本期榜单 · Rankings
          </div>
          <h1 style={{ fontSize: 48, marginBottom: 10, letterSpacing: '-0.02em' }}>读者正在读什么</h1>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink-3)' }}>
            What readers are turning to.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', padding: 4, borderRadius: 'var(--r-pill)', border: '1px solid var(--border)' }}>
            {[{k:'day',l:'今日'},{k:'week',l:'本周'},{k:'month',l:'本月'},{k:'all',l:'总榜'}].map(t => (
              <button key={t.k} onClick={()=>setRange(t.k)} style={{
                padding: '8px 18px', fontSize: 13, border: 'none', borderRadius: 'var(--r-pill)',
                background: range === t.k ? 'var(--surface)' : 'transparent',
                color: range === t.k ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: range === t.k ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer', fontWeight: range === t.k ? 500 : 400,
                transition: 'all var(--d-fast) var(--ease-out)',
              }}>{t.l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>评分 = 阅读 + 点赞×10 + 评论×20</div>
            <button className="btn" onClick={()=>setSeed(s=>s+1)} style={{ fontSize: 13 }}>
              <Icon name="fire" size={14}/>刷新
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
          {/* Main ranking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {rows.map((r, i) => (
              <RankRow key={r.id} rank={i+1} article={r} onOpen={()=>onNav('article')}/>
            ))}
          </div>

          {/* Sidebar — author ranking */}
          <aside>
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
                <h3 style={{ fontSize: 22 }}>作者榜</h3>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 14 }}>Top writers</span>
              </div>
              <div className="card" style={{ padding: '8px 0', overflow: 'hidden' }}>
                {AUTHORS.map((a, i) => (
                  <div key={a.handle} className="fade-up" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px',
                    borderBottom: i < AUTHORS.length - 1 ? '1px solid var(--border)' : 'none',
                    animationDelay: i*60 + 'ms',
                  }}>
                    <div style={{
                      width: 22, fontFamily: 'var(--serif)', fontSize: 16,
                      color: i < 3 ? 'var(--accent)' : 'var(--ink-4)',
                      fontWeight: 500,
                    }}>{String(i+1).padStart(2,'0')}</div>
                    <Avatar char={a.avatar} size={36} accent={i<3}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.articles} 篇 · <RollingNumber value={a.followers}/> 读者</div>
                    </div>
                    <button style={{
                      padding: '4px 12px', fontSize: 11, border: '1px solid var(--border-strong)',
                      background: 'transparent', borderRadius: 'var(--r-pill)',
                      color: 'var(--ink-2)', cursor: 'pointer',
                    }}>关注</button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const RankRow = ({ rank, article, onOpen }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      onClick={onOpen}
      className="fade-up"
      style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '22px 0',
        borderTop: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all var(--d-fast) var(--ease-out)',
        animationDelay: rank*40 + 'ms',
      }}>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: rank <= 3 ? 56 : 44,
        color: rank <= 3 ? 'var(--accent)' : 'var(--ink-4)',
        lineHeight: 1, width: 72, textAlign: 'right',
        fontWeight: rank <= 3 ? 500 : 400,
        letterSpacing: '-0.02em',
        transition: 'transform var(--d-fast) var(--ease-out)',
        transform: hover ? 'translateX(-4px)' : 'translateX(0)',
      }}>
        {String(rank).padStart(2,'0')}
      </div>
      <div style={{
        width: 96, height: 72, borderRadius: 'var(--r-md)', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <Cover variant={article.cover} height={72} rounded={false}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {article.tags.slice(0,2).map(t => <span key={t} className="tag" style={{ fontSize: 11, padding: '2px 8px' }}>{t}</span>)}
        </div>
        <h3 style={{
          fontSize: 20, lineHeight: 1.3, marginBottom: 4,
          color: hover ? 'var(--accent)' : 'var(--ink)',
          transition: 'color var(--d-fast)',
        }}>{article.title}</h3>
        <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>
          {article.author.name} · {article.date}
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 140 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          <RollingNumber value={article.score}/>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <span>👁 {article.views.toLocaleString()}</span>
          <span>♥ {article.likes}</span>
          <span>💬 {article.comments}</span>
        </div>
      </div>
    </div>
  );
};

window.PageRanking = PageRanking;
