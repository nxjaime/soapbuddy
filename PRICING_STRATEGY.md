# SoapBuddy Pricing Strategy & Market Research
**Last Updated:** February 21, 2026
**Status:** Recommendation for Market Launch

---

## 🚨 CRITICAL FINDING: Pricing Misalignment

### Current State (In Code)
```
Free: $0/mo (3 recipes)
Maker: $6/mo
Manufacturer: $19/mo
```

### Business Plan Assumptions
```
Free: $0/mo (5 recipes)
Starter: $29/mo
Professional: $79/mo
Enterprise: $199/mo
```

**Impact:** Current pricing would generate **~$150K ARR** at 1,000 customers instead of **$600K ARR** at target pricing. This is a **$450K/year revenue gap**.

**Recommendation:** Align code with market-rate pricing before public launch.

---

## Market Research: Competitor Pricing Analysis

### Direct Competitors (Soap-Specific Software)

| Competitor | Model | Price | Target Market | Strengths | Weaknesses |
|------------|-------|-------|---------------|-----------|------------|
| **SoapMaker Pro** | One-time | $130-$200 | Professional makers | Mature features, no recurring cost | Desktop-only, no updates, dated UI |
| **Soapmaker Software** | One-time | $80 | Hobbyists | Affordable | Windows-only, limited features |
| **Formulary Software** | One-time | $150-$500 | Professional formulators | Comprehensive | Expensive, steep learning curve |
| **SoapCalc** | Free | $0 | All users | Trusted, simple | Online-only calculator, no inventory/business features |

**Key Insight:** No established SaaS competitor exists. The market is used to one-time purchases ($80-$500 range), which means:
- **Opportunity:** First-mover advantage in SaaS model
- **Challenge:** Must educate market on value of subscription vs. one-time purchase

### Adjacent SaaS Competitors (Craft Business Tools)

| Tool | Price/Month | Target | Features Overlap |
|------|-------------|--------|------------------|
| **Craftybase** | $19-$99/mo | General crafters | Inventory, production, COGS tracking |
| **Katana MRP** | $99-$899/mo | Small manufacturers | Production planning, inventory |
| **Shopify** | $29-$299/mo | E-commerce sellers | Sales tracking, inventory (basic) |
| **QuickBooks** | $15-$200/mo | Small businesses | Accounting, expenses (no lye calc) |

**Key Insight:** Craft-specific tools charge $19-$99/mo for similar feature sets (inventory + production tracking). We can price competitively at $29-$79/mo with our soap-specific features (lye calc, SAP database, INCI labeling).

---

## Recommended Pricing Strategy

### Option A: **Market-Rate SaaS** (Recommended)
**Position:** Premium value-added platform
**Rationale:** First cloud-based soap business software with professional features

| Tier | Price/Mo | Annual (15% discount) | Target User | Key Features |
|------|----------|----------------------|-------------|--------------|
| **Free** | $0 | $0 | Hobbyists, trial users | 5 recipes, lye calc, basic formulation |
| **Maker** | $29 | $299/yr ($25/mo) | New businesses (0-50 batches/mo) | Unlimited recipes, inventory, production, sales tracking |
| **Professional** | $79 | $799/yr ($67/mo) | Established businesses (50-200 batches/mo) | Multi-location, traceability, advanced analytics, integrations |
| **Enterprise** | $199 | $1,999/yr ($167/mo) | Large operations (200+ batches/mo) | Label creator, API access, priority support, custom features |

**Justification:**
- **$29 Maker tier:** Comparable to Craftybase ($19), Shopify Basic ($29), but with soap-specific features
- **$79 Professional tier:** Between Craftybase Pro ($49) and Katana Starter ($99), fair for multi-location + traceability
- **$199 Enterprise tier:** Lower than Katana Standard ($299) while offering label creator + compliance tools

**Projected Year 1 Revenue (600 customers):**
- Free: 200 users = $0
- Maker: 300 users × $29 = $8,700/mo
- Professional: 90 users × $79 = $7,110/mo
- Enterprise: 10 users × $199 = $1,990/mo
- **Total MRR:** $17,800 → **ARR: $213,600**

---

### Option B: **Value Pricing** (Conservative)
**Position:** Affordable alternative to desktop software
**Rationale:** Ease market transition from one-time to subscription model

