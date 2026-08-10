import { LegalPage } from "@/components/ui/legal-page";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      lastUpdated="July 2026"
      intro="This describes what information WanderWorld Global collects, why, and who it's shared with."
      sections={[
        {
          heading: "1. What we collect",
          body: [
            "Account information: name, email, and optionally phone number and country, whether you sign up directly or through Google sign-in.",
            "Booking information: check-in and check-out dates, guest count, and which stay you booked — needed to actually fulfil the booking.",
            "We do not collect or store your full card number, mobile money PIN, or bank details. Payment is handled directly by Stripe, PayPal, Paystack, or M-Pesa, whichever you choose at checkout.",
          ],
        },
        {
          heading: "2. How we use it",
          body: [
            "To create your account, process and confirm bookings, send booking-related emails (confirmations, password resets), and respond if you contact us directly.",
            "If you use the AI trip planner, the destination, dates, and preferences you enter are sent to our AI provider to generate an itinerary. We don't use this to build an advertising profile of you.",
          ],
        },
        {
          heading: "3. Who we share it with",
          body: [
            "Payment processors (Stripe, PayPal, Paystack, M-Pesa) receive what's needed to process your payment.",
            "Resend, our email provider, sends transactional emails on our behalf (booking confirmations, password resets, contact form replies).",
            "Groq, our AI provider, processes trip-planning requests you submit through the AI concierge.",
            "Google, only if you choose to sign in with Google — we receive your name, email, and profile photo from Google, nothing more.",
            "We don't sell your data to anyone, for any reason.",
          ],
        },
        {
          heading: "4. Cookies",
          body: [
            "We use a single session cookie to keep you signed in. We don't use third-party advertising or tracking cookies.",
          ],
        },
        {
          heading: "5. Your rights",
          body: [
            "You can ask us to see, correct, or delete the personal data we hold about you at any time — reach out through the contact page. We'll respond within a reasonable time.",
          ],
        },
        {
          heading: "6. Children",
          body: [
            "WanderWorld Global is not intended for anyone under 18, consistent with our terms of service.",
          ],
        },
        {
          heading: "7. Changes to this policy",
          body: [
            "If this policy changes in a meaningful way, we'll update the date at the top of this page.",
          ],
        },
        {
          heading: "8. Contact",
          body: [
            "Questions about your data — reach out through the contact page and a real person will respond.",
          ],
        },
      ]}
    />
  );
}
