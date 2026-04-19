/* global React, ARTICLES, Icon, Avatar, Cover, AdminShell */

const PageAdminArticles = ({ onNav }) => {
  const [filter, setFilter] = React.useState('all');
  const [hovered, setHovered] = React.useState(null);

  const list = [
    { ...ARTICLES[0], status: 'published' },
    { ...ARTICLES[1], status: 'published' },
    { ...ARTICLES[2], status: 'draft', views: 0, likes: 0, comments: 0 },
    { ...ARTICLES[3], status: 'published' },
    { ...ARTICLES[4], status: 'scheduled', views: 0, likes: 0, comments: 0 },
    { ...ARTICLES[5], status: 'draft', views: 0, likes: 0, comments: 0 },
  ];
  const statusBadge = {
    published: { l: '已发布', bg: 'rgba(107,142,90,0.14)', c: 'var(--success)' },
    draft:     { l: '草稿',   bg: 'var(--paper-3)', c: 'var(--ink-3)' },
    scheduled: { l: '定时',   bg: 'rgba(200,154,62,0.16)', c: 'var(--warn)' },
  };
  const filtered = filter === 'all' ? list : list.filter(x => x.status === filter);

  return (
    <AdminShell active="admin-articles" onNav={onNav}>
      <div style={{ padding: '32px 48px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div className="fade-up">
            <h1 style={{ fontSize: 34, marginBottom: 4 }}>我的文章</h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>My writings</div>
          </div>
          <button className="btn btn-primary" onClick={()=>onNav('admin-editor')}>
            <Icon name="feather" size={15}/>开始写作
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[
            { k: 'all', l: '全部', c: list.length },
            { k: 'published', l: '已发布', c: list.filter(x=>x.status==='published').length },
            { k: 'draft', l: '草稿', c: list.filter(x=>x.status==='draft').length },
            { k: 'scheduled', l: '定时', c: list.filter(x=>x.status==='scheduled').length },
          ].map(t => (
            <button key={t.k} onClick={()=>setFilter(t.k)} style={{
              padding: '8px 16px', border: '1px solid var(--border)', background: filter===t.k ? 'var(--ink)' : 'var(--surface)',
              color: filter===t.k ? 'var(--paper)' : 'var(--ink-2)',
              borderRadius: 'var(--r-pill)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all var(--d-fast)',
            }}>
              {t.l} <span style={{ opacity: 0.6, marginLeft: 4 }}>{t.c}</span>
            </button>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 100px 50px',
            padding: '14px 24px', borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <div>标题</div><div>状态</div><div style={{ textAlign: 'right' }}>阅读</div><div style={{ textAlign: 'right' }}>赞</div><div style={{ textAlign: 'right' }}>评论</div><div/>
          </div>
          {filtered.map((a, i) => {
            const s = statusBadge[a.status];
            const isHover = hovered === a.id;
            return (
              <div key={a.id}
                onMouseEnter={()=>setHovered(a.id)} onMouseLeave={()=>setHovered(null)}
                className="fade-up"
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 100px 50px',
                  alignItems: 'center', gap: 12,
                  padding: '16px 24px', borderTop: i ? '1px solid var(--border)' : 'none',
                  background: isHover ? 'var(--paper-2)' : 'transparent',
                  transition: 'background var(--d-fast)',
                  animationDelay: i*40+'ms',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{ width: 52, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                    <Cover variant={a.cover} height={36} rounded={false}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.date} · {a.readTime} 分钟</div>
                  </div>
                </div>
                <div>
                  <span style={{ padding: '3px 10px', background: s.bg, color: s.c, borderRadius: 'var(--r-pill)', fontSize: 11, fontWeight: 500 }}>{s.l}</span>
                </div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{a.views.toLocaleString()}</div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{a.likes}</div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{a.comments}</div>
                <div style={{
                  display: 'flex', gap: 4, justifyContent: 'flex-end',
                  opacity: isHover ? 1 : 0,
                  transition: 'opacity var(--d-fast)',
                }}>
                  <button style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--ink-3)' }}>
                    <Icon name="edit" size={15}/>
                  </button>
                  <button style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--ink-3)' }}>
                    <Icon name="more" size={15}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminArticles = PageAdminArticles;