| Tier | Price/Mo | Annual (20% discount) | Target User |
|------|----------|----------------------|-------------|
| **Free** | $0 | $0 | Hobbyists |
| **Maker** | $19 | $182/yr ($15/mo) | New businesses |
| **Professional** | $49 | $470/yr ($39/mo) | Established businesses |
| **Enterprise** | $99 | $950/yr ($79/mo) | Large operations |

**Justification:**
- **$19 Maker tier:** Lower than Craftybase ($19), aggressive customer acquisition
- **$49 Professional tier:** Positioned as "cheaper than desktop software over 2 years"
- **$99 Enterprise tier:** Still accessible for small manufacturers

**Projected Year 1 Revenue (600 customers):**
- Free: 200 users = $0
- Maker: 300 users × $19 = $5,700/mo
- Professional: 90 users × $49 = $4,410/mo
- Enterprise: 10 users × $99 = $990/mo
- **Total MRR:** $11,100 → **ARR: $133,200**

**Risk:** Leaves $80K/year on the table vs. Option A. Harder to raise prices later.

---

### Option C: **Freemium + Usage-Based** (Innovative)
**Position:** Pay for what you use
**Rationale:** Appeal to seasonal makers, reduce churn

| Tier | Base Price/Mo | Usage Fee | Target User |
|------|---------------|-----------|-------------|
| **Free** | $0 | - | Hobbyists (5 recipes, 10 batches/mo) |
| **Maker** | $15 | $0.50/batch over 25 | New businesses (variable production) |
| **Professional** | $49 | $0.30/batch over 100 | Established (high volume months) |
| **Enterprise** | $99 | Unlimited | Large operations (predictable costs) |

**Justification:**
- **Flexibility:** Seasonal makers pay less in slow months
- **Growth alignment:** Revenue scales with customer success
- **Competitive moat:** No competitor offers usage-based pricing

**Projected Year 1 Revenue (600 customers, avg 40 batches/mo):**
- Free: 200 users × $0 = $0
- Maker: 300 users × ($15 + 15 batches × $0.50) = $300 × $22.50 = $6,750/mo
- Professional: 90 users × ($49 + 20 batches × $0.30) = 90 × $55 = $4,950/mo
- Enterprise: 10 users × $99 = $990/mo
- **Total MRR:** $12,690 → **ARR: $152,280**

**Risk:** Complex to communicate, potential for "bill shock" if usage spikes.

---

## Recommended Pricing: Option A (Market-Rate SaaS)

### Why Option A Wins

**1. Market Positioning:**
- First cloud-based soap software = premium positioning justified
- Competing with desktop software ($130-$500 one-time) that has NO recurring value
- SaaS provides continuous updates, cloud access, mobile support → worth premium

**2. Customer Psychology:**
- Target customers (soap businesses making $4K-$250K/year) can afford $29-$79/mo
- Price anchoring: $79/mo feels reasonable when SoapMaker Pro is $200 one-time (breaks even in 3 months)
- Annual discount (15%) encourages commitment, reduces churn

**3. Financial Viability:**
- Higher pricing = fewer customers needed to hit profitability
- Provides margin for customer acquisition ($100 CAC = 3-4 month payback at $29/mo)
- Allows investment in support, features, marketing

**4. Competitive Moat:**
- Premium pricing signals quality vs. "cheap" alternatives
- Room to offer discounts/promotions without devaluing product
- Can add features without raising prices (expansion revenue opportunity)

### Price Anchoring Strategy

**On Landing Page:**
- Compare $79/mo Professional to "SoapMaker Pro $200 one-time (no updates)"
- Highlight: "Pays for itself in saved time within first month"
- Show ROI calculator: "Making 50 batches/mo? Save 10 hrs/mo = $200+ value at $20/hr"

**In Sales Conversations:**
- "How much time do you spend on spreadsheets each week?"
- "What's your hourly rate for that admin work?"
- "SoapBuddy saves 5-10 hrs/week = $400-$800/month in time value"

---

## Pricing Psychology: Best Practices

### 1. **Charm Pricing** (Debated)
- **Current:** $29, $79, $199
- **Alternative:** $27, $77, $197
- **Recommendation:** Stick with round numbers for B2B SaaS (appears more professional, premium)

