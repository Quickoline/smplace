import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../auth/model/model.js";
import { registerUser, createAdminBySuperAdmin } from "../auth/services/services.js";
import { createService } from "../api/service/services/services.js";
import { createOrder } from "../api/order/services/services.js";
import { createListing } from "../api/buySell/services/services.js";
import { Service } from "../api/service/model/model.js";
import { ServiceCategory } from "../api/service/category/model/model.js";
import { BuySellListing } from "../api/buySell/model/model.js";
import { Order } from "../api/order/model/model.js";
import { Message } from "../api/chat/model/model.js";
import { Payment } from "../api/payment/model/model.js";
import { WalletTransaction } from "../api/wallet/model/model.js";

/**
 * CATEGORY_TREE: category.name and subcategory names must match SERVICE_SEEDS (category / subcategory).
 */
const CATEGORY_TREE = [
  {
    name: "Software",
    subcategories: [
      "App Development",
      "Website Development",
      "WordPress Development",
      "Webflow Development",
      "FlutterFlow Development",
      "UI/UX Design",
      "AI Agent Development",
      "Application Deployment",
    ],
  },
  {
    name: "Company Registration & Compliance",
    subcategories: [
      "Sole Proprietorship",
      "Partnership",
      "Limited Liability Partnership (LLP)",
      "Private Limited (Pvt Ltd)",
      "Public Limited",
      "Section 8 (NGO)",
      "GST Services",
      "ROC Compliances",
      "DSC & KYC",
    ],
  },
  {
    name: "Design",
    subcategories: ["Graphic Design", "Logo Design", "Video Editing"],
  },
  {
    name: "Digital Marketing",
    subcategories: [
      "SEO",
      "Advertising",
      "Lead Generation",
      "Social Media Management",
    ],
  },
  {
    name: "Licensing",
    subcategories: [
      "Trademark",
      "ISO Certification",
      "FSSAI",
      "Import Export Code (IEC)",
    ],
  },
  {
    name: "Ecommerce",
    subcategories: [
      "Account Management",
      "Ad Campaign",
      "Brand Approval & Product Review",
      "Product Listing",
    ],
  },
  {
    name: "Buy/Sell",
    subcategories: [
      "Company Sale",
      "Franchise",
      "Digital Assets & Accounts",
      "Software & SaaS",
    ],
  },
  {
    name: "Finance",
    subcategories: [
      "Startup India Registration",
      "Fundraising",
      "Loan Consultation",
    ],
  },
  {
    name: "Hiring",
    subcategories: [
      "Executive & Leadership",
      "Technical & Product",
      "Operations & HR",
      "Marketing & Creative",
    ],
  },
  {
    name: "Consultancy",
    subcategories: ["Business Consultant", "General Startup Consultant"],
  },
  {
    name: "Advocate",
    subcategories: [
      "Consumer & Civil Litigation",
      "Corporate & Commercial",
      "Criminal & White-Collar",
      "Tax & Revenue Litigation",
      "Property, Defamation & General Civil",
    ],
  },
];

