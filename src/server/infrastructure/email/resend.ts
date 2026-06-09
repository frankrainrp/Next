export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  return {
    mode: process.env.RESEND_API_KEY ? "ready-for-resend" : "mock",
    from: process.env.RESEND_FROM ?? "Project AI <onboarding@resend.dev>",
    ...input,
  };
}
