# SoapBuddy Financial Model
**5-Year Projections with Unit Economics**
**Last Updated:** February 21, 2026

---

## Executive Summary

**Key Metrics (Year 3 Target):**
- Customers: 6,000
- MRR: $360K
- ARR: $4.3M
- LTV:CAC Ratio: 15:1
- Gross Margin: 85%
- Net Margin: 35%

**Capital Efficiency:**
- Break-even: Month 9 ($25K MRR)
- Profitability: Month 12 ($36K MRR, 20% margin)
- Series A readiness: Month 18-24 ($1M+ ARR)

---

## Pricing Assumptions

### Monthly Subscription Revenue

| Tier | Price/Mo | Annual Price | Annual Discount |
|------|----------|--------------|-----------------|
| Free | $0 | $0 | - |
| Maker | $29 | $299 | 15% ($49 savings) |
| Professional | $79 | $799 | 15% ($149 savings) |
| Enterprise | $199 | $1,999 | 15% ($389 savings) |

**Blended ARPU Target:** $50/month (across all paying tiers)

**Annual vs. Monthly Split:**
- Year 1: 20% annual, 80% monthly
- Year 2: 35% annual, 65% monthly
- Year 3: 50% annual, 50% monthly (mature SaaS benchmark)

---

## Customer Acquisition Model

### Traffic & Conversion Funnel (Monthly)

**Year 1 Average:**
| Stage | Volume | Conversion Rate | Notes |
|-------|--------|-----------------|-------|
| Website Visitors | 5,000/mo | - | SEO, paid ads, referrals |
| Trial Signups | 150/mo | 3% | Free plan signup |
| Activated Users | 90/mo | 60% | Created first recipe |
| Paying Customers | 50/mo | 33% of activated | Upgraded within 30 days |

**Customer Acquisition Cost (CAC) by Channel:**
| Channel | CAC | % of Customers | Notes |
|---------|-----|----------------|-------|
| Organic (SEO, content) | $25 | 30% | Blog posts, YouTube tutorials |
| Paid (FB/Google ads) | $150 | 40% | Targeted ads to soap groups |
| Partnerships (influencers) | $75 | 20% | Affiliate commissions, sponsorships |
| Referral | $15 | 10% | Existing customer referrals |
| **Blended CAC** | **$100** | **100%** | Weighted average |

**CAC Improvement Over Time:**
- Year 1: $100 (building brand, testing channels)
- Year 2: $75 (SEO compounding, referrals growing)
- Year 3: $60 (brand recognition, word-of-mouth)

---

## Customer Lifetime Value (LTV)

### Retention & Churn

**Monthly Churn Rates by Tier:**
| Tier | Monthly Churn | Avg Tenure (Months) | Notes |
|------|---------------|---------------------|-------|
| Free | 30% | 3 months | High churn, conversion funnel |
| Maker | 5% | 20 months | Some seasonal makers churn |
| Professional | 3% | 33 months | Sticky, integral to business |
| Enterprise | 2% | 50 months | High switching costs |
| **Blended** | **5%** | **20 months** | Weighted by tier distribution |

**Annual Retention (Inverse of Churn):**
- Year 1: 85% (5% monthly churn compounded)
- Year 2: 90% (3% monthly churn as product improves)
- Year 3: 92% (2.5% monthly churn, mature product)

**LTV Calculation:**
```
LTV = ARPU × Gross Margin × Avg Customer Lifetime

Maker tier:
- ARPU: $29/mo
- Gross Margin: 85%
- Avg Lifetime: 20 months
- LTV = $29 × 0.85 × 20 = $493

Professional tier:
- ARPU: $79/mo
- Gross Margin: 85%
- Avg Lifetime: 33 months
- LTV = $79 × 0.85 × 33 = $2,217

Blended (assuming 70% Maker, 25% Pro, 5% Enterprise):
- Blended ARPU: $50/mo
- Avg Lifetime: 20 months
- Blended LTV = $50 × 0.85 × 20 = $850
```

**LTV:CAC Ratio:**
- Year 1: $850 LTV ÷ $100 CAC = **8.5:1** (healthy)
- Year 2: $1,050 LTV ÷ $75 CAC = **14:1** (excellent)
- Year 3: $1,200 LTV ÷ $60 CAC = **20:1** (best-in-class)

*SaaS benchmark: 3:1 minimum, 5:1+ is excellent*

---

## Revenue Model

### Customer Mix by Tier

