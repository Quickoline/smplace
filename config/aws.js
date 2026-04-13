import AWS from "aws-sdk";

// Configure AWS S3 (IAM roles on AWS, or access keys locally / external)
const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  correctClockSkew: true,
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff(retryCount) {
      return Math.min(100 * Math.pow(2, retryCount), 1000);
    },
  },
  httpOptions: {
    timeout: 30000,
    connectTimeout: 10000,
  },
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  s3Config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

const s3 = new AWS.S3(s3Config);

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.error(
    "⚠️ WARNING: AWS_S3_BUCKET_NAME is not configured. Chat/contact uploads will use local disk fallback."
  );
}

/**
 * @param {Buffer} fileBuffer
 * @param {String} fileName S3 key (path inside bucket)
 * @param {String} contentType
 * @param {Number} retries
 * @returns {Promise<String>} S3 URL of uploaded file
 */
export const uploadToS3 = async (fileBuffer, fileName, contentType, retries = 3) => {
  if (!BUCKET_NAME) {
    const error = new Error(
      "S3 bucket name is not configured. Please set AWS_S3_BUCKET_NAME in your environment variables."
    );
    error.code = "BUCKET_NOT_CONFIGURED";
    throw error;
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType || "application/octet-stream",
    ACL: "private",
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Uploading to S3 (attempt ${attempt}/${retries}): ${fileName}`);
      const result = await s3.upload(params).promise();
      console.log(`✅ Successfully uploaded to S3: ${result.Location}`);
      return result.Location;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetryableError = isRetryableS3Error(error);

      console.error(`❌ S3 upload attempt ${attempt}/${retries} failed:`, error.message);

      if (isLastAttempt || !isRetryableError) {
        const errorMessage = formatS3Error(error);
        console.error("Final S3 upload error:", errorMessage);
        throw new Error(errorMessage);
      }

      const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const isRetryableS3Error = (error) => {
  if (!error) return false;

  const retryableErrors = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ServiceUnavailable",
    "RequestTimeout",
    "Throttling",
    "ThrottlingException",
    "RequestTimeoutException",
    "InternalError",
    "InternalServerError",
    "503",
    "500",
    "temporarily unavailable",
  ];

  const errorMessage = (error.message || "").toLowerCase();
  const errorCode = error.code || error.statusCode || "";

  return retryableErrors.some(
    (retryable) =>
      errorMessage.includes(retryable.toLowerCase()) ||
      errorCode.toString().includes(retryable)
  );
};

const formatS3Error = (error) => {
  if (!error) return "File service temporarily unavailable. Please try again.";

  const errorMessage = (error.message || "").toLowerCase();
  const errorCode = error.code || error.statusCode || "";

  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("econnreset") ||
    errorMessage.includes("etimedout")
  ) {
    return "File service temporarily unavailable due to network timeout. Please try again in a moment.";
  }

  if (
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("temporarily unavailable") ||
    errorCode === "503" ||
    errorCode === 503
  ) {
    return "File service temporarily unavailable. Please try again in a few moments.";
  }

  if (
    errorMessage.includes("access denied") ||
    errorMessage.includes("forbidden") ||
    errorCode === "403" ||
    errorCode === 403
  ) {
    return "Access denied. Please check your AWS credentials and permissions.";
  }

  if (
    errorMessage.includes("not found") ||
    errorMessage.includes("no such bucket") ||
    errorCode === "404" ||
    errorCode === 404
  ) {
    return "Storage bucket not found. Please check your configuration.";
  }

  if (errorMessage.includes("invalid") && errorMessage.includes("key")) {
    return "Invalid AWS credentials. Please check your configuration.";
  }

  if (
    (errorMessage.includes("missing required key") && errorMessage.includes("bucket")) ||
    errorCode === "BUCKET_NOT_CONFIGURED" ||
    error.code === "BUCKET_NOT_CONFIGURED"
  ) {
    return "S3 bucket is not configured. Please contact support.";
  }

  return `File upload failed: ${error.message || "File service temporarily unavailable. Please try again."}`;
};

export const deleteFromS3 = async (fileUrl, retries = 2) => {
  if (!BUCKET_NAME) {
    console.warn("⚠️ Cannot delete from S3: Bucket name not configured");
    return false;
  }

  let key = fileUrl;
  if (fileUrl.includes("amazonaws.com")) {
    const urlParts = fileUrl.split(".com/");
    key = urlParts[urlParts.length - 1];
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: key.split("?")[0],
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetryableError = isRetryableS3Error(error);

      if (isLastAttempt || !isRetryableError) {
        console.error("Error deleting from S3:", error);
        return false;
      }

      const delay = Math.min(100 * Math.pow(2, attempt - 1), 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
};

/**
 * @param {String} fileKey - S3 object key
 * @param {Number} expiresIn seconds
 */
export const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  if (!BUCKET_NAME) {
    throw new Error(
      "S3 bucket name is not configured. Please set AWS_S3_BUCKET_NAME in your environment variables."
    );
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: expiresIn,
  };

  try {
    if (typeof s3.getSignedUrlPromise === "function") {
      return await s3.getSignedUrlPromise("getObject", params);
    }
    return s3.getSignedUrl("getObject", params);
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/** Extract object key from common S3 HTTPS URL shapes (virtual-hosted + path-style). */
export function extractKeyFromS3Url(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return null;
  if (!fileUrl.includes("amazonaws.com")) return null;
  try {
    const u = new URL(fileUrl);
    const host = u.hostname || "";
    const path = (u.pathname || "").replace(/^\/+/, "");
    // Path-style: s3.<region>.amazonaws.com/<bucket>/<key...>
    if (host.startsWith("s3.") && path.includes("/")) {
      const segments = path.split("/").filter(Boolean);
      if (segments.length >= 2 && BUCKET_NAME && segments[0] === BUCKET_NAME) {
        return segments.slice(1).join("/") || null;
      }
    }
  } catch {
    /* fall through */
  }
  const parts = fileUrl.split(".com/");
  const pathPart = parts[parts.length - 1];
  if (!pathPart) return null;
  try {
    const decoded = decodeURIComponent(pathPart.split("?")[0]);
    return decoded || null;
  } catch {
    return pathPart.split("?")[0] || null;
  }
}

/** Private S3 objects need a signed GET URL for browsers / Image.network */
export async function signMediaUrlIfNeeded(url) {
  if (!url || typeof url !== "string" || !BUCKET_NAME) return url;
  const key = extractKeyFromS3Url(url);
  if (!key) return url;
  try {
    return await getSignedUrl(key, 3600);
  } catch (e) {
    console.error("signMediaUrlIfNeeded:", e.message);
    return url;
  }
}

export { s3 };
