/* global React, ARTICLES, COMMENTS, Icon, Avatar, Cover, TopNav */

const PageArticle = ({ onNav }) => {
  const a = ARTICLES[0];
  const [liked, setLiked] = React.useState(false);
  const [likes, setLikes] = React.useState(a.likes);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [comments, setComments] = React.useState(COMMENTS);
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const handler = () => {
      const el = document.documentElement;
      const p = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const onLike = () => {
    setLiked(l => !l);
    setLikes(n => liked ? n - 1 : n + 1);
  };

  const onPost = () => {
    if (!draft.trim()) return;
    setComments(cs => [{
      id: 'n' + Date.now(), author: '你', avatar: '你', handle: 'you',
      time: '刚刚', likes: 0, text: draft.trim(), isNew: true,
    }, ...cs]);
    setDraft('');
  };

  return (
    <div>
      <TopNav active="home" onNav={onNav}/>
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

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 120px' }}>
        <div className="fade-up">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {a.tags.map(t => <span key={t} className="tag">{t}</span>)}
            <span style={{ fontSize: 12, color: 'var(--ink-4)', marginLeft: 8 }}>{a.date} · {a.readTime} 分钟阅读</span>
          </div>
          <h1 style={{ fontSize: 52, lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.02em' }}>{a.title}</h1>
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--ink-3)', marginBottom: 32,
          }}>— {a.titleEn}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 40 }}>
            <Avatar char={a.author.avatar} size={44} accent/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{a.author.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>@{a.author.handle} · 42 篇文章 · 8,920 读者</div>
            </div>
            <button className="btn" style={{ fontSize: 13 }}>+ 关注</button>
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.85,
          color: 'var(--ink-2)',
        }}>
          <p style={{ fontSize: 22, color: 'var(--ink)' }}>
            <span style={{
              float: 'left', fontFamily: 'var(--serif)', fontSize: 72, lineHeight: 0.85,
              marginRight: 12, marginTop: 8, color: 'var(--accent)',
            }}>当</span>
            整个互联网都在比拼"更快、更多、更响",写作这件事,忽然显得有点笨拙 —— 你得坐下来,把一个模糊的念头,一点点拧干,直到它变成一个清澈的句子。
          </p>
          <p>而这个过程,是反效率的。它不适合算法,不适合推荐系统,也不适合 KPI。它只适合那个慢下来、愿意陪自己想一想的人。</p>
          <h2 style={{ fontSize: 30, margin: '44px 0 20px' }}>一、我们为什么失去了慢</h2>
          <p>过去十年,写作的工具变了三次:从博客,到微博,再到算法化的内容流。每一次变化,都让写作离"表达自己"更远一点,离"讨好系统"更近一点。</p>
          <blockquote style={{
            margin: '36px 0', padding: '24px 32px',
            borderLeft: '3px solid var(--accent)',
            background: 'var(--accent-wash)',
            fontStyle: 'italic', fontSize: 20, color: 'var(--ink-2)',
            borderRadius: '0 var(--r-md) var(--r-md) 0',
          }}>
            "当你为了被看见而写,你就已经不是自己了。"
          </blockquote>
          <p>我不是要复古。我只是想,在效率主义的大合唱里,留一小块空地 —— 让一个人可以不为谁写,只为把自己的想法弄明白。</p>
          <h2 style={{ fontSize: 30, margin: '44px 0 20px' }}>二、慢写作的三个小练习</h2>
          <p>这三件事,是我这两年慢慢摸索出来的。它们不难,难的是每天都做:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li style={{ marginBottom: 12 }}><b style={{ color: 'var(--ink)' }}>先写再改。</b> 把第一稿当作"思考过程"而不是"成品",允许它粗糙。</li>
            <li style={{ marginBottom: 12 }}><b style={{ color: 'var(--ink)' }}>朗读一遍。</b> 你会立刻听出哪些句子是假的 —— 它们读起来不像人话。</li>
            <li><b style={{ color: 'var(--ink)' }}>隔一天再发。</b> 越是兴奋想发的文章,越值得放一放。</li>
          </ul>
          <p>写作是反复试错。没有一条捷径能跳过"把话讲清楚"这件事本身。</p>
        </div>

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
          <button onClick={onLike} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', border: 'none', cursor: 'pointer',
            background: liked ? 'var(--accent-wash)' : 'transparent',
            color: liked ? 'var(--accent-deep)' : 'var(--ink-2)',
            borderRadius: 'var(--r-pill)',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
            transition: 'all var(--d-fast) var(--ease-out)',
            position: 'relative',
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
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 2px' }}/>
          <button className="btn-ghost" style={{ padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-2)', fontSize: 14 }}>分享</button>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>读者笔谈</h2>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', marginBottom: 28 }}>
            {comments.length} Conversations
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar char="你" size={40} accent/>
              <div style={{ flex: 1 }}>
                <textarea
                  value={draft}
                  onChange={e=>setDraft(e.target.value)}
                  placeholder="写下你的想法…"
                  style={{
                    width: '100%', minHeight: 72, resize: 'vertical',
                    border: 'none', background: 'transparent',
                    fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.7,
                    color: 'var(--ink)', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8, color: 'var(--ink-4)' }}>
                    <Icon name="bold" size={15}/><Icon name="italic" size={15}/><Icon name="link" size={15}/><Icon name="quote" size={15}/>
                  </div>
                  <button onClick={onPost} className="btn btn-primary" style={{ fontSize: 13 }} disabled={!draft.trim()}>
                    发布笔谈
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {comments.map((c, i) => (
              <Comment key={c.id} comment={c} delay={c.isNew ? 0 : i*60}/>
            ))}
          </div>
        </div>
      </article>

      <style>{`
        @keyframes floatUp { 0%{opacity:0; transform:translateY(0) scale(.7)} 20%{opacity:1} 100%{opacity:0; transform:translateY(-30px) scale(1.3)} }
      `}</style>
    </div>
  );
};

const Comment = ({ comment, delay = 0 }) => {
  const [liked, setLiked] = React.useState(false);
  const [n, setN] = React.useState(comment.likes);
  return (
    <div className="fade-up" style={{ animationDelay: delay + 'ms', display: 'flex', gap: 14 }}>
      <Avatar char={comment.avatar} size={38}/>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{comment.author}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>@{comment.handle} · {comment.time}</span>
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-2)', marginBottom: 10 }}>
          {comment.text}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-4)' }}>
          <button onClick={()=>{setLiked(l=>!l); setN(v=>liked?v-1:v+1);}} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: liked ? 'var(--accent)' : 'var(--ink-4)',
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, fontSize: 12,
          }}>
            <Icon name="heart" size={13} style={{ fill: liked ? 'currentColor' : 'none' }}/>
            {n}
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 12 }}>回复</button>
        </div>
      </div>
    </div>
  );
};

window.PageArticle = PageArticle;
