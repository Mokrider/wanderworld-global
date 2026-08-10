import { LegalPage } from "@/components/ui/legal-page";

export const metadata = { title: "Help center" };

export default function HelpPage() {
  return (
    <LegalPage
      eyebrow="Help center"
      title="Frequently asked questions"
      lastUpdated="July 2026"
      sections={[
        {
          heading: "How do I book a stay?",
          body: [
            "Search or browse to a stay you like, pick your dates and guest count, and continue to checkout. You'll see the full price — including any service fee — before you pay anything.",
          ],
        },
        {
          heading: "What payment methods are accepted?",
          body: [
            "Card via Stripe, PayPal, Paystack, or M-Pesa. Which options appear depends on what's set up for your region, but most bookings can choose between at least two.",
          ],
        },
        {
          heading: "Can I cancel or change a booking?",
          body: [
            "Cancellation terms are shown on each listing before you book, since they can vary by property. If you need to change dates or cancel after booking, contact us and we'll work directly with the host on your behalf.",
          ],
        },
        {
          heading: "How does the AI trip planner work?",
          body: [
            "Tell it your destination, how many nights, your budget level, and pace — it builds a day-by-day itinerary with real, bookable stays already attached, not just generic suggestions.",
          ],
        },
        {
          heading: "I forgot my password — what now?",
          body: [
            "Click \"Forgot password?\" on the sign-in page and enter your email. If an account exists for that address, you'll get a reset link within a few minutes — check your spam folder if it doesn't show up.",
          ],
        },
        {
          heading: "Is my payment information safe?",
          body: [
            "We never see or store your full card number or mobile money PIN — that's handled directly by Stripe, PayPal, Paystack, or M-Pesa, whichever you choose at checkout.",
          ],
        },
        {
          heading: "A listing looks wrong or outdated — what do I do?",
          body: [
            "Tell us through the contact page. Every listing is reviewed before it goes live, but if something's changed or doesn't match, we want to know.",
          ],
        },
        {
          heading: "Still stuck?",
          body: [
            "The contact page reaches a real person, not a support queue — send a message and expect a reply within a day or two.",
          ],
        },
      ]}
    />
  );
}