### 2. **Annual Discount Sweet Spot**
- **15% discount** = 1.8 months free (appeals to logic)
- **20% discount** = 2.4 months free (more aggressive, higher LTV)
- **Recommendation:** Start with 15%, test 20% for Q4 holiday promotion

### 3. **Free Plan Limits**
- **Current recommendation:** 5 recipes (enough to feel useful, creates upgrade path)
- **Alternative:** 3 recipes (forces faster upgrade)
- **Decision:** 5 recipes balances virality (people share) with conversion pressure

### 4. **Trial Period**
- **Current:** 14 days free trial (requires card)
- **Alternative:** 30 days free trial (no card required)
- **Recommendation:** 14 days with card (reduces free-tier abuse, qualifies leads)

### 5. **Grandfather Clause**
- **For beta users:** Lock in $19/mo Maker, $49/mo Pro for first 100 customers
- **Benefit:** Creates urgency ("early adopter pricing"), generates testimonials
- **Risk:** Revenue left on table (mitigated by LTV from loyal early customers)

---

## Pricing Migration Plan

### Phase 1: Beta Launch (Months 1-3)
**Pricing:** Early Adopter Discount
- Free: $0 (5 recipes)
- Maker: $19/mo (normally $29)
- Professional: $49/mo (normally $79)
- **Messaging:** "Lock in early adopter pricing forever - first 100 customers only"

**Goal:** Validate willingness to pay, gather testimonials, create urgency

### Phase 2: Public Launch (Months 4-6)
**Pricing:** Standard Market Rates
- Free: $0 (5 recipes)
- Maker: $29/mo
- Professional: $79/mo
- Enterprise: $199/mo (launch this tier at public launch)
- **Messaging:** "Beta pricing ends - grandfather existing customers"

**Goal:** Maximize revenue from new customers, reward early adopters

### Phase 3: Optimization (Months 7-12)
**Pricing:** Test & Iterate
- A/B test annual discount (15% vs. 20%)
- Test free tier limits (3 vs. 5 recipes)
- Survey churned users on price sensitivity
- Consider seasonal promotions (Black Friday, New Year)

**Goal:** Find optimal price point for conversion and retention

---

## Pricing FAQs (For Sales/Support)

