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
  // Image: must come before link so ![alt](url) isn't caught as a link
  h = h.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, url, title) => `<img src="${url}" alt="${alt || ''}"${title ? ` title="${title}"` : ''}/>`);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.+?)\*/g, '<em>$1</em>')
       .replace(/`(.+?)`/g, '<code>$1</code>')
       .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  h = h.split(/\n{2,}/).map(p => {
    const t = p.trim();
    if (/^<(h\d|blockquote|ul|ol)/.test(t)) return p;
    // A paragraph that is just an image: render as a figure so the image
    // becomes a proper block element without <p> wrapping around it.
    if (/^<img\b[^>]*\/?>\s*$/.test(t)) return `<figure class="md-fig">${t}</figure>`;
    return '<p>' + p.replace(/\n/g,'<br/>') + '</p>';
  }).join('\n');
  return h;
};

// Resize a pasted image so the embedded data URL doesn't balloon
// the article payload. Keeps longest edge <= maxDim.
const compressImageToDataUrl = (file, maxDim = 1600, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片解码失败'));
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          // Preserve transparency for PNG; JPEG otherwise for smaller size.
          const out = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(out, quality));
        } catch (e) { reject(e); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const IMG_URL_RE = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg|avif|bmp)(?:\?\S*)?$/i;

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

  // Drop `text` at the cursor, collapsing the selection. Safe to call
  // from async handlers — reads the live textarea state each time.
  const insertAtCursor = (text) => {
    const ta = taRef.current;
    if (!ta) { setContent(c => c + text); return; }
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const next = value.slice(0, s) + text + value.slice(e);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      const pos = s + text.length;
      ta.selectionStart = ta.selectionEnd = pos;
    }, 0);
  };

  const handlePasteImage = async (file) => {
    try {
      const dataUrl = await compressImageToDataUrl(file);
      insertAtCursor(`\n\n![](${dataUrl})\n\n`);
    } catch (err) {
      setError(err.message || '图片处理失败');
    }
  };

  const onContentPaste = (e) => {
    const cd = e.clipboardData;
    if (!cd) return;

    // 1) Local image file in clipboard (screenshot, copied file, etc.)
    const items = Array.from(cd.items || []);
    const imgItem = items.find(it => it.kind === 'file' && it.type.startsWith('image/'));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        e.preventDefault();
        handlePasteImage(file);
        return;
      }
    }

    // 2) Copied image from a web page — clipboard usually carries HTML
    //    with the <img> tag. Extract src and insert as markdown.
    const html = cd.getData && cd.getData('text/html');
    if (html) {
      const m = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (m && /^https?:\/\//i.test(m[1])) {
        e.preventDefault();
        insertAtCursor(`\n\n![](${m[1]})\n\n`);
        return;
      }
    }

    // 3) Pasted plain text that is itself an image URL.
    const txt = cd.getData && cd.getData('text/plain');
    if (txt && IMG_URL_RE.test(txt.trim())) {
      e.preventDefault();
      insertAtCursor(`\n\n![](${txt.trim()})\n\n`);
      return;
    }
    // Otherwise fall through to default paste (text).
  };

  const tools = [
    { k: 'b', icon: 'bold',   a: ()=>insert('**','**'), title: '粗体' },
    { k: 'i', icon: 'italic', a: ()=>insert('*','*'),   title: '斜体' },
    { k: 'h', icon: 'doc',    a: ()=>insert('## '),     title: '标题' },
    { k: 'q', icon: 'quote',  a: ()=>insert('> '),      title: '引用' },
    { k: 'l', icon: 'list',   a: ()=>insert('- '),      title: '列表' },
    { k: 'k', icon: 'link',   a: ()=>insert('[','](url)'), title: '链接' },
    { k: 'm', icon: 'image',  a: ()=>{
        const url = window.prompt('图片链接(或直接在正文 Ctrl/⌘-V 粘贴图片):', '');
        if (url && url.trim()) insertAtCursor(`\n\n![](${url.trim()})\n\n`);
      }, title: '图片 — 可直接粘贴' },
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
                onPaste={onContentPaste}
                placeholder="从一个清澈的句子开始…(可直接粘贴图片)"
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
              .md-preview .md-fig { margin: 28px 0; text-align: center; }
              .md-preview .md-fig img { display: block; margin: 0 auto; max-width: 100%; max-height: 480px; height: auto; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 2px 14px rgba(20,20,20,0.08); background: var(--paper-2); }
              .md-preview p img { display: inline-block; max-width: 100%; max-height: 1.4em; vertical-align: middle; border-radius: 4px; }
            `}</style>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminEditor = PageAdminEditor;
