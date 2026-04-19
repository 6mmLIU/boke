/* global React, ARTICLES, Icon, Avatar, Cover, TopNav, ArticleCard */

const PageProfile = ({ onNav }) => {
  const [tab, setTab] = React.useState('articles');
  const stats = [
    { label: '文章', value: 42 },
    { label: '读者', value: 8920 },
    { label: '关注', value: 128 },
    { label: '获赞', value: 23104 },
  ];
  const tabs = [
    { k: 'articles', l: '文章', le: 'Articles', c: 42 },
    { k: 'liked', l: '喜欢', le: 'Liked', c: 186 },
    { k: 'bookmarks', l: '书签', le: 'Bookmarks', c: 73 },
    { k: 'about', l: '关于', le: 'About' },
  ];
  return (
    <div>
      <TopNav active="profile" onNav={onNav}/>
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
          }}>沈</div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <h1 style={{ fontSize: 36, marginBottom: 4, letterSpacing: '-0.01em' }}>沈既白</h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)', marginBottom: 8 }}>
              Shen Jibai · @shenjibai
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 14, maxWidth: 540 }}>
              慢写作者,做过产品,现在只想写字。相信"把一件事想透"比"做很多件事"更重要。
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <button className="btn">私信</button>
            <button className="btn btn-primary">+ 关注</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="card fade-up" style={{ padding: '22px 24px', animationDelay: i*80+'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, letterSpacing: '-0.01em' }}>
                {s.value.toLocaleString()}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {ARTICLES.slice(0, 6).map((a, i) => (
              <ArticleCard key={a.id} article={a} onOpen={()=>onNav('article')} delay={i*60}/>
            ))}
          </div>
        )}
        {tab !== 'articles' && (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 6 }}>此处暂无内容</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }}>Nothing here yet.</div>
          </div>
        )}
      </div>
    </div>
  );
};

window.PageProfile = PageProfile;
