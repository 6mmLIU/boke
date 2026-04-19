/* global React, ARTICLES, Icon, Avatar */

// ─────────────────────────────────────────────────────────
// Admin shell — sidebar + content
// ─────────────────────────────────────────────────────────
const AdminShell = ({ active, onNav, children }) => {
  const items = [
    { k: 'admin', l: '概览', le: 'Overview', icon: 'chart' },
    { k: 'admin-articles', l: '文章', le: 'Articles', icon: 'doc' },
    { k: 'admin-editor', l: '写作', le: 'Write', icon: 'feather' },
    { k: 'admin-comments', l: '评论', le: 'Comments', icon: 'chat' },
    { k: 'admin-readers', l: '读者', le: 'Readers', icon: 'user' },
    { k: 'admin-settings', l: '设置', le: 'Settings', icon: 'settings' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: '100vh', background: 'var(--paper)' }}>
      <aside style={{
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <a onClick={()=>onNav('home')} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px',
          fontFamily: 'var(--serif)', fontSize: 20, cursor: 'pointer',
          borderBottom: '1px solid var(--border)', marginBottom: 12,
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: 6, background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>砚</span>
          Inkwell <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--sans)', padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4, marginLeft: 'auto' }}>STUDIO</span>
        </a>
        {items.map(it => (
          <button key={it.k} onClick={()=>onNav(it.k)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            background: active === it.k ? 'var(--paper)' : 'transparent',
            border: '1px solid ' + (active === it.k ? 'var(--border)' : 'transparent'),
            borderRadius: 'var(--r-md)',
            color: active === it.k ? 'var(--ink)' : 'var(--ink-3)',
            fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: active === it.k ? 500 : 400, textAlign: 'left',
            transition: 'all var(--d-fast) var(--ease-out)',
          }}>
            <Icon name={it.icon} size={16}/>
            <span>{it.l}</span>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-4)', fontSize: 11, marginLeft: 'auto' }}>{it.le}</span>
          </button>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)' }}>
          <Avatar char="沈" size={32} accent/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>沈既白</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>@shenjibai</div>
          </div>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Dashboard — Overview
// ─────────────────────────────────────────────────────────
const PageAdminDashboard = ({ onNav }) => {
  const stats = [
    { label: '总阅读', value: 248932, delta: '+12.4%', up: true },
    { label: '总点赞', value: 18420, delta: '+8.1%', up: true },
    { label: '新读者', value: 1283, delta: '+24.2%', up: true },
    { label: '互动率', value: '7.3%', delta: '-0.4%', up: false },
  ];
  // Sparkline data
  const series = [12,18,14,22,28,26,34,38,32,40,44,48,46,52,58,54,62,66,70,68,74,78];
  const max = Math.max(...series);

  return (
    <AdminShell active="admin" onNav={onNav}>
      <div style={{ padding: '32px 48px 80px' }}>
        <div className="fade-up" style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 14, marginBottom: 8 }}>— 书斋近况 · Studio</div>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>早上好,沈既白</h1>
          <div style={{ color: 'var(--ink-3)' }}>过去 30 天,你的文字被 <b style={{ color: 'var(--ink)' }}>1,283</b> 位新读者读到。</div>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '32px 0' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="card fade-up" style={{ padding: '20px 22px', animationDelay: i*80+'ms' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 32, margin: '6px 0 4px', letterSpacing: '-0.01em' }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: 12, color: s.up ? 'var(--success)' : 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name={s.up ? 'arrowUp' : 'arrowDown'} size={12}/>{s.delta}
              </div>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>阅读趋势</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>Reading over time</div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', padding: 3, borderRadius: 'var(--r-pill)' }}>
              {['7 天','30 天','90 天'].map((t,i)=>(
                <button key={t} style={{
                  padding: '6px 14px', fontSize: 12, border: 'none', borderRadius: 'var(--r-pill)',
                  background: i===1 ? 'var(--surface)' : 'transparent', cursor: 'pointer',
                  color: i===1 ? 'var(--ink)' : 'var(--ink-3)',
                  fontWeight: i===1 ? 500 : 400,
                }}>{t}</button>
              ))}
            </div>
          </div>
          <svg viewBox={`0 0 ${series.length*24} 180`} width="100%" height="180" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28"/>
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path
              d={`M 0 ${180 - series[0]/max*160} ${series.map((v,i)=>`L ${i*24} ${180 - v/max*160}`).join(' ')} L ${(series.length-1)*24} 180 L 0 180 Z`}
              fill="url(#areaGrad)"
            >
              <animate attributeName="opacity" from="0" to="1" dur="800ms" fill="freeze"/>
            </path>
            <path
              d={`M 0 ${180 - series[0]/max*160} ${series.map((v,i)=>`L ${i*24} ${180 - v/max*160}`).join(' ')}`}
              fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="2000" strokeDashoffset="2000"
              style={{ animation: 'draw 1400ms var(--ease-out) forwards' }}
            />
            {series.map((v,i) => (
              <circle key={i} cx={i*24} cy={180 - v/max*160} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"
                style={{ opacity: 0, animation: `fadeIn 200ms ${600+i*30}ms forwards` }}/>
            ))}
          </svg>
          <style>{`
            @keyframes draw { to { stroke-dashoffset: 0; } }
            @keyframes fadeIn { to { opacity: 1; } }
          `}</style>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>最热文章</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Top articles</div>
            <div>
              {ARTICLES.slice(0,5).map((a,i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-4)', width: 20 }}>{i+1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.views.toLocaleString()} 阅读 · {a.likes} 赞</div>
                  </div>
                  <div style={{
                    width: 80, height: 24,
                  }}>
                    <svg width="80" height="24" viewBox="0 0 80 24">
                      <path d={`M 0 ${20 - (i*3)%12} Q 20 ${8+i*2} 40 ${14 - i} T 80 ${6 + (i%3)*4}`}
                        fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>最近互动</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 16 }}>Recent activity</div>
            {[
              { n: '林知夏', a: '喜欢了', t: '《在喧嚣中保留一方砚台》', when: '2 分钟前' },
              { n: '周砚之', a: '评论了', t: '《在喧嚣中保留一方砚台》', when: '14 分钟前' },
              { n: '陈墨言', a: '收藏了', t: '《我把博客搬离了平台》', when: '1 小时前' },
              { n: '叶竹',   a: '关注了你', t: '', when: '3 小时前' },
              { n: '苏砚秋', a: '喜欢了', t: '《关于专注…》', when: '5 小时前' },
            ].map((x,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <Avatar char={x.n[0]} size={30}/>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>
                  <b>{x.n}</b> <span style={{ color: 'var(--ink-3)' }}>{x.a}</span> {x.t && <span style={{ color: 'var(--accent)' }}>{x.t}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{x.when}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

window.PageAdminDashboard = PageAdminDashboard;
window.AdminShell = AdminShell;
