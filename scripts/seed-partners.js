/**
 * Idempotent: creates marketplace `user` + `service_admin` per entry (same email allowed),
 * then adds completed orders with 4★ / 5★ ratings + comments from other seeded clients.
 *
 * Config resolution (first match wins):
 *   PARTNER_SEED_CONFIG → scripts/data/partner-seed.local.json → partner-seed.example.json
 *
 * Setup:
 *   1. Optional: copy example → partner-seed.local.json for private passwords (gitignored)
 *   2. npm run seed   (catalog + superadmin must exist)
 *   3. npm run seed-partners
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import { User } from "../auth/model/model.js";
import { registerUser, createAdminBySuperAdmin } from "../auth/services/services.js";
import { Service } from "../api/service/model/model.js";
import { Order } from "../api/order/model/model.js";
import { recomputeAdminRating } from "../api/order/services/services.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMENTS = [
  "Excellent communication and delivery.",
  "Very professional — would recommend.",
  "Great experience from start to finish.",
  "Handled everything clearly and on time.",
  "Outstanding support for our requirements.",
];

function loadConfig() {
  const fromEnv = process.env.PARTNER_SEED_CONFIG?.trim();
  const localPath = path.join(__dirname, "data", "partner-seed.local.json");
  const examplePath = path.join(__dirname, "data", "partner-seed.example.json");

  let p = fromEnv || null;
  if (p && !fs.existsSync(p)) {
    console.error(`PARTNER_SEED_CONFIG file not found: ${p}`);
    process.exit(1);
  }
  if (!p && fs.existsSync(localPath)) {
    p = localPath;
  }
  if (!p && fs.existsSync(examplePath)) {
    console.warn(
      "Using partner-seed.example.json (create partner-seed.local.json to override and keep secrets out of git)."
    );
    p = examplePath;
  }
  if (!p) {
    console.error("No partner seed JSON found.");
    console.error(`Expected: ${localPath} or ${examplePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function isDuplicateKeyError(err) {
  return err?.code === 11000 || err?.codeName === "DuplicateKey";
}

async function ensureUser(entry, password) {
  const e = entry.email.trim().toLowerCase();
  let u = await User.findOne({ email: e, role: "user" });
  if (u) {
    console.log(`  · user already exists: ${e}`);
    return u;
  }
  try {
    const { user } = await registerUser({
      email: e,
      phone: String(entry.phone).trim(),
      password,
      name: entry.clientName,
    });
    console.log(`  · registered user: ${e}`);
    return user;
  } catch (err) {
    if (String(err.message).toLowerCase().includes("already")) {
      return User.findOne({ email: e, role: "user" });
    }
    if (isDuplicateKeyError(err)) {
      const again = await User.findOne({ email: e, role: "user" });
      if (again) return again;
      console.error(
        "Mongo duplicate key. If the same email must be user + service_admin, drop legacy index:",
        "\n  db.getCollection('users').dropIndex('email_1')"
      );
    }
    throw err;
  }
}

async function ensureAdmin(entry, password, superadminId) {
  const e = entry.email.trim().toLowerCase();
  let a = await User.findOne({ email: e, role: "service_admin" });
  if (a) {
    console.log(`  · service_admin already exists: ${e}`);
    return a;
  }
  try {
    const { admin } = await createAdminBySuperAdmin({
      email: e,
      name: entry.adminDisplayName,
      employeeId: entry.employeeId,
      password,
      phone: String(entry.phone).trim(),
      qrCodeUrl: null,
      createdBy: superadminId,
      role: "service_admin",
    });
    console.log(`  · created service_admin: ${e}`);
    return admin;
  } catch (err) {
    if (String(err.message).toLowerCase().includes("already")) {
      const again = await User.findOne({ email: e, role: "service_admin" });
      if (again) return again;
    }
    if (isDuplicateKeyError(err)) {
      const again = await User.findOne({ email: e, role: "service_admin" });
      if (again) return again;
      console.error(
        "Mongo duplicate key on service_admin. Drop legacy index:",
        "\n  db.getCollection('users').dropIndex('email_1')"
      );
    }
    throw err;
  }
}

async function seedReviews(entries, clients, admins, service) {
  const listingOwner = service.createdBy || undefined;
  for (let pi = 0; pi < admins.length; pi++) {
    const provider = admins[pi];
    const pEmail = entries[pi].email.toLowerCase();
    let n = 0;
    for (let ci = 0; ci < clients.length; ci++) {
      if (entries[ci].email.toLowerCase() === pEmail) continue;
      const exists = await Order.findOne({
        createdBy: clients[ci]._id,
        provider: provider._id,
        rating: { $nin: [null, undefined] },
      });
      if (exists) continue;
      const stars = n % 2 === 0 ? 5 : 4;
      n += 1;
      await Order.create({
        customerName: entries[ci].clientName,
        phone: String(entries[ci].phone).trim(),
        service: service._id,
        serviceModel: "Service",
        status: "task_completed",
        rating: stars,
        ratingComment: COMMENTS[(pi + ci) % COMMENTS.length],
        provider: provider._id,
        listingOwner,
        createdBy: clients[ci]._id,
      });
      await recomputeAdminRating(provider._id);
    }
  }
}

const run = async () => {
  const cfg = loadConfig();
  const entries = cfg.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("entries[] required in partner seed config");
  }

  const superEmail = (
    cfg.superadminEmail ||
    process.env.SUPERADMIN_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
  if (!superEmail) {
    throw new Error("superadminEmail in config or SUPERADMIN_EMAIL in .env");
  }

  await connectDB();

  const coll = User.collection;
  for (const spec of await coll.indexes()) {
    if (spec.name === "email_1") {
      await coll.dropIndex("email_1");
      console.log("✓ Dropped legacy index email_1 (enables same email as user + service_admin).");
      break;
    }
  }
  await User.syncIndexes();

  const superadmin = await User.findOne({
    email: superEmail,
    role: "superadmin",
  });
  if (!superadmin) {
    throw new Error(`Superadmin not found for email: ${superEmail}`);
  }

  const defaultPw =
    cfg.defaultPassword || process.env.PARTNER_SEED_DEFAULT_PASSWORD;
  if (
    !defaultPw &&
    entries.some(
      (en) => !en.password || String(en.password).trim() === ""
    )
  ) {
    throw new Error(
      "Set defaultPassword in partner JSON or PARTNER_SEED_DEFAULT_PASSWORD, or set password on every entry"
    );
  }

  const service = await Service.findOne().sort({ createdAt: 1 });
  if (!service) {
    throw new Error("No Service in database — run npm run seed first.");
  }

  const clients = [];
  const admins = [];
  for (const entry of entries) {
    const pw = entry.password || defaultPw;
    if (!pw) throw new Error(`Password missing for ${entry.email}`);
    clients.push(await ensureUser(entry, pw));
    admins.push(await ensureAdmin(entry, pw, superadmin._id));
    console.log(`✓ user + service_admin: ${entry.email}`);
  }

  await seedReviews(entries, clients, admins, service);
  console.log("✓ Partner ratings (4★ and 5★) added where missing.");

  process.exit(0);
};

run().catch((e) => {
  console.error("seed-partners error:", e.message || e);
  process.exit(1);
});
