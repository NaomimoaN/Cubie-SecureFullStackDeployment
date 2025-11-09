// server/utils/downloadHandler.js

/**
 * Provides a common utility function for downloading files from S3.
 * Handles fetching the file buffer, setting headers, and sending the response.
 */

import asyncHandler from "express-async-handler";
import { downloadFile } from "../services/s3Service.js"; // Import downloadFile from s3Service

/**
 * Handles the common logic for downloading a file from S3 and sending it as an HTTP response.
 * @param {object} res - Express response object.
 * @param {string} s3Key - The S3 key of the file to download.
 * @param {object} fileMetadata - An object containing file details (fileName, fileType).
 * @param {string} [fileMetadata.fileName] - The original name of the file.
 * @param {string} [fileMetadata.fileType] - The MIME type of the file.
 */
const handleFileDownload = asyncHandler(async (res, s3Key, fileMetadata) => {
  let fileBuffer;
  try {
    fileBuffer = await downloadFile(s3Key);

    console.log(
      `[DownloadHandler] Successfully retrieved file buffer for S3 key: ${s3Key}, size: ${fileBuffer.length} bytes`
    );

    const contentType = fileMetadata.fileType || "application/octet-stream";
    const fileName = fileMetadata.fileName || s3Key.split("/").pop();

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("Content-Length", fileBuffer.length);

    res.send(fileBuffer);
    console.log(
      `[DownloadHandler] Successfully sent file ${fileName} to client.`
    );
  } catch (error) {
    console.error(
      `[DownloadHandler] Error during file download for S3 key ${s3Key}:`,
      error
    );
    // Re-throw the error to be caught by the calling controller's asyncHandler
    // or handle specific HTTP status codes here if desired, but re-throwing maintains consistency.
    if (error.statusCode === 404 || error.name === "NoSuchKey") {
      res.status(404);
      throw new Error("File not found in storage.");
    }
    res.status(error.statusCode || 500);
    throw new Error(`Failed to download file: ${error.message}`);
  }
});

export { handleFileDownload };
