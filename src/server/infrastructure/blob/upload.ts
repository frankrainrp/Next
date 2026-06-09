export async function uploadProjectFile(input: {
  pathname: string;
  file: File;
}) {
  return {
    mode: process.env.BLOB_READ_WRITE_TOKEN ? "ready-for-vercel-blob" : "mock",
    pathname: input.pathname,
    url: `mock://blob/${input.pathname}`,
    size: input.file.size,
  };
}
