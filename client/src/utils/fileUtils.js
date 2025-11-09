export const getS3KeyFromFileUrl = (fileURL) => {
  if (!fileURL) {
    return undefined;
  }

  // https://[bucket-name].s3.[region].amazonaws.com/[key]?query_params
  const s3UrlMatch = fileURL.match(
    /https:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+?)(\?.*)?$/
  );
  if (s3UrlMatch && s3UrlMatch[1]) {
    return s3UrlMatch[1];
  }

  const uploadsPathMatch = fileURL.split("/uploads/")[1];
  if (uploadsPathMatch) {
    return uploadsPathMatch.split("?")[0];
  }

  return undefined;
};
