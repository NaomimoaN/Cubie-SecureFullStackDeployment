import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

//These are access module through server
export const downloadFile = async (key) => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("File body is empty from S3.");
    }
    return await response.Body.transformToByteArray();
  } catch (error) {
    console.error(`Error downloading file (Key: ${key}) from S3:`, error);
    throw new Error("Failed to download the file from S3: " + error.message);
  }
};

export const uploadFile = async (fileBuffer, fileName, mimetype) => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: fileName,
    Body: Readable.from(fileBuffer),
    ContentType: mimetype,
    ACL: "private",
  };

  try {
    const uploader = new Upload({
      client: s3Client,
      params: params,
    });

    const data = await uploader.done();

    return data.Location;
  } catch (error) {
    console.error(`Error uploading file (Name: ${fileName}) to S3:`, error);
    throw new Error("Failed to upload the file to S3: " + error.message);
  }
};

export const deleteFile = async (key) => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting file (Key: ${key}) from S3:`, error);
    throw new Error("Failed to delete the file from S3: " + error.message);
  }
};

//These are access module by Signed Url
// SignedUrl for display img
export const generateSignedUrl = async (key, expiresInSeconds = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: "image/jpeg",
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for key ${key}:`, error);
    throw new Error("Failed to generate signed URL: " + error.message);
  }
};

// SignedUrl for display pdf
export const generateSignedUrlForPdf = async (key, expiresInSeconds = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: "application/pdf",
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for PDF key ${key}:`, error);
    throw new Error("Failed to generate signed URL: " + error.message);
  }
};

// SignedUrl for upload
export const generateUploadSignedUrl = async (
  fileKey,
  contentType,
  expiresInSeconds = 3600
) => {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    ACL: "private",
  };

  try {
    const command = new PutObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });
    return signedUrl;
  } catch (error) {
    console.error(
      `Error generating upload signed URL for file ${fileKey}:`,
      error
    );
    throw new Error("Failed to generate upload signed URL: " + error.message);
  }
};

// SignedUrl for download
export const generateDownloadSignedUrl = async (
  key,
  fileName = null,
  expiresInSeconds = 3600
) => {
  let contentDisposition = "attachment";
  if (fileName) {
    const encodedFileName = encodeURIComponent(fileName);
    contentDisposition = `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: contentDisposition,
  });
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });
  return signedUrl;
};

export { s3Client, S3_BUCKET_NAME };
