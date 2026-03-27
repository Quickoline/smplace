import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../auth/model/model.js";
import { registerUser, createAdminBySuperAdmin } from "../auth/services/services.js";
import { createService } from "../api/service/services/services.js";
import { createOrder } from "../api/order/services/services.js";
import { createListing } from "../api/buySell/services/services.js";
import { Service } from "../api/service/model/model.js";
import { BuySellListing } from "../api/buySell/model/model.js";
import { Order } from "../api/order/model/model.js";

/**
 * Inserts new rows only when no document exists for this admin with the same
 * service name+category (or buy/sell title). If a row already exists, the script
 * updates price/description/etc. when your seed data changed — so "new data" in
 * this file syncs to MongoDB without duplicating users/admins.
 */
/** Service marketplace offerings — one per category / subcategory style */
const SERVICE_SEEDS = [
  {
    name: "Full-Stack Web App",
    category: "software",
    subcategory: "web",
    description: "React/Node or similar stack; API, auth, deployment.",
    price: 8500,
    requirements: "Scope document, brand assets",
  },
  {
    name: "Mobile App (iOS & Android)",
    category: "software",
    subcategory: "mobile",
    description: "Flutter or native builds, store submission support.",
    price: 12000,
    requirements: "Designs or wireframes",
  },
  {
    name: "Contract Drafting & Review",
    category: "legal",
    subcategory: "contracts",
    description: "NDAs, MSAs, employment agreements reviewed by counsel.",
    price: 3500,
    requirements: "Existing drafts or bullet points",
  },
  {
    name: "Company Registration & Compliance",
    category: "legal",
    subcategory: "corporate",
    description: "Incorporation, GST, basic statutory filings.",
    price: 9000,
    requirements: "Director KYC, proposed name",
  },
  {
    name: "Brand Identity Package",
    category: "design",
    subcategory: "branding",
    description: "Logo, color system, typography, brand guidelines PDF.",
    price: 15000,
    requirements: "Brief and references",
  },
  {
    name: "UI/UX for SaaS",
    category: "design",
    subcategory: "ui_ux",
    description: "Figma screens, design system, handoff to dev.",
    price: 22000,
    requirements: "User flows, content outline",
  },
  {
    name: "Technical Hiring — Screening",
    category: "hiring",
    subcategory: "tech",
    description: "JD refinement, take-home design, interview panel coordination.",
    price: 4500,
    requirements: "Role level, stack, salary band",
  },
  {
    name: "Executive Search",
    category: "hiring",
    subcategory: "leadership",
    description: "Senior roles; shortlist and reference checks.",
    price: 75000,
    requirements: "Mandate and compensation range",
  },
  {
    name: "Business Strategy Workshop",
    category: "consultancy",
    subcategory: "strategy",
    description: "2-day workshop + written recommendations.",
    price: 18000,
    requirements: "Financial summary, goals",
  },
  {
    name: "Process & Ops Consulting",
    category: "consultancy",
    subcategory: "operations",
    description: "SOP mapping, tooling recommendations, KPIs.",
    price: 25000,
    requirements: "Team size, current tools",
  },
  {
    name: "B2B SaaS Listing — Acquisition",
    category: "buying_selling",
    subcategory: "saas",
    description: "Advisory for buying or selling a small B2B SaaS.",
    price: 50000,
    requirements: "NDA, high-level metrics",
  },
];

/** Buy/sell listings (product vs company) */
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

