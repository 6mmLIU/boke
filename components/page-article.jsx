/* global React, Icon, Avatar, Cover, TopNav, EmptyState, Loading, formatDate, formatRelative, adaptArticle, renderMd */

const PageArticle = ({ onNav, articleId, user }) => {
  const [article, setArticle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [liked, setLiked] = React.useState(false);
  const [likes, setLikes] = React.useState(0);
  const [likeBusy, setLikeBusy] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const [comments, setComments] = React.useState([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState('');

  // Fetch the article
  React.useEffect(() => {
    if (!articleId) {
      setArticle(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    window.API.Articles.get(articleId)
      .then((a) => {
        if (cancelled) return;
        const adapted = adaptArticle(a);
        setArticle(adapted);
        setLikes(adapted.likes || 0);
        setLiked(!!a.userLiked);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [articleId]);

  // Fetch comments
  React.useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    setCommentsLoading(true);
    window.API.Comments.list(articleId, { limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setComments(res.comments || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [articleId]);

  // Reading progress
  React.useEffect(() => {
    const handler = () => {
      const el = document.documentElement;
      const p = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const onLike = async () => {
    if (!user) { onNav && onNav('auth'); return; }
    if (likeBusy || !article) return;
    setLikeBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(n => wasLiked ? Math.max(0, n - 1) : n + 1);
    try {
      if (wasLiked) await window.API.Articles.unlike(article.id);
      else await window.API.Articles.like(article.id);
    } catch (err) {
      setLiked(wasLiked);
      setLikes(n => wasLiked ? n + 1 : Math.max(0, n - 1));
    } finally {
      setLikeBusy(false);
    }
  };

  const onPost = async () => {
    if (!user) { onNav && onNav('auth'); return; }
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const res = await window.API.Comments.create(article.id, text);
      setComments(cs => [{ ...res.comment, isNew: true }, ...cs]);
      setDraft('');
    } catch (err) {
      setPostError(err.message || '评论发布失败');
    } finally {
      setPosting(false);
    }
  };

  // ── Render guards ──
  if (!articleId) {
    return (
      <div>
        <TopNav active="home" onNav={onNav} user={user}/>
        <EmptyState
          icon="doc"
          title="请先选一篇文章"
          subtitle="Pick an article from the home feed."
          action={<button className="btn btn-primary" onClick={()=>onNav && onNav('home')}>回到首页</button>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <TopNav active="home" onNav={onNav} user={user}/>
        <Loading label="正在打开文章…"/>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div>
        <TopNav active="home" onNav={onNav} user={user}/>
        <EmptyState
          icon="x"
          title="文章无法打开"
          subtitle={error || '可能已被删除或暂时不可用'}
          action={<button className="btn btn-primary" onClick={()=>onNav && onNav('home')}>回到首页</button>}
        />
      </div>
    );
  }

  const a = article;
  const bodyHtml = renderMd(a.content || '');

  return (
    <div>
      <TopNav active="home" onNav={onNav} user={user}/>
      {/* Reading progress */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 60,
        background: 'transparent',
      }}>
        <div style={{
          height: '100%', width: progress * 100 + '%',
          background: 'var(--accent)',
          transition: 'width 120ms linear',
        }}/>
      </div>

      <Cover variant={a.cover} height={320} rounded={false}/>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px' }}>
        <div className="fade-up">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(a.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
            <span style={{ fontSize: 12, color: 'var(--ink-4)', marginLeft: 8 }}>
              {formatDate(a.createdAt) || a.date} · {a.readTime} 分钟阅读 · {(a.views || 0).toLocaleString()} 阅读
            </span>
          </div>
          <h1 style={{ fontSize: 52, lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.02em' }}>{a.title}</h1>
          {a.titleEn && (
            <div style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic',
              fontSize: 22, color: 'var(--ink-3)', marginBottom: 32,
            }}>— {a.titleEn}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 40 }}>
            <div
              onClick={() => a.author.handle && onNav && onNav('author', a.author.handle)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                cursor: a.author.handle ? 'pointer' : 'default',
              }}>
              <Avatar char={a.author.avatar} size={44} accent/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{a.author.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                  @{a.author.handle}
                  {typeof a.author.articles === 'number' ? ` · ${a.author.articles} 篇文章` : ''}
                  {typeof a.author.followers === 'number' ? ` · ${a.author.followers.toLocaleString()} 读者` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {bodyHtml ? (
          <div className="article-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}/>
        ) : (
          <div className="article-body">
            <p style={{ color: 'var(--ink-4)' }}>（这篇文章还没有正文。）</p>
          </div>
        )}
        <style>{`
          .article-body { font-family: var(--serif); font-size: 19px; line-height: 1.85; color: var(--ink-2); }
          .article-body p { margin: 0 0 20px; }
          .article-body h1 { font-size: 36px; margin: 48px 0 18px; color: var(--ink); font-weight: 500; letter-spacing: -0.01em; line-height: 1.25; }
          .article-body h2 { font-size: 28px; margin: 40px 0 14px; color: var(--ink); font-weight: 500; letter-spacing: -0.005em; line-height: 1.3; }
          .article-body h3 { font-size: 22px; margin: 32px 0 12px; color: var(--ink); font-weight: 500; }
          .article-body h4, .article-body h5, .article-body h6 { font-size: 18px; margin: 24px 0 10px; color: var(--ink); font-weight: 500; }
          .article-body blockquote { margin: 28px 0; padding: 14px 22px; border-left: 3px solid var(--accent); background: var(--accent-wash); font-style: italic; border-radius: 0 8px 8px 0; color: var(--ink-2); }
          .article-body blockquote p:last-child { margin-bottom: 0; }
          .article-body hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
          .article-body ul, .article-body ol { margin: 0 0 20px; padding-left: 1.8em; }
          .article-body li { margin: 6px 0; }
          .article-body strong { color: var(--ink); font-weight: 600; }
          .article-body em { color: var(--ink); }
          .article-body code { background: var(--paper-2); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: var(--accent-deep); font-family: var(--mono); }
          .article-body a { color: var(--accent); border-bottom: 1px solid currentColor; }
          .article-body .md-fig { margin: 32px 0; text-align: center; }
          .article-body .md-fig img { display: block; margin: 0 auto; max-width: 100%; max-height: 520px; height: auto; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 2px 18px rgba(20,20,20,0.08); background: var(--paper-2); }
          .article-body .md-fig figcaption { margin-top: 10px; font-family: var(--serif); font-style: italic; font-size: 13px; color: var(--ink-4); }
          /* Drop-cap on the first paragraph only */
          .article-body > p:first-of-type { font-size: 22px; color: var(--ink); }
          .article-body > p:first-of-type::first-letter {
            float: left; font-family: var(--serif); font-size: 72px; line-height: 0.85;
            margin: 8px 12px 0 0; color: var(--accent);
          }
        `}</style>

        {/* Action bar (sticky bottom-floating) */}
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, padding: 6,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 40,
          backdropFilter: 'blur(12px)',
        }}>
          <button onClick={onLike} disabled={likeBusy} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', border: 'none', cursor: likeBusy ? 'wait' : 'pointer',
            background: liked ? 'var(--accent-wash)' : 'transparent',
            color: liked ? 'var(--accent-deep)' : 'var(--ink-2)',
            borderRadius: 'var(--r-pill)',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
            transition: 'all var(--d-fast) var(--ease-out)',
            position: 'relative',
            opacity: likeBusy ? 0.7 : 1,
          }}>
            <span style={{
              display: 'inline-flex',
              transform: liked ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 320ms var(--ease-spring)',
              color: liked ? 'var(--accent)' : 'inherit',
            }}>
              <Icon name="heart" size={16} style={{ fill: liked ? 'currentColor' : 'none' }}/>
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{likes}</span>
            {liked && (
              <span style={{
                position: 'absolute', top: -8, left: 20,
                color: 'var(--accent)',
                animation: 'floatUp 900ms var(--ease-out) forwards',
                pointerEvents: 'none', fontSize: 16,
              }}>♥</span>
            )}
          </button>
          <button style={{ padding: 10, border: 'none', background: 'transparent', borderRadius: 'var(--r-pill)', cursor: 'pointer', color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Icon name="chat" size={16}/>{comments.length}
          </button>
          <button onClick={()=>setBookmarked(b=>!b)} style={{
            padding: 10, border: 'none', cursor: 'pointer',
            background: bookmarked ? 'var(--accent-wash)' : 'transparent',
            color: bookmarked ? 'var(--accent-deep)' : 'var(--ink-2)',
            borderRadius: 'var(--r-pill)',
          }}>
            <Icon name="bookmark" size={16} style={{ fill: bookmarked ? 'currentColor' : 'none' }}/>
          </button>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>读者笔谈</h2>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', marginBottom: 28 }}>
            {comments.length} Conversations
          </div>

          {user ? (
            <div className="card" style={{ padding: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar char={user.name ? user.name[0] : '你'} size={40} accent/>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={draft}
                    onChange={e=>setDraft(e.target.value)}
                    placeholder="写下你的想法…"
                    disabled={posting}
                    style={{
                      width: '100%', minHeight: 72, resize: 'vertical',
                      border: 'none', background: 'transparent',
                      fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.7,
                      color: 'var(--ink)', outline: 'none',
                    }}
                  />
                  {postError && (
                    <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{postError}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 8, color: 'var(--ink-4)' }}>
                      <Icon name="bold" size={15}/><Icon name="italic" size={15}/><Icon name="link" size={15}/><Icon name="quote" size={15}/>
                    </div>
                    <button onClick={onPost} className="btn btn-primary" style={{ fontSize: 13 }} disabled={!draft.trim() || posting}>
                      {posting ? '发布中…' : '发布笔谈'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 20, marginBottom: 28, textAlign: 'center' }}>
              <div style={{ color: 'var(--ink-3)', marginBottom: 12 }}>登录后即可发表笔谈</div>
              <button className="btn btn-primary" onClick={()=>onNav && onNav('auth')}>登录 / 注册</button>
            </div>
          )}

          {commentsLoading ? (
            <Loading label="读取笔谈…"/>
          ) : comments.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-4)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
              还没有人留言 — 来做第一位提笔的人。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {comments.map((c, i) => (
                <Comment key={c.id} comment={c} delay={c.isNew ? 0 : i*60}/>
              ))}
            </div>
          )}
        </div>
      </article>

      <style>{`
        @keyframes floatUp { 0%{opacity:0; transform:translateY(0) scale(.7)} 20%{opacity:1} 100%{opacity:0; transform:translateY(-30px) scale(1.3)} }
      `}</style>
    </div>
  );
};

const Comment = ({ comment, delay = 0 }) => {
  const author = comment.author || {};
  const name = author.name || comment.authorName || '匿名';
  const handle = author.handle || comment.handle || '';
  const avatarChar = author.avatar || (name ? name[0] : '匿');
  const time = comment.createdAt
    ? formatRelative(comment.createdAt)
    : (comment.time || '');
  return (
    <div className="fade-up" style={{ animationDelay: delay + 'ms', display: 'flex', gap: 14 }}>
      <Avatar char={avatarChar} size={38}/>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{name}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
            {handle ? `@${handle}` : ''}{handle && time ? ' · ' : ''}{time}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-2)', marginBottom: 10, whiteSpace: 'pre-wrap' }}>
          {comment.text}
        </div>
      </div>
    </div>
  );
};

window.PageArticle = PageArticle;
