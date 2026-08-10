import type { PaymentProvider, CheckoutInput, CheckoutResult } from "./types";
import { convertToKES } from "@/lib/fx";

function getBaseUrl() {
  return process.env.MPESA_MODE === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

/** Daraja wants 2547XXXXXXXX — no "+", no leading "0". */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET is not set.");
  }

  const res = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage ?? "M-Pesa authorization failed.");
  return data.access_token as string;
}

function daradaTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export const mpesaProvider: PaymentProvider = {
  id: "mpesa",
  label: "M-Pesa",
  bestFor: "Kenya — STK push to phone",
  get available() {
    return Boolean(
      process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY
    );
  },
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.customerPhone) {
      throw new Error("A phone number is required for M-Pesa.");
    }
    // Daraja STK push is KES-only — convert whatever currency the
    // booking is actually priced in (USD for every current listing)
    // into KES before sending. See lib/fx.ts.
    const amountKES = await convertToKES(input.amount, input.currency);

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const timestamp = daradaTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const phone = normalizePhone(input.customerPhone);

    const token = await getAccessToken();

    const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amountKES), // Daraja requires a whole-number KES amount
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: input.callbackUrl,
        AccountReference: input.bookingId,
        TransactionDesc: input.description.slice(0, 13), // Daraja truncates this field anyway
      }),
    });

    const data = await res.json();
    if (!res.ok || data.ResponseCode !== "0") {
      throw new Error(data.errorMessage ?? data.ResponseDescription ?? "STK push failed.");
    }

    return {
      provider: "mpesa",
      // No hosted page — the PIN prompt appears directly on the
      // customer's phone. The checkout UI must handle the absence of
      // redirectUrl by showing a "check your phone" state instead of
      // navigating away.
      redirectUrl: undefined,
      reference: data.CheckoutRequestID,
      status: "pending",
    };
  },
};
