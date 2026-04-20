/* global React, Avatar, Cover, TopNav, ArticleCard, EmptyState, Loading, adaptArticle, useIsMobile */

const PageAuthor = ({ onNav, user, authorHandle }) => {
  const [profile, setProfile] = React.useState(null);
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const mobile = typeof useIsMobile !== 'undefined' ? useIsMobile(768) : false;

  React.useEffect(() => {
    if (!authorHandle) {
      setLoading(false);
      setError('缺少作者标识');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Users.get(authorHandle)
      .then((res) => {
        if (cancelled) return;
        setProfile(res.user || null);
        setArticles((res.articles || []).map(adaptArticle));
        if (res.canonicalHandle && res.canonicalHandle !== authorHandle) {
          onNav && onNav('author', res.canonicalHandle);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [authorHandle]);

  if (loading) {
    return (
      <div>
        <TopNav active="profile" onNav={onNav} user={user}/>
        <Loading label="正在展开作者主页…"/>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <TopNav active="profile" onNav={onNav} user={user}/>
        <EmptyState icon="x" title="作者主页暂时无法打开" subtitle={error || '未找到该作者'}/>
      </div>
    );
  }

  const initial = profile.name ? profile.name[0] : '砚';
  const isSelf = !!(user && user.id === profile.id);
  const stats = [
    { label: '文章', value: profile.articles || 0 },
    { label: '阅读', value: profile.views || 0 },
    { label: '获赞', value: profile.likes || 0 },
    { label: '读者', value: profile.followers || 0 },
  ];

  return (
    <div>
      <TopNav active="profile" onNav={onNav} user={user}/>
      <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
        <Cover variant="moss" height={240} rounded={false}/>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: mobile ? '0 16px 60px' : '0 48px 96px' }}>
        <div className="fade-up" style={{
          marginTop: mobile ? -48 : -72,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: mobile ? 'center' : 'flex-end',
          flexDirection: mobile ? 'column' : 'row',
          gap: mobile ? 16 : 24,
          paddingBottom: mobile ? 20 : 28,
          borderBottom: '1px solid var(--border)',
          textAlign: mobile ? 'center' : 'left',
        }}>
          <div style={{
            width: mobile ? 96 : 132,
            height: mobile ? 96 : 132,
            borderRadius: '50%',
            background: 'var(--accent-wash)',
            border: mobile ? '4px solid var(--paper)' : '6px solid var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--serif)',
            fontSize: mobile ? 40 : 58,
            color: 'var(--accent-deep)',
            boxShadow: 'var(--shadow-md)',
          }}>{initial}</div>
          <div style={{ flex: 1, paddingBottom: mobile ? 0 : 8 }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: mobile ? 12 : 14, marginBottom: 8 }}>
              — 作者主页 · Author space
            </div>
            <h1 style={{ fontSize: mobile ? 28 : 40, marginBottom: 4, letterSpacing: '-0.01em' }}>{profile.name}</h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: mobile ? 14 : 16, color: 'var(--ink-3)', marginBottom: 10 }}>
              @{profile.handle}
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: mobile ? 14 : 15, maxWidth: 620, lineHeight: 1.8 }}>
              {profile.bio || '这位作者还没有写下个人简介。'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: mobile ? 0 : 8 }}>
            {isSelf ? (
              <button className="btn btn-primary" onClick={()=>onNav && onNav('profile')}>
                编辑我的资料
              </button>
            ) : (
              <button className="btn" onClick={()=>onNav && onNav('home')}>
                返回首页
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: mobile ? 12 : 16, margin: '32px 0 36px' }}>
          {stats.map((item, index) => (
            <div key={item.label} className="card fade-up" style={{ padding: '22px 24px', animationDelay: index * 80 + 'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, letterSpacing: '-0.01em' }}>
                {Number(item.value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {articles.length === 0 ? (
          <EmptyState icon="feather" title="这位作者还没有公开文章" subtitle="The desk is ready, but the page is still blank."/>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              margin: '10px 0 28px', color: 'var(--ink-3)',
            }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>作者文章</span>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>Published pieces</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>
            <div className="article-card-grid">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpen={(id) => onNav('article', id)}
                  onOpenAuthor={(handle) => onNav('author', handle)}
                  delay={index * 50}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

window.PageAuthor = PageAuthor;