const SERVICE_SEEDS = [
  // --- Software ---
  {
    name: "Custom Mobile App Development",
    category: "Software",
    subcategory: "App Development",
    description:
      "Full-lifecycle mobile delivery: discovery, UX flows, visual design, implementation, QA, and store submission. We build native (Swift/Kotlin) or cross-platform (Flutter, React Native) apps aligned to your business rules, analytics, and integrations—whether you need a customer-facing product, internal tool, or companion to an existing web platform.",
    requirements:
      "Written feature list or PRD, primary user personas, iOS/Android/store priorities, brand kit (logo, colours, fonts), wireframes or references if any, API base URLs and auth method for integrations, analytics tools in use, offline/push notification needs, and target launch window. For regulated data, note compliance constraints up front.",
    included: "",
  },
  {
    name: "Custom Web Development",
    category: "Software",
    subcategory: "Website Development",
    description:
      "Engineering for marketing sites, authenticated portals, dashboards, and data-driven web apps. We choose stack and architecture to match traffic, SEO, security, and your team’s ability to maintain the system after handover—static sites, SSR, or SPA plus API backends as appropriate.",
    requirements:
      "Sitemap and page purposes, domain and DNS access (or registrar login), hosting preference or budget, final or draft copy and imagery, design files or reference URLs, list of forms and third-party embeds, authentication/roles if applicable, and non-functional needs (languages, accessibility level, peak traffic).",
    included: "",
  },
  {
    name: "WordPress Website Development",
    category: "Software",
    subcategory: "WordPress Development",
    description:
      "WordPress builds using quality themes or custom child themes: corporate sites, publishers, and WooCommerce shops. Includes performance tuning (caching, image pipeline), security basics, plugin hygiene, editor training, and documentation so your team can publish without breaking layout.",
    requirements:
      "Hosting control panel or SFTP, domain pointing, brand assets, list of pages and templates, product catalogue structure for shops, payment/shipping rules, required plugins (SEO, forms, CRM), migration source if replacing a site, and legal pages (privacy, returns) if you already have drafts.",
    included: "",
  },
  {
    name: "Webflow Design & Development",
    category: "Software",
    subcategory: "Webflow Development",
    description:
      "Marketing and content sites in Webflow with responsive layouts, CMS collections for blogs or resources, interactions, and a publishing workflow your marketing team can own. Ideal when design quality and fast iteration matter more than heavy custom backend code.",
    requirements:
      "Webflow account or workspace invite, brand guidelines, final copy and image assets per section, CMS field requirements (authors, categories, SEO fields), integration needs (analytics, CRM forms), and launch checklist items (redirects from old URLs, favicon, social previews).",
    included: "",
  },
  {
    name: "FlutterFlow App Development",
    category: "Software",
    subcategory: "FlutterFlow Development",
    description:
      "Accelerated apps using FlutterFlow: screens, component library, Firebase or REST bindings, custom actions, and export paths to raw Flutter when you outgrow no-code. Suited to MVPs, internal tools, and client demos that must ship quickly with a path to scale.",
    requirements:
      "FlutterFlow project access or greenfield brief, feature list with user roles, backend choice (Firebase vs custom API) and schema outline, branding, push/analytics requirements, and whether App Store / Play Store publishing is in scope. List any native modules you know you will need beyond FlutterFlow defaults.",
    included: "",
  },
  {
    name: "Product UI/UX Design",
    category: "Software",
    subcategory: "UI/UX Design",
    description:
      "Research-informed product design: journeys, wireframes, high-fidelity UI, and design systems in Figma. We align UX decisions with engineering constraints and content reality so implementation matches the prototype and accessibility expectations are explicit.",
    requirements:
      "Problem statement and success metrics, audience segments, competitive products to benchmark, existing user research, content inventory or copy owner, engineering platform (web, iOS, Android), accessibility target (e.g. WCAG level), and deadline for developer handoff. Prior designs or a current app build help calibrate scope.",
    included: "",
  },
  {
    name: "Prebuilt & Custom AI Agents",
    category: "Software",
    subcategory: "AI Agent Development",
    description:
      "Assistants for support, sales qualification, or internal knowledge: template chatbots with guardrails or retrieval-augmented agents over your documents. Scope covers prompt design, tool/API calling where needed, evaluation against sample queries, and deployment to web, WhatsApp, or ticketing systems where feasible.",
    requirements:
      "Primary use case and tone, languages, sample conversations (good and bad), document sources and update frequency, PII/redaction rules, target channels, SLA for response quality, and whether human handoff is required. For custom models, note hosting constraints (cloud region, on-prem).",
    included: "",
  },
  {
    name: "Cloud & Server Deployment Services",
    category: "Software",
    subcategory: "Application Deployment",
    description:
      "Production setup on AWS, GCP, Azure, or simpler VPS providers: networking, secrets, scaling basics, observability, backups, and CI/CD so deploys are repeatable. We document runbooks and access so your team is not locked to a single engineer.",
    requirements:
      "Repository access and branch strategy, environment matrix (dev/stage/prod), env var list (redacted values OK), domain and TLS expectations, data residency, budget caps, existing containers or bare-metal preference, compliance (HTTPS-only, logging retention), and on-call expectations.",
    included: "",
  },
  // --- Company Registration & Compliance (by nature) ---
  {
    name: "Sole Proprietorship Registration",
    category: "Company Registration & Compliance",
    subcategory: "Sole Proprietorship",
    description:
      "Guidance for operating as a sole proprietor with the right local and sector registrations: trade name clarity, bank account opening support context, and alignment with GST or MSME/Udyam where your turnover and activity require it. Suited to freelancers, retailers, and small service businesses that want the simplest formal footprint.",
    requirements:
      "Proprietor PAN and Aadhaar, passport-size photographs, proof of principal place of business (rent agreement/NOC or utility), personal bank account details, proposed business names in order of preference, nature of business in plain language, and any existing registrations (GSTIN, shop licence) for continuity planning.",
    included: "",
  },
  {
    name: "Partnership Firm Registration",
    category: "Company Registration & Compliance",
    subcategory: "Partnership",
    description:
      "Partnership firm structuring: drafting a deed that records capital, profit share, decision-making, admission/exit, and dispute resolution, plus coordination of applicable registrations. Helps partners start with aligned expectations before operations and lender relationships grow.",
    requirements:
      "PAN and Aadhaar for all partners, photographs, registered office address proof, proposed firm name, capital contribution per partner, profit-sharing ratio, designated managing partner if any, list of authorised signatories for bank, and summary of business activity and locations.",
    included: "",
  },
  {
    name: "LLP Incorporation",
    category: "Company Registration & Compliance",
    subcategory: "Limited Liability Partnership (LLP)",
    description:
      "MCA-based LLP incorporation for teams wanting limited liability without full company formality: designated partners, LLP Agreement filing, contribution structure, and first compliance milestones. Common for professional services and small joint ventures.",
    requirements:
      "DSC for designated partners, two proposed names in order, principal business activity, registered office proof, partner KYC (PAN, address, contact), proposed contribution and profit-sharing, and clarity on foreign partner involvement if any. Existing partnership or business to convert should disclose liabilities and contracts.",
    included: "",
  },
  {
    name: "Private Limited Company Incorporation",
    category: "Company Registration & Compliance",
    subcategory: "Private Limited (Pvt Ltd)",
    description:
      "Private Limited incorporation for startups and SMEs: authorised capital, subscriber shares, directors, MOA/AOA objects, and CIN issuance. We align the cap table and object clauses with near-term fundraising or lender expectations where you share those goals.",
    requirements:
      "Director DIN/DSC readiness, proposed name options, main objects of the company, registered office proof, subscriber sheet details, shareholding percentages, authorised vs paid-up capital plan, and nominee/signatory for first bank account. NRIs or foreign subscribers need additional KYC clarity up front.",
    included: "",
  },
  {
    name: "Public Limited Company Incorporation",
    category: "Company Registration & Compliance",
    subcategory: "Public Limited",
    description:
      "Incorporation path for Public Limited companies when broader membership, listing, or regulatory structure requires this form. Includes heavier governance defaults; early scoping covers minimum directors, capital, and whether you are preparing for eventual listing or large investor base.",
    requirements:
      "Promoter and director KYC, DSC, multiple name choices, detailed object clause, registered office evidence, proposed capital and share classes, board composition, company secretary engagement plan if applicable, and any sectoral approvals known at inception.",
    included: "",
  },
  {
    name: "Section 8 (Not-for-Profit) Registration",
    category: "Company Registration & Compliance",
    subcategory: "Section 8 (NGO)",
    description:
      "Section 8 company route for non-profit objects with limited liability: charitable, educational, social welfare, or similar purposes. Covers drafting of memorandum, licence stage before incorporation, and clarity on restrictions on dividend and asset use.",
    requirements:
      "Promoter/trustee profiles, registered office proof, detailed charitable objects, proposed name, initial funding plan, director KYC and DSC, and any existing trust/society to merge or relate. Foreign contribution or FCRA angle should be flagged early if relevant.",
    included: "",
  },
  {
    name: "Comprehensive GST Registration & Filing",
    category: "Company Registration & Compliance",
    subcategory: "GST Services",
    description:
      "GST lifecycle support: fresh registration, amendments, core returns (GSTR-1, GSTR-3B, annual reconciliation), e-invoicing readiness where applicable, LUT for exporters, and cancellation or migration when closing or restructuring a unit.",
    requirements:
      "Legal entity PAN, principal/additional place addresses, bank proof, authorised signatory Aadhaar for verification, business commencement proof, HSN/SAC summary, previous GST credentials if migrating, sales/purchase data access for reconciliations, and DSC if your profile requires it.",
    included: "",
  },
  {
    name: "ROC Annual & Event-Based Compliances",
    category: "Company Registration & Compliance",
    subcategory: "ROC Compliances",
    description:
      "ROC and MCA calendar: annual financial filings, director and auditor appointments, and event-driven forms for changes in capital, address, directors, or charges. Organises documents so board-approved resolutions match filed facts and due dates are tracked.",
    requirements:
      "Audited financial statements, signed board reports, AGM details, director DSCs, event-specific papers (allotment, share-movement filings, charge deeds, lease for address change), prior filing references (SRNs), and company email/mobile for MCA login. For delays, history of defaults helps plan remedial filings.",
    included: "",
  },
  {
    name: "DSC Issuance & Director KYC",
    category: "Company Registration & Compliance",
    subcategory: "DSC & KYC",
    description:
      "Digital signature certificates for MCA, GST, tender portals, and organisation use; plus DIR-3 KYC compliance for directors with active DIN. Covers application, video KYC slots, token delivery, and renewal planning so filings are not blocked at deadline.",
    requirements:
      "Applicant PAN, Aadhaar, mobile, email, recent photo, organisation letter if applying as organisation DSC, and for DIR-3 KYC the active DIN, DSC on hand, and proof of personal mobile/email matching MCA records. Renewals need old certificate details and expiry date.",
    included: "",
  },
  // --- Design ---
  {
    name: "Marketing Collateral & Social Media Graphics",
    category: "Design",
    subcategory: "Graphic Design",
    description:
      "Campaign-ready visuals for feeds, stories, print handouts, slide decks, and ads. We align grids, typography, and export specs to each channel so assets stay sharp and on-brand when your team reuses them across markets or resizes for seasonal pushes.",
    requirements:
      "Brand kit (hex/RGB colours, fonts, logo variants), final or draft copy per asset, exact sizes or platform (e.g. Instagram square, LinkedIn article), reference designs you like, file format needs (PNG, PDF, print bleed), and approval chain if legal/compliance must sign off.",
    included: "",
  },
  {
    name: "Brand Identity & Logo Creation",
    category: "Design",
    subcategory: "Logo Design",
    description:
      "Identity systems from discovery to delivery: naming constraints, mark exploration, wordmarks, colour logic, and a short guideline for partners and vendors. Suited to new ventures refreshing positioning or splitting a sub-brand from a parent company.",
    requirements:
      "Company/product name, tagline, industry and audience, competitors to avoid resembling, values or personality words (e.g. bold, clinical, playful), mandatory colours or symbols, trademark search hints if you already ran one, and primary touchpoints (app icon, signage, merch).",
    included: "",
  },
  {
    name: "Professional Video Production & Editing",
    category: "Design",
    subcategory: "Video Editing",
    description:
      "Post-production for social clips, explainers, webinars, and ads: pacing, colour, sound mix, captions, and platform-safe loudness. We can work from your rushes or augment with stock and motion graphics when you specify brand rules.",
    requirements:
      "All source footage with naming convention, script or beat sheet, reference edit (YouTube link OK), music preference (library vs licensed track), caption language(s), aspect ratios needed (9:16, 1:1, 16:9), final length targets, and brand fonts/overlays if supplied.",
    included: "",
  },
  // --- Digital Marketing ---
  {
    name: "On-Page & Off-Page SEO",
    category: "Digital Marketing",
    subcategory: "SEO",
    description:
      "Organic growth program: technical crawl fixes, information architecture, content briefs, internal linking, and measured off-site tactics. Reporting ties rankings and impressions to pages you care about—not vanity metrics disconnected from leads.",
    requirements:
      "CMS or repo access, Google Search Console and Analytics (GA4) property access, list of priority products/services and locations, competitor domains, historical penalties or migrations, content approval owner, and acceptable keyword themes to avoid (brand/legal).",
    included: "",
  },
  {
    name: "Google Ads & Meta Ads Management",
    category: "Digital Marketing",
    subcategory: "Advertising",
    description:
      "Paid media across Search, Performance Max, Display, YouTube, Meta feeds and stories: structured tests, creative rotation, audience exclusions, and budget pacing with clear hypotheses each sprint.",
    requirements:
      "Ad account admin access, billing method in good standing, monthly budget range, conversion definitions in GA4/ads, creative assets and UTM conventions, landing page URLs, restricted claims policy if you are in regulated sectors, and list of geos/languages.",
    included: "",
  },
  {
    name: "B2B/B2C Lead Generation Campaigns",
    category: "Digital Marketing",
    subcategory: "Lead Generation",
    description:
      "End-to-end funnels: offer design, landing experience, form logic, CRM hooks, nurture emails, and sales handoff rules. Focus on qualified leads rather than raw form fills when you share what “good” looks like for your reps.",
    requirements:
      "ICP and disqualifiers, CRM (HubSpot, Zoho, etc.) access or API docs, lead magnet or trial offer, sales follow-up SLA, compliance text (privacy, consent), current cost-per-lead if known, and creative tone examples from your brand.",
    included: "",
  },
  {
    name: "Social Media Growth & Management",
    category: "Digital Marketing",
    subcategory: "Social Media Management",
    description:
      "Always-on social: content calendar, publishing, community replies within agreed windows, UGC guidelines, and monthly insight summaries. Can include creator coordination when you pre-approve budgets and usage rights.",
    requirements:
      "Handle logins or scheduling tool access, brand voice guide, do-not-say list, escalation matrix for complaints, asset library links, hashtag rules, hours for engagement coverage, and approval turnaround time from your side.",
    included: "",
  },
  // --- Licensing ---
  {
    name: "Trademark Search & Registration",
    category: "Licensing",
    subcategory: "Trademark",
    description:
      "Clearance search, filing strategy for word/device marks, class selection, prosecution through examination reports, and hearing prep when disputes arise. Helps reduce refusal risk before you invest in packaging and domains.",
    requirements:
      "High-resolution logo or word mark, exact spelling and stylisation, list of goods/services with examples sold in commerce, applicant legal name and address, date of first use if claiming use-based filing, MSME certificate for fee concession if applicable, and any co-existence letters already negotiated.",
    included: "",
  },
  {
    name: "ISO Standards Implementation & Certification",
    category: "Licensing",
    subcategory: "ISO Certification",
    description:
      "Management system build for ISO 9001 (quality), ISO 27001 (security), or related standards: context, risks, procedures, records, internal audit readiness, and liaison with certification bodies you select.",
    requirements:
      "Organisation chart, scope of certification (sites/products), existing SOPs, customer/regulatory obligations, IT asset overview for 27001, prior non-conformities if recertifying, target audit month, and management rep for system ownership.",
    included: "",
  },
  {
    name: "Food License Registration (FSSAI)",
    category: "Licensing",
    subcategory: "FSSAI",
    description:
      "Licensing path for manufacturers, cloud kitchens, retailers, importers, and e-commerce food sellers: category selection (Basic/State/Central), FoSTac training coordination where needed, and post-approval display/compliance reminders.",
    requirements:
      "Business constitution proof, premises layout and rental docs, category of food articles, production capacity or turnover bracket, photo ID of responsible person, water test report if asked for your category, and existing licences if upgrading or modifying.",
    included: "",
  },
  {
    name: "IEC Registration",
    category: "Licensing",
    subcategory: "Import Export Code (IEC)",
    description:
      "Fresh IEC, modification, or surrender via DGFT: linking IEC to your entity PAN, digital token steps, and guidance on when IEC updates are mandatory after business changes.",
    requirements:
      "Entity PAN, authorised signatory Aadhaar/DSC as per current DGFT flow, cancelled cheque or bank certificate, principal business address proof, mobile/email for OTP, and if modification—supporting board resolution or name-change certificate.",
    included: "",
  },
  // --- Ecommerce ---
  {
    name: "Marketplace Account Management",
    category: "Ecommerce",
    subcategory: "Account Management",
    description:
      "Daily seller ops: catalogue hygiene, pricing rules, inventory sync, order defect reduction, case logging with support, and performance notifications. Works across Amazon, Flipkart, Meesho, or D2C Shopify when you grant appropriate access.",
    requirements:
      "Seller central credentials with roles separated for agency, SKU master with costs, fulfilment model (FBA/self-ship), SLA for pricing approvals, list of restricted claims per ASIN, returns policy, and escalation contact on your side for stockouts.",
    included: "",
  },
  {
    name: "Ecommerce Marketplace Advertising",
    category: "Ecommerce",
    subcategory: "Ad Campaign",
    description:
      "Retail media: sponsored products/brands, deals placement, and defensive campaigns on competitor keywords where policy allows. Ties spend to margin-aware targets using your COGS and fee structure when you share them.",
    requirements:
      "Advertising console access, monthly cap, target ACOS/TACOS or incremental sales goal, hero SKUs and seasonality calendar, creative assets compliant with marketplace rules, and inventory buffer so ads are not pointed at out-of-stock lines.",
    included: "",
  },
  {
    name: "Brand Registry & Review Management",
    category: "Ecommerce",
    subcategory: "Brand Approval & Product Review",
    description:
      "Protect listings via registry programs, report violations with evidence, and implement review generation patterns that stay within marketplace policies. Includes playbook for handling negative spikes without policy risk.",
    requirements:
      "Registered trademark matching brand name on packaging, high-quality product and packaging images, brand website, customer service email/phone appearing on detail pages, historical review data export if analysing anomalies, and legal letterhead for escalations if needed.",
    included: "",
  },
  {
    name: "SEO-Optimized Product Cataloguing",
    category: "Ecommerce",
    subcategory: "Product Listing",
    description:
      "Listing engineering: keyword architecture per ASIN, structured bullets, backend search terms where available, A+ or brand story modules, and bulk upload templates for large catalogues.",
    requirements:
      "Raw images meeting marketplace resolution, dimensional and variant matrix, ingredient or compliance text for regulated categories, competitor ASINs for benchmarking, brand style for capitalisation and claims, and translation needs if multilingual.",
    included: "",
  },
  // --- Buy/Sell (subcategory strings must match CATEGORY_TREE exactly) ---
  {
    name: "Company Sale",
    category: "Buy/Sell",
    subcategory: "Company Sale",
    description:
      "Structured buy-side and sell-side support for company sales: from small private companies to larger asset deals. We help clarify what is being sold (shares vs assets), align expectations on valuation bands, introduce serious counterparties under confidentiality, and keep diligence and negotiation organised so both sides understand timelines, risks, and typical deal steps before lawyers and accountants finalise terms.",
    requirements:
      "Seller: company/incorporation details, cap table or ownership proof, 2–3 years financials or management accounts, asset/stock summary, list of material contracts, and any existing LOI or term sheet. Buyer: brief on target profile, proof of funds or financing route, and NDA acceptance. Both: preferred deal structure (asset vs share), jurisdiction, and target close window.",
    included: "",
  },
  {
    name: "Franchise Resale",
    category: "Buy/Sell",
    subcategory: "Franchise",
    description:
      "Support for franchise resales: matching incoming franchisees with outgoing operators, coordinating with franchisor approval processes, and making handover expectations clear. Suitable when a unit is changing hands but the brand agreement and franchisor consent remain central to a lawful resale.",
    requirements:
      "Current franchise agreement (or key terms), franchisor contact for resale approval, territory and outlet details, FDD or disclosure summary if available, P&L for the unit, list of fixed assets and staff, and any handover or training fees from the franchisor. Buyer: background summary and capital available for franchise fee and working capital.",
    included: "",
  },
  {
    name: "Digital Assets & Accounts",
    category: "Buy/Sell",
    subcategory: "Digital Assets & Accounts",
    description:
      "Facilitation when value sits in digital presence: social media accounts, content channels, marketplace seller accounts, domains bundled with operations, and similar. Emphasis on platform rules, proof of control, and a clear handover checklist so buyers receive access and sellers exit cleanly within each platform’s terms.",
    requirements:
      "Inventory of accounts (URLs/handles), platform login and recovery method outline, proof of ownership or long-term control, follower/engagement or revenue screenshots where relevant, any trademark or brand tie-in, and written confirmation that the handover complies with platform policies. Buyer: intended use and compliance with platform TOS.",
    included: "",
  },
  {
    name: "Software, Codebase & SaaS",
    category: "Buy/Sell",
    subcategory: "Software & SaaS",
    description:
      "Support for buying or selling software products, source code, and small SaaS operations: scoping what is included (repo, hosting, customers, IP), identifying technical and commercial dependencies, and structuring introductions and diligence so technical buyers and sellers can align on stack, data, and migration.",
    requirements:
      "Tech stack and hosting summary, repository/access outline, customer count or MRR if applicable, IP assignment expectations, third-party licences in use, privacy/GDPR or data-processing notes, and any existing escrow or milestone plan. Seller: proof of right to sell the code/product. Buyer: technical reviewer contact and integration constraints.",
    included: "",
  },
  // --- Finance ---
  {
    name: "DPIIT Startup India Recognition",
    category: "Finance",
    subcategory: "Startup India Registration",
    description:
      "Startup India portal work: eligibility check against DPIIT criteria, drafting innovation/scalability narrative, document upload, and follow-up on queries. Clarifies which benefits (tax, compliance relaxations, IP fast track) attach to your stage—not every incorporated company qualifies.",
    requirements:
      "Incorporation certificate, PAN, company email and mobile for portal, director DIN/PAN list, pitch deck or note describing product, traction metrics, how you innovate or improve products/processes, website or demo links, and any patents or publications supporting novelty.",
    included: "",
  },
  {
    name: "Capital Raising Consulting",
    category: "Finance",
    subcategory: "Fundraising",
    description:
      "Fundraising process design: narrative, financial model hygiene, data room checklist, investor segmentation, and meeting cadence. Covers angels, seed funds, venture, strategic corporates, and some grant routes when you identify targets jointly.",
    requirements:
      "Historical financials, 3–5 year forecast with assumptions, cap table, pitch deck, product roadmap, unit economics where relevant, list of prior investor conversations, target raise and use of funds, and NDAs or teasers already in circulation.",
    included: "",
  },
  {
    name: "Debt Financing Advisory",
    category: "Finance",
    subcategory: "Loan Consultation",
    description:
      "Debt option mapping for working capital, capex, machinery, and CGTMSE-backed MSME lines: bank vs NBFC fit, collateral expectations, and documentation rehearsal before credit committee.",
    requirements:
      "Last 3 years audited statements, provisional current year, GST returns summary, 12 months bank statements, existing borrowing sanctions, CIBIL for promoters, project report for term loans, title deeds if mortgage proposed, and repayment source narrative.",
    included: "",
  },
  // --- Hiring ---
  {
    name: "Executive & Leadership Hiring",
    category: "Hiring",
    subcategory: "Executive & Leadership",
    description:
      "Search and selection for senior roles: CXO-level hires, heads of department, and leadership that sets culture and strategy. Includes defining the mandate with stakeholders, calibrated sourcing, structured interviews, and reference-style checkpoints so shortlists reflect both capability and fit for high-impact roles.",
    requirements:
      "Role title and reporting line, mandate (turnaround vs scale vs first hire), compensation band and equity policy, location and travel expectations, must-have vs nice-to-have competencies, interview panel and decision timeline, and any confidentiality constraints for outbound sourcing.",
    included: "",
  },
  {
    name: "Technical & Product Hiring",
    category: "Hiring",
    subcategory: "Technical & Product",
    description:
      "Recruitment for engineers, QA, DevOps, data, product managers, and designers. We align on stack and product stage, screen for practical skills and ownership, and support a pipeline that matches your release cadence—whether you are pre-product, scaling a team, or backfilling critical roles.",
    requirements:
      "Stack and tools, seniority mix, product stage and roadmap summary, work model (office/hybrid/remote), assessment format (take-home, live coding, system design), salary bands per level, and hiring manager availability for feedback within agreed SLAs.",
    included: "",
  },
  {
    name: "Operations, Admin & HR Hiring",
    category: "Hiring",
    subcategory: "Operations & HR",
    description:
      "Hiring for operations managers, office and admin leads, HR generalists and BP roles, recruiters, and similar backbone functions. Focus on process discipline, stakeholder coordination, and reliability for organisations that need dependable operators rather than only customer-facing hires.",
    requirements:
      "Department structure, day-to-day responsibilities, tools (ERP, HRIS, ticketing), shift or on-call needs if any, compliance sensitivities, compensation and benefits outline, and examples of success in the role from your organisation.",
    included: "",
  },
  {
    name: "Marketing, Content & Social Hiring",
    category: "Hiring",
    subcategory: "Marketing & Creative",
    description:
      "Roles spanning growth marketing, performance and brand, content writers, social media managers, and community leads. We source candidates who match your channel mix and brand voice, with portfolios or sample work reviewed against your audience and KPIs.",
    requirements:
      "Channel priorities (paid, organic, social, events), brand guidelines or voice references, KPIs and budget exposure, tools (Meta/Google/LinkedIn, CMS, analytics), content volume expectations, and whether the role is individual contributor vs team lead.",
    included: "",
  },
  // --- Consultancy ---
  {
    name: "Operational & Strategic Consulting",
    category: "Consultancy",
    subcategory: "Business Consultant",
    description:
      "Structured review of how work flows through your company: procurement to cash, service delivery, inventory, and support. Outputs typically include a heatmap of delays, margin leakage hypotheses, and a sequenced plan that respects cash and change-management limits.",
    requirements:
      "Latest P&L and balance sheet, operational KPIs (cycle times, utilisation, defect rates), org chart with roles, key contracts or SLA penalties, site/process maps if any, IT systems list, and top three board-level concerns. Access to functional heads for interviews as agreed.",
    included: "",
  },
  {
    name: "Idea-to-Execution Startup Advisory",
    category: "Consultancy",
    subcategory: "General Startup Consultant",
    description:
      "Early-stage mentoring across problem definition, segment choice, MVP scope, pricing experiments, distribution experiments, and hiring sequence. Sessions are tailored to stage—pre-revenue teams get different cadence than post-PMF scale-ups.",
    requirements:
      "One-page thesis on problem and user, evidence so far (interviews, waitlist, revenue), competitive alternatives, current burn and runway, cap table summary, team bios, and explicit decisions you need help unblocking (e.g. pivot vs persevere).",
    included: "",
  },
  // --- Advocate ---
  {
    name: "Consumer Forum & Civil Disputes",
    category: "Advocate",
    subcategory: "Consumer & Civil Litigation",
    description:
      "Representation and advisory in consumer protection forums and broader civil disputes where individuals or businesses seek relief for deficient services, unfair trade practices, or contractual breaches. Work typically includes assessing maintainability, drafting complaints or written statements, evidence organisation, and appearing through agreed stages of the forum process.",
    requirements:
      "Chronological narrative of facts, invoices/contracts/warranty terms, correspondence with the opposite party, photos or expert reports if relevant, prior complaint IDs, limitation dates, and identity/address proof. For companies: board authorisation and signatory details for filings.",
    included: "",
  },
  {
    name: "Corporate, Contracts & Employment Counsel",
    category: "Advocate",
    subcategory: "Corporate & Commercial",
    description:
      "Legal support for companies: drafting and reviewing commercial agreements, shareholder or founder arrangements, vendor and customer contracts, employment policies, separation settlements, and day-to-day corporate compliance questions that need advocate-led review or dispute containment before litigation.",
    requirements:
      "Entity incorporation documents, existing agreements under review, email trail or minutes reflecting commercial intent, counterpart party details, risk priorities (liability cap, IP, non-compete, termination), and jurisdiction or arbitration preferences.",
    included: "",
  },
  {
    name: "Criminal Defence & White-Collar Matters",
    category: "Advocate",
    subcategory: "Criminal & White-Collar",
    description:
      "Defence and procedural strategy in criminal matters including FIR response, anticipatory or regular bail applications, trial preparation, and white-collar or economic offence contexts where document trails and parallel civil/regulatory angles matter. Scope and forum suitability are confirmed after initial fact review.",
    requirements:
      "FIR or complaint copy, court notices and past orders, list of accused/witnesses known to you, bail history, seized material summary, and a frank factual timeline. Do not withhold material facts that affect strategy; bring identity proof and prior counsel’s filings if switching representation.",
    included: "",
  },
  {
    name: "Tax & Revenue Litigation",
    category: "Advocate",
    subcategory: "Tax & Revenue Litigation",
    description:
      "Contestation and appeals in direct and indirect tax disputes before appropriate tribunals and courts: GST demands, income tax assessments, penalty proceedings, and related recovery actions. Includes organising grounds of appeal, precedents, and reconciliation of ledgers with department orders.",
    requirements:
      "Assessment or order under challenge, returns and reconciliation working, notices and replies filed, payment challans if any, DSC for e-filings, and prior appellate history. For companies: authorised signatory and board resolution where needed.",
    included: "",
  },
  {
    name: "Property, Defamation & General Civil",
    category: "Advocate",
    subcategory: "Property, Defamation & General Civil",
    description:
      "Matters involving immovable property (title, possession, tenancy, specific performance), defamation concerns (cease-and-desist strategy and, where appropriate, civil remedies), and miscellaneous civil suits where relief is sought through regular civil courts. Initial scoping clarifies forum, urgency, and evidentiary gaps.",
    requirements:
      "Title chain or lease deeds, municipal or revenue records available, survey maps, possession proof, publication details for defamation (URLs, print), harm suffered, limitation analysis, and list of opposite parties. Prior mediation or settlement attempts if any.",
    included: "",
  },
];

