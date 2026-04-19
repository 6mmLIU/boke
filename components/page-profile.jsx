/* global React, Icon, Avatar, Cover, TopNav, ArticleCard, EmptyState, Loading, adaptArticle */

const PageProfile = ({ onNav, user }) => {
  const [tab, setTab] = React.useState('articles');
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Articles.list({ author: user.handle, limit: 50 })
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
  }, [user && user.handle]);

  if (!user) {
    return (
      <div>
        <TopNav active="profile" onNav={onNav} user={user}/>
        <EmptyState
          icon="user"
          title="登录后查看你的书房"
          subtitle="Sign in to see your study."
          action={<button className="btn btn-primary" onClick={()=>onNav && onNav('auth')}>登录 / 注册</button>}
        />
      </div>
    );
  }

  const totalLikes = articles.reduce((s, a) => s + (a.likes || 0), 0);
  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);
  const stats = [
    { label: '文章', value: articles.length },
    { label: '阅读', value: totalViews },
    { label: '获赞', value: totalLikes },
    { label: '加入', value: user.createdAt ? new Date(user.createdAt).getFullYear() : '—' },
  ];
  const tabs = [
    { k: 'articles', l: '文章', le: 'Articles', c: articles.length },
    { k: 'about', l: '关于', le: 'About' },
  ];

  const initial = user.name ? user.name[0] : '砚';

  return (
    <div>
      <TopNav active="profile" onNav={onNav} user={user}/>
      {/* Hero cover */}
      <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        <Cover variant="warm" height={220} rounded={false}/>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 96px' }}>
        <div className="fade-up" style={{
          marginTop: -72, position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'flex-end', gap: 24,
          paddingBottom: 28, borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 128, height: 128, borderRadius: '50%',
            background: 'var(--accent-wash)', border: '6px solid var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: 56, color: 'var(--accent-deep)',
            boxShadow: 'var(--shadow-md)',
          }}>{initial}</div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <h1 style={{ fontSize: 36, marginBottom: 4, letterSpacing: '-0.01em' }}>{user.name}</h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', marginBottom: 8 }}>
              @{user.handle}
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 14, maxWidth: 540 }}>
              {user.bio || '这位作者还没有写下个人简介。'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <button className="btn" onClick={()=>onNav && onNav('admin-editor', null)}>
              <Icon name="feather" size={14}/> 写作
            </button>
            <button className="btn btn-primary" onClick={()=>onNav && onNav('admin')}>
              进入后台
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="card fade-up" style={{ padding: '22px 24px', animationDelay: i*80+'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, letterSpacing: '-0.01em' }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '14px 20px',
              fontSize: 14, fontWeight: 500,
              color: tab === t.k ? 'var(--ink)' : 'var(--ink-4)',
              borderBottom: '2px solid ' + (tab === t.k ? 'var(--accent)' : 'transparent'),
              transition: 'all var(--d-fast)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: -1,
            }}>
              {t.l}
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 12 }}>{t.le}</span>
              {t.c !== undefined && <span className="tag" style={{ fontSize: 11, padding: '1px 8px' }}>{t.c}</span>}
            </button>
          ))}
        </div>

        {tab === 'articles' && (
          loading ? (
            <Loading label="读取你的文章…"/>
          ) : error ? (
            <EmptyState icon="x" title="加载失败" subtitle={error}/>
          ) : articles.length === 0 ? (
            <EmptyState
              icon="feather"
              title="还没有发表文章"
              subtitle="Your study is quiet — write your first piece."
              action={<button className="btn btn-primary" onClick={()=>onNav && onNav('admin-editor', null)}>写第一篇</button>}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {articles.map((a, i) => (
                <ArticleCard key={a.id} article={a} onOpen={(id)=>onNav('article', id)} delay={i*60}/>
              ))}
            </div>
          )
        )}
        {tab === 'about' && (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.8, color: 'var(--ink-2)' }}>
              {user.bio || '这位作者还没有写下个人简介。'}
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--ink-4)' }}>
              <div>邮箱:{user.email}</div>
              <div>笔名:@{user.handle}</div>
              {user.createdAt && <div>加入时间:{new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.PageProfile = PageProfile;