**Year 1 (600 total paying customers by end of year):**
| Tier | Customers | % of Paying | Monthly Revenue | Annual Revenue |
|------|-----------|-------------|-----------------|----------------|
| Free | 400 | - | $0 | $0 |
| Maker | 420 | 70% | $12,180 | $146,160 |
| Professional | 150 | 25% | $11,850 | $142,200 |
| Enterprise | 30 | 5% | $5,970 | $71,640 |
| **Total Paying** | **600** | **100%** | **$30,000** | **$360,000** |

*Note: Year 1 ARR is $162K (average across ramp-up), not $360K (end-of-year run rate)*

**Year 2 (2,500 total paying customers):**
| Tier | Customers | % of Paying | Monthly Revenue | Annual Revenue |
|------|-----------|-------------|-----------------|----------------|
| Free | 1,500 | - | $0 | $0 |
| Maker | 1,750 | 70% | $50,750 | $609,000 |
| Professional | 625 | 25% | $49,375 | $592,500 |
| Enterprise | 125 | 5% | $24,875 | $298,500 |
| **Total Paying** | **2,500** | **100%** | **$125,000** | **$1,500,000** |

**Year 3 (6,000 total paying customers):**
| Tier | Customers | % of Paying | Monthly Revenue | Annual Revenue |
|------|-----------|-------------|-----------------|----------------|
| Free | 3,000 | - | $0 | $0 |
| Maker | 4,200 | 70% | $121,800 | $1,461,600 |
| Professional | 1,500 | 25% | $118,500 | $1,422,000 |
| Enterprise | 300 | 5% | $59,700 | $716,400 |
| **Total Paying** | **6,000** | **100%** | **$300,000** | **$3,600,000** |

**Revenue Growth Rate:**
- Year 1 → Year 2: +826% (rapid early growth)
- Year 2 → Year 3: +140% (still strong, but decelerating)
- CAGR (3-year): 280%

---

## Operating Expenses

### Cost Structure (Monthly, Year 1 Average)

**Fixed Costs:**
| Category | Monthly | Annual | Notes |
|----------|---------|--------|-------|
| **Infrastructure** | | | |
| - Supabase (Database + Auth) | $250 | $3,000 | Pro plan, scales with users |
| - Vercel (Hosting) | $200 | $2,400 | Pro plan, edge functions |
| - Stripe (Payment Processing) | 2.9% + $0.30/txn | ~$10,800 | Variable, ~$30K MRR avg |
| - SaaS Tools (Analytics, CRM, etc.) | $300 | $3,600 | PostHog, Linear, Slack, etc. |
| **People** | | | |
| - Founder Salary | $5,000 | $60,000 | Below-market, sweat equity |
| - Part-time Support (Month 6+) | $2,000 | $12,000 | 20 hrs/week, customer success |
| - Contractors (design, content) | $1,000 | $12,000 | Ad-hoc basis |
| **Marketing** | | | |
| - Paid Ads (Google, FB) | $3,000 | $36,000 | Scales with growth targets |
| - Content Creation | $500 | $6,000 | Writers, video editors |
| - Influencer Partnerships | $1,000 | $12,000 | Sponsorships, affiliate commissions |
| - Events (trade shows) | $500 | $6,000 | Booth fees, travel |
| **Operations** | | | |
| - Legal & Accounting | $500 | $6,000 | Annual incorporation, taxes |
| - Insurance | $150 | $1,800 | Liability, E&O |
| - Miscellaneous | $300 | $3,600 | Buffer for unexpected |
| **TOTAL** | **~$14,700** | **$176,400** | Year 1 average |

**Gross Margin:** 85% (industry-standard for SaaS)
**Contribution Margin:** ARPU - Variable Costs = $50 - $7.50 = $42.50/customer/month

**Variable Costs per Customer:**
- Stripe fees: $1.50 (3% of $50 ARPU)
- Hosting (per user): $0.50 (Supabase, Vercel)
- Support (time): $6.00 (15 min/month avg × $24/hr)
- Total: ~$8/customer/month

---

### Expense Scaling (3-Year Plan)

**Year 1:**
| Category | Amount | % of Revenue |
|----------|--------|--------------|
| Infrastructure | $20,000 | 12% |
| People | $84,000 | 52% |
| Marketing | $60,000 | 37% |
| Operations | $12,000 | 7% |
| **Total** | **$176,000** | **109%** (slight loss) |
| **Net Profit** | ($14,000) | -9% |

**Year 2:**
| Category | Amount | % of Revenue |
|----------|--------|--------------|
| Infrastructure | $75,000 | 5% |
| People | $450,000 | 30% (3-5 FTEs) |
| Marketing | $600,000 | 40% (scaling acquisition) |
| Operations | $75,000 | 5% |
| **Total** | **$1,200,000** | **80%** |
| **Net Profit** | $300,000 | 20% |

