/* global React, Auth, Icon */

// ─────────────────────────────────────────────────────────
// Login / Register page — real API
// ─────────────────────────────────────────────────────────
const PageAuth = ({ onNav }) => {
  const [mode, setMode] = React.useState('login'); // 'login' | 'register'
  const [focused, setFocused] = React.useState(null);
  const [values, setValues] = React.useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Already logged in? Bounce to home.
  React.useEffect(() => {
    if (window.Auth && window.Auth.isLoggedIn() && window.Auth.user) {
      onNav && onNav('home');
    }
  }, []);

  const doSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!values.email || !values.password) {
      setError('请填写邮箱和密码');
      return;
    }
    if (mode === 'register' && (!values.name || values.name.length < 2)) {
      setError('请填写至少 2 个字符的笔名');
      return;
    }
    if (mode === 'register' && values.password.length < 8) {
      setError('密码至少需要 8 个字符');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await window.Auth.register({
          email: values.email.trim(),
          password: values.password,
          name: values.name.trim(),
        });
      } else {
        await window.Auth.login({
          email: values.email.trim(),
          password: values.password,
        });
      }
      onNav && onNav('home');
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', placeholder }) => (
    <div style={{ position: 'relative', marginBottom: 18 }}>
      <label style={{
        position: 'absolute', left: 14,
        top: (focused === name || values[name]) ? -8 : 14,
        fontSize: (focused === name || values[name]) ? 11 : 14,
        color: focused === name ? 'var(--accent)' : 'var(--ink-4)',
        background: 'var(--surface)', padding: '0 6px',
        transition: 'all 220ms var(--ease-out)',
        pointerEvents: 'none',
        fontFamily: 'var(--sans)',
      }}>{label}</label>
      <input
        type={type} placeholder={focused === name ? placeholder : ''}
        value={values[name]}
        onChange={e=>setValues(v=>({...v, [name]: e.target.value}))}
        onFocus={()=>setFocused(name)} onBlur={()=>setFocused(null)}
        className="input" style={{ background: 'var(--surface)' }}
        autoComplete={type === 'password' ? (mode === 'register' ? 'new-password' : 'current-password') : (name === 'email' ? 'email' : 'off')}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--paper)',
    }}>
      {/* Left — brand side */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, var(--accent-wash) 0%, var(--paper-2) 50%, var(--paper) 100%)',
        padding: '56px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <ParticleField/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--serif)', fontSize: 22, position: 'relative', zIndex: 1 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>砚</span>
          <span>Inkwell</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--serif)', fontSize: 48, lineHeight: 1.2,
            color: 'var(--ink)', marginBottom: 20, letterSpacing: '-0.02em',
          }}>
            给想法<br/>一方砚台。
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-3)', marginBottom: 8 }}>
            A quiet place for slow writing.
          </div>
          <div style={{ color: 'var(--ink-3)', fontSize: 15, maxWidth: 380, lineHeight: 1.7 }}>
            不追赶热点,不计较流量。在这里写的每一篇,都值得被慢慢读完。
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 13, color: 'var(--ink-3)', position: 'relative', zIndex: 1 }}>
          <div><b style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>12,480</b><br/>作者</div>
          <div><b style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>384,291</b><br/>文章</div>
          <div><b style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>2.1 M</b><br/>字</div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* tabs */}
          <div style={{
            display: 'inline-flex', position: 'relative',
            background: 'var(--paper-2)', borderRadius: 'var(--r-pill)',
            padding: 4, marginBottom: 32,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              position: 'absolute', top: 4, bottom: 4,
              left: mode === 'login' ? 4 : 'calc(50% + 0px)',
              width: 'calc(50% - 4px)',
              background: 'var(--surface)',
              borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'left 320ms var(--ease-spring)',
            }}/>
            {[{k:'login',l:'登录'},{k:'register',l:'注册'}].map(t => (
              <button key={t.k} onClick={()=>{setMode(t.k); setError('');}} style={{
                position: 'relative', zIndex: 1,
                padding: '8px 32px',
                background: 'transparent', border: 'none',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                color: mode === t.k ? 'var(--ink)' : 'var(--ink-3)',
                transition: 'color 200ms',
              }}>{t.l}</button>
            ))}
          </div>

          <h1 style={{ fontSize: 32, marginBottom: 6 }}>
            {mode === 'login' ? '欢迎回来' : '开一间书房'}
          </h1>
          <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 28, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
            {mode === 'login' ? 'Welcome back.' : 'Open your study.'}
          </div>

          <form onSubmit={doSubmit} style={{ position: 'relative' }}>
            <div style={{
              maxHeight: mode === 'register' ? 80 : 0,
              opacity: mode === 'register' ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 400ms var(--ease-out)',
            }}>
              <Field name="name" label="笔名 / Pen Name" placeholder="例如:沈既白"/>
            </div>
            <Field name="email" label="邮箱 / Email" placeholder="you@example.com"/>
            <Field name="password" label="密码 / Password" type="password" placeholder="至少 8 位"/>

            {error && (
              <div style={{
                background: 'rgba(184, 85, 64, 0.08)',
                border: '1px solid rgba(184, 85, 64, 0.25)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                marginBottom: 16,
              }}>{error}</div>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)', cursor: 'pointer' }}>
                  <span style={{ width: 16, height: 16, border: '1.5px solid var(--border-strong)', borderRadius: 4 }}/>
                  记住我
                </label>
                <a style={{ color: 'var(--accent)', cursor: 'pointer' }}>忘记密码?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{
              width: '100%', justifyContent: 'center', padding: '13px',
              fontSize: 15, position: 'relative', overflow: 'hidden',
            }} disabled={loading}>
              {loading ? (
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#fff',
                      animation: `bounce 900ms ${i*120}ms infinite var(--ease-in-out)`,
                    }}/>
                  ))}
                </span>
              ) : (
                <>{mode === 'login' ? '进入书房' : '创建账户'}<Icon name="arrow" size={15}/></>
              )}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '24px 0', color: 'var(--ink-4)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            或
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { name: 'GitHub', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3 8.57 7.17 9.96.52.1.71-.23.71-.5v-1.8c-2.92.63-3.53-1.4-3.53-1.4-.48-1.2-1.17-1.53-1.17-1.53-.96-.65.07-.64.07-.64 1.06.07 1.62 1.08 1.62 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.16-4.78-5.18 0-1.14.41-2.08 1.08-2.81-.11-.27-.47-1.34.1-2.8 0 0 .88-.28 2.88 1.07a10 10 0 0 1 5.24 0c2-1.35 2.88-1.07 2.88-1.07.58 1.46.21 2.53.1 2.8.67.73 1.08 1.67 1.08 2.81 0 4.03-2.46 4.9-4.8 5.17.38.32.72.96.72 1.95v2.9c0 .28.19.61.72.5A10.5 10.5 0 0 0 22.5 12 10.5 10.5 0 0 0 12 1.5z"/>
                </svg>
              )},
              { name: '微信', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8.7 4C4.97 4 2 6.58 2 9.74c0 1.82 1 3.4 2.57 4.46l-.52 1.66 1.95-1.05c.7.2 1.44.3 2.2.3h.54a4.48 4.48 0 0 1-.14-1.1c0-2.78 2.62-5.02 5.9-5.02.33 0 .65.02.97.07C14.78 5.6 12 4 8.7 4zm-2.3 2.3a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64zm4.6 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64zm3.6 2.85c-3 0-5.4 2.1-5.4 4.68 0 2.6 2.4 4.68 5.4 4.68.62 0 1.23-.1 1.82-.27l1.8.98-.5-1.5c1.35-.95 2.2-2.36 2.2-3.9 0-2.57-2.4-4.67-5.32-4.67zm-1.85 1.9a.68.68 0 1 1 0 1.35.68.68 0 0 1 0-1.36zm3.7 0a.68.68 0 1 1 0 1.35.68.68 0 0 1 0-1.36z"/>
                </svg>
              )},
              { name: 'Google', icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.34-.17-1.97H12v3.73h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.74 2.99-4.3 2.99-7.28z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"/>
                  <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.59z"/>
                  <path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86A10 10 0 0 0 12 2a10 10 0 0 0-8.93 5.51l3.34 2.59C7.2 7.74 9.4 5.98 12 5.98z"/>
                </svg>
              )},
            ].map(p => (
              <button key={p.name} className="btn" style={{
                flex: 1, justifyContent: 'center', fontSize: 13, gap: 8,
                color: 'var(--ink-2)',
              }} title="第三方登录暂未启用" disabled>
                {p.icon}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.6} 40%{transform:translateY(-6px);opacity:1} }`}</style>
    </div>
  );
};

window.PageAuth = PageAuth;

// ─────────────────────────────────────────────────────────
// ParticleField — ink-drop bloom field (水墨)
// Soft circular ink blots of varying size slowly breathe in and out
// across the canvas, evoking drops of ink spreading on rice paper.
// No connecting threads, no cursor chasing — stillness over motion.
// ─────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // Read accent from CSS var, re-evaluated on theme/accent change
    const getVar = (name, fallback) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    };
    const hexToRgb = (hex) => {
      const m = hex.replace('#', '');
      const v = m.length === 3
        ? m.split('').map(c => parseInt(c+c,16))
        : [0,2,4].map(i => parseInt(m.slice(i,i+2),16));
      return v;
    };
    let accent = hexToRgb(getVar('--accent', '#C5704A'));
    let inkHue = [140, 115, 88];
    const mo = new MutationObserver(() => {
      accent = hexToRgb(getVar('--accent', '#C5704A'));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-accent','data-theme'] });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * DPR);
      canvas.height = Math.max(1, H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const rand = (a, b) => a + Math.random() * (b - a);
    const mkDrop = (opts = {}) => {
      const useAccent = Math.random() < 0.4;
      const rMax = opts.rMax ?? rand(40, 180);
      return {
        nx: opts.nx ?? rand(0.05, 0.95),
        ny: opts.ny ?? rand(0.05, 0.95),
        dx: rand(-0.02, 0.02),
        dy: rand(-0.015, 0.015),
        swayPhaseX: rand(0, Math.PI * 2),
        swayPhaseY: rand(0, Math.PI * 2),
        swaySpeed: rand(0.15, 0.35),
        swayAmp: rand(0.015, 0.04),
        rMax,
        rMin: rMax * rand(0.35, 0.6),
        phase: rand(0, Math.PI * 2),
        phaseSpeed: rand(0.18, 0.4),
        alphaMax: rand(0.14, useAccent ? 0.38 : 0.28),
        useAccent,
        softness: rand(0.55, 0.85),
      };
    };

    const drops = [];
    drops.push(mkDrop({ nx: 0.18, ny: 0.72, rMax: rand(160, 220) }));
    drops.push(mkDrop({ nx: 0.42, ny: 0.28, rMax: rand(120, 170) }));
    drops.push(mkDrop({ nx: 0.78, ny: 0.55, rMax: rand(180, 240) }));
    drops.push(mkDrop({ nx: 0.62, ny: 0.88, rMax: rand(90, 140) }));
    for (let i = 0; i < 6; i++) drops.push(mkDrop({ rMax: rand(50, 100) }));
    for (let i = 0; i < 14; i++) drops.push(mkDrop({ rMax: rand(12, 34) }));

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, W, H);

      for (const d of drops) {
        d.phase += d.phaseSpeed * dt;
        d.nx += d.dx * dt;
        d.ny += d.dy * dt;
        d.swayPhaseX += d.swaySpeed * dt;
        d.swayPhaseY += d.swaySpeed * dt * 0.8;
        if (d.nx < -0.15) d.nx = 1.15; else if (d.nx > 1.15) d.nx = -0.15;
        if (d.ny < -0.15) d.ny = 1.15; else if (d.ny > 1.15) d.ny = -0.15;

        const x = (d.nx + Math.sin(d.swayPhaseX) * d.swayAmp) * W;
        const y = (d.ny + Math.cos(d.swayPhaseY) * d.swayAmp) * H;
        const breath = 0.5 + 0.5 * Math.sin(d.phase);
        const r = d.rMin + (d.rMax - d.rMin) * breath;
        const a = d.alphaMax * (0.45 + 0.55 * breath);

        const [cr, cg, cb] = d.useAccent ? accent : inkHue;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0,           `rgba(${cr},${cg},${cb},${a})`);
        grad.addColorStop(d.softness * 0.5, `rgba(${cr},${cg},${cb},${a * 0.35})`);
        grad.addColorStop(d.softness,  `rgba(${cr},${cg},${cb},${a * 0.08})`);
        grad.addColorStop(1,           `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
    }}/>
  );
}
