/* global React, Icon, Avatar, Cover, TopNav, ArticleCard, EmptyState, Loading, adaptArticle */

const PageProfile = ({ onNav, user }) => {
  const [tab, setTab] = React.useState('articles');
  const [articles, setArticles] = React.useState([]);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = React.useState(true);
  const [error, setError] = React.useState('');
  const [articlesError, setArticlesError] = React.useState('');
  const [bookmarksError, setBookmarksError] = React.useState('');
  const [profileDraft, setProfileDraft] = React.useState({ name: '', bio: '' });
  const [handleDraft, setHandleDraft] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingHandle, setSavingHandle] = React.useState(false);
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setProfileDraft({
      name: user.name || '',
      bio: user.bio || '',
    });
    setHandleDraft(user.handle || '');
  }, [user]);

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setArticlesError('');
    window.API.Articles.list({ author: user.handle, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setArticles((res.articles || []).map(adaptArticle));
      })
      .catch((err) => {
        if (cancelled) return;
        setArticlesError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user && user.handle]);

  React.useEffect(() => {
    if (!user) { setLoadingBookmarks(false); return; }
    let cancelled = false;
    setLoadingBookmarks(true);
    setBookmarksError('');
    window.API.Users.bookmarks()
      .then((res) => {
        if (cancelled) return;
        setBookmarks((res.articles || []).map(adaptArticle));
      })
      .catch((err) => {
        if (cancelled) return;
        setBookmarksError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoadingBookmarks(false); });
    return () => { cancelled = true; };
  }, [user && user.id]);

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

  const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0);
  const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  const stats = [
    { label: '文章', value: articles.length },
    { label: '阅读', value: totalViews },
    { label: '获赞', value: totalLikes },
    { label: '加入', value: user.createdAt ? new Date(user.createdAt).getFullYear() : '—' },
  ];
  const tabs = [
    { k: 'articles', l: '文章', le: 'Articles', c: articles.length },
    { k: 'bookmarks', l: '收藏', le: 'Bookmarks', c: bookmarks.length },
    { k: 'about', l: '资料', le: 'Profile' },
  ];

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setNotice('');
    try {
      const res = await window.API.Users.updateProfile(profileDraft);
      window.Auth.syncUser(res.user);
      setNotice('资料已更新');
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleHandleSave = async () => {
    setSavingHandle(true);
    setNotice('');
    setError('');
    try {
      const res = await window.API.Users.updateHandle(handleDraft);
      window.Auth.syncUser(res.user);
      setHandleDraft(res.user.handle || '');
      setNotice('公开主页用户名已更新');
    } catch (err) {
      setError(err.message || '用户名更新失败');
      setHandleDraft(user.handle || '');
    } finally {
      setSavingHandle(false);
    }
  };

  const initial = user.name ? user.name[0] : '砚';
  const handleLocked = !!user.handleChangedAt;

  return (
    <div>
      <TopNav active="profile" onNav={onNav} user={user}/>
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
            <button className="btn" onClick={()=>onNav && onNav('author', user.handle)}>
              <Icon name="user" size={14}/> 公开主页
            </button>
            <button className="btn btn-primary" onClick={()=>onNav && onNav('admin')}>
              进入创作台
            </button>
          </div>
        </div>

        {notice && (
          <div style={{
            marginTop: 18,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(100, 130, 90, 0.08)',
            color: '#49624a',
            fontSize: 13,
          }}>{notice}</div>
        )}

        {error && (
          <div style={{
            marginTop: 18,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(180,80,60,0.08)',
            color: 'var(--danger)',
            fontSize: 13,
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }}>
          {stats.map((item, index) => (
            <div key={item.label} className="card fade-up" style={{ padding: '22px 24px', animationDelay: index*80+'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, letterSpacing: '-0.01em' }}>
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
          {tabs.map((tabItem) => (
            <button key={tabItem.k} onClick={()=>setTab(tabItem.k)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '14px 20px',
              fontSize: 14, fontWeight: 500,
              color: tab === tabItem.k ? 'var(--ink)' : 'var(--ink-4)',
              borderBottom: '2px solid ' + (tab === tabItem.k ? 'var(--accent)' : 'transparent'),
              transition: 'all var(--d-fast)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: -1,
            }}>
              {tabItem.l}
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 12 }}>{tabItem.le}</span>
              {tabItem.c !== undefined && <span className="tag" style={{ fontSize: 11, padding: '1px 8px' }}>{tabItem.c}</span>}
            </button>
          ))}
        </div>

        {tab === 'articles' && (
          loading ? (
            <Loading label="读取你的文章…"/>
          ) : articlesError ? (
            <EmptyState icon="x" title="加载失败" subtitle={articlesError}/>
          ) : articles.length === 0 ? (
            <EmptyState
              icon="feather"
              title="还没有发表文章"
              subtitle="Your study is quiet — write your first piece."
              action={<button className="btn btn-primary" onClick={()=>onNav && onNav('admin-editor', null)}>写第一篇</button>}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpen={(id)=>onNav('article', id)}
                  onOpenAuthor={(handle)=>onNav('author', handle)}
                  delay={index * 60}
                />
              ))}
            </div>
          )
        )}

        {tab === 'bookmarks' && (
          loadingBookmarks ? (
            <Loading label="读取你的收藏…"/>
          ) : bookmarksError ? (
            <EmptyState icon="x" title="加载失败" subtitle={bookmarksError}/>
          ) : bookmarks.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="还没有收藏文章"
              subtitle="在文章页点击书签后，会出现在这里。"
              action={<button className="btn btn-primary" onClick={()=>onNav && onNav('home')}>去看看首页</button>}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {bookmarks.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpen={(id)=>onNav('article', id)}
                  onOpenAuthor={(handle)=>onNav('author', handle)}
                  delay={index * 60}
                />
              ))}
            </div>
          )
        )}

        {tab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 6 }}>资料设置</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 20 }}>
                Update your public profile
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>笔名</span>
                  <input
                    value={profileDraft.name}
                    onChange={(e)=>setProfileDraft((draft) => ({ ...draft, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: 'var(--surface)',
                      outline: 'none',
                    }}/>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>个人简介</span>
                  <textarea
                    value={profileDraft.bio}
                    onChange={(e)=>setProfileDraft((draft) => ({ ...draft, bio: e.target.value }))}
                    rows={5}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: 'var(--surface)',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.7,
                    }}/>
                </label>
                <div>
                  <button className="btn btn-primary" disabled={savingProfile} onClick={handleProfileSave}>
                    {savingProfile ? '保存中…' : '保存资料'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 6 }}>公开主页用户名</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 20 }}>
                Your public handle
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>用户名</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--surface)',
                  }}>
                    <span style={{ color: 'var(--ink-4)' }}>@</span>
                    <input
                      value={handleDraft}
                      onChange={(e)=>setHandleDraft(e.target.value.replace(/^@+/, ''))}
                      disabled={handleLocked}
                      style={{
                        flex: 1,
                        padding: 12,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: handleLocked ? 'var(--ink-4)' : 'var(--ink)',
                      }}/>
                  </div>
                </label>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.7 }}>
                  {handleLocked
                    ? `你已经在 ${new Date(user.handleChangedAt).toLocaleDateString('zh-CN')} 修改过一次用户名，当前已锁定。`
                    : '用户名只能修改一次。支持小写字母、数字、下划线和短横线。'}
                </div>
                {user.previousHandle && (
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                    旧链接保留为：@{user.previousHandle}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" disabled={savingHandle || handleLocked} onClick={handleHandleSave}>
                    {savingHandle ? '更新中…' : '更新用户名'}
                  </button>
                  <button className="btn" onClick={()=>onNav && onNav('author', user.handle)}>
                    查看公开主页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.PageProfile = PageProfile;
