/* global React, Icon, Avatar, EmptyState, Loading, formatRelative */

// ─────────────────────────────────────────────────────────
// Admin shell — sidebar + content
// ─────────────────────────────────────────────────────────
const AdminShell = ({ active, onNav, user, children }) => {
  const items = [
    { k: 'admin', l: '概览', le: 'Overview', icon: 'chart' },
    { k: 'admin-articles', l: '文章', le: 'Articles', icon: 'doc' },
    { k: 'admin-editor', l: '写作', le: 'Write', icon: 'feather' },
  ];
  const u = user || (window.Auth && window.Auth.user) || null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: '100vh', background: 'var(--paper)' }}>
      <aside style={{
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <a onClick={()=>onNav('home')} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px',
          fontFamily: 'var(--serif)', fontSize: 20, cursor: 'pointer',
          borderBottom: '1px solid var(--border)', marginBottom: 12,
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: 6, background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>砚</span>
          Inkwell <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--sans)', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4, marginLeft: 'auto' }}>STUDIO</span>
        </a>
        {items.map(it => (
          <button key={it.k} onClick={()=>onNav(it.k, it.k === 'admin-editor' ? null : undefined)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            background: active === it.k ? 'var(--paper)' : 'transparent',
            border: '1px solid ' + (active === it.k ? 'var(--border)' : 'transparent'),
            borderRadius: 'var(--r-md)',
            color: active === it.k ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: active === it.k ? 500 : 400, textAlign: 'left',
            transition: 'all var(--d-fast) var(--ease-out)',
          }}>
            <Icon name={it.icon} size={16}/>
            <span>{it.l}</span>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 11, marginLeft: 'auto' }}>{it.le}</span>
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        {u && (
          <div style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)' }}>
            <Avatar char={u.name ? u.name[0] : '砚'} size={32} accent/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>@{u.handle}</div>
            </div>
            <button title="登出" onClick={()=>{
              window.Auth && window.Auth.logout();
              onNav && onNav('home');
            }} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--ink-4)', borderRadius: 6, cursor: 'pointer',
              padding: '4px 6px',
            }}>
              <Icon name="x" size={12}/>
            </button>
          </div>
        )}
      </aside>
      <main>{children}</main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Dashboard — Overview
// ─────────────────────────────────────────────────────────
const PageAdminDashboard = ({ onNav, user }) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Admin.stats()
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
  }, []);

  if (loading) {
    return <AdminShell active="admin" onNav={onNav} user={user}><Loading label="读取统计…"/></AdminShell>;
  }
  if (error) {
    return (
      <AdminShell active="admin" onNav={onNav} user={user}>
        <EmptyState icon="x" title="加载失败" subtitle={error}/>
      </AdminShell>
    );
  }

  const s = data && data.stats ? data.stats : {};
  const totalViews = (s.views && s.views.total && (s.views.total._sum?.views ?? s.views.total)) || 0;
  const totalLikes = (s.likes && s.likes.total) || 0;
  const totalArticles = (s.articles && s.articles.total) || 0;
  const totalFollowers = (s.followers && s.followers.total) || 0;

  const stats = [
    { label: '总阅读', value: totalViews },
    { label: '总点赞', value: totalLikes },
    { label: '文章数', value: totalArticles },
    { label: '关注者', value: totalFollowers },
  ];

  // Trend data: array of { date, views } for last 30 days
  const trend = (data && data.trendData) || [];
  const series = trend.map(d => d.views || 0);
  const max = Math.max(1, ...series);

  const topArticles = (data && data.topArticles) || [];
  const recentActivity = (data && data.recentActivity) || [];

  const greet = (() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 12) return '早上好';
    if (h < 18) return '下午好';
    return '晚上好';
  })();

  return (
    <AdminShell active="admin" onNav={onNav} user={user}>
      <div style={{ padding: '32px 48px 80px' }}>
        <div className="fade-up" style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 14, marginBottom: 8 }}>— 书斋近况 · Studio</div>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>{greet},{user ? user.name : '作者'}</h1>
          <div style={{ color: 'var(--ink-3)' }}>
            {totalArticles > 0
              ? <>你已发表 <b style={{ color: 'var(--ink)' }}>{totalArticles}</b> 篇文章,共获得 <b style={{ color: 'var(--ink)' }}>{totalViews.toLocaleString()}</b> 次阅读。</>
              : '还没有发表文章 — 写下第一篇,让别人读到你。'}
          </div>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="card fade-up" style={{ padding: '20px 22px', animationDelay: i*80+'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, margin: '6px 0 4px', letterSpacing: '-0.01em' }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* chart */}
        {series.length > 0 && (
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>最近 30 天阅读</div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>Reading over time</div>
              </div>
            </div>
            <svg viewBox={`0 0 ${series.length*24} 180`} width="100%" height="180" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d={`M 0 ${180 - series[0]/max*160} ${series.map((v,i)=>`L ${i*24} ${180 - v/max*160}`).join(' ')} L ${(series.length-1)*24} 180 L 0 180 Z`}
                fill="url(#areaGrad)"
              />
              <path
                d={`M 0 ${180 - series[0]/max*160} ${series.map((v,i)=>`L ${i*24} ${180 - v/max*160}`).join(' ')}`}
                fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>最热文章</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Top articles</div>
            {topArticles.length === 0 ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '16px 0' }}>暂无数据</div>
            ) : (
              <div>
                {topArticles.map((a,i) => (
                  <div key={a.id}
                    onClick={()=>onNav('article', a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-4)', width: 20 }}>{i+1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{(a.views || 0).toLocaleString()} 阅读 · {a.likes || 0} 赞</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>最近评论</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Recent comments</div>
            {recentActivity.length === 0 ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '16px 0' }}>暂无评论</div>
            ) : (
              recentActivity.map((c,i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                  <Avatar char={c.author && c.author.name ? c.author.name[0] : '匿'} size={30}/>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)', minWidth: 0 }}>
                    <b>{c.author ? c.author.name : '匿名'}</b>
                    <span style={{ color: 'var(--ink-3)' }}> 评论了 </span>
                    <span style={{ color: 'var(--accent)' }}>《{c.article ? c.article.title : ''}》</span>
                    <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{formatRelative(c.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminDashboard = PageAdminDashboard;
window.AdminShell = AdminShell;
