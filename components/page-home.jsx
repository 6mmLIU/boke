/* global React, ARTICLES, AUTHORS, Icon, Avatar, Cover, TopNav */

// ─────────────────────────────────────────────────────────
// Article card — with hover expansion
// ─────────────────────────────────────────────────────────
const ArticleCard = ({ article, onOpen, compact, featured, delay = 0 }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onClick={()=>onOpen && onOpen(article.id)}
      className="fade-up card"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform var(--d-base) var(--ease-out), box-shadow var(--d-base) var(--ease-out), border-color var(--d-base) var(--ease-out)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--border)',
        animationDelay: `${delay}ms`,
        display: 'flex', flexDirection: 'column',
      }}>
      <Cover variant={article.cover} height={featured ? 280 : compact ? 120 : 180}/>
      <div style={{ padding: compact ? '16px 18px' : '22px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {article.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <h3 style={{
          fontSize: featured ? 28 : compact ? 17 : 21,
          lineHeight: 1.3, marginBottom: 4,
          transition: 'color var(--d-fast)',
          color: hover ? 'var(--accent)' : 'var(--ink)',
        }}>{article.title}</h3>
        <div style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontSize: featured ? 16 : 13,
          color: 'var(--ink-4)', marginBottom: 12,
        }}>{article.titleEn}</div>
        {!compact && (
          <p style={{
            fontSize: 14, lineHeight: 1.65, color: 'var(--ink-3)',
            margin: 0, marginBottom: 16,
            display: '-webkit-box', WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{article.excerpt}</p>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar char={article.author.avatar} size={28}/>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{article.author.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{article.date} · {article.readTime} 分钟</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-4)' }}>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="eye" size={13}/> {article.views.toLocaleString()}</span>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="heart" size={13}/> {article.likes}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────
// Home / Feed page
// ─────────────────────────────────────────────────────────
const PageHome = ({ onNav, tweaks }) => {
  const [sort, setSort] = React.useState('recent');
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { const t = setTimeout(()=>setLoading(false), 600); return ()=>clearTimeout(t); }, []);

  const compact = tweaks?.density === 'compact';

  return (
    <div>
      <TopNav active="home" onNav={onNav}/>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 48px 80px' }}>
        {/* Hero */}
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
          <div className="fade-up">
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 15, marginBottom: 10 }}>
              — 本周编辑精选 · Editor's Picks
            </div>
            <h1 style={{ fontSize: 56, lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.02em' }}>
              慢一点,<br/>想得更远。
            </h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink-3)' }}>
              Slow down to think further.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--paper-2)', padding: 4, borderRadius: 'var(--r-pill)', border: '1px solid var(--border)' }}>
            {[
              { k: 'recent', l: '最新' },
              { k: 'hot', l: '热度' },
              { k: 'following', l: '关注' },
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
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24 }}>
            <div className="skeleton" style={{ height: 480 }}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="skeleton" style={{ height: 228 }}/>
              <div className="skeleton" style={{ height: 228 }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="skeleton" style={{ height: 228 }}/>
              <div className="skeleton" style={{ height: 228 }}/>
            </div>
          </div>
        ) : (
          <>
            {/* Featured row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
              <ArticleCard article={ARTICLES[0]} onOpen={()=>onNav('article')} featured delay={0}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <ArticleCard article={ARTICLES[1]} onOpen={()=>onNav('article')} compact delay={80}/>
                <ArticleCard article={ARTICLES[2]} onOpen={()=>onNav('article')} compact delay={160}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <ArticleCard article={ARTICLES[3]} onOpen={()=>onNav('article')} compact delay={240}/>
                <ArticleCard article={ARTICLES[4]} onOpen={()=>onNav('article')} compact delay={320}/>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              margin: '48px 0 28px', color: 'var(--ink-3)',
            }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>继续阅读</span>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>Continue reading</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 24,
            }}>
              {ARTICLES.map((a, i) => (
                <ArticleCard key={a.id} article={a} onOpen={()=>onNav('article')} delay={i*60}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

window.PageHome = PageHome;
window.ArticleCard = ArticleCard;