const run = async () => {
  try {
    await connectDB();

    const superadminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@test.com";
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123";

    let superadmin = await User.findOne({ email: superadminEmail, role: "superadmin" });
    if (!superadmin) {
      const bcrypt = (await import("bcryptjs")).default;
      superadmin = await User.create({
        email: superadminEmail,
        passwordHash: await bcrypt.hash(superadminPassword, 10),
        role: "superadmin",
      });
      console.log("✓ Superadmin created:", superadminEmail);
    } else {
      console.log("— Superadmin already exists (skipped):", superadminEmail);
    }

    const adminEmail = "admin@test.com";
    const adminPassword = "Admin123";
    let admin = await User.findOne({ email: adminEmail, role: "admin" });
    if (!admin) {
      const result = await createAdminBySuperAdmin({
        email: adminEmail,
        employeeId: "EMP001",
        password: adminPassword,
        phone: "9876543210",
        phoneLast4: "3210",
        qrCodeUrl: null,
        createdBy: superadmin._id,
      });
      admin = result.admin;
      console.log("✓ Admin created:", adminEmail);
    } else {
      console.log("— Admin already exists (skipped):", adminEmail);
    }

    const userEmail = "user@test.com";
    const userPassword = "User123";
    let user = await User.findOne({ email: userEmail, role: "user" });
    if (!user) {
      const result = await registerUser({
        email: userEmail,
        phone: "9123456789",
        password: userPassword,
      });
      user = result.user;
      console.log("✓ User created:", userEmail);
    } else {
      console.log("— User already exists (skipped):", userEmail);
    }

    let servicesInserted = 0;
    let servicesUpdated = 0;
    for (const row of SERVICE_SEEDS) {
      const exists = await Service.findOne({
        createdBy: admin._id,
        name: row.name,
        category: row.category,
      });
      if (exists) {
        const changed =
          exists.description !== row.description ||
          exists.price !== row.price ||
          (exists.subcategory || "") !== (row.subcategory || "") ||
          (exists.requirements || "") !== (row.requirements || "");
        if (changed) {
          await Service.updateOne(
            { _id: exists._id },
            {
              $set: {
                subcategory: row.subcategory,
                description: row.description,
                price: row.price,
                requirements: row.requirements,
              },
            }
          );
          servicesUpdated += 1;
          console.log("  ~ Service updated:", row.name);
        }
        continue;
      }
      await createService({
        ...row,
        userId: admin._id,
      });
      servicesInserted += 1;
      console.log("  + Service:", row.name, `(${row.category})`);
    }
    const servicesSkipped = SERVICE_SEEDS.length - servicesInserted - servicesUpdated;
    console.log(
      `✓ Services: ${servicesInserted} inserted, ${servicesUpdated} updated from seed file, ${servicesSkipped} unchanged`
    );

    let listingsInserted = 0;
    let listingsUpdated = 0;
    for (const row of BUYSELL_SEEDS) {
      const exists = await BuySellListing.findOne({
        createdBy: admin._id,
        title: row.title,
      });
      if (exists) {
        const changed =
          exists.description !== row.description ||
          exists.price !== row.price ||
          exists.type !== row.type ||
          (exists.serviceCategory || "") !== (row.serviceCategory || "") ||
          (exists.requirements || "") !== (row.requirements || "");
        if (changed) {
          await BuySellListing.updateOne(
            { _id: exists._id },
            {
              $set: {
                type: row.type,
                description: row.description,
                price: row.price,
                serviceCategory: row.serviceCategory,
                requirements: row.requirements,
              },
            }
          );
          listingsUpdated += 1;
          console.log("  ~ Buy/Sell updated:", row.title);
        }
        continue;
      }
      await createListing({
        ...row,
        userId: admin._id,
      });
      listingsInserted += 1;
      console.log("  + Buy/Sell:", row.title, `(${row.type})`);
    }
    const listingsSkipped = BUYSELL_SEEDS.length - listingsInserted - listingsUpdated;
    console.log(
      `✓ Buy/Sell: ${listingsInserted} inserted, ${listingsUpdated} updated from seed file, ${listingsSkipped} unchanged`
    );

    const firstService = await Service.findOne({ createdBy: admin._id }).sort({ createdAt: 1 });
    const hasOrder = firstService
      ? await Order.findOne({ createdBy: user._id, service: firstService._id })
      : null;
    if (firstService && !hasOrder) {
      await createOrder({
        serviceId: firstService._id,
        source: "service",
        userId: user._id,
      });
      console.log("✓ Sample order created for:", firstService.name);
    } else {
      console.log("— Sample order skipped (already exists or no service)");
    }

    console.log("\n--- Seed complete ---");
    console.log("Login:", superadminEmail, "|", adminEmail, "|", userEmail);
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
