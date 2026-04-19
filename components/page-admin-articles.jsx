/* global React, Icon, Cover, AdminShell, EmptyState, Loading, formatDate */

const PageAdminArticles = ({ onNav, user }) => {
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [hovered, setHovered] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Admin.articles({ limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setArticles(res.articles || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    return load();
  }, [load]);

  const onDelete = async (id) => {
    if (!window.confirm('确定要删除这篇文章吗?此操作不可撤销。')) return;
    setBusyId(id);
    try {
      await window.API.Articles.delete(id);
      setArticles(list => list.filter(a => a.id !== id));
    } catch (err) {
      alert('删除失败:' + (err.message || ''));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell active="admin-articles" onNav={onNav} user={user}>
      <div style={{ padding: '32px 48px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div className="fade-up">
            <h1 style={{ fontSize: 34, marginBottom: 4 }}>我的文章</h1>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)' }}>My writings</div>
          </div>
          <button className="btn btn-primary" onClick={()=>onNav('admin-editor', null)}>
            <Icon name="feather" size={15}/>开始写作
          </button>
        </div>

        {loading ? (
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
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 90px',
              padding: '14px 24px', borderBottom: '1px solid var(--border)',
              fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <div>标题</div><div style={{ textAlign: 'right' }}>阅读</div><div style={{ textAlign: 'right' }}>赞</div><div style={{ textAlign: 'right' }}>评论</div><div/>
            </div>
            {articles.map((a, i) => {
              const isHover = hovered === a.id;
              return (
                <div key={a.id}
                  onMouseEnter={()=>setHovered(a.id)} onMouseLeave={()=>setHovered(null)}
                  className="fade-up"
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 90px',
                    alignItems: 'center', gap: 12,
                    padding: '16px 24px', borderTop: i ? '1px solid var(--border)' : 'none',
                    background: isHover ? 'var(--paper-2)' : 'transparent',
                    transition: 'background var(--d-fast)',
                    animationDelay: i*40+'ms',
                    opacity: busyId === a.id ? 0.5 : 1,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div style={{ width: 52, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                      <Cover variant={a.cover || 'warm'} height={36} rounded={false}/>
                    </div>
                    <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={()=>onNav('article', a.id)}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{formatDate(a.createdAt)} · {a.readTime} 分钟</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{(a.views || 0).toLocaleString()}</div>
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{a.likes || 0}</div>
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--ink-2)' }}>{a.comments || 0}</div>
                  <div style={{
                    display: 'flex', gap: 4, justifyContent: 'flex-end',
                    opacity: isHover ? 1 : 0.4,
                    transition: 'opacity var(--d-fast)',
                  }}>
                    <button title="编辑" onClick={()=>onNav('admin-editor', a.id)} style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--ink-3)' }}>
                      <Icon name="edit" size={15}/>
                    </button>
                    <button title="删除" disabled={busyId === a.id} onClick={()=>onDelete(a.id)} style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--danger)' }}>
                      <Icon name="trash" size={15}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

window.PageAdminArticles = PageAdminArticles;