const BUYSELL_SEEDS = [
  {
    title: "Premium Support Tool License (Resale)",
    type: "product",
    description: "Annual license resale for ticketing integration suite.",
    price: 0,
    serviceCategory: "software",
    requirements: "Legal handover paperwork — pricing on inquiry.",
  },
  {
    title: "Regional IT Services Company",
    type: "company",
    description: "10-person MSP with recurring contracts; books available.",
    price: 0,
    serviceCategory: "buying_selling",
    requirements: "LOI, proof of funds — pricing on inquiry.",
  },
];

async function wipeDatabase() {
  await Message.deleteMany({});
  await WalletTransaction.deleteMany({});
  await Payment.deleteMany({});
  await Order.deleteMany({});
  await Service.deleteMany({});
  await BuySellListing.deleteMany({});
  await ServiceCategory.deleteMany({});
  await User.deleteMany({});
  console.log("✓ Cleared: messages, wallet, payments, orders, services, listings, categories, users");
}

const run = async () => {
  try {
    await connectDB();
    await wipeDatabase();

    const superadminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@test.com";
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123";

    const bcrypt = (await import("bcryptjs")).default;
    const superadmin = await User.create({
      email: superadminEmail,
      name: "Superadmin",
      passwordHash: await bcrypt.hash(superadminPassword, 10),
      role: "superadmin",
    });
    console.log("✓ Superadmin:", superadminEmail, "| _id:", superadmin._id.toString());

    const seniorEmail = "senior@test.com";
    const seniorPassword = "Senior123";
    const seniorResult = await createAdminBySuperAdmin({
      email: seniorEmail,
      name: "Senior Admin",
      employeeId: "EMP-SENIOR",
      password: seniorPassword,
      phone: "9876543210",
      qrCodeUrl: null,
      role: "senior_admin",
      createdBy: superadmin._id,
    });
    const senior = seniorResult.admin;
    console.log("✓ Senior admin:", seniorEmail, "| _id:", senior._id.toString());

    const opsEmail = "ops@test.com";
    const opsPassword = "Ops12345";
    const opsResult = await createAdminBySuperAdmin({
      email: opsEmail,
      name: "Service Admin",
      employeeId: "EMP-OPS",
      password: opsPassword,
      phone: "9876543211",
      qrCodeUrl: null,
      role: "service_admin",
      createdBy: superadmin._id,
    });
    const ops = opsResult.admin;
    console.log("✓ Service admin:", opsEmail, "| _id:", ops._id.toString());

    const userEmail = "user@test.com";
    const userPassword = "User123";
    const userResult = await registerUser({
      email: userEmail,
      name: "Test User",
      phone: "9123456789",
      password: userPassword,
    });
    const user = userResult.user;
    console.log("✓ User:", userEmail, "| _id:", user._id.toString());

    const categoryByName = new Map();
    const subIdByCatAndSub = new Map();

    for (const row of CATEGORY_TREE) {
      const doc = await ServiceCategory.create({
        name: row.name,
        subcategories: row.subcategories.map((name) => ({ name })),
      });
      categoryByName.set(row.name, doc);
      for (const sub of doc.subcategories) {
        subIdByCatAndSub.set(`${row.name}:${sub.name}`, sub._id);
      }
      console.log(
        "  + Category:",
        row.name,
        "| categoryId:",
        doc._id.toString(),
        "| subcategories:",
        doc.subcategories.map((s) => `${s.name}→${s._id}`).join(", ")
      );
    }

    const createdServices = [];
    for (const row of SERVICE_SEEDS) {
      const catDoc = categoryByName.get(row.category);
      if (!catDoc) {
        throw new Error(`Unknown category slug: ${row.category}`);
      }
      const subId = subIdByCatAndSub.get(`${row.category}:${row.subcategory}`);
      if (!subId) {
        throw new Error(`Unknown subcategory: ${row.category} / ${row.subcategory}`);
      }
      const svc = await createService({
        name: row.name,
        categoryId: catDoc._id,
        subcategoryId: subId,
        description: row.description,
        ...(row.price != null ? { price: row.price } : {}),
        requirements: row.requirements,
        included: row.included,
        operationsAdminId: ops._id,
        userId: senior._id,
      });
      createdServices.push(svc);
      console.log(
        "  + Service:",
        row.name,
        "| serviceId:",
        svc._id,
        "| categoryId:",
        svc.categoryId,
        "| subcategoryId:",
        svc.subcategoryId
      );
    }
    console.log(`✓ Services: ${createdServices.length} created (linked to category & subcategory _id)`);

    for (const row of BUYSELL_SEEDS) {
      await createListing({
        ...row,
        operationsAdminId: ops._id,
        userId: senior._id,
      });
      console.log("  + Buy/Sell:", row.title);
    }
    console.log(`✓ Buy/Sell: ${BUYSELL_SEEDS.length} created`);

    const firstService = createdServices[0];
    if (firstService) {
      await createOrder({
        serviceId: firstService._id,
        source: "service",
        userId: user._id,
      });
      console.log("✓ Sample order for service:", firstService.name);
    }

    const catSummary = await ServiceCategory.find().lean();
    const svcSummary = await Service.find({})
      .select("name categoryId subcategoryId price")
      .lean();

    console.log("\n--- ID summary (JSON) ---");
    console.log(
      JSON.stringify(
        {
          categories: catSummary.map((c) => ({
            _id: String(c._id),
            name: c.name,
            subcategories: (c.subcategories || []).map((s) => ({
              _id: String(s._id),
              name: s.name,
            })),
          })),
          services: svcSummary.map((s) => ({
            _id: String(s._id),
            name: s.name,
            categoryId: s.categoryId ? String(s.categoryId) : null,
            subcategoryId: s.subcategoryId ? String(s.subcategoryId) : null,
            price: s.price,
          })),
        },
        null,
        2
      )
    );

    console.log("\n--- Seed complete ---");
    console.log("Login:", superadminEmail, "|", seniorEmail, "|", opsEmail, "|", userEmail);
  } catch (error) {
    console.error("Seed error:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
