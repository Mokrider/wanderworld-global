import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

/** guestName is fully user-controlled at checkout — never interpolate it
 * (or any other field here) into HTML without escaping first. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TripInviteEmailInput = {
  to: string;
  inviterName: string;
  tripName: string;
  destinationName: string;
  inviteUrl: string;
};

export async function sendTripInviteEmail(input: TripInviteEmailInput): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — cannot send trip invite email.");
    return false;
  }

  const from = process.env.EMAIL_FROM || "WanderWorld Global <onboarding@resend.dev>";
  const inviterName = escapeHtml(input.inviterName);
  const tripName = escapeHtml(input.tripName);
  const destinationName = escapeHtml(input.destinationName);

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #1C1815;">
      <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #B97A3D; margin-bottom: 8px;">Trip invite</p>
      <h1 style="font-weight: 300; font-size: 26px; margin: 0 0 16px;">${inviterName} invited you to ${destinationName}.</h1>
      <p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2A241F;">
        You've been invited to join <strong>${tripName}</strong> on WanderWorld Global. Join to see who else is going and book your own stay alongside them.
      </p>
      <p style="margin: 28px 0;">
        <a href="${input.inviteUrl}" style="display: inline-block; background: #1C1815; color: #F4EDE3; font-family: Arial, sans-serif; font-size: 14px; padding: 12px 28px; text-decoration: none;">View the trip</a>
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999;">
        If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `${input.inviterName} invited you to a trip on WanderWorld Global`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send trip invite email:", err);
    return false;
  }
}

export type ContactEmailInput = {
  name: string;
  fromEmail: string;
  message: string;
};

/**
 * Sends a visitor's contact message to CONTACT_EMAIL. Unlike the
 * password reset email, a missing key or unset destination should not
 * silently pretend to succeed — see app/api/contact/route.ts, which
 * checks isContactFormAvailable() before ever calling this.
 */
export function isContactFormAvailable(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL);
}

