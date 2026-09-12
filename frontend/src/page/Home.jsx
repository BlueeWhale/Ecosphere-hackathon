import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Code2,
  Database,
  GitBranch,
  Handshake,
  Headphones,
  Menu,
  MessageSquareText,
  Network,
  PhoneCall,
  Quote,
  Radio,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import './Home.css';

const features = [
  { icon: Bot, label: 'AI Sales Agent', text: 'Conduct natural, real-time sales conversations with an intelligent AI agent.' },
  { icon: ScanSearch, label: 'Smart Qualification', text: 'Understand customer requirements, needs, budget, and buying readiness.' },
  { icon: MessageSquareText, label: 'Objection Handling', text: 'Respond intelligently to customer concerns and adapt the conversation in real time.' },
  { icon: CircleDollarSign, label: 'Price Comparator', text: "Compare competitive offerings and communicate DealPilot's value during negotiations." },
  { icon: Target, label: 'Buying Intent', text: 'Identify buying signals and understand the current state of every opportunity.' },
  { icon: Handshake, label: 'Human Handoff', text: 'Transfer important conversations to a human representative with the complete context.' },
];

const steps = [
  ['01', 'START THE CONVERSATION', 'Customers interact with the DealPilot AI Sales Agent through a real-time conversation.'],
  ['02', 'UNDERSTAND & QUALIFY', 'AI understands requirements, questions, objections, and buying intent.'],
  ['03', 'NEGOTIATE & RECOMMEND', 'DealPilot handles pricing discussions, competitor comparisons, and recommendations.'],
  ['04', 'HANDOFF OR FOLLOW UP', 'When human expertise is needed, DealPilot transfers the conversation with complete context and supports follow-ups.'],
];

const technologies = [
  ['Agora', Radio],
  ['Google Gemini', Sparkles],
  ['MongoDB', Database],
  ['Socket.IO', Network],
  ['React', Code2],
  ['Node.js', GitBranch],
  ['FastAPI', Zap],
];

