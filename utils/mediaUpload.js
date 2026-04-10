import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToS3, BUCKET_NAME } from "../config/aws.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHAT_DIR = path.join(__dirname, "../uploads/chat");
const CONTACT_DIR = path.join(__dirname, "../uploads/contact");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * @param {{ buffer: Buffer, originalname: string, mimetype: string, orderId: string }} p
 * @returns {Promise<string>} Public path `/uploads/...` or full S3 URL
 */
export async function saveChatMedia({ buffer, originalname, mimetype, orderId }) {
  const ext = path.extname(originalname || "") || ".bin";
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  if (BUCKET_NAME) {
    const key = `chat/${orderId}/${name}`;
    return uploadToS3(buffer, key, mimetype || "application/octet-stream");
  }

  ensureDir(CHAT_DIR);
  const dest = path.join(CHAT_DIR, name);
  await fs.promises.writeFile(dest, buffer);
  return `/uploads/chat/${name}`;
}

/**
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} p
 */
export async function saveContactAttachment({ buffer, originalname, mimetype }) {
  const ext = path.extname(originalname || "") || ".bin";
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  if (BUCKET_NAME) {
    const key = `contact/${name}`;
    return uploadToS3(buffer, key, mimetype || "application/octet-stream");
  }

  ensureDir(CONTACT_DIR);
  const dest = path.join(CONTACT_DIR, name);
  await fs.promises.writeFile(dest, buffer);
  return `/uploads/contact/${name}`;
}