**Year 3:**
| Category | Amount | % of Revenue |
|----------|--------|--------------|
| Infrastructure | $150,000 | 4% |
| People | $900,000 | 25% (8-10 FTEs) |
| Marketing | $1,080,000 | 30% |
| Operations | $150,000 | 4% |
| **Total** | **$2,280,000** | **63%** |
| **Net Profit** | $1,320,000 | 37% |

**Operating Leverage:** As revenue scales, fixed costs become smaller % of revenue, improving margins.

---

## Cash Flow & Runway

### Year 1 Quarterly Cash Flow

**Assumptions:**
- Starting cash: $50,000 (founder investment) + $250,000 (seed round) = $300,000
- Monthly burn rate: $14,700 (operating expenses)
- Revenue ramp: $2K MRR (Q1) → $36K MRR (Q4)

| Quarter | Revenue | Expenses | Net Cash Flow | Cumulative Cash |
|---------|---------|----------|---------------|-----------------|
| **Q1** | $6,000 | $44,100 | ($38,100) | $261,900 |
| **Q2** | $24,000 | $52,900 | ($28,900) | $233,000 |
| **Q3** | $60,000 | $61,700 | ($1,700) | $231,300 |
| **Q4** | $108,000 | $84,300 | $23,700 | $255,000 |
| **Total Year 1** | **$198,000** | **$243,000** | **($45,000)** | **$255,000** |

**Runway Analysis:**
- With $300K starting capital: 20+ months runway (to Month 12 break-even)
- Without fundraising ($50K only): 3-4 months runway (must hit revenue fast or bootstrap harder)

**Break-Even Point:**
- Monthly revenue needed: $14,700 (covering operating expenses)
- At $50 ARPU: 294 paying customers
- **Forecast: Month 9 (350 customers, $17.5K MRR)**

---

### Fundraising Scenarios

**Scenario A: Bootstrap (No Fundraising)**
- Starting capital: $50,000 (personal investment)
- Burn rate: $7,000/mo (founder takes $0 salary, minimal marketing)
- Runway: 7 months
- Revenue target to survive: $10K MRR by Month 6 (200 customers)
- **Outcome:** Possible but high-stress, limits growth speed

**Scenario B: $250K Seed Round**
- Total capital: $300,000
- Burn rate: $14,700/mo (founder $5K salary, marketing $3-5K/mo)
- Runway: 20 months to break-even
- Revenue target: $36K MRR by Month 12 (600 customers)
- **Outcome:** Comfortable path to profitability, sustainable growth

**Scenario C: $500K Seed Round**
- Total capital: $550,000
- Burn rate: $35,000/mo (hire engineer $8K, marketing manager $6K, ads $10K/mo)
- Runway: 15 months to break-even (but higher revenue targets)
- Revenue target: $60K MRR by Month 12 (1,200 customers)
- **Outcome:** Aggressive growth, higher risk, faster scale

**Recommended: Scenario B** (balanced risk/reward, capital efficient)

---

## Unit Economics Summary

### Key Metrics Dashboard

**Customer Metrics:**
| Metric | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| Paying Customers | 600 | 2,500 | 6,000 | End-of-period |
| Free Users | 400 | 1,500 | 3,000 | Conversion funnel |
| Monthly Churn | 5% | 3% | 2.5% | Improving with product maturity |
| Annual Retention | 85% | 90% | 92% | Inverse of churn |

**Revenue Metrics:**
| Metric | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| MRR (End of Period) | $36K | $125K | $360K | Monthly recurring revenue |
| ARR | $162K | $1.5M | $4.3M | Annualized (weighted average) |
| ARPU | $50 | $50 | $60 | Increases with Enterprise adoption |
| Blended LTV | $850 | $1,050 | $1,200 | Customer lifetime value |

**Acquisition Metrics:**
| Metric | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| CAC | $100 | $75 | $60 | Customer acquisition cost |
| LTV:CAC | 8.5:1 | 14:1 | 20:1 | Improving efficiency |
| Payback Period | 4 months | 3 months | 2 months | Time to recover CAC |
| Website Traffic/Mo | 5,000 | 20,000 | 50,000 | SEO compounding |

**Profitability Metrics:**
| Metric | Year 1 | Year 2 | Year 3 | Notes |
|--------|--------|--------|--------|-------|
| Gross Margin | 85% | 87% | 88% | Improving with scale |
| Operating Expenses | $176K | $1.2M | $2.28M | Scaling with revenue |
| Net Margin | -9% | 20% | 37% | Path to profitability |
| EBITDA | ($14K) | $300K | $1.32M | Earnings before taxes |

