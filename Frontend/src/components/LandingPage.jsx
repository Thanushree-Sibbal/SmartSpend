import { useState, useEffect } from "react";


/* ─── Place these images in src/assets/ and update paths if needed ─── */
const imgFailed        = new URL("../assets/transactionfailed.png",        import.meta.url).href;
const imgChai          = new URL("../assets/chai.png",          import.meta.url).href;
const imgWallet        = new URL("../assets/wallet.png",        import.meta.url).href;
const imgDinner        = new URL("../assets/dinner.png",        import.meta.url).href;
const imgSavingsJar    = new URL("../assets/savingsjar.png",   import.meta.url).href;
const imgPiggy         = new URL("../assets/piggybank.png",         import.meta.url).href;
const imgBudgetPlanner = new URL("../assets/budgetplanner.png",import.meta.url).href;

function LandingPage({ onGetStarted }) {
  const [scrollY,      setScrollY]      = useState(0);
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 });
  const [activeStep,   setActiveStep]   = useState(0);
  const [notifPulse,   setNotifPulse]   = useState(true);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMouse  = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMouse);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { setNotifPulse(false); setTimeout(() => setNotifPulse(true), 500); }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing-root">

      {/* cursor glow */}
      <div className="cursor-aura" style={{ left: mousePos.x, top: mousePos.y, transform:"translate(-50%,-50%)" }} />

      {/* ─── NAV ─────────────────────────────────────── */}
      <nav className={`landing-nav ${scrollY > 60 ? "nav-blur" : ""}`}>
        <div className="nav-logo">
          <span className="logo-mark">S</span>
          <span>SmartSpend</span>
        </div>
        <div className="nav-links">
          <a href="#pain">The Problem</a>
          <a href="#features">Features</a>
          <a href="#reviews">Reviews</a>
        </div>
        <button className="nav-cta" onClick={onGetStarted}>Start Free →</button>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO — "We've all been there" moment
      ═══════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-grid" />

        {/* LEFT — copy */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>For college students · By college students</span>
          </div>

          <h1 className="hero-headline">
            <span className="headline-line">You scanned</span>
            <span className="headline-line accent-line">the QR.</span>
            <span className="headline-line">It said NO!</span>
          </h1>

          <p className="hero-sub">
            <b>That gut-drop when your chai scan fails. The awkward auto-fare split. The month-end panic texting home — again.</b> 
            <br /><br />
            <strong>SmartSpend makes sure it never happens again.</strong>
          </p>

          <div className="hero-actions">
            <button className="cta-primary" onClick={onGetStarted}>
              <span>Fix My Finances Free</span>
              <span className="cta-arrow">↗</span>
            </button>
            <a href="#pain" className="cta-ghost">See how it works</a>
          </div>

          <div className="feature-pills">
            {[
              { icon:"📊", label:"Daily Tracking" },
              { icon:"🔔", label:"Smart Alerts" },
              { icon:"🍽", label:"Budget Dining" },
              { icon:"🎯", label:"Savings Goals" },
            ].map((p, i) => (
              <div key={i} className="feature-pill"><span>{p.icon}</span><span>{p.label}</span></div>
            ))}
          </div>
        </div>

        {/* RIGHT — photo collage with overlaid UI */}
        <div className="hero-visual">
          <div className="hero-photo-collage">

            {/* Main phone screenshot */}
            <div className="hpc-main">
              <img src={imgFailed} alt="Transaction Failed" className="hpc-main-img" />
              <div className="hpc-cross">
                <span className="hpc-cross-line hpc-cross-1" />
                <span className="hpc-cross-line hpc-cross-2" />
              </div>
              <div className="hpc-never-badge">Never again 🙅</div>
            </div>

            {/* Chai photo — floats top right */}
            <div className="hpc-float hpc-float-tr">
              <img src={imgChai} alt="Chai" />
              <div className="hpc-float-label">₹20 chai — paid ✅</div>
            </div>

            {/* Chai photo — floats top left */}
            <div className="hpc-float hpc-float-tl">
              <img src={imgPiggy} alt="Chai" />
              <div className="hpc-float-label">Should start SAVING</div>
            </div>

            {/* Wallet photo — floats bottom left */}
            <div className="hpc-float hpc-float-bl">
              <img src={imgWallet} alt="Wallet" />
              <div className="hpc-float-label">Always know what's inside</div>
            </div>

            {/* Balance pill */}
            <div className="hero-balance-pill">
              <span className="bal-label">Current balance</span>
              <span className="bal-val">₹ 3,240</span>
              <span className="bal-sub">↑ Healthy for 8 more days</span>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PAIN SECTION — 3 relatable moments
      ═══════════════════════════════════════════════════════ */}
      <section className="pain-section" id="pain">
        <div className="pain-inner">
          <p className="lp-section-label" style={{ textAlign:"center" }}>WE KNOW THE FEELING</p>
          <h2 className="pain-headline">
            "Where did my <span className="pain-accent">₹5,000</span> go?"
          </h2>
          <p className="pain-sub">You got the money. Spent it. Don't know on what. Now you're calling home again.</p>

          <div className="pain-cards">
            {[
              { img: imgFailed,  emoji:"😤", title:"The Decline",  desc:"Scanning QR for ₹20 chai and getting 'Insufficient Balance'. In front of everyone. That sting." },
              { img: imgChai,    emoji:"🤯", title:"The Mystery",  desc:"Money appears mid-month. By the 25th it's gone — spent on chai, auto, canteen. ₹0 remains." },
              { img: imgWallet,  emoji:"😰", title:"The Call",     desc:"'Mom I need ₹3,000 more.' The silence. The sigh. 'Beta where does it all go?' You wish you knew." },
            ].map((pc, i) => (
              <div key={i} className="pain-card">
                <div className="pain-card-img-wrap">
                  <img src={pc.img} alt={pc.title} className="pain-card-img" />
                  <div className="pain-img-overlay" />
                  <span className="pain-card-emoji">{pc.emoji}</span>
                </div>
                <h3>{pc.title}</h3>
                <p>{pc.desc}</p>
              </div>
            ))}
          </div>

          <div className="pain-fix-row">
            <div className="pain-fix-line" />
            <div className="pain-fix-badge">SmartSpend fixes all three ↓</div>
            <div className="pain-fix-line" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS BAND
      ═══════════════════════════════════════════════════════ */}
      <section className="stats-band">
        {[
          { value:"₹2.4L", label:"Avg saved per user / year" },
          { value:"94%",   label:"Students hit their goals" },
          { value:"12K+",  label:"Active college members" },
          { value:"4.9★",  label:"App store rating" },
        ].map((s, i) => (
          <div key={i} className="stat-item">
            <strong className="stat-val">{s.value}</strong>
            <span className="stat-lbl">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES — alternating rows with photos
      ═══════════════════════════════════════════════════════ */}
      <section className="features-section" id="features">
        <div className="lp-section-label">WHAT SMARTSPEND DOES</div>
        <h2 className="lp-section-title">Your financial life,<br />finally under control.</h2>

        {/* — Feature 1: Daily Tracker — */}
        <div className="feat-row feat-row-left">
          <div className="feat-photo-wrap">
            <img src={imgBudgetPlanner} alt="Budget planner" className="feat-photo" />
            <div className="feat-photo-overlay" />
            <div className="feat-overlay-ui">
              <p className="foui-label">This month</p>
              <div className="foui-bars">
                {[40,65,45,80,55,90,70,60].map((h,i)=>(
                  <div key={i} className="foui-bar" style={{ height:`${h}%`, animationDelay:`${i*0.1}s`,
                    background: h>70 ? "var(--ember)" : "var(--green)" }} />
                ))}
              </div>
              <p className="foui-alert">🔔 Food 80% — ease up this week!</p>
            </div>
          </div>
          <div className="feat-copy">
            <div className="feat-icon-wrap" style={{ background:"rgba(226,55,68,0.10)" }}>📊</div>
            <h3>Daily Budget Tracker</h3>
            <p>Every transaction — QR pay, UPI, cash — gets tracked and categorised. Food, transport, shopping. You'll never say "where did it go?" again.</p>
            <ul className="feat-list">
              <li>✅ Auto-categorises UPI transactions</li>
              <li>✅ Daily, weekly, monthly views</li>
              <li>✅ Visual spending heatmap by day</li>
            </ul>
          </div>
        </div>

        {/* — Feature 2: Smart Alerts — */}
        <div className="feat-row feat-row-right">
          <div className="feat-copy">
            <div className="feat-icon-wrap" style={{ background:"rgba(56,189,248,0.10)" }}>🔔</div>
            <h3>Smart Alerts & Spend Limits</h3>
            <p>Set a ₹500/week food limit. The moment you cross ₹400, you get a nudge. Like a financially responsible friend who actually cares.</p>
            <ul className="feat-list">
              <li>✅ Custom category limits</li>
              <li>✅ Low balance warning before you decline</li>
              <li>✅ Weekly spend digest every Monday</li>
            </ul>
            <div className="alerts-preview">
              <div className={`alert-notif alert-warn ${notifPulse ? "notif-in" : "notif-out"}`}>
                <span>⚠️</span>
                <div><strong>Food at 85%</strong><p>₹75 left this week</p></div>
              </div>
              <div className="alert-notif alert-good notif-in" style={{ animationDelay:"0.3s" }}>
                <span>🎯</span>
                <div><strong>Savings on track!</strong><p>₹3,200 / ₹4,000 this month</p></div>
              </div>
            </div>
          </div>
          <div className="feat-photo-wrap">
            <img src={imgPiggy} alt="Piggy bank savings" className="feat-photo" />
            <div className="feat-photo-overlay" />
            <div className="feat-overlay-ui feat-overlay-ui-right">
              <p className="foui-label">Savings goals</p>
              {[
                { name:"Trip to Goa 🏖", pct:72, color:"var(--sky)" },
                { name:"New Phone 📱",   pct:41, color:"var(--ember)" },
                { name:"Emergency 🛡",   pct:90, color:"var(--green)" },
              ].map((g,i)=>(
                <div key={i} className="foui-goal">
                  <div className="foui-goal-row"><span>{g.name}</span><span>{g.pct}%</span></div>
                  <div className="foui-track"><div className="foui-fill" style={{ width:`${g.pct}%`, background:g.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* — Feature 3: Restaurant Finder — */}
        <div className="feat-row feat-row-left">
          <div className="feat-photo-wrap">
            <img src={imgDinner} alt="Friends dining out" className="feat-photo" />
            <div className="feat-photo-overlay" />
            <div className="feat-overlay-ui">
              <p className="foui-label">Budget-based picks near you 📍</p>
              {[
                { name:"Chai & Bytes",   price:"₹80/meal",  ok:true },
                { name:"Mess Delight",   price:"₹120/meal", ok:true },
                { name:"The Fancy Café", price:"₹480/meal", ok:false },
              ].map((r,i)=>(
                <div key={i} className="foui-rest">
                  <span className="foui-rest-name">{r.name}</span>
                  <span className="foui-rest-price">{r.price}</span>
                  <span className={`foui-rest-tag ${r.ok?"tag-ok":"tag-warn"}`}>{r.ok?"✅ Fits":"⚠️ Tight"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="feat-copy">
            <div className="feat-icon-wrap" style={{ background:"rgba(34,197,94,0.10)" }}>🍽</div>
            <h3>Restaurant Finder by Budget</h3>
            <p>SmartSpend looks at your spending graph and tells you exactly what you can afford for a meal today. Then finds the best places nearby that fit.</p>
            <ul className="feat-list">
              <li>✅ Personalised to your real-time balance</li>
              <li>✅ Location-aware suggestions</li>
              <li>✅ Shows whether a place fits this week's budget</li>
            </ul>
          </div>
        </div>

        {/* — Feature 4: Savings Goals — */}
        <div className="feat-row feat-row-right">
          <div className="feat-copy">
            <div className="feat-icon-wrap" style={{ background:"rgba(245,158,11,0.10)" }}>🫙</div>
            <h3>Savings Goals That Actually Work</h3>
            <p>Name it. Set it. Watch it fill. SmartSpend auto-allocates from your budget so saving isn't an afterthought — it's built in from day one.</p>
            <ul className="feat-list">
              <li>✅ Visual progress jars</li>
              <li>✅ Auto-save rules (save 10% of every credit)</li>
              <li>✅ Milestone celebrations 🎉</li>
            </ul>
          </div>
          <div className="feat-photo-wrap">
            <img src={imgSavingsJar} alt="Savings jar" className="feat-photo" />
            <div className="feat-photo-overlay" />
            <div className="feat-overlay-ui feat-overlay-ui-right">
              <p className="foui-label">Your savings jar 🫙</p>
              <div className="foui-ring-wrap">
                <svg viewBox="0 0 80 80" className="foui-ring-svg">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="7" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--green)" strokeWidth="7"
                    strokeDasharray="201" strokeDashoffset="50"
                    strokeLinecap="round" transform="rotate(-90 40 40)" />
                </svg>
                <div className="foui-ring-label"><span>75%</span><small>of goal</small></div>
              </div>
              <p className="foui-alert" style={{ textAlign:"center", marginTop:8 }}>₹7,500 / ₹10,000 saved 💪</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PHOTO COLLAGE STRIP
      ═══════════════════════════════════════════════════════ */}
      <section className="collage-section">
        <div className="lp-section-label" style={{ textAlign:"center" }}>THE SMARTSPEND LIFE</div>
        <h2 className="lp-section-title" style={{ textAlign:"center" }}>Spend smart. Live better.</h2>
        <h2 className="lp-section-title" style={{ textAlign:"center" }}>No more excuses to go BROKE!</h2>
        <div className="collage-grid">
          <div className="collage-item collage-tall">
            <img src={imgChai} alt="Chai" />
            <div className="collage-tag">₹20 chai — always possible ☕</div>
          </div>
          <div className="collage-col">
            <div className="collage-item">
              <img src={imgDinner} alt="Dinner" />
              <div className="collage-tag">Know before you go 🍽</div>
            </div>
            <div className="collage-item">
              <img src={imgSavingsJar} alt="Savings" />
              <div className="collage-tag">Watch it grow 🫙</div>
            </div>
          </div>
          <div className="collage-col">
            <div className="collage-item">
              <img src={imgBudgetPlanner} alt="Planner" />
              <div className="collage-tag">Your money, your plan 📓</div>
            </div>
            <div className="collage-item">
              <img src={imgPiggy} alt="Piggy bank" />
              <div className="collage-tag">Every rupee counts 🐷</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="how-section" id="how">
        <div className="lp-section-label">HOW IT WORKS</div>
        <h2 className="lp-section-title">Three steps. Zero excuses.</h2>
        <div className="steps-track">
          {[
            { num:"01", icon:"⚡", title:"Sign up in 30s",          desc:"No credit card. No KYC. No friction. Just your name and you're in. Free forever." },
            { num:"02", icon:"💸", title:"Log every transaction",    desc:"Auto-syncs via UPI alerts or add manually. Chai, auto, food — categorised instantly." },
            { num:"03", icon:"🚀", title:"Watch the magic happen",   desc:"Charts appear. Alerts fire. Restaurant picks roll in. You stop running out of money. That's it." },
          ].map((s, i) => (
            <div key={i} className={`step-card ${activeStep === i ? "step-active" : ""}`}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < 2 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════ */}
      <section className="reviews-section" id="reviews">
        <div className="lp-section-label">WHAT STUDENTS SAY</div>
        <h2 className="lp-section-title">Real students. Real results.</h2>
        <div className="reviews-grid">
          {[
            { name:"Riya S.",   college:"DU, Delhi",    stars:5, text:"I used to run out of money by the 20th. Now I actually have ₹3,000 left at month end. The alerts changed everything." },
            { name:"Aryan M.",  college:"VIT, Vellore", stars:5, text:"The restaurant finder is literally my favourite feature. Shows me good biryani spots I can actually afford rn 😭" },
            { name:"Sneha K.",  college:"BITS, Pilani", stars:5, text:"Told my parents I needed ₹5k more. Then SmartSpend showed me I'd spent ₹4k on Swiggy. That was a wake-up call fr." },
          ].map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-stars">{"⭐".repeat(r.stars)}</div>
              <p className="review-text">"{r.text}"</p>
              <div className="reviewer">
                <div className="reviewer-avatar">{r.name[0]}</div>
                <div><strong>{r.name}</strong><span>{r.college}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA — "Transaction Failed" as emotional hook
      ═══════════════════════════════════════════════════════ */}
      <section className="final-cta-section">
        <div className="cta-glow" />
        <div className="cta-crossed-wrap">
          <img src={imgFailed} alt="Transaction failed — never again" className="cta-crossed-img" />
          <div className="cta-crossed-overlay">
            <span className="cta-cross cta-cross-1" />
            <span className="cta-cross cta-cross-2" />
          </div>
          <div className="cta-never-badge">Never. Again. 🙅</div>
        </div>
        <div className="lp-section-label" style={{ textAlign:"center" }}>READY?</div>
        <h2 className="cta-headline">
          Stop guessing.<br />
          <span style={{ color:"var(--ember)" }}>Start knowing.</span>
        </h2>
        <p className="cta-body">Free forever. Works for every college student in India. No BS.</p>
        <button className="cta-primary cta-big" onClick={onGetStarted}>
          <span>Create Free Account</span>
          <span className="cta-arrow">↗</span>
        </button>
        <p className="cta-footnote">Join 12,000+ students already spending smarter</p>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <span className="logo-mark">S</span>
          <span>SmartSpend</span>
        </div>
        <p>© 2025 SmartSpend · Built for better budgeting</p>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;