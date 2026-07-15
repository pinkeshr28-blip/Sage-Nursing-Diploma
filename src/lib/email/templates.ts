export function emailTemplate(subject: string, body: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#F7F5F1; padding:24px; color:#2B2E2E; margin:0;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #E3DFD5;">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8A867A;margin-bottom:10px;">SAGE Academy</div>
      <h1 style="font-size:18px;margin:0 0 12px;color:#1B4B4A;font-family:Georgia,serif;">${subject}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0;">${body}</p>
    </div>
  </body>
</html>`;
}
