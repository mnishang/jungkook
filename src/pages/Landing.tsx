import { Link } from 'react-router-dom'
import { ArrowRight, Users, BookOpen, CalendarDays } from 'lucide-react'
export default function Landing(){return <div className="landing">
    <header className="landing-nav"><Link to="/" className="brand">
    <span className="brand-mark">✦</span><span>
        <b>Study<span className="brand-accent">Buddy</span></b>
        <small>Study Together. Achieve More.</small></span>
        </Link><nav></nav><div><Link className="login-link" to="/login">Log in</Link>
        <Link className="btn-primary" to="/signup">Get Started</Link></div></header>
        <main className="landing-hero"><div className="landing-copy">
            <span className="eyebrow">YOUR STUDY COMMUNITY</span>
            <h1>Find your study buddy,<br/><em>build your dreams.</em></h1>
            <p>Connect with fellow students, join study groups, share resources, and achieve your goals together.</p>
            <div className="landing-actions">
                <Link className="btn-primary" to="/signup">Get Started <ArrowRight size={16}/></Link>
                <a className="btn-outline" href="#features">Learn More</a></div><div className="social-proof">
                    <div className="avatar-stack"><span>MS</span><span>JR</span><span>AC</span>
                    </div><p><b>Join 1,000+ students</b><small>already studying together</small>
                    </p></div></div><div className="landing-visual"><div className="visual-glow"/>
                    <div className="notebook">
                        <span>Better<br/>Students<br/>Brighter<br/>Futures</span><b>♡</b></div>
                        <div className="coffee">☕</div><div className="floating-card"><BookOpen/><span><b>Study smarter</b>
                        <small>One session at a time</small></span></div></div></main>
                        <section id="features" className="landing-features">
                            <h2>Everything you need to study better</h2><div><article><Users/>
                            <h3>Find your people</h3><p>Meet study buddies who share your subjects and goals.</p>
                            </article><article><BookOpen/><h3>Share resources</h3><p>Keep notes, reviewers, and useful links together.</p>
                            </article><article><CalendarDays/><h3>Plan sessions</h3><p>Make time for focused learning and group study.</p>
                            </article></div></section><footer id="about">StudyBuddy © 2026 · Learn together, grow together.</footer></div>}
