import { ContactForm } from "@/components/marketing/contact-form";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">Contact</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-4 text-center">
        Get in touch
      </h1>
      <p className="text-sm text-ink/60 text-center mb-10 max-w-sm mx-auto">
        Questions about a booking, a listing, or anything else — send a
        message and a real person will read it.
      </p>
      <ContactForm />
    </div>
  );
}
