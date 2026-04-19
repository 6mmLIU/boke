/* global React, Icon, AdminShell, Loading */

// Minimal markdown -> html renderer
const renderMd = (src) => {
  if (!src) return '';
  let h = src
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h = h.replace(/^### (.*)$/gm, '<h3>$1</h3>')
       .replace(/^## (.*)$/gm, '<h2>$1</h2>')
       .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  h = h.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.+?)\*/g, '<em>$1</em>')
       .replace(/`(.+?)`/g, '<code>$1</code>')
       .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  h = h.split(/\n{2,}/).map(p => {
    if (/^<(h\d|blockquote|ul|ol)/.test(p.trim())) return p;
    return '<p>' + p.replace(/\n/g,'<br/>') + '</p>';
  }).join('\n');
  return h;
};

const COVER_OPTIONS = [
  { k: 'warm',   l: '赤陶', c: '#C5704A' },
  { k: 'moss',   l: '墨绿', c: '#6F8560' },
  { k: 'indigo', l: '藏青', c: '#4A6A8A' },
  { k: 'cream',  l: '米白', c: '#D9D0BE' },
];

const PageAdminEditor = ({ onNav, articleId, user }) => {
  const isEdit = !!articleId;
  const [title, setTitle] = React.useState('');
  const [titleEn, setTitleEn] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const [cover, setCover] = React.useState('warm');
  const [loadingArticle, setLoadingArticle] = React.useState(isEdit);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [focusedTool, setFocusedTool] = React.useState(null);
  const taRef = React.useRef(null);

  // Load existing article when editing
  React.useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoadingArticle(true);
    window.API.Articles.get(articleId)
      .then((a) => {
        if (cancelled) return;
        setTitle(a.title || '');
        setTitleEn(a.titleEn || '');
        setExcerpt(a.excerpt || '');
        setContent(a.content || '');
        setTagsInput((a.tags || []).join(', '));
        setCover(a.cover || 'warm');
      })
      .catch((err) => { if (!cancelled) setError(err.message || '加载失败'); })
      .finally(() => { if (!cancelled) setLoadingArticle(false); });
    return () => { cancelled = true; };
  }, [articleId, isEdit]);

  const wordCount = content.replace(/\s/g,'').length;
  const est = Math.max(1, Math.round(wordCount / 300));

  const insert = (before, after = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + sel.length;
    }, 0);
  };

  const tools = [
    { k: 'b', icon: 'bold',   a: ()=>insert('**','**'), title: '粗体' },
    { k: 'i', icon: 'italic', a: ()=>insert('*','*'),   title: '斜体' },
    { k: 'h', icon: 'doc',    a: ()=>insert('## '),     title: '标题' },
    { k: 'q', icon: 'quote',  a: ()=>insert('> '),      title: '引用' },
    { k: 'l', icon: 'list',   a: ()=>insert('- '),      title: '列表' },
    { k: 'k', icon: 'link',   a: ()=>insert('[','](url)'), title: '链接' },
    { k: 'm', icon: 'image',  a: ()=>insert('![alt](','url)'), title: '图片' },
    { k: 'c', icon: 'code',   a: ()=>insert('`','`'),   title: '代码' },
  ];

  const onPublish = async () => {
    setError('');
    if (!title.trim()) { setError('请填写标题'); return; }
    if (!excerpt.trim()) { setError('请填写摘要(用于首页和列表展示)'); return; }
    if (!content.trim()) { setError('请填写正文'); return; }

    const tags = tagsInput.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 10);
    const payload = {
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      excerpt: excerpt.trim(),
      content,
      cover,
      tags,
      readTime: est,
    };

    setPublishing(true);
    try {
      let result;
      if (isEdit) {
        result = await window.API.Articles.update(articleId, payload);
      } else {
        result = await window.API.Articles.create(payload);
      }
      onNav('article', result.id);
    } catch (err) {
      setError(err.message || '发布失败');
      if (err.details && Array.isArray(err.details)) {
        setError(err.details.map(d => d.message).join('；'));
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loadingArticle) {
    return (
      <AdminShell active="admin-editor" onNav={onNav} user={user}>
        <Loading label="读取草稿…"/>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="admin-editor" onNav={onNav} user={user}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <button className="btn btn-ghost" onClick={()=>onNav('admin-articles')} style={{ padding: '8px 12px' }}>
            ← 文章
          </button>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {isEdit ? '编辑文章' : '新建文章'}
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
            {wordCount} 字 · 约 {est} 分钟
          </div>
          <button className="btn btn-primary" onClick={onPublish} disabled={publishing}>
            {publishing ? '保存中…' : (isEdit ? '更新' : '发布')}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 32px', background: 'rgba(180,80,60,0.08)',
            color: 'var(--danger)', fontSize: 13, borderBottom: '1px solid var(--border)',
          }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
          {/* Editor pane */}
          <div style={{
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
            background: 'var(--surface-2)',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', gap: 2, padding: '10px 32px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}>
              {tools.map(t => (
                <button key={t.k} onClick={t.a} title={t.title}
                  onMouseEnter={()=>setFocusedTool(t.k)} onMouseLeave={()=>setFocusedTool(null)}
                  style={{
                    padding: 8, background: focusedTool === t.k ? 'var(--paper-2)' : 'transparent',
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    color: focusedTool === t.k ? 'var(--accent)' : 'var(--ink-3)',
                    transition: 'all var(--d-fast)',
                    transform: focusedTool === t.k ? 'translateY(-1px)' : 'translateY(0)',
                  }}>
                  <Icon name={t.icon} size={16}/>
                </button>
              ))}
              <div style={{ flex: 1 }}/>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', alignSelf: 'center', paddingRight: 8 }}>
                Markdown · 实时预览
              </div>
            </div>
            <div style={{ padding: '40px 64px', overflowY: 'auto', flex: 1 }}>
              <input
                value={title} onChange={e=>setTitle(e.target.value)}
                placeholder="一个可以说一整晚的标题…"
                style={{
                  width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 500,
                  color: 'var(--ink)', marginBottom: 8,
                  letterSpacing: '-0.02em',
                }}/>
              <input
                value={titleEn} onChange={e=>setTitleEn(e.target.value)}
                placeholder="English title (optional)"
                style={{
                  width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18,
                  color: 'var(--ink-3)', marginBottom: 14,
                }}/>
              <textarea
                value={excerpt} onChange={e=>setExcerpt(e.target.value)}
                placeholder="一句话摘要 — 会出现在首页和列表里"
                style={{
                  width: '100%', minHeight: 56, resize: 'vertical',
                  border: '1px dashed var(--border)', borderRadius: 8,
                  padding: 10, outline: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6,
                  color: 'var(--ink-2)', marginBottom: 14,
                }}/>
              <input
                value={tagsInput} onChange={e=>setTagsInput(e.target.value)}
                placeholder="标签,用逗号分隔(如:写作, 慢生活)"
                style={{
                  width: '100%', padding: 10, border: '1px dashed var(--border)',
                  borderRadius: 8, outline: 'none', background: 'transparent',
                  fontSize: 13, color: 'var(--ink-2)', marginBottom: 14,
                }}/>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>封面:</span>
                {COVER_OPTIONS.map(o => (
                  <button key={o.k} onClick={()=>setCover(o.k)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: cover === o.k ? 'var(--paper-2)' : 'transparent',
                    border: '1px solid ' + (cover === o.k ? 'var(--accent)' : 'var(--border)'),
                    borderRadius: 'var(--r-pill)', cursor: 'pointer',
                    fontSize: 12, color: 'var(--ink-2)', fontFamily: 'inherit',
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: o.c }}/>
                    {o.l}
                  </button>
                ))}
              </div>
              <textarea
                ref={taRef}
                value={content} onChange={e=>setContent(e.target.value)}
                placeholder="从一个清澈的句子开始…"
                style={{
                  width: '100%', minHeight: 400, border: 'none', outline: 'none', resize: 'none',
                  background: 'transparent', fontFamily: 'var(--mono)', fontSize: 14,
                  lineHeight: 1.8, color: 'var(--ink-2)',
                }}/>
            </div>
          </div>

          {/* Preview pane */}
          <div style={{ padding: '56px 64px', overflowY: 'auto', background: 'var(--paper)' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>
              — 实时预览 · Live preview
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, marginBottom: 6, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{title || '（未命名）'}</h1>
            {titleEn && (
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 18, marginBottom: 24 }}>— {titleEn}</div>
            )}
            <div className="md-preview"
              style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.85, color: 'var(--ink-2)' }}
              dangerouslySetInnerHTML={{ __html: renderMd(content) }}/>
            <style>{`
              .md-preview p { margin: 0 0 20px; }
              .md-preview h2 { font-size: 28px; margin: 36px 0 14px; color: var(--ink); font-weight: 500; letter-spacing: -0.01em; }
              .md-preview h3 { font-size: 22px; margin: 28px 0 10px; color: var(--ink); font-weight: 500; }
              .md-preview blockquote { margin: 28px 0; padding: 16px 24px; border-left: 3px solid var(--accent); background: var(--accent-wash); font-style: italic; border-radius: 0 8px 8px 0; }
              .md-preview strong { color: var(--ink); font-weight: 600; }
              .md-preview em { color: var(--ink); }
              .md-preview code { background: var(--paper-2); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: var(--accent-deep); font-family: var(--mono); }
              .md-preview a { color: var(--accent); border-bottom: 1px solid currentColor; }
            `}</style>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminEditor = PageAdminEditor;
