/* global React, Icon, AdminShell, Loading, renderMd */

// Resize clipboard or local images before uploading to the backend.
// Keeps longest edge <= maxDim so writing stays lightweight.
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
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [error, setError] = React.useState('');
  const [focusedTool, setFocusedTool] = React.useState(null);
  const [imagePanelOpen, setImagePanelOpen] = React.useState(false);
  const [imageUrlInput, setImageUrlInput] = React.useState('');
  const [imageAltInput, setImageAltInput] = React.useState('');
  const [dragActive, setDragActive] = React.useState(false);
  const taRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // 自定义光标（带扫尾拖影）
  const [caret, setCaret] = React.useState({ x: 0, y: 0, h: 25, on: false });
  const [typing, setTyping] = React.useState(false);
  const mirrorRef = React.useRef(null);
  const typingTmrRef = React.useRef(null);

  const pokeTyping = () => {
    setTyping(true);
    if (typingTmrRef.current) clearTimeout(typingTmrRef.current);
    typingTmrRef.current = setTimeout(() => setTyping(false), 650);
  };

  const updateCaret = React.useCallback(() => {
    const ta = taRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;
    const cs = window.getComputedStyle(ta);
    ['fontSize','fontFamily','fontWeight','lineHeight','letterSpacing'].forEach(p => {
      mirror.style[p] = cs[p];
    });
    mirror.style.padding = '0';
    mirror.style.width = ta.clientWidth + 'px';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflowWrap = 'break-word';

    const pos = ta.selectionEnd ?? 0;
    const val = ta.value || '';
    mirror.textContent = val.slice(0, pos);
    const span = document.createElement('span');
    span.textContent = '\u200b';
    mirror.appendChild(span);
    mirror.appendChild(document.createTextNode(val.slice(pos) || ' '));

    const x = span.offsetLeft;
    const y = span.offsetTop;
    const lh = parseFloat(cs.lineHeight) || 25;
    setCaret({ x, y, h: lh, on: document.activeElement === ta });
  }, []);

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

  React.useEffect(() => { updateCaret(); }, [content, updateCaret]);

  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const poke = () => { pokeTyping(); setTimeout(updateCaret, 0); };
    const onClick = () => setTimeout(updateCaret, 0);
    const onFocus = () => setTimeout(updateCaret, 0);
    const onBlur = () => setCaret(c => ({ ...c, on: false }));
    ta.addEventListener('keyup', poke);
    ta.addEventListener('keydown', poke);
    ta.addEventListener('click', onClick);
    ta.addEventListener('focus', onFocus);
    ta.addEventListener('blur', onBlur);
    ta.addEventListener('select', onClick);
    window.addEventListener('resize', updateCaret);
    return () => {
      ta.removeEventListener('keyup', poke);
      ta.removeEventListener('keydown', poke);
      ta.removeEventListener('click', onClick);
      ta.removeEventListener('focus', onFocus);
      ta.removeEventListener('blur', onBlur);
      ta.removeEventListener('select', onClick);
      window.removeEventListener('resize', updateCaret);
    };
  }, [updateCaret]);

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

  const insertImageMarkdown = (url, alt = '') => {
    const safeAlt = (alt || '').replace(/\]/g, '').trim();
    insertAtCursor(`\n\n![${safeAlt}](${url})\n\n`);
  };

  const uploadImageDataUrl = async (dataUrl, filename = 'image') => {
    const res = await window.API.Uploads.image({ dataUrl, filename });
    return res.url;
  };

  const uploadImageFile = async (file, altText = '') => {
    try {
      setUploadingImage(true);
      setError('');
      const dataUrl = await compressImageToDataUrl(file);
      const url = await uploadImageDataUrl(dataUrl, file.name || 'image');
      insertImageMarkdown(url, altText);
      setImagePanelOpen(false);
      setImageUrlInput('');
    } catch (err) {
      setError(err.message || '图片上传失败');
    } finally {
      setUploadingImage(false);
      setDragActive(false);
    }
  };

  const replacePastedDataImages = async (text) => {
    const matches = [...text.matchAll(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/ig)];
    if (!matches.length) return text;

    let nextText = text;
    for (const match of matches) {
      const alt = match[1] || '';
      const dataUrl = match[2];
      const url = await uploadImageDataUrl(dataUrl, 'pasted-image');
      nextText = nextText.replace(match[0], `![${alt}](${url})`);
    }
    return nextText;
  };

  const handlePasteImage = async (file) => {
    try {
      await uploadImageFile(file, imageAltInput);
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
      if (m && /^data:image\//i.test(m[1])) {
        e.preventDefault();
        setUploadingImage(true);
        uploadImageDataUrl(m[1], 'clipboard-image')
          .then((url) => insertImageMarkdown(url, imageAltInput))
          .catch((err) => setError(err.message || '图片上传失败'))
          .finally(() => setUploadingImage(false));
        return;
      }
      if (m && /^https?:\/\//i.test(m[1])) {
        e.preventDefault();
        insertImageMarkdown(m[1], imageAltInput);
        return;
      }
    }

    // 3) Pasted markdown text that contains inline data:image payloads.
    const txt = cd.getData && cd.getData('text/plain');
    if (txt && /!\[[^\]]*]\(data:image\//i.test(txt)) {
      e.preventDefault();
      setUploadingImage(true);
      replacePastedDataImages(txt)
        .then((nextText) => insertAtCursor(nextText))
        .catch((err) => setError(err.message || '图片上传失败'))
        .finally(() => setUploadingImage(false));
      return;
    }

    // 4) Pasted plain text that is itself an image URL.
    if (txt && IMG_URL_RE.test(txt.trim())) {
      e.preventDefault();
      insertImageMarkdown(txt.trim(), imageAltInput);
      return;
    }
    // Otherwise fall through to default paste (text).
  };

  const onContentDragOver = (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.some((file) => file.type.startsWith('image/'))) return;
    e.preventDefault();
    setDragActive(true);
  };

  const onContentDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const onContentDrop = (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (!imageFile) return;
    e.preventDefault();
    setDragActive(false);
    uploadImageFile(imageFile, imageAltInput);
  };

  const onPickImageFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) uploadImageFile(file, imageAltInput);
    e.target.value = '';
  };

  const onInsertImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    insertImageMarkdown(url, imageAltInput);
    setImagePanelOpen(false);
    setImageUrlInput('');
  };

  const tools = [
    { k: 'b', icon: 'bold',   a: ()=>insert('**','**'), title: '粗体' },
    { k: 'i', icon: 'italic', a: ()=>insert('*','*'),   title: '斜体' },
    { k: 'h', icon: 'doc',    a: ()=>insert('## '),     title: '标题' },
    { k: 'q', icon: 'quote',  a: ()=>insert('> '),      title: '引用' },
    { k: 'l', icon: 'list',   a: ()=>insert('- '),      title: '列表' },
    { k: 'k', icon: 'link',   a: ()=>insert('[','](url)'), title: '链接' },
    { k: 'm', icon: 'image',  a: ()=>setImagePanelOpen(v => !v), title: '图片 — 上传 / 粘贴 / 拖拽' },
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
            {uploadingImage ? '图片上传中…' : `${wordCount} 字 · 约 ${est} 分钟`}
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
              {imagePanelOpen && (
                <div style={{
                  padding: '18px 32px',
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(253, 251, 246, 0.8)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16,
                  alignItems: 'end',
                }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 6 }}>插入图片</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                        支持外链、拖拽、粘贴截图或直接上传。正文里只会写入图片 URL，不再塞入 Base64。
                      </div>
                    </div>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>图片地址</span>
                      <input
                        value={imageUrlInput}
                        onChange={(e)=>setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        style={{
                          width: '100%',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          outline: 'none',
                        }}/>
                    </label>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>替代文字（可选）</span>
                      <input
                        value={imageAltInput}
                        onChange={(e)=>setImageAltInput(e.target.value)}
                        placeholder="例如：书桌上的钢笔与便笺"
                        style={{
                          width: '100%',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          outline: 'none',
                        }}/>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPickImageFile} style={{ display: 'none' }}/>
                    <button className="btn" disabled={uploadingImage} onClick={()=>fileInputRef.current && fileInputRef.current.click()}>
                      {uploadingImage ? '上传中…' : '选择图片'}
                    </button>
                    <button className="btn btn-primary" onClick={onInsertImageUrl} disabled={!imageUrlInput.trim()}>
                      插入外链
                    </button>
                  </div>
                </div>
              )}
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
              <div
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  outline: dragActive ? '2px dashed var(--accent)' : 'none',
                  outlineOffset: dragActive ? 10 : 0,
                  transition: 'outline-offset 120ms ease-out',
                }}
                onDragOver={onContentDragOver}
                onDragLeave={onContentDragLeave}
                onDrop={onContentDrop}>
                <textarea
                  ref={taRef}
                  value={content} onChange={e=>setContent(e.target.value)}
                  onPaste={onContentPaste}
                  placeholder="从一个清澈的句子开始…（支持拖拽、粘贴、上传图片）"
                  className="editor-ta-hide-caret"
                  style={{
                    width: '100%', minHeight: 400, border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: 'var(--mono)', fontSize: 14,
                    lineHeight: 1.8, color: 'var(--ink-2)',
                  }}/>
                {dragActive && (
                  <div style={{
                    position: 'absolute',
                    inset: -14,
                    borderRadius: 20,
                    background: 'rgba(197, 112, 74, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    color: 'var(--accent-deep)',
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                  }}>
                    松开以上传并插入图片
                  </div>
                )}
                {/* Mirror div for caret position measurement */}
                <div ref={mirrorRef} aria-hidden="true" style={{
                  position: 'absolute', top: 0, left: 0,
                  visibility: 'hidden', pointerEvents: 'none',
                  whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                }}/>
                {/* Custom ink caret with trailing wash */}
                {caret.on && (
                  <div style={{
                    position: 'absolute',
                    left: caret.x,
                    top: caret.y,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}>
                    {/* Trailing wash — a soft gradient that bleeds downward
                        when typing, like ink soaking into paper */}
                    <div className="ink-trail" style={{
                      position: 'absolute',
                      left: -3,
                      top: 0,
                      width: 8,
                      height: caret.h * 2.5,
                      borderRadius: '0 0 4px 4px',
                      background: `linear-gradient(to bottom, var(--accent-soft) 0%, var(--accent-wash) 40%, transparent 100%)`,
                      opacity: typing ? 0.55 : 0,
                      transform: typing ? `scaleY(1) translateY(${caret.h * 0.15}px)` : `scaleY(0.3) translateY(0px)`,
                      transformOrigin: 'top center',
                      transition: typing
                        ? 'opacity 0.12s ease-out, transform 0.18s ease-out'
                        : 'opacity 0.8s ease-in, transform 0.9s ease-in',
                      filter: 'blur(2px)',
                    }}/>
                    {/* Secondary softer wash — wider, more diffuse */}
                    <div style={{
                      position: 'absolute',
                      left: -6,
                      top: 0,
                      width: 14,
                      height: caret.h * 1.8,
                      borderRadius: '0 0 6px 6px',
                      background: `radial-gradient(ellipse at top center, var(--accent-wash) 0%, transparent 70%)`,
                      opacity: typing ? 0.35 : 0,
                      transform: typing ? 'scaleY(1)' : 'scaleY(0.2)',
                      transformOrigin: 'top center',
                      transition: typing
                        ? 'opacity 0.15s ease-out, transform 0.2s ease-out'
                        : 'opacity 1s ease-in, transform 1.1s ease-in',
                      filter: 'blur(4px)',
                    }}/>
                    {/* Main caret line — slim, with soft glow */}
                    <div className={typing ? 'ink-caret ink-caret--typing' : 'ink-caret'} style={{
                      position: 'relative',
                      width: 1.5,
                      height: caret.h,
                      borderRadius: 1,
                      background: 'var(--accent)',
                    }}/>
                  </div>
                )}
              </div>
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
              .md-preview h1 { font-size: 32px; margin: 40px 0 16px; color: var(--ink); font-weight: 500; letter-spacing: -0.01em; }
              .md-preview hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
              .md-preview ul, .md-preview ol { margin: 0 0 20px; padding-left: 1.6em; }
              .md-preview li { margin: 4px 0; }
              .md-preview .md-fig { margin: 28px 0; text-align: center; }
              .md-preview .md-fig img { display: block; margin: 0 auto; max-width: 100%; max-height: 480px; height: auto; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 2px 14px rgba(20,20,20,0.08); background: var(--paper-2); }
              .md-preview .md-fig figcaption { margin-top: 8px; font-family: var(--serif); font-style: italic; font-size: 12px; color: var(--ink-4); }
              .md-preview p img { display: inline-block; max-width: 100%; max-height: 1.4em; vertical-align: middle; border-radius: 4px; }

              /* ── Custom ink caret ── */
              .editor-ta-hide-caret { caret-color: transparent; }

              /* Idle: gentle breathing blink */
              @keyframes inkBreath {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.2; }
              }

              .ink-caret {
                animation: inkBreath 1.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                box-shadow: 0 0 6px 1px var(--accent-wash);
              }

              /* While typing: stay solid, no blink, subtle glow */
              .ink-caret--typing {
                animation: none;
                opacity: 1;
                box-shadow: 0 0 8px 2px var(--accent-wash), 0 0 3px 0 var(--accent-soft);
              }
            `}</style>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminEditor = PageAdminEditor;
