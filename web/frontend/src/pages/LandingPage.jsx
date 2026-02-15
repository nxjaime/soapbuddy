import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../contexts/SubscriptionContext';
import {
    BookOpen,
    FlaskConical,
    Factory,
    Warehouse,
    BarChart3,
    Calculator,
    Check,
    X as XIcon,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Sparkles,
    Shield,
    Clock,
    Users,
    Zap,
    Heart,
    FileSearch,
    Menu,
    X
} from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Sticky nav on scroll
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection observer for fade-in animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('landing-visible');
                    }
                });
            },
            { threshold: 0.1 }
        );
        document.querySelectorAll('.landing-animate').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const goToSignUp = () => navigate('/auth', { state: { isSignUp: true } });

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    // ── Pain points ──
    const painPoints = [
        {
            icon: <Clock size={32} />,
            title: 'Drowning in Spreadsheets?',
            description: 'Tracking recipes, costs, and inventory across scattered spreadsheets wastes hours every week — and one typo can throw everything off.'
        },
        {
            icon: <Zap size={32} />,
            title: 'Scaling Feels Impossible?',
            description: "You've perfected your recipes at home, but scaling to sell at markets or online feels overwhelming without the right tools."
        },
        {
            icon: <Shield size={32} />,
            title: 'Worried About Compliance?',
            description: 'Keeping batch records, ingredient traceability, and proper documentation for regulations shouldn\'t keep you up at night.'
        },
        {
            icon: <Heart size={32} />,
            title: 'Lost the Joy of Creating?',
            description: "The business side of soapmaking shouldn't steal the creativity that got you started. You deserve tools that handle the busywork."
        }
    ];

    // ── Features ──
    const features = [
        {
            icon: <BookOpen size={28} />,
            title: 'Recipe Management',
            description: 'Store all your recipes with precise measurements, lye calculations, and fragrance notes in one beautiful place.'
        },
        {
            icon: <Calculator size={28} />,
            title: 'Lye Calculator',
            description: 'Built-in SAP values for 100+ oils, fats, and waxes. Calculate lye amounts, water ratios, and superfat percentages instantly.'
        },
        {
            icon: <Factory size={28} />,
            title: 'Production Tracking',
            description: 'Track every batch with lot numbers, production dates, and yield — from mixing bowl to curing rack.'
        },
        {
            icon: <Warehouse size={28} />,
            title: 'Inventory Control',
            description: 'Know exactly what you have, where it is, and when to reorder. Multi-location support for markets and shops.'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Financial Insights',
            description: 'See your true profit margins. Track revenue, supply costs, and expenses with beautiful, easy-to-read reports.'
        },
        {
            icon: <FileSearch size={28} />,
            title: 'Batch Traceability',
            description: 'Full supply chain tracking from raw ingredient to finished bar — the compliance records you need, generated for you.'
        }
    ];

    // ── Stats ──
    const stats = [
        { value: '100+', label: 'Oils in Calculator' },
        { value: '14-Day', label: 'Free Trial on Paid Plans' },
        { value: '0', label: 'Setup Fees' },
        { value: '∞', label: 'Recipes on Paid Plans' }
    ];

    // ── FAQ ──
    const faqs = [
        {
            q: 'Do paid plans come with a free trial?',
            a: 'Yes! Both the Maker and Manufacturer plans include a 14-day free trial. You\'ll need to enter a card at checkout, but you won\'t be charged until after the trial period ends — and you can cancel anytime before that.'
        },
        {
            q: 'Is there really a free plan?',
            a: 'Absolutely! Our Free plan lets you manage up to 3 recipes, track ingredients, run lye calculations, and manage basic production — no credit card required. It\'s perfect for hobbyists who want to get organized.'
        },
        {
            q: 'I\'m not very tech-savvy. Is this hard to learn?',
            a: 'Not at all! SoapBuddy is designed by soapmakers, for soapmakers. The interface is clean, intuitive, and we provide step-by-step guidance. Most users are up and running in under 10 minutes.'
        },
        {
            q: 'What makes this different from a spreadsheet?',
            a: 'Spreadsheets can\'t auto-calculate lye, track lot numbers, connect your recipes to production batches, manage multi-location inventory, or generate compliance records. SoapBuddy does all of that — and it does it beautifully.'
        },
        {
            q: 'Can I import my existing recipes?',
            a: 'Yes! You can manually add recipes quickly through our intuitive recipe builder. We support all common oil, fat, and wax types with built-in SAP values.'
        },
        {
            q: 'Do I need to install anything?',
            a: 'Nope! SoapBuddy runs entirely in your web browser. Access it from your laptop, tablet, or phone — wherever you make your magic happen.'
        },
        {
            q: 'How does the lye calculator work?',
            a: 'Select your oils, enter quantities, set your desired superfat percentage, and SoapBuddy instantly calculates the exact NaOH or KOH amounts plus water. It uses the same SAP values trusted by professional formulators.'
        },
        {
            q: 'Can I cancel my subscription anytime?',
            a: 'Yes, cancel anytime — no long-term contracts, no cancellation fees. Your data remains accessible on the Free plan, so you never lose your recipes.'
        },
        {
            q: 'Is my data secure?',
            a: 'Your data is stored securely with enterprise-grade encryption and hosted on trusted cloud infrastructure. We never share or sell your information.'
        },
        {
            q: 'What if I sell at multiple locations — markets, online, and my studio?',
            a: 'The Maker plan and above supports multi-location inventory tracking. Move stock between locations, see what\'s where, and never show up to a market under-stocked again.'
        }
    ];

    // ── Plan data from SubscriptionContext ──
    const planKeys = ['free', 'maker', 'manufacturer'];

    return (
        <div className="landing-page">
            {/* ═══════ NAVIGATION ═══════ */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-nav-inner">
                    <div className="landing-logo" onClick={() => scrollTo('hero')}>
                        <span className="landing-logo-icon">🧼</span>
                        <span className="landing-logo-text">SoapBuddy</span>
                    </div>

                    <div className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
                        <button className="landing-nav-close" onClick={() => setMobileMenuOpen(false)}>
                            <X size={24} />
                        </button>
                        <a onClick={() => scrollTo('features')}>Features</a>
                        <a onClick={() => scrollTo('pricing')}>Pricing</a>
                        <a onClick={() => scrollTo('faq')}>FAQ</a>
                        <button className="landing-btn-ghost" onClick={() => navigate('/auth')}>
                            Sign In
                        </button>
                        <button className="landing-btn-primary" onClick={goToSignUp}>
                            Get Started Free
                        </button>
                    </div>

                    <button className="landing-hamburger" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="landing-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* ═══════ HERO ═══════ */}
            <section className="landing-hero" id="hero">
                <div className="landing-hero-bg" />
                <div className="landing-hero-content">
                    <div className="landing-hero-badge">
                        <Sparkles size={14} />
                        Built by soapmakers, for soapmakers
                    </div>
                    <h1 className="landing-hero-title">
                        Your Soap Business,<br />
                        <span className="landing-gradient-text">Beautifully Organized</span>
                    </h1>
                    <p className="landing-hero-subtitle">
                        From recipe to retail — manage formulations, track batches, control inventory,
                        and understand your finances. All in one place, so you can focus on what you love: <strong>creating.</strong>
                    </p>
                    <div className="landing-hero-actions">
                        <button className="landing-btn-primary landing-btn-lg" onClick={goToSignUp}>
                            Start Free — No Credit Card
                            <ArrowRight size={20} />
                        </button>
                        <button className="landing-btn-ghost landing-btn-lg" onClick={() => scrollTo('features')}>
                            See What's Inside
                        </button>
                    </div>
                    <p className="landing-hero-trust">
                        <Check size={16} /> Free forever plan &nbsp;·&nbsp;
                        <Check size={16} /> 14-day trial on paid plans &nbsp;·&nbsp;
                        <Check size={16} /> Setup in minutes
                    </p>
                </div>
            </section>

            {/* ═══════ PAIN POINTS ═══════ */}
            <section className="landing-section landing-pain-section" id="problems">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <span className="landing-section-tag">Sound Familiar?</span>
                        <h2 className="landing-section-title">
                            Running a Soap Business Shouldn't Be <em>This</em> Hard
                        </h2>
                        <p className="landing-section-subtitle">
                            You started because you love making soap. But the business side? That's where things get messy.
                        </p>
                    </div>
                    <div className="landing-pain-grid">
                        {painPoints.map((p, i) => (
                            <div key={i} className="landing-pain-card landing-animate" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="landing-pain-icon">{p.icon}</div>
                                <h3>{p.title}</h3>
                                <p>{p.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section className="landing-section landing-features-section" id="features">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <span className="landing-section-tag">Everything You Need</span>
                        <h2 className="landing-section-title">
                            One Platform. <span className="landing-gradient-text">Every Tool.</span>
                        </h2>
                        <p className="landing-section-subtitle">
                            Stop juggling apps and notebooks. SoapBuddy brings your entire workflow together.
                        </p>
                    </div>
                    <div className="landing-features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="landing-feature-card landing-animate" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="landing-feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ STATS ═══════ */}
            <section className="landing-stats-banner landing-animate">
                <div className="landing-stats-inner">
                    {stats.map((s, i) => (
                        <div key={i} className="landing-stat">
                            <div className="landing-stat-value">{s.value}</div>
                            <div className="landing-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>


            {/* ═══════ PRICING ═══════ */}
            <section className="landing-section landing-pricing-section" id="pricing">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <span className="landing-section-tag">Simple Pricing</span>
                        <h2 className="landing-section-title">
                            A Plan for Every <span className="landing-gradient-text">Stage</span> of Your Journey
                        </h2>
                        <p className="landing-section-subtitle">
                            Start free and upgrade as your business grows. No surprises, no hidden fees.
                        </p>
                    </div>
                    <div className="landing-pricing-grid">
                        {planKeys.map((key) => {
                            const plan = PLANS[key];
                            const isPopular = key === 'maker';
                            return (
                                <div key={key} className={`landing-plan-card ${isPopular ? 'popular' : ''} landing-animate`}>
                                    {isPopular && <div className="landing-popular-badge">Most Popular</div>}
                                    <div className="landing-plan-header">
                                        <h3 className="landing-plan-name">{plan.name}</h3>
                                        <p className="landing-plan-description">{plan.description}</p>
                                        <div className="landing-plan-price">
                                            {plan.price}
                                            {plan.period && <span>{plan.period}</span>}
                                        </div>
                                    </div>
                                    <ul className="landing-plan-features">
                                        {plan.features.map((f) => {
                                            const hasIt = typeof f.value === 'boolean' ? f.value : f.value > 0;
                                            return (
                                                <li key={f.id} className={hasIt ? '' : 'disabled'}>
                                                    {hasIt
                                                        ? <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                                        : <XIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                    }
                                                    {f.label}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {key !== 'free' && (
                                        <p className="landing-plan-trial">✓ 14-day free trial included</p>
                                    )}
                                    <button
                                        className={`landing-plan-btn ${isPopular ? 'landing-btn-primary' : 'landing-btn-ghost'}`}
                                        onClick={goToSignUp}
                                    >
                                        {key === 'free' ? 'Get Started Free' : `Choose ${plan.name}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════ FAQ ═══════ */}
            <section className="landing-section landing-faq-section" id="faq">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <span className="landing-section-tag">Questions?</span>
                        <h2 className="landing-section-title">
                            Frequently Asked <span className="landing-gradient-text">Questions</span>
                        </h2>
                    </div>
                    <div className="landing-faq-list">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className={`landing-faq-item landing-animate ${openFaq === i ? 'open' : ''}`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <button
                                    className="landing-faq-question"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {openFaq === i && (
                                    <div className="landing-faq-answer">
                                        <p>{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FINAL CTA ═══════ */}
            <section className="landing-cta-section">
                <div className="landing-cta-inner landing-animate">
                    <h2>Ready to Get Organized?</h2>
                    <p>
                        Join hundreds of soapmakers who've traded spreadsheet chaos for clarity.<br />
                        Your free account is waiting.
                    </p>
                    <button className="landing-btn-primary landing-btn-lg" onClick={goToSignUp}>
                        Create Your Free Account
                        <ArrowRight size={20} />
                    </button>
                    <span className="landing-cta-note">Free plan · 14-day trial on paid plans · Cancel anytime</span>
                </div>
            </section>

            {/* ═══════ FOOTER ═══════ */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <span className="landing-logo-icon">🧼</span>
                        <span className="landing-logo-text">SoapBuddy</span>
                    </div>
                    <div className="landing-footer-links">
                        <a onClick={() => scrollTo('features')}>Features</a>
                        <a onClick={() => scrollTo('pricing')}>Pricing</a>
                        <a onClick={() => scrollTo('faq')}>FAQ</a>
                        <a onClick={() => navigate('/auth')}>Sign In</a>
                    </div>
                    <p className="landing-footer-copy">
                        © {new Date().getFullYear()} SoapBuddy. Crafted with 💜 for soapmakers everywhere.
                    </p>
                </div>
            </footer>
        </div>
    );
}
