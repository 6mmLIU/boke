/* global React, Icon, Avatar, Cover, TopNav, EmptyState, Loading, adaptArticle */

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

const PageRanking = ({ onNav, user }) => {
  const [sort, setSort] = React.useState('hot'); // 'hot' (views) | 'trending' (likes) | 'recent'
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Articles.list({ sort, limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setArticles((res.articles || []).map(adaptArticle));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sort]);

  // Build author leaderboard from the loaded articles
  const authors = React.useMemo(() => {
    const map = new Map();
    for (const a of articles) {
      const key = a.author.handle || a.author.name;
      if (!key) continue;
      const cur = map.get(key) || { ...a.author, articles: 0, likes: 0, views: 0 };
      cur.articles += 1;
      cur.likes += a.likes || 0;
      cur.views += a.views || 0;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.likes - a.likes).slice(0, 5);
  }, [articles]);

  const ranked = React.useMemo(() => articles.map(a => ({
    ...a,
    score: (a.views || 0) + (a.likes || 0) * 10 + (a.comments || 0) * 20,
  })), [articles]);

  return (
    <div>
      <TopNav active="ranking" onNav={onNav} user={user}/>
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
            {[
              { k: 'hot', l: '阅读榜' },
              { k: 'trending', l: '点赞榜' },
              { k: 'recent', l: '新发表' },
            ].map(t => (
              <button key={t.k} onClick={()=>setSort(t.k)} style={{
                padding: '8px 18px', fontSize: 13, border: 'none', borderRadius: 'var(--r-pill)',
                background: sort === t.k ? 'var(--surface)' : 'transparent',
                color: sort === t.k ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: sort === t.k ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer', fontWeight: sort === t.k ? 500 : 400,
                transition: 'all var(--d-fast) var(--ease-out)',
              }}>{t.l}</button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>评分 = 阅读 + 点赞×10 + 评论×20</div>
        </div>

        {loading ? (
          <Loading label="计算榜单中…"/>
        ) : error ? (
          <EmptyState icon="x" title="加载失败" subtitle={error}/>
        ) : ranked.length === 0 ? (
          <EmptyState icon="trophy" title="榜单空空如也" subtitle="No entries yet — check back soon."/>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
            {/* Main ranking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ranked.map((r, i) => (
                <RankRow key={r.id} rank={i+1} article={r} onOpen={()=>onNav('article', r.id)}/>
              ))}
            </div>

            {/* Sidebar — author ranking */}
            <aside>
              <div style={{ position: 'sticky', top: 100 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 22 }}>作者榜</h3>
                  <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 14 }}>Top writers</span>
                </div>
                {authors.length === 0 ? (
                  <div className="card" style={{ padding: 20, color: 'var(--ink-4)', fontSize: 13 }}>暂无数据</div>
                ) : (
                  <div className="card" style={{ padding: '8px 0', overflow: 'hidden' }}>
                    {authors.map((a, i) => (
                      <div key={a.handle || a.name} className="fade-up" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 18px',
                        borderBottom: i < authors.length - 1 ? '1px solid var(--border)' : 'none',
                        animationDelay: i*60 + 'ms',
                        cursor: a.handle ? 'pointer' : 'default',
                      }}>
                        <div style={{
                          width: 22, fontFamily: 'var(--serif)', fontSize: 16,
                          color: i < 3 ? 'var(--accent)' : 'var(--ink-4)',
                          fontWeight: 500,
                        }}>{String(i+1).padStart(2,'0')}</div>
                        <div onClick={() => a.handle && onNav('author', a.handle)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          <Avatar char={a.avatar} size={36} accent={i<3}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                            {a.articles} 篇 · <RollingNumber value={a.likes}/> 赞
                          </div>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
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
          {(article.tags || []).slice(0,2).map(t => <span key={t} className="tag" style={{ fontSize: 11, padding: '2px 8px' }}>{t}</span>)}
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
          <span>{(article.views || 0).toLocaleString()} 阅读</span>
          <span>{article.likes || 0} 赞</span>
          <span>{article.comments || 0} 评</span>
        </div>
      </div>
    </div>
  );
};

window.PageRanking = PageRanking;
