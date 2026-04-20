/* global React, Icon, AdminShell, Loading, analyzeArticleComposition, renderMd */

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

  const wrapBlock = (before, after, placeholder = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    const body = sel || placeholder;
    const next = value.slice(0, s) + before + body + after + value.slice(e);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + body.length;
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
    { k: 'ac', icon: 'alignCenter', a: ()=>wrapBlock('\n\n:::center\n', '\n:::\n\n', '要居中的文字'), title: '居中' },
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

  const previewProfile = React.useMemo(
    () => analyzeArticleComposition({ title, excerpt, content }),
    [title, excerpt, content]
  );

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
          padding: '18px 40px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 94%, transparent) 100%)',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <button
            onClick={()=>onNav('admin-articles')}
            onMouseEnter={(e)=>{ e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.transform = 'translateX(0)'; }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 10px 6px 0',
              cursor: 'pointer',
              color: 'var(--ink-3)',
              fontFamily: 'var(--serif)',
              fontSize: 14,
              letterSpacing: '0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color var(--d-fast) var(--ease-out), transform var(--d-fast) var(--ease-out)',
            }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> 文章
          </button>
          <div style={{
            width: 1,
            height: 22,
            background: 'var(--border-strong)',
            opacity: 0.7,
          }}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--serif)',
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}>
              {isEdit ? '编辑文章' : '新建文章'}
            </div>
            <div style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--ink-4)',
              letterSpacing: '0.01em',
            }}>
              {isEdit ? '— Refining a draft' : '— A new page'}
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            color: 'var(--ink-4)',
            fontFamily: 'var(--serif)',
            fontSize: 13,
            letterSpacing: '0.01em',
          }}>
            {uploadingImage ? (
              <span style={{ fontStyle: 'italic', color: 'var(--accent-deep)' }}>图片上传中…</span>
            ) : (
              <>
                <span style={{ color: 'var(--ink-2)', fontSize: 15 }}>{wordCount}</span>
                <span>字</span>
                <span style={{ color: 'var(--ink-5)' }}>·</span>
                <span style={{ fontStyle: 'italic' }}>约 {est} 分钟</span>
              </>
            )}
          </div>
          <button
            onClick={onPublish}
            disabled={publishing}
            onMouseEnter={(e)=>{ if (!publishing) { e.currentTarget.style.boxShadow = '0 10px 24px color-mix(in srgb, var(--accent) 28%, transparent), 0 2px 6px color-mix(in srgb, var(--accent) 14%, transparent)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={(e)=>{ e.currentTarget.style.boxShadow = '0 4px 14px color-mix(in srgb, var(--accent) 22%, transparent), 0 1px 3px color-mix(in srgb, var(--accent) 10%, transparent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              padding: '11px 26px',
              border: 'none',
              borderRadius: 999,
              background: publishing
                ? 'color-mix(in srgb, var(--accent) 55%, var(--ink-4))'
                : 'linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 100%)',
              color: '#fff',
              fontFamily: 'var(--serif)',
              fontSize: 15,
              letterSpacing: '0.04em',
              fontWeight: 500,
              cursor: publishing ? 'wait' : 'pointer',
              opacity: publishing ? 0.75 : 1,
              boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 22%, transparent), 0 1px 3px color-mix(in srgb, var(--accent) 10%, transparent)',
              transition: 'box-shadow var(--d-base) var(--ease-out), transform var(--d-base) var(--ease-out), background var(--d-base) var(--ease-out)',
            }}>
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
                  className="editor-ta"
                  style={{
                    width: '100%', minHeight: 400, border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: 'var(--mono)', fontSize: 14,
                    lineHeight: 1.8, color: 'var(--ink-2)',
                    caretColor: 'var(--accent)',
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

              </div>
            </div>
          </div>

          {/* Preview pane */}
          <div
            className="preview-stage reading-stage"
            data-reading-profile={previewProfile.shape}
            style={{ padding: 'clamp(28px, 4vw, 56px) clamp(20px, 5vw, 64px)', overflowY: 'auto', background: 'var(--paper)' }}>
            <div className="reading-shell">
              <div className="reading-header">
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>
                  — 实时预览 · Live preview
                </div>
                <h1 className="reading-title">{title || '（未命名）'}</h1>
                {titleEn && (
                  <div className="reading-subtitle">— {titleEn}</div>
                )}
                {excerpt && (
                  <div style={{
                    maxWidth: 'var(--reading-inline)',
                    color: 'var(--ink-3)',
                    fontSize: 14,
                    lineHeight: 1.75,
                    marginTop: titleEn ? -12 : 0,
                  }}>
                    {excerpt}
                  </div>
                )}
              </div>
              <div className="md-preview article-prose"
                dangerouslySetInnerHTML={{ __html: renderMd(content) }}/>
            </div>
            <style>{`
              .editor-ta::selection { background: var(--accent-wash); }
              .editor-ta::placeholder { color: var(--ink-4); font-style: italic; }
            `}</style>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminEditor = PageAdminEditor;
