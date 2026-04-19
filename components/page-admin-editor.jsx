/* global React, Icon, Avatar, AdminShell */

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

const PageAdminEditor = ({ onNav }) => {
  const [mode, setMode] = React.useState('markdown'); // 'markdown' | 'wysiwyg'
  const [title, setTitle] = React.useState('在喧嚣中保留一方砚台');
  const [content, setContent] = React.useState(`当整个互联网都在比拼"更快、更多、更响",写作这件事,忽然显得有点笨拙 —— 你得坐下来,把一个模糊的念头,一点点拧干,直到它变成一个清澈的句子。

而这个过程,是反效率的。它不适合算法,不适合推荐系统,也不适合 KPI。

## 一、我们为什么失去了慢

过去十年,写作的工具变了三次:从博客,到微博,再到算法化的内容流。

> "当你为了被看见而写,你就已经不是自己了。"

我不是要复古。我只是想,在效率主义的大合唱里,留一小块空地。

## 二、慢写作的三个小练习

这三件事,是我这两年慢慢摸索出来的:**先写再改**,*朗读一遍*,\`隔一天再发\`。`);
  const [saved, setSaved] = React.useState('刚刚已保存');
  const [focusedTool, setFocusedTool] = React.useState(null);
  const [showFloat, setShowFloat] = React.useState(false);
  const taRef = React.useRef(null);

  // Auto-save simulation
  React.useEffect(() => {
    setSaved('正在保存…');
    const t = setTimeout(() => setSaved('刚刚已保存'), 800);
    return () => clearTimeout(t);
  }, [title, content]);

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

  return (
    <AdminShell active="admin-editor" onNav={onNav}>
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
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-4)' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: saved === '正在保存…' ? 'var(--warn)' : 'var(--success)',
              animation: saved === '正在保存…' ? 'pulse 1.2s infinite' : 'none',
            }}/>
            {saved} · {wordCount} 字 · 约 {est} 分钟
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', padding: 3, borderRadius: 'var(--r-pill)' }}>
            {[{k:'markdown',l:'Markdown'},{k:'wysiwyg',l:'所见即所得'}].map(t => (
              <button key={t.k} onClick={()=>setMode(t.k)} style={{
                padding: '6px 14px', fontSize: 12, border: 'none', borderRadius: 'var(--r-pill)',
                background: mode === t.k ? 'var(--surface)' : 'transparent',
                color: mode === t.k ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: mode === t.k ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer', fontWeight: mode === t.k ? 500 : 400,
                transition: 'all var(--d-fast) var(--ease-out)',
              }}>{t.l}</button>
            ))}
          </div>
          <button className="btn">预览</button>
          <button className="btn btn-primary">发布</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mode === 'markdown' ? '1fr 1fr' : '1fr', flex: 1, minHeight: 0 }}>
          {/* Editor pane */}
          <div style={{
            borderRight: mode === 'markdown' ? '1px solid var(--border)' : 'none',
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
                {mode === 'markdown' ? 'Markdown · 实时预览' : '所见即所得'}
              </div>
            </div>
            <div style={{ padding: '40px 64px', overflowY: 'auto', flex: 1 }}>
              <input
                value={title} onChange={e=>setTitle(e.target.value)}
                placeholder="一个可以说一整晚的标题…"
                style={{
                  width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 500,
                  color: 'var(--ink)', marginBottom: 18,
                  letterSpacing: '-0.02em',
                }}/>
              {mode === 'markdown' ? (
                <textarea
                  ref={taRef}
                  value={content} onChange={e=>setContent(e.target.value)}
                  placeholder="从一个清澈的句子开始…"
                  style={{
                    width: '100%', minHeight: 400, border: 'none', outline: 'none', resize: 'none',
                    background: 'transparent', fontFamily: 'var(--mono)', fontSize: 14,
                    lineHeight: 1.8, color: 'var(--ink-2)',
                  }}/>
              ) : (
                <div
                  contentEditable suppressContentEditableWarning
                  onInput={e=>setContent(e.currentTarget.innerText)}
                  style={{
                    minHeight: 400, outline: 'none',
                    fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.85, color: 'var(--ink)',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMd(content) }}
                />
              )}
            </div>
          </div>

          {/* Preview pane */}
          {mode === 'markdown' && (
            <div style={{ padding: '56px 64px', overflowY: 'auto', background: 'var(--paper)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 13, marginBottom: 10 }}>
                — 实时预览 · Live preview
              </div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, marginBottom: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{title}</h1>
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
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </AdminShell>
  );
};

window.PageAdminEditor = PageAdminEditor;
