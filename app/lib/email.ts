import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "us-east-1" });

const FROM_ADDRESS = "andrew@aiwolfsolutions.com";

/**
 * Send a new-review email alert to a user.
 */
export async function sendNewReviewAlert({
  toEmail,
  locationName,
  starRating,
  authorName,
  reviewText,
  dashboardUrl,
}: {
  toEmail: string;
  locationName: string;
  starRating: number;
  authorName: string;
  reviewText: string | null;
  dashboardUrl: string;
}): Promise<void> {
  const stars = getStarEmoji(starRating);
  const subject = `New ${starRating}-star review on ${locationName}`;
  const snippet = reviewText
    ? reviewText.length > 120
      ? reviewText.slice(0, 120) + "..."
      : reviewText
    : "(No comment)";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
  <h2 style="margin-bottom: 4px;">New Review Alert ${stars}</h2>
  <p style="color: #666; margin-top: 0;">A draft response is ready for your review.</p>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px;"><strong>${authorName}</strong> left a <strong>${starRating}-star</strong> review on <strong>${locationName}</strong></p>
    <p style="margin: 8px 0 0; color: #444; font-style: italic;">"${snippet}"</p>
  </div>
  <a href="${dashboardUrl}" style="display: inline-block; background: #2ecc71; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 8px;">View Dashboard</a>
  <p style="color: #999; font-size: 12px; margin-top: 24px;">AI Review Responder by AI Wolf Solutions</p>
</body>
</html>`.trim();

  const textBody = `New ${starRating}-star review on ${locationName}\n\n${authorName}: "${snippet}"\n\nDraft response ready. View dashboard: ${dashboardUrl}`;

  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: htmlBody, Charset: "UTF-8" },
        Text: { Data: textBody, Charset: "UTF-8" },
      },
    },
  });

  try {
    await ses.send(command);
    console.log(`Email alert sent to ${toEmail} for ${locationName}`);
  } catch (err) {
    // Don't let email failures break the sync flow
    console.error("Failed to send email alert:", err);
  }
}

function getStarEmoji(rating: number): string {
  if (rating <= 2) return "&#9888;&#65039;"; // warning sign for low ratings
  if (rating === 3) return "&#9733;&#9733;&#9733;";
  return "&#9733;&#9733;&#9733;&#9733;&#9733;";
}
