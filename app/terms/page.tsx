import { LegalPage } from "@/components/ui/legal-page";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      lastUpdated="July 2026"
      intro="These terms govern your use of WanderWorld Global. By creating an account or booking a stay, you agree to them."
      sections={[
        {
          heading: "1. What WanderWorld Global is",
          body: [
            "WanderWorld Global is a booking platform that connects travelers with independently owned and operated stays. We list, describe, and process payment for these stays; we don't own or run the properties themselves, and each host or property manager is responsible for the accuracy of their own listing.",
          ],
        },
        {
          heading: "2. Accounts",
          body: [
            "You need an account to book a stay. You're responsible for keeping your login credentials secure and for all activity under your account. Let us know immediately if you think someone else has access to it.",
            "You must be at least 18 years old to create an account or make a booking.",
          ],
        },
        {
          heading: "3. Bookings and payment",
          body: [
            "Prices are shown in USD unless a listing states otherwise, and the total shown at checkout — including any service fee — is the amount you'll be charged. We don't add anything after the fact.",
            "Payment is processed through Stripe, PayPal, Paystack, or M-Pesa, depending on which you choose at checkout. WanderWorld Global does not store your full card number or mobile money PIN — that's handled directly by the payment provider.",
            "A booking is confirmed once payment succeeds and you receive a confirmation email. If a listing becomes unavailable after you book (rare, but possible), we'll contact you directly to resolve it, including a full refund if no alternative works for you.",
          ],
        },
        {
          heading: "4. Cancellations and refunds",
          body: [
            "Cancellation terms vary by individual listing and are shown before you complete a booking. If a listing doesn't specify otherwise, contact us and we'll work with the host directly on your behalf.",
          ],
        },
        {
          heading: "5. Acceptable use",
          body: [
            "Don't use WanderWorld Global to book a stay you don't intend to honor, to harass a host or another guest, or to attempt to circumvent payment through the platform. We can suspend or close an account for behavior that puts other users or hosts at risk.",
          ],
        },
        {
          heading: "6. Listings and content",
          body: [
            "We review listings before they go live, but property descriptions, photos, and amenities are ultimately provided by the host. If something doesn't match what you booked, tell us — that's exactly the kind of thing we want to know about.",
          ],
        },
        {
          heading: "7. Liability",
          body: [
            "WanderWorld Global facilitates the booking and payment for a stay; we aren't the operator of the property itself. To the extent permitted by law, our liability for any issue arising from your stay is limited to the amount you paid for that booking.",
          ],
        },
        {
          heading: "8. Changes to these terms",
          body: [
            "We may update these terms as the platform grows. Meaningful changes will be reflected here with an updated date at the top of this page.",
          ],
        },
        {
          heading: "9. Contact",
          body: [
            "Questions about these terms — reach out through the contact page and a real person will respond.",
          ],
        },
      ]}
    />
  );
}
