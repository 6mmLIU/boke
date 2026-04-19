/* global React, TopNav, EmptyState */

const PageAbout = ({ onNav, user }) => (
  <div>
    <TopNav active="home" onNav={onNav} user={user}/>
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '72px 48px 120px' }}>
      <div className="fade-up" style={{ marginBottom: 42 }}>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 15, marginBottom: 10 }}>
          — 关于 Inkwell · About
        </div>
        <h1 style={{ fontSize: 58, lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.03em' }}>
          给想法一方砚台。<br/>给写作者一间书房。
        </h1>
        <div style={{ maxWidth: 720, fontSize: 17, color: 'var(--ink-3)', lineHeight: 1.9 }}>
          Inkwell 正在从原型走向真正可用的慢写作平台。这里会逐步补齐平台介绍、写作原则、作者机制和运营说明。
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        <div className="card" style={{ padding: 30 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 10 }}>现在的方向</div>
          <div style={{ color: 'var(--ink-3)', lineHeight: 1.9, fontSize: 15 }}>
            这是一个偏作者中心的写作系统，不强调信息轰炸，而强调沉静、审美和作品沉淀。后续这里会补充完整的平台介绍内容。
          </div>
        </div>
        <div className="card" style={{ padding: 30 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 10 }}>内容待定</div>
          <div style={{ color: 'var(--ink-3)', lineHeight: 1.9, fontSize: 15, marginBottom: 18 }}>
            这里预留给创始人介绍、平台愿景、投稿规则或联系信息。
          </div>
          <div className="tag">About page in progress</div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <EmptyState
          icon="feather"
          title="这一页正在整理"
          subtitle="The voice of the platform is still being written."
        />
      </div>
    </div>
  </div>
);

window.PageAbout = PageAbout;