function ProductPreview() {
  return (
    <div className="home-product-preview" aria-label="DealPilot product preview">
      <div className="preview-topbar">
        <div className="preview-brand"><span className="preview-brand-mark"><Sparkles size={13} /></span> DealPilot <span className="preview-live"><i /> LIVE</span></div>
        <div className="preview-window-dots"><i /><i /><i /></div>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <span className="preview-sidebar-active"><BarChart3 size={13} /></span>
          <span><Users size={13} /></span>
          <span><MessageSquareText size={13} /></span>
          <span><BrainCircuit size={13} /></span>
          <span><Clock3 size={13} /></span>
        </aside>
        <div className="preview-content">
          <div className="preview-heading"><div><span>ACTIVE DEAL INTELLIGENCE</span><strong>Northstar Systems</strong></div><span className="preview-stage">NEGOTIATION</span></div>
          <div className="preview-metrics">
            <div><span>BUYING INTENT</span><strong className="metric-high">HIGH</strong></div>
            <div><span>DEAL VALUE</span><strong>$48,000</strong></div>
            <div><span>DEAL SCORE</span><strong>82<span className="metric-muted">/100</span></strong></div>
          </div>
          <div className="preview-main-grid">
            <div className="preview-conversation">
              <div className="preview-card-heading"><span><PhoneCall size={12} /> LIVE CONVERSATION</span><i /></div>
              <div className="conversation-line customer"><span>Customer</span><p>We need to support 200 reps before Q4. How flexible is your pricing?</p></div>
              <div className="conversation-line agent"><span>DealPilot AI</span><p>Based on your rollout, Professional gives you the qualification and handoff controls you need.</p></div>
              <div className="preview-wave"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
            <div className="preview-recommendation"><div className="preview-card-heading"><span><BrainCircuit size={12} /> AI RECOMMENDATION</span></div><strong>Clarify rollout timeline</strong><p>Offer an annual plan after confirming implementation requirements.</p><div className="recommendation-tag"><CheckCircle2 size={12} /> Context preserved</div></div>
          </div>
          <div className="preview-bottom-note"><span><ShieldCheck size={12} /> HUMAN HANDOFF READY</span><span>Objection: pricing flexibility <ArrowRight size={12} /></span></div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home-page">
      <header className={`home-nav ${scrolled ? 'home-nav-scrolled' : ''}`}>
        <Link to="/" className="home-logo" onClick={closeMenu}><span><Sparkles size={17} /></span><strong>DEALPILOT</strong></Link>
        <nav className={`home-nav-links ${menuOpen ? 'home-nav-links-open' : ''}`}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
          <Link to="/products" onClick={closeMenu}>Pricing</Link>
          <a href="#about" onClick={closeMenu}>About</a>
          <div className="home-mobile-actions"><Link to="/login" onClick={closeMenu}>Login</Link><Link to="/register" className="home-button home-button-small" onClick={closeMenu}>Sign Up <ArrowRight size={14} /></Link></div>
        </nav>
        <div className="home-nav-actions"><Link to="/login">Login</Link><Link to="/register" className="home-button home-button-small">Sign Up <ArrowRight size={14} /></Link><Link to="/sales-agent" className="home-nav-demo"><Radio size={14} /> Live Demo</Link></div>
        <button type="button" className="home-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        <section className="home-hero" id="home">
          <div className="home-hero-grid home-container">
            <div className="home-hero-copy">
              <div className="home-eyebrow"><span className="home-eyebrow-dot" /> AI-POWERED SALES INTELLIGENCE</div>
              <h1>Turn Every Sales Conversation <em>Into a Deal.</em></h1>
              <p className="home-hero-text">DealPilot combines real-time AI conversations, sales intelligence, negotiation, and human handoff to help your team close more deals.</p>
              <div className="home-hero-actions"><Link to="/register" className="home-button">Start Selling with AI <ArrowRight size={17} /></Link><Link to="/sales-agent" className="home-button-ghost"><span className="home-play"><Radio size={15} /></span> Live Demo</Link></div>
              <div className="home-trust-line"><CheckCircle2 size={15} /> Real-time AI conversations <span /> Intelligent sales automation</div>
            </div>
            <div className="home-hero-visual"><div className="home-orbit home-orbit-one" /><div className="home-orbit home-orbit-two" /><ProductPreview /><div className="home-float-card home-float-intent"><span><Target size={14} /></span><div><small>BUYING INTENT</small><strong>High confidence</strong></div></div><div className="home-float-card home-float-handoff"><span><Handshake size={14} /></span><div><small>HUMAN HANDOFF</small><strong>Context ready</strong></div></div></div>
          </div>
          <div className="home-scroll-hint"><span>SCROLL TO EXPLORE</span><ChevronDown size={15} /></div>
        </section>

        <section className="home-value-strip"><div className="home-container home-value-grid">{[['01', 'Real-Time AI', Radio], ['02', 'Smart Qualification', ScanSearch], ['03', 'Intelligent Negotiation', CircleDollarSign], ['04', 'Human Handoff', Handshake]].map(([number, label, Icon]) => <div className="home-value-item" key={label}><span>{number}</span><Icon size={17} /><strong>{label}</strong></div>)}</div></section>

        <section className="home-section home-features" id="features"><div className="home-container"><div className="home-section-heading"><div><span className="home-kicker">THE SALES INTELLIGENCE LAYER</span><h2>Everything your sales team needs to <em>close smarter.</em></h2></div><p>One connected system for the conversations, signals, and actions that move opportunities forward.</p></div><div className="home-feature-grid">{features.map(({ icon: Icon, label, text }, index) => <article className="home-feature-card" key={label}><div className="home-feature-number">0{index + 1}</div><div className="home-icon-box"><Icon size={21} /></div><h3>{label}</h3><p>{text}</p><ArrowRight className="home-feature-arrow" size={17} /></article>)}</div></div></section>

        <section className="home-section home-process" id="how-it-works"><div className="home-container"><div className="home-section-heading centered"><span className="home-kicker">A BETTER SALES MOTION</span><h2>From conversation to <em>conversion.</em></h2><p>DealPilot turns every customer interaction into structured intelligence your team can act on.</p></div><div className="home-process-grid">{steps.map(([number, title, text]) => <article className="home-step" key={number}><div className="home-step-number">{number}</div><div className="home-step-line" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

        <section className="home-section home-intelligence" id="about"><div className="home-container home-intelligence-grid"><div className="home-intelligence-copy"><span className="home-kicker">ADAPTIVE REASONING</span><h2>AI that understands the <em>conversation.</em></h2><p>DealPilot doesn't simply follow a fixed sales script. It understands the conversation, adapts to customer requirements, identifies objections, and helps your sales team decide what to do next.</p><Link to="/sales-agent" className="home-text-link">Explore the AI Sales Agent <ArrowRight size={16} /></Link></div><div className="home-signal-board"><div className="signal-board-top"><span>CONVERSATION SIGNALS</span><span className="signal-live"><i /> PROCESSING</span></div><div className="signal-flow">{[['Customer Requirement', Users], ['AI Understanding', BrainCircuit], ['Buying Intent', Target], ['Customer Objection', MessageSquareText], ['AI Recommendation', Sparkles], ['Deal State', BarChart3]].map(([label, Icon], index) => <React.Fragment key={label}><div className={`signal-node ${index === 4 ? 'signal-node-active' : ''}`}><Icon size={15} /><span>{label}</span><CheckCircle2 size={13} /></div>{index < 5 && <div className="signal-connector"><span /></div>}</React.Fragment>)}</div></div></div></section>

        <section className="home-section home-handoff"><div className="home-container home-handoff-grid"><div className="home-handoff-visual"><div className="handoff-card"><div className="handoff-card-header"><span><Handshake size={15} /> HANDOFF CONTEXT</span><span className="handoff-status">READY</span></div><div className="handoff-profile"><div className="handoff-avatar">NS</div><div><strong>Northstar Systems</strong><span>Enterprise opportunity · 200 users</span></div><span className="handoff-score">82</span></div>{[['Customer Requirements', '200 seats before Q4'], ['Conversation Summary', 'Evaluating implementation speed'], ['Objections', 'Pricing flexibility'], ['Pricing Discussion', 'Annual commitment suggested'], ['AI Recommendation', 'Bring in sales specialist'], ['Buying Intent', 'HIGH']].map(([label, value]) => <div className="handoff-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}<div className="handoff-reason"><ShieldCheck size={14} /><span>Handoff reason: complex commercial requirement</span></div></div></div><div className="home-handoff-copy"><span className="home-kicker">CONTEXTUAL ESCALATION</span><h2>When AI knows it's time for a <em>human.</em></h2><p>DealPilot can seamlessly transfer a conversation to a human sales representative while preserving the context of the interaction.</p><blockquote>“We don't just transfer the call.<br /><strong>We transfer the context.</strong>”</blockquote><Link to="/sales-agent" className="home-button-ghost">Explore Human Handoff <ArrowRight size={16} /></Link></div></div></section>

        <section className="home-section home-workspace"><div className="home-container home-workspace-grid"><div className="home-workspace-copy"><span className="home-kicker">THE CONNECTED WORKSPACE</span><h2>One platform. Your entire <em>sales journey.</em></h2><p>Bring conversations, customer intelligence, pipeline activity, and follow-ups together in one connected sales workspace.</p><div className="workspace-list">{['Dashboard', 'Leads', 'Conversations', 'Deal State', 'Buying Intent', 'Follow-ups', 'AI Sales Agent', 'Human Handoff'].map((label, index) => <span key={label}><CheckCircle2 size={14} /> {label}</span>)}</div><Link to="/register" className="home-text-link">Build your sales workspace <ArrowRight size={16} /></Link></div><div className="workspace-visual"><div className="workspace-window"><div className="workspace-window-bar"><span>SALES COMMAND CENTER</span><span><i /> SYNCED</span></div><div className="workspace-dashboard"><div className="workspace-chart"><span>PIPELINE MOMENTUM</span><strong>$248,400</strong><div className="chart-bars">{[42, 58, 48, 76, 64, 88, 72, 96].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div><div className="workspace-side-stats"><div><span>OPEN DEALS</span><strong>24</strong></div><div><span>HIGH INTENT</span><strong>08</strong></div><div><span>FOLLOW-UPS</span><strong>16</strong></div></div></div></div></div></div></section>

        <section className="home-tech"><div className="home-container"><div className="home-section-heading centered"><span className="home-kicker">THE DEALPILOT STACK</span><h2>Built for <em>real-time sales.</em></h2><p>Practical technology for reliable intelligence, live conversations, and connected workflows.</p></div><div className="home-tech-grid">{technologies.map(([label, Icon]) => <div className="home-tech-badge" key={label}><Icon size={18} /><span>{label}</span></div>)}</div></div></section>

        <section className="home-cta"><div className="home-container home-cta-inner"><div><span className="home-kicker">READY WHEN YOU ARE</span><h2>Ready to transform your <em>sales process?</em></h2><p>Start with AI-powered conversations and scale to intelligent sales automation.</p></div><div className="home-cta-actions"><Link to="/products" className="home-button-ghost">View Pricing <ArrowRight size={16} /></Link><Link to="/register" className="home-button">Get Started <ArrowRight size={16} /></Link></div></div></section>
      </main>

      <footer className="home-footer"><div className="home-container"><div className="home-footer-main"><div><Link to="/" className="home-logo"><span><Sparkles size={17} /></span><strong>DEALPILOT</strong></Link><p>AI-powered sales and negotiation for modern sales teams.</p></div><div className="home-footer-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#how-it-works">How It Works</a><Link to="/products">Pricing</Link><Link to="/login">Login</Link><Link to="/register">Sign Up</Link></div></div><div className="home-footer-bottom"><span>© 2026 DealPilot. All rights reserved.</span><span>Real-time intelligence for every conversation.</span></div></div></footer>
    </div>
  );
}

export default Home;
