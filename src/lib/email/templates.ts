export type EmailTemplate =
  | "account_approved"
  | "account_rejected"
  | "account_suspended"
  | "invitation"
  | "invitation_reminder"
  | "new_login"
  | "admin_new_signup"
  | "test";

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "SelfDiscovery";

function layout(options: {
  heading: string;
  intro: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
}) {
  const { heading, intro, body, ctaLabel, ctaUrl, footnote } = options;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr>
        <td style="padding:32px 32px 8px 32px;">
          <div style="font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#86868b;">${BRAND}</div>
          <h1 style="margin:12px 0 0 0;font-size:24px;line-height:1.25;font-weight:600;">${heading}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 0 32px;font-size:15px;line-height:1.6;color:#424245;">
          <p style="margin:0 0 16px 0;">${intro}</p>
          ${body ? `<p style="margin:0 0 16px 0;">${body}</p>` : ""}
        </td>
      </tr>
      ${
        ctaUrl && ctaLabel
          ? `<tr>
        <td style="padding:8px 32px 0 32px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#1d1d1f;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${ctaLabel}</a>
        </td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:28px 32px 32px 32px;font-size:12px;line-height:1.6;color:#86868b;border-top:1px solid #f0f0f2;margin-top:24px;">
          ${footnote || `You received this message because you have a ${BRAND} account.`}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function stripTags(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderEmail(
  template: EmailTemplate,
  payload: Record<string, string | string[] | undefined>
): RenderedEmail {
  const name = (payload.name as string) || "there";
  const appUrl = (payload.appUrl as string) || "";

  switch (template) {
    case "account_approved": {
      const modules = Array.isArray(payload.modules) ? payload.modules.join(", ") : "";
      const html = layout({
        heading: "Your access has been approved",
        intro: `Hi ${name}, an administrator approved your ${BRAND} account. You can sign in now.`,
        body: modules ? `You have access to: <strong>${modules}</strong>.` : undefined,
        ctaLabel: "Open your workspace",
        ctaUrl: `${appUrl}/login`,
      });
      return { subject: `Your ${BRAND} access is approved`, html, text: stripTags(html) };
    }

    case "account_rejected": {
      const reason = (payload.reason as string) || "";
      const html = layout({
        heading: "Access request declined",
        intro: `Hi ${name}, your request to join the ${BRAND} workspace was not approved.`,
        body: reason ? `Reason given: <em>${reason}</em>` : undefined,
        footnote: "If you believe this is a mistake, reply to this email to reach an administrator.",
      });
      return { subject: `Your ${BRAND} access request`, html, text: stripTags(html) };
    }

    case "account_suspended": {
      const html = layout({
        heading: "Your account has been suspended",
        intro: `Hi ${name}, an administrator suspended your ${BRAND} account. You will not be able to sign in until it is restored.`,
        footnote: "Contact your workspace administrator if you need access restored.",
      });
      return { subject: `Your ${BRAND} account was suspended`, html, text: stripTags(html) };
    }

    case "invitation":
    case "invitation_reminder": {
      const inviter = (payload.inviter as string) || "An administrator";
      const modules = Array.isArray(payload.modules) ? payload.modules.join(", ") : "";
      const inviteUrl = (payload.inviteUrl as string) || appUrl;
      const expires = (payload.expiresAt as string) || "";
      const html = layout({
        heading:
          template === "invitation_reminder"
            ? `Reminder: your ${BRAND} invitation`
            : `You're invited to ${BRAND}`,
        intro: `${inviter} invited you to join the ${BRAND} workspace.`,
        body: modules ? `You'll get access to: <strong>${modules}</strong>.` : undefined,
        ctaLabel: "Accept invitation",
        ctaUrl: inviteUrl,
        footnote: expires
          ? `This invitation expires on ${expires}. If you weren't expecting it, you can ignore this email.`
          : "If you weren't expecting this invitation, you can ignore this email.",
      });
      return {
        subject:
          template === "invitation_reminder"
            ? `Reminder: your invitation to ${BRAND}`
            : `${inviter} invited you to ${BRAND}`,
        html,
        text: stripTags(html),
      };
    }

    case "new_login": {
      const device = (payload.device as string) || "a new device";
      const when = (payload.when as string) || "just now";
      const ip = (payload.ip as string) || "unknown location";
      const html = layout({
        heading: "New sign-in to your account",
        intro: `Hi ${name}, your ${BRAND} account was accessed from ${device} at ${when}.`,
        body: `IP address: ${ip}. If this was you, no action is needed.`,
        ctaLabel: "Review your security settings",
        ctaUrl: `${appUrl}/settings`,
        footnote:
          "If you don't recognise this activity, change your password immediately and revoke other sessions.",
      });
      return { subject: `New sign-in to your ${BRAND} account`, html, text: stripTags(html) };
    }

    case "test": {
      const sender = (payload.sender as string) || "an administrator";
      const html = layout({
        heading: "Email delivery is working",
        intro: `This is a test message sent from the ${BRAND} admin console by ${sender}.`,
        body: "If you can read this, approval, rejection, invitation, and security emails will reach your members.",
        ctaLabel: "Open the platform",
        ctaUrl: appUrl,
        footnote: "You can safely ignore this message.",
      });
      return { subject: `${BRAND} test email`, html, text: stripTags(html) };
    }

    case "admin_new_signup": {
      const applicant = (payload.applicant as string) || "Someone";
      const html = layout({
        heading: "A new account is waiting for approval",
        intro: `${applicant} signed up and is waiting for access to be granted.`,
        ctaLabel: "Review in Members",
        ctaUrl: `${appUrl}/admin/members`,
      });
      return { subject: `New ${BRAND} access request`, html, text: stripTags(html) };
    }
  }
}