**SaaS Magic Number:**
```
Magic Number = (Net New ARR in Quarter) / (Sales & Marketing Spend in Prior Quarter)

Year 1 Q4:
- Net New ARR: $108K (Q4 revenue annualized)
- S&M Spend (Q3): $15K
- Magic Number: 7.2 (> 1.0 is efficient, > 0.75 is acceptable)
```

**Rule of 40 (SaaS Health Metric):**
```
Rule of 40 = Revenue Growth Rate + Profit Margin

Year 2: 826% growth + 20% margin = 846% (exceptional, early-stage growth)
Year 3: 140% growth + 37% margin = 177% (still well above 40% benchmark)
```

---

## Sensitivity Analysis

### What-If Scenarios

**Variable: Monthly Churn Rate**
| Churn | Avg Tenure | LTV | LTV:CAC | Impact |
|-------|------------|-----|---------|--------|
| 3% (optimistic) | 33 mo | $1,400 | 14:1 | +65% LTV, higher profitability |
| 5% (base case) | 20 mo | $850 | 8.5:1 | Base scenario |
| 8% (pessimistic) | 12.5 mo | $530 | 5.3:1 | -38% LTV, still viable but margins compressed |

**Variable: Customer Acquisition Cost**
| CAC | LTV:CAC | Payback | Impact |
|-----|---------|---------|--------|
| $60 (optimistic) | 14:1 | 2.4 mo | Strong organic growth, efficient channels |
| $100 (base case) | 8.5:1 | 4 mo | Balanced paid + organic |
| $150 (pessimistic) | 5.7:1 | 6 mo | Heavy reliance on paid ads, slower scale |

**Variable: Pricing (Maker Tier)**
| Price/Mo | ARPU | ARR (Year 3) | Conversion Rate Assumption | Impact |
|----------|------|--------------|----------------------------|--------|
| $19 | $35 | $2.52M | +20% (lower friction) | -41% revenue vs. base case |
| $29 (base) | $50 | $4.3M | Baseline | Base scenario |
| $39 | $62 | $5.58M | -15% (price resistance) | +30% revenue if conversion holds |

**Variable: Customer Growth Rate**
| Growth | Year 3 Customers | ARR | Notes |
|--------|------------------|-----|-------|
| Conservative (50% slower) | 3,000 | $2.15M | Market saturation, strong churn |
| Base Case | 6,000 | $4.3M | Steady execution |
| Aggressive (2x faster) | 12,000 | $8.6M | VC-backed blitz scaling |

**Break-Even Sensitivity:**
| Scenario | Customers to Break-Even | Months to Break-Even | Notes |
|----------|-------------------------|----------------------|-------|
| Low burn ($7K/mo, bootstrap) | 140 | 4-5 months | Founder takes $0 salary, minimal marketing |
| Base burn ($14.7K/mo) | 294 | 9 months | Sustainable, $250K funding |
| High burn ($35K/mo) | 700 | 12-14 months | Aggressive hiring, $500K funding |

---

## Expansion Revenue Opportunities

### Beyond Core Subscriptions

**1. Marketplace Commission (Year 2+)**
- **Model:** 15% commission on recipe template sales
- **Assumption:** 20% of Pro/Enterprise users sell templates, avg $25/template, 10 sales/seller/year
- **Year 2 Revenue:** 150 sellers × 10 sales × $25 × 15% = $5,625/year
- **Year 3 Revenue:** 500 sellers × 15 sales × $30 × 15% = $33,750/year

**2. Premium Templates (One-Time)**
- **Model:** $10-$50 curated template packs (e.g., "Holiday Soap Collection")
- **Assumption:** 30% of paying customers buy 1 template/year at avg $25
- **Year 2 Revenue:** 2,500 × 30% × $25 = $18,750/year
- **Year 3 Revenue:** 6,000 × 35% × $30 = $63,000/year

**3. Expert Consultations (Marketplace)**
- **Model:** $150/hr formulation consulting, 20% commission to platform
- **Assumption:** 50 experts, 5 sessions/month each at $150/hr
- **Year 3 Revenue:** 50 × 5 × 12 × $150 × 20% = $90,000/year

**4. Transaction Fees (Optional, Year 3+)**
- **Model:** 1% fee on sales imported through Shopify/Etsy integrations
- **Assumption:** 50% of Pro/Enterprise users opt-in, avg $5K/month sales per user
- **Year 3 Revenue:** 900 users × $5,000/mo × 12 mo × 1% = $540,000/year
- **Risk:** May reduce adoption of integrations if mandatory

