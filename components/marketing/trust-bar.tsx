import { ShieldCheck, CreditCard, Smartphone, Globe2 } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    label: "Secure checkout",
    detail: "Encrypted payments, every time",
  },
  {
    icon: CreditCard,
    label: "Card, PayPal, Paystack",
    detail: "Pay the way you already pay",
  },
  {
    icon: Smartphone,
    label: "M-Pesa supported",
    detail: "Built for East African travelers",
  },
  {
    icon: Globe2,
    label: "Priced in your currency",
    detail: "No surprise conversions at checkout",
  },
];

export function TrustBar() {
  return (
    <div className="hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {ITEMS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={18} className="text-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-ink/50 mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
