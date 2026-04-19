/* global React, API, Icon, Avatar, Cover, TopNav, EmptyState, Loading, adaptArticle */

// ─────────────────────────────────────────────────────────
// Article card — opens article by id
// ─────────────────────────────────────────────────────────
const ArticleCard = ({ article, onOpen, onOpenAuthor, compact, featured, delay = 0 }) => {
  const [hover, setHover] = React.useState(false);
  const canOpenAuthor = !!(onOpenAuthor && article.author && article.author.handle);
  const coverHeight = featured ? 280 : compact ? 120 : 180;
  const contentPadding = compact ? '16px 18px' : '22px 24px 20px';
  const titleSize = featured ? 28 : compact ? 17 : 21;
  const showExcerpt = !compact;
  const excerptHeight = featured ? 86 : 52;
  const transitionName = article?.id ? `article-card-${article.id}` : undefined;
  return (
    <article
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onClick={()=>onOpen && onOpen(article.id)}
      className="fade-up card density-frame"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform var(--d-base) var(--ease-out), box-shadow var(--d-base) var(--ease-out), border-color var(--d-base) var(--ease-out)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--border)',
        animationDelay: `${delay}ms`,
        display: 'flex', flexDirection: 'column',
        contain: 'layout paint',
        viewTransitionName: transitionName,
      }}>
      <div className="density-cover" style={{ height: coverHeight }}>
        <Cover variant={article.cover} height="100%"/>
      </div>
      <div className="density-panel" style={{ padding: contentPadding, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {(article.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <h3 className="density-copy" style={{
          fontSize: titleSize,
          lineHeight: 1.3, marginBottom: 4,
          transition: 'color var(--d-fast) var(--ease-out), font-size var(--d-base) var(--ease-out), line-height var(--d-base) var(--ease-out), margin var(--d-base) var(--ease-out)',
          color: hover ? 'var(--accent)' : 'var(--ink)',
        }}>{article.title}</h3>
        {article.titleEn && (
          <div className="density-copy" style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: featured ? 16 : 13,
            color: 'var(--ink-4)', marginBottom: 12,
            transition: 'font-size var(--d-base) var(--ease-out), margin var(--d-base) var(--ease-out), opacity var(--d-base) var(--ease-out), transform var(--d-base) var(--ease-out)',
          }}>{article.titleEn}</div>
        )}
        <div
          aria-hidden={!showExcerpt}
          className="density-excerpt"
          style={{
            maxHeight: showExcerpt ? excerptHeight : 0,
            opacity: showExcerpt ? 1 : 0,
            transform: showExcerpt ? 'translateY(0)' : 'translateY(-10px)',
            marginBottom: showExcerpt ? 16 : 0,
          }}>
          <p className="density-copy" style={{
            fontSize: 14, lineHeight: 1.65, color: 'var(--ink-3)',
            margin: 0,
            display: '-webkit-box', WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{article.excerpt}</p>
        </div>
        <div className="density-panel" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            onClick={canOpenAuthor ? (e) => { e.stopPropagation(); onOpenAuthor(article.author.handle); } : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: canOpenAuthor ? 'pointer' : 'default',
            }}>
            <Avatar char={article.author.avatar} size={28}/>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{article.author.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{article.date} · {article.readTime} 分钟</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-4)' }}>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="eye" size={13}/> {(article.views || 0).toLocaleString()}</span>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="heart" size={13}/> {article.likes || 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────
// Home / Feed page
// ─────────────────────────────────────────────────────────
const PageHome = ({ onNav, tweaks, user }) => {
  const [sort, setSort] = React.useState('recent');
  const [loading, setLoading] = React.useState(true);
  const [articles, setArticles] = React.useState([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Articles.list({ sort, limit: 24 })
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

  const compact = tweaks?.density === 'compact';
  const openArticle = (id) => onNav && onNav('article', id);
  const openAuthor = (handle) => onNav && onNav('author', handle);
  const sortOptions = [
    { k: 'recent', l: '最新' },
    { k: 'hot', l: '热度' },
    { k: 'trending', l: '点赞' },
  ];
  const featured = articles[0];
  const sideTop = articles.slice(1, 3);
  const sideBot = articles.slice(3, 5);
  const remaining = articles.slice(5);

  return (
    <div>
      <TopNav active="home" onNav={onNav} user={user}/>
      <div className="feed-shell density-layout" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 48px 80px', viewTransitionName: 'home-feed-shell' }}>
        {/* Hero */}
        <div className="feed-hero density-layout" style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
          <div className="fade-up" style={{ viewTransitionName: 'home-feed-hero' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 15, marginBottom: 10 }}>
              — 本周编辑精选 · Editor's Picks
            </div>
            <h1 className="density-copy" style={{ fontSize: 56, lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.02em' }}>
              慢一点,<br/>想得更远。
            </h1>
            <div className="density-copy" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink-3)' }}>
              Slow down to think further.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--paper-2)', padding: 4, borderRadius: 'var(--r-pill)', border: '1px solid var(--border)' }}>
            {sortOptions.map(t => (
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
        ) : error ? (
          <EmptyState icon="x" title="加载失败" subtitle={error}/>
        ) : articles.length === 0 ? (
          <EmptyState
            icon="feather"
            title="还没有文章"
            subtitle="The shelf is empty — be the first to write."
            action={user
              ? <button className="btn btn-primary" onClick={()=>onNav('admin-editor', null)}>写第一篇</button>
              : <button className="btn btn-primary" onClick={()=>onNav('auth')}>登录开始写作</button>
            }
          />
        ) : (
          <>
            {/* Featured row — only show if we have multiple articles */}
            {articles.length >= 5 ? (
              <div className="density-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24, marginBottom: 32, viewTransitionName: 'home-feature-grid' }}>
                <ArticleCard article={featured} onOpen={openArticle} onOpenAuthor={openAuthor} featured delay={0}/>
                <div className="density-layout" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {sideTop.map((a, i) => <ArticleCard key={a.id} article={a} onOpen={openArticle} onOpenAuthor={openAuthor} compact delay={80+i*80}/>)}
                </div>
                <div className="density-layout" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {sideBot.map((a, i) => <ArticleCard key={a.id} article={a} onOpen={openArticle} onOpenAuthor={openAuthor} compact delay={240+i*80}/>)}
                </div>
              </div>
            ) : (
              <div className="density-layout" style={{
                display: 'grid', gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 24,
              }}>
                {articles.map((a, i) => (
                  <ArticleCard key={a.id} article={a} onOpen={openArticle} onOpenAuthor={openAuthor} delay={i*60}/>
                ))}
              </div>
            )}

            {remaining.length > 0 && (
              <>
                <div className="density-layout" style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  margin: '48px 0 28px', color: 'var(--ink-3)',
                }}>
                  <span className="density-copy" style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>继续阅读</span>
                  <span className="density-copy" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>Continue reading</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                </div>
                <div className="density-layout" style={{
                  display: 'grid', gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 24,
                }}>
                  {remaining.map((a, i) => (
                    <ArticleCard key={a.id} article={a} onOpen={openArticle} onOpenAuthor={openAuthor} delay={i*60}/>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

window.PageHome = PageHome;
window.ArticleCard = ArticleCard;