**Q: "Why should I pay monthly when SoapMaker Pro is one-time $200?"**
A: Great question! SoapMaker Pro is desktop-only (can't access from your phone at markets), doesn't get updates, and has no cloud backup. SoapBuddy gives you:
- Access from any device, anywhere
- Continuous updates with new features
- Automatic backups (never lose your recipes)
- Modern interface built for 2026 workflows
- Multi-location inventory (SoapMaker Pro can't do this)

Think of it this way: SoapMaker Pro breaks even at 7 months ($200 ÷ $29 = 6.9 months). After that, you're getting better software for the same total cost - and you can cancel anytime.

**Q: "Can I get a discount?"**
A: We offer 15% off if you pay annually ($299/year vs. $348/year on monthly billing). For established businesses, we occasionally offer custom pricing for multi-year commitments - reach out to sales@soapbuddy.com if you're interested!

**Q: "What if I only make soap seasonally (holidays)?"**
A: You can downgrade to the Free plan during off-months and upgrade back to Maker when you ramp up production. Your recipes and data are always saved. Alternatively, annual billing ($299/year) works out to $25/month and gives you year-round access for tax prep, planning, etc.

**Q: "I'm just starting out - $29/mo feels like a lot."**
A: Totally understand! That's why we have a Free plan - 5 recipes, lye calculator, basic formulation tools. Use that to validate your business idea, and upgrade when you start selling regularly. Most customers upgrade after their first $500 in sales (2-3 months for market sellers).

**Q: "What's the difference between Maker and Professional?"**
A: **Maker ($29/mo):** Unlimited recipes, inventory tracking, production batches, sales recording - everything you need to run a soap business from home or sell at markets.

**Professional ($79/mo):** Adds multi-location inventory (if you sell at markets + have a studio + consignment shops), end-to-end traceability (for recalls/compliance), advanced analytics (profit by product, supplier comparison), and integrations (Shopify, Etsy import).

Most customers start with Maker and upgrade to Professional when they hit 50-100 batches/month or expand to multiple sales channels.

---

## Competitive Response Playbook

### If SoapMaker Pro Launches Cloud Version
**Scenario:** Desktop incumbent releases SaaS product at $15-$20/mo

**Response:**
1. **Grandfather existing customers** at current pricing (loyalty lock-in)
2. **Highlight superior UX** - modern React vs. their legacy desktop-ported UI
3. **Accelerate integrations** - Shopify, Etsy, QuickBooks partnerships before they can
4. **Community moat** - recipe marketplace, user-generated content they can't replicate
5. **Consider:** Temporary 6-month promotional pricing ($24/mo Maker) to prevent customer loss

### If Craftybase Adds Soap-Specific Features
**Scenario:** General craft software adds lye calculator

**Response:**
1. **Lean into specialization** - "Built by soapmakers, for soapmakers"
2. **SAP database depth** - 100+ oils with detailed profiles vs. basic calculator
3. **Compliance focus** - INCI labeling, batch traceability, allergen tracking
4. **Community** - Soap-specific recipe templates, ingredient supplier partnerships
5. **Maintain pricing** - Our $29-$79 is competitive with their $19-$99 range

### If New Competitor Enters at $10/mo
**Scenario:** Aggressive startup undercuts pricing

**Response:**
1. **Do NOT engage in price war** - maintain $29/mo positioning
2. **Emphasize quality** - "You get what you pay for in business-critical tools"
3. **Feature velocity** - Ship new features faster, highlight innovation
4. **Support quality** - Premium pricing funds better customer support
5. **If necessary:** Introduce "Starter" tier at $19/mo (limited features) to compete

---

## Action Items: Pricing Implementation

### Immediate (This Week)
- [x] ~~Document current pricing misalignment~~
- [ ] **Decision required:** Choose Option A, B, or C pricing strategy
- [ ] Update `SubscriptionContext.jsx` with chosen pricing
- [ ] Update landing page copy to reflect new pricing
- [ ] Create Stripe products/prices for new tiers
- [ ] Update environment variables (VITE_STRIPE_PRICE_MAKER, etc.)

### Pre-Launch (Weeks 2-4)
- [ ] Add pricing calculator to landing page ("See your ROI")
- [ ] Create comparison table vs. SoapMaker Pro/Craftybase
- [ ] Write pricing FAQ content
- [ ] A/B test messaging: "Time savings" vs. "Professional features"
- [ ] Set up analytics tracking for pricing page (where do users drop off?)

### Post-Launch (Months 1-6)
- [ ] Survey beta users on price sensitivity
- [ ] Track conversion rate by pricing tier
- [ ] Analyze churn by tier (is Pro too expensive?)
- [ ] Test annual discount (15% vs. 20% vs. 25%)
- [ ] Consider introducing "Starter" tier if $29 Maker has low conversion

---

## Recommended Decision: Option A at $29/$79/$199

**Final Recommendation:** Implement **Option A (Market-Rate SaaS)** pricing:
- Free: $0 (5 recipes)
- Maker: $29/mo or $299/year
- Professional: $79/mo or $799/year
- Enterprise: $199/mo or $1,999/year

**Rationale:**
1. ✅ **Market supports it:** Craftybase charges $19-$99, you offer more value
2. ✅ **First-mover premium:** No cloud soap software exists, justify higher price
3. ✅ **Financial viability:** $29/mo = $100 CAC payback in 3-4 months
4. ✅ **Room to discount:** Can offer promotions without devaluing product
5. ✅ **Expansion revenue:** Clear upgrade path from $29 → $79 → $199

**Risk Mitigation:**
- Offer **early adopter pricing** ($19/mo) for first 100 beta customers (grandfather clause)
- Provide **14-day free trial** to reduce friction
- Show **ROI calculator** on landing page to justify value
- Collect **price sensitivity data** in beta, adjust if <20% conversion

**Next Step:** Update code to match recommended pricing and create Stripe products.

---

**Document Owner:** Business Strategy
**Review Cadence:** Monthly during beta, quarterly after launch
**Last Pricing Change:** TBD (not yet launched)
**Grandfathered Customers:** TBD (track in CRM once beta starts)
