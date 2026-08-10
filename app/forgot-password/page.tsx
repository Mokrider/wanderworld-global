import { ForgotPasswordForm } from "@/components/marketing/forgot-password-form";

export const metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">Account</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-4 text-center">
        Forgot your password?
      </h1>
      <p className="text-sm text-ink/60 text-center mb-10">
        Enter your email and we'll send you a link to reset it.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