**Total Expansion Revenue (Year 3):** ~$726K (adds ~17% to core ARR)

---

## Valuation Benchmarks

### Comparable SaaS Multiples

**Public SaaS Comparables (2026 Averages):**
| Company | ARR | Revenue Multiple | Notes |
|---------|-----|------------------|-------|
| Shopify | $7.5B | 12x | E-commerce platform, high growth |
| Intuit (QuickBooks) | $14B | 8x | SMB accounting, mature |
| HubSpot | $2.1B | 15x | Marketing automation, fast growth |
| **Median Multiple** | - | **10-12x ARR** | For profitable, growing SaaS |

**Private SaaS Acquisition Multiples:**
| Stage | ARR Range | Typical Multiple | Notes |
|-------|-----------|------------------|-------|
| Early (Series A) | $1M-$5M | 6-10x ARR | High growth, not yet profitable |
| Growth (Series B/C) | $5M-$20M | 8-15x ARR | Profitable or near-profitable |
| Late-Stage | $20M+ | 10-20x ARR | Market leader, strong margins |

**SoapBuddy Valuation Estimates:**

**Year 2 (Seed/Series A Stage):**
- ARR: $1.5M
- Growth Rate: 826%
- Profitability: 20% net margin
- **Valuation Range:** $9M-$15M (6-10x ARR)
- **Investor Returns:** $500K at $2.5M post → owns 20% → $1.8M-$3M exit value = **3.6x-6x return**

**Year 3 (Series A/B Stage):**
- ARR: $4.3M
- Growth Rate: 140%
- Profitability: 37% net margin
- **Valuation Range:** $34M-$64M (8-15x ARR)
- **Investor Returns:** $500K at $2.5M post → owns 20% (diluted to ~15%) → $5M-$9.6M exit value = **10x-19x return**

**Strategic Acquisition Premium:**
- Add 20-30% premium if Shopify, Square, or Etsy acquires (strategic value)
- **Year 3 Strategic Exit:** $40M-$80M range possible

---

## Financial Model Export (For Excel/Google Sheets)

### Tables to Build in Spreadsheet

**Tab 1: Assumptions**
- Pricing by tier
- Churn rates
- CAC by channel
- Customer mix %
- Annual vs. monthly split

**Tab 2: Customer Cohorts**
- Month-by-month cohort retention
- LTV calculation per cohort
- Churn modeling

**Tab 3: Revenue Model**
- Customer count by tier (monthly)
- MRR by tier
- ARR calculation
- Expansion revenue

**Tab 4: Operating Expenses**
- Personnel (salaries + benefits)
- Infrastructure (hosting, SaaS tools)
- Marketing (paid ads, content, events)
- Operations (legal, insurance, etc.)

**Tab 5: Cash Flow**
- Monthly revenue
- Monthly expenses
- Net cash flow
- Cumulative cash (runway tracker)

**Tab 6: Unit Economics Dashboard**
- CAC, LTV, LTV:CAC
- Payback period
- Magic Number
- Rule of 40

**Tab 7: Sensitivity Analysis**
- Scenarios: churn, CAC, pricing, growth rate
- Data tables for what-if modeling

**Tab 8: Valuation**
- ARR projections
- Comparable multiples
- Investor return calculations

---

## Action Items

### Immediate (This Week)
- [ ] Build Excel/Google Sheets version of this model (use templates above)
- [ ] Validate assumptions with market research (interview 10 soap makers on pricing)
- [ ] Decide on pricing strategy (Option A $29/$79 vs. Option B $19/$49)
- [ ] Update code to reflect chosen pricing

### Pre-Launch (Weeks 2-4)
- [ ] Add cohort retention tracking to analytics (PostHog or Mixpanel)
- [ ] Set up financial dashboard (track actual vs. projected)
- [ ] Create investor data room with this model
- [ ] Test pricing with beta users (A/B test $29 vs. $39 for Maker)

### Post-Launch (Months 1-6)
- [ ] Update model monthly with actual data
- [ ] Adjust assumptions based on real churn, CAC, conversion rates
- [ ] Share model with investors (monthly update emails)
- [ ] Revisit expansion revenue opportunities (marketplace, templates)

---

**Model Owner:** Founder / Finance Lead
**Review Cadence:** Weekly (first 3 months), then monthly
**Actuals vs. Forecast:** Track variance, adjust assumptions quarterly
**Investor Reporting:** Share updated model in monthly/quarterly updates
