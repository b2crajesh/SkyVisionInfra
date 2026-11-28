import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../utils/env";
import { logError } from "../utils/logger";

const SIGNED_URL_EXPIRY_SECONDS = 300;
let client: S3Client | undefined;

function getStorageConfig() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_REGION } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new ApiError(503, "Profile photo storage is not configured");
  }
  return {
    bucket: R2_BUCKET,
    client:
      client ??
      (client = new S3Client({
        region: R2_REGION,
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })),
  };
}

export async function storeProfilePhoto(key: string, image: Buffer): Promise<void> {
  const storage = getStorageConfig();
  await storage.client.send(
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      Body: image,
      ContentType: "image/webp",
      CacheControl: "private, max-age=60",
    })
  );
}

export async function deleteProfilePhoto(key: string): Promise<void> {
  const storage = getStorageConfig();
  try {
    await storage.client.send(
      new DeleteObjectCommand({
        Bucket: storage.bucket,
        Key: key,
      })
    );
  } catch (error) {
    logError("profile_photo.delete.failed", error);
    throw new ApiError(502, "Unable to delete the profile photo; associate deletion was cancelled");
  }
}

export async function getProfilePhoto(key: string): Promise<Buffer> {
  const storage = getStorageConfig();
  const result = await storage.client.send(
    new GetObjectCommand({
      Bucket: storage.bucket,
      Key: key,
    })
  );
  if (!result.Body) {
    throw new ApiError(502, "Unable to retrieve the associate profile photo");
  }
  return Buffer.from(await result.Body.transformToByteArray());
}

export async function createProfilePhotoUrl(key: string): Promise<string> {
  const storage = getStorageConfig();
  return getSignedUrl(
    storage.client,
    new GetObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      ResponseContentType: "image/webp",
      ResponseCacheControl: "private, max-age=60",
    }),
    { expiresIn: SIGNED_URL_EXPIRY_SECONDS }
  );
}
