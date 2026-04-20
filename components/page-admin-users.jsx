/* global React, Icon, AdminShell, EmptyState, Loading, formatDate, useIsMobile */

const PageAdminUsers = ({ onNav, user }) => {
  const [q, setQ] = React.useState('');
  const [users, setUsers] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busyId, setBusyId] = React.useState('');
  const mobile = typeof useIsMobile !== 'undefined' ? useIsMobile(768) : false;

  const load = React.useCallback((keyword = '') => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Admin.users({ q: keyword, limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.users || []);
        setSummary(res.summary || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => load(''), [load]);

  const onBanToggle = async (target) => {
    const isBan = !target.isBanned;
    const reason = isBan ? window.prompt('封禁原因（可选）', '') || '' : '';
    setBusyId(target.id);
    try {
      if (isBan) await window.API.Admin.banUser(target.id, reason);
      else await window.API.Admin.unbanUser(target.id);
      load(q);
    } catch (err) {
      alert(err.message || '操作失败');
    } finally {
      setBusyId('');
    }
  };

  const summaryCards = summary ? [
    { label: '注册用户', value: summary.totalUsers || 0 },
    { label: '近 7 天新增', value: summary.newUsers7d || 0 },
    { label: '文章总数', value: summary.totalArticles || 0 },
    { label: '总阅读', value: summary.totalViews || 0 },
    { label: '总获赞', value: summary.totalLikes || 0 },
    { label: '总评论', value: summary.totalComments || 0 },
    { label: '封禁账户', value: summary.bannedUsers || 0 },
    { label: '管理员', value: summary.admins || 0 },
  ] : [];

  return (
    <AdminShell active="admin-users" onNav={onNav} user={user}>
      <div style={{ padding: mobile ? '24px 16px 60px' : '32px 48px 80px' }}>
        <div style={{ display: 'flex', alignItems: mobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: mobile ? 16 : 24, marginBottom: 28, flexDirection: mobile ? 'column' : 'row' }}>
          <div className="fade-up">
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 14, marginBottom: 8 }}>
              — 平台管理 · Platform admin
            </div>
            <h1 style={{ fontSize: mobile ? 26 : 34, marginBottom: 4 }}>用户与内容总览</h1>
            <div style={{ color: 'var(--ink-4)' }}>查看所有注册用户、最近文章与封禁状态</div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: mobile ? '100%' : 320,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <Icon name="search" size={14}/>
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=>{ if (e.key === 'Enter') load(q); }}
              placeholder="搜索邮箱、笔名、用户名"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent' }}/>
            <button className="btn btn-ghost" onClick={()=>load(q)} style={{ padding: '6px 10px' }}>搜索</button>
          </div>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            {summaryCards.map((item, index) => (
              <div key={item.label} className="card fade-up" style={{ padding: '20px 22px', animationDelay: index * 50 + 'ms' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, marginTop: 6 }}>{Number(item.value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <Loading label="读取平台用户…"/>
        ) : error ? (
          <EmptyState icon="x" title="读取失败" subtitle={error}/>
        ) : users.length === 0 ? (
          <EmptyState icon="user" title="没有找到用户" subtitle="Try a different keyword."/>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {users.map((item, index) => (
              <div key={item.id} className="card fade-up" style={{ padding: 24, animationDelay: index * 40 + 'ms' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexDirection: mobile ? 'column' : 'row' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--accent-wash)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--serif)',
                        color: 'var(--accent-deep)',
                      }}>
                        {item.name ? item.name[0] : '游'}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>@{item.handle} · {item.email}</div>
                      </div>
                      <div className="tag">{item.role === 'ADMIN' ? '管理员' : '普通用户'}</div>
                      {item.isBanned && <div className="tag" style={{ color: 'var(--danger)', borderColor: 'rgba(180,80,60,0.2)' }}>已封禁</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                      {[
                        ['文章', item.stats.articles],
                        ['阅读', item.stats.views],
                        ['获赞', item.stats.likes],
                        ['评论', item.stats.comments],
                        ['关注者', item.stats.followers],
                      ].map(([label, value]) => (
                        <div key={label} style={{ padding: '12px 14px', background: 'var(--paper-2)', borderRadius: 14 }}>
                          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>{Number(value || 0).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.8, marginBottom: 14 }}>
                      {item.bio || '这个用户还没有填写个人简介。'}
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-4)', marginBottom: 16 }}>
                      <span>加入时间：{formatDate(item.createdAt)}</span>
                      {item.previousHandle && <span>旧用户名：@{item.previousHandle}</span>}
                      {item.handleChangedAt && <span>已改名：{formatDate(item.handleChangedAt)}</span>}
                      {item.bannedAt && <span>封禁时间：{formatDate(item.bannedAt)}</span>}
                    </div>

                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 10 }}>最近文章</div>
                      {item.recentArticles.length === 0 ? (
                        <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>暂无文章</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {item.recentArticles.map((article) => (
                            <div key={article.id} style={{
                              display: 'grid',
                              gridTemplateColumns: mobile ? '1fr' : '1fr auto',
                              gap: 10,
                              alignItems: 'center',
                              padding: '12px 14px',
                              borderRadius: 14,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  onClick={()=>onNav('article', article.id)}
                                  style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {article.title}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>
                                  {formatDate(article.createdAt)} · {article.readTime} 分钟
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-4)' }}>
                                <span>{Number(article.views || 0).toLocaleString()} 阅读</span>
                                <span>{article.likes || 0} 赞</span>
                                <span>{article.comments || 0} 评</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ width: mobile ? '100%' : 180, display: 'flex', flexDirection: mobile ? 'row' : 'column', gap: 10, flexShrink: 0, flexWrap: mobile ? 'wrap' : 'nowrap' }}>
                    <button className="btn" onClick={()=>onNav('author', item.handle)}>
                      查看公开主页
                    </button>
                    {item.role !== 'ADMIN' && (
                      <button
                        className={item.isBanned ? 'btn' : 'btn btn-primary'}
                        disabled={busyId === item.id}
                        onClick={()=>onBanToggle(item)}
                        style={item.isBanned ? { color: '#49624a' } : undefined}>
                        {busyId === item.id ? '处理中…' : item.isBanned ? '解除封禁' : '封禁用户'}
                      </button>
                    )}
                    {item.bannedReason && (
                      <div style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.7 }}>
                        封禁原因：{item.bannedReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

window.PageAdminUsers = PageAdminUsers;