export async function sendContactEmail(input: ContactEmailInput): Promise<boolean> {
  const resend = getClient();
  const to = process.env.CONTACT_EMAIL;
  if (!resend || !to) return false;

  const from = process.env.EMAIL_FROM || "WanderWorld Global <onboarding@resend.dev>";
  const name = escapeHtml(input.name);
  const fromEmail = escapeHtml(input.fromEmail);
  const message = escapeHtml(input.message).replace(/\n/g, "<br/>");

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #1C1815;">
      <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #B97A3D; margin-bottom: 8px;">New contact message</p>
      <h1 style="font-weight: 300; font-size: 22px; margin: 0 0 16px;">${name}</h1>
      <p style="font-family: Arial, sans-serif; font-size: 13px; color: #999; margin-bottom: 20px;">${fromEmail}</p>
      <p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2A241F; white-space: pre-wrap;">${message}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: input.fromEmail,
      subject: `WanderWorld contact form: ${input.name}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return false;
  }
}

export type PasswordResetEmailInput = {
  to: string;
  firstName: string;
  resetUrl: string;
};

/**
 * Same fire-and-forget-on-failure philosophy as the booking email would
 * use, EXCEPT the caller here should treat a missing RESEND_API_KEY as a
 * hard failure, not a silent skip — with no email sent, the user has no
 * way to actually reset their password. See app/api/auth/forgot-password/route.ts.
 */
export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — cannot send password reset email.");
    return false;
  }

  const from = process.env.EMAIL_FROM || "WanderWorld Global <onboarding@resend.dev>";
  const firstName = escapeHtml(input.firstName);

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #1C1815;">
      <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #B97A3D; margin-bottom: 8px;">Password reset</p>
      <h1 style="font-weight: 300; font-size: 26px; margin: 0 0 16px;">Reset your password, ${firstName}.</h1>
      <p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2A241F;">
        Click below to choose a new password. This link expires in 1 hour and can only be used once.
      </p>
      <p style="margin: 28px 0;">
        <a href="${input.resetUrl}" style="display: inline-block; background: #1C1815; color: #F4EDE3; font-family: Arial, sans-serif; font-size: 14px; padding: 12px 28px; text-decoration: none;">Reset password</a>
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999;">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: "Reset your WanderWorld Global password",
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return false;
  }
}

export type BookingConfirmationInput = {
  to: string;
  guestName: string;
  hotelName: string;
  hotelImage?: string | null;
  city: string;
  country: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  total: number;
  currency: string;
  reference: string;
  giftedByName?: string;
};

/**
 * Fire-and-forget by design: a failed email should never fail the
 * booking confirmation itself (the booking is already CONFIRMED in the
 * DB by the time this is called — see lib/bookings.ts). Errors are
 * logged, not thrown.
 */
export async function sendBookingConfirmationEmail(input: BookingConfirmationInput) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping booking confirmation email.");
    return;
  }

  // resend.dev's shared address works with zero setup but is rate-limited
  // and clearly a test sender to recipients. Set EMAIL_FROM once a domain
  // is verified in the Resend dashboard, e.g. "WanderWorld Global <bookings@yourdomain.com>".
  const from = process.env.EMAIL_FROM || "WanderWorld Global <onboarding@resend.dev>";
  const firstName = escapeHtml(input.guestName.split(" ")[0] || input.guestName);
  const hotelName = escapeHtml(input.hotelName);
  const city = escapeHtml(input.city);
  const country = escapeHtml(input.country);
  const reference = escapeHtml(input.reference);
  const giftedByName = input.giftedByName ? escapeHtml(input.giftedByName) : null;

  const fallbackImage =
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800";
  const hotelImage = input.hotelImage || fallbackImage;

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #1C1815;">
      <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #B97A3D; margin-bottom: 8px;">Booking confirmed</p>
      <h1 style="font-weight: 300; font-size: 26px; margin: 0 0 20px;">You're all set, ${firstName}.</h1>
      ${giftedByName ? `<p style="font-family: Arial, sans-serif; font-size: 13px; color: #B97A3D; margin: -10px 0 20px;">🎁 This stay was booked for you by ${giftedByName}.</p>` : ""}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5DCCB; background: #FBF8F2;">
        <tr>
          <td>
            <img src="${hotelImage}" width="480" height="180" alt="${hotelName}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 20px 0; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #999;">
            WanderWorld Global &middot; Stay Pass
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 20px 16px; font-size: 20px;">
            ${city}, ${country}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 20px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 13px; text-align: center;">
              <tr>
                <td style="width: 33%; padding-bottom: 4px; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Check-in</td>
                <td style="width: 33%; padding-bottom: 4px; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; border-left: 1px solid #E5DCCB; border-right: 1px solid #E5DCCB;">Check-out</td>
                <td style="width: 33%; padding-bottom: 4px; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Guests</td>
              </tr>
              <tr>
                <td style="font-size: 16px; padding-top: 2px;">${formatDate(input.checkIn)}</td>
                <td style="font-size: 16px; padding-top: 2px; border-left: 1px solid #E5DCCB; border-right: 1px solid #E5DCCB;">${formatDate(input.checkOut)}</td>
                <td style="font-size: 16px; padding-top: 2px;">${input.guests}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 20px 16px; font-family: Arial, sans-serif; font-size: 13px; color: #2A241F; text-align: center;">
            ${hotelName}
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px dashed #C9B896;"></td>
        </tr>
        <tr>
          <td style="padding: 16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
              <tr>
                <td>
                  <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999;">Reference</p>
                  <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 0.05em;">${reference}</p>
                </td>
                <td style="text-align: right;">
                  <p style="margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #999;">Total paid</p>
                  <p style="margin: 0; font-family: Georgia, serif; font-size: 16px;">${input.currency} ${input.total}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
        Save this email as your confirmation — no need to print anything.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: `Booking confirmed — ${input.hotelName}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send booking confirmation email:", err);
  }
}
