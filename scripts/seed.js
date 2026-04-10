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

/** CATEGORY_TREE.name / sub names are seed lookup keys; DB uses categoryId + subcategoryId only. */
const CATEGORY_TREE = [
  { name: "software", subcategories: ["web", "mobile"] },
  { name: "legal", subcategories: ["contracts", "corporate"] },
  { name: "design", subcategories: ["branding", "ui_ux"] },
  { name: "hiring", subcategories: ["tech", "leadership"] },
  { name: "consultancy", subcategories: ["strategy", "operations"] },
  { name: "buying_selling", subcategories: ["saas"] },
];

const SERVICE_SEEDS = [
  {
    name: "Full-Stack Web App",
    category: "software",
    subcategory: "web",
    description: "React/Node or similar stack; API, auth, deployment.",
    price: 8500,
    requirements: "Scope document, brand assets",
    included: "Source handover, 2 weeks post-launch bugfix window, deployment notes.",
  },
  {
    name: "Mobile App (iOS & Android)",
    category: "software",
    subcategory: "mobile",
    description: "Flutter or native builds, store submission support.",
    price: 12000,
    requirements: "Designs or wireframes",
    included: "Store listings draft, build artifacts, basic analytics hookup.",
  },
  {
    name: "Contract Drafting & Review",
    category: "legal",
    subcategory: "contracts",
    description: "NDAs, MSAs, employment agreements reviewed by counsel.",
    price: 3500,
    requirements: "Existing drafts or bullet points",
    included: "One revision round, redlined PDF, short summary email.",
  },
  {
    name: "Company Registration & Compliance",
    category: "legal",
    subcategory: "corporate",
    description: "Incorporation, GST, basic statutory filings.",
    price: 9000,
    requirements: "Director KYC, proposed name",
    included: "Certificate of incorporation, PAN application support, checklist.",
  },
  {
    name: "Brand Identity Package",
    category: "design",
    subcategory: "branding",
    description: "Logo, color system, typography, brand guidelines PDF.",
    price: 15000,
    requirements: "Brief and references",
    included: "Logo files (SVG/PNG), color tokens, 1-page brand one-pager.",
  },
  {
    name: "UI/UX for SaaS",
    category: "design",
    subcategory: "ui_ux",
    description: "Figma screens, design system, handoff to dev.",
    price: 22000,
    requirements: "User flows, content outline",
    included: "Figma library, component specs, export-ready assets.",
  },
  {
    name: "Technical Hiring — Screening",
    category: "hiring",
    subcategory: "tech",
    description: "JD refinement, take-home design, interview panel coordination.",
    price: 4500,
    requirements: "Role level, stack, salary band",
    included: "Scorecard template, 5 candidate reviews, debrief notes.",
  },
  {
    name: "Executive Search",
    category: "hiring",
    subcategory: "leadership",
    description: "Senior roles; shortlist and reference checks.",
    price: 75000,
    requirements: "Mandate and compensation range",
    included: "Longlist, shortlist of 3–5, structured references.",
  },
  {
    name: "Business Strategy Workshop",
    category: "consultancy",
    subcategory: "strategy",
    description: "2-day workshop + written recommendations.",
    price: 18000,
    requirements: "Financial summary, goals",
    included: "Workshop materials, 10-page recommendations memo.",
  },
  {
    name: "Process & Ops Consulting",
    category: "consultancy",
    subcategory: "operations",
    description: "SOP mapping, tooling recommendations, KPIs.",
    price: 25000,
    requirements: "Team size, current tools",
    included: "Process maps, KPI dashboard sketch, follow-up call.",
  },
  {
    name: "B2B SaaS Listing — Acquisition",
    category: "buying_selling",
    subcategory: "saas",
    description: "Advisory for buying or selling a small B2B SaaS.",
    price: 50000,
    requirements: "NDA, high-level metrics",
    included: "Teaser, buyer/seller intro pack, diligence checklist.",
  },
];

const BUYSELL_SEEDS = [
  {
    title: "Premium Support Tool License (Resale)",
    type: "product",
    description: "Annual license transfer for ticketing integration suite.",
    price: 25000,
    serviceCategory: "software",
    requirements: "Legal transfer paperwork",
  },
  {
    title: "Regional IT Services Company",
    type: "company",
    description: "10-person MSP with recurring contracts; books available.",
    price: 1800000,
    serviceCategory: "buying_selling",
    requirements: "LOI, proof of funds",
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
      passwordHash: await bcrypt.hash(superadminPassword, 10),
      role: "superadmin",
    });
    console.log("✓ Superadmin:", superadminEmail, "| _id:", superadmin._id.toString());

    const seniorEmail = "senior@test.com";
    const seniorPassword = "Senior123";
    const seniorResult = await createAdminBySuperAdmin({
      email: seniorEmail,
      employeeId: "EMP-SENIOR",
      password: seniorPassword,
      phone: "9876543210",
      phoneLast4: "3210",
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
      employeeId: "EMP-OPS",
      password: opsPassword,
      phone: "9876543211",
      phoneLast4: "3211",
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
        price: row.price,
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
