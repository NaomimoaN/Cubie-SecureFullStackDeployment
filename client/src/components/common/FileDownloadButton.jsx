// client/src/components/common/FileDownloadButton.jsx

/**
 * A reusable button component for downloading files related to homeworks or submissions.
 * It handles the download initiation, displays loading state, and provides callbacks for download progress.
 * It also includes robust error handling for various download scenarios.
 */
import React, { useCallback, useState } from "react";
import { downloadHomeworkFile } from "../../services/homeworkService";

const FileDownloadButton = ({
  homeworkId,
  fileS3Key,
  fileName,
  isTeacherFile,
  submissionId,
  buttonText = "Download",
  className = "ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  onDownloadStart,
  onDownloadSuccess,
  onDownloadError,
  disabled = false,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    onDownloadStart?.();

    try {
      const response = await downloadHomeworkFile(
        homeworkId,
        fileS3Key,
        isTeacherFile,
        submissionId
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      onDownloadSuccess?.(`Downloading "${fileName}"...`);
    } catch (err) {
      let errorMessage = "Unknown error occurred during download.";
      if (err.response) {
        if (err.response.data instanceof Blob) {
          const errorText = await err.response.data.text();
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = err.response.statusText;
        }
      } else {
        errorMessage = err.message;
      }
      onDownloadError?.(`Download failed: ${errorMessage}`);
    } finally {
      setDownloading(false);
    }
  }, [
    homeworkId,
    fileS3Key,
    isTeacherFile,
    submissionId,
    fileName,
    onDownloadStart,
    onDownloadSuccess,
    onDownloadError,
  ]);

  return (
    <button
      onClick={handleDownload}
      className={`${className} ${
        downloading || disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={downloading || disabled}
    >
      {downloading ? "Downloading..." : buttonText}
    </button>
  );
};

export default FileDownloadButton;
