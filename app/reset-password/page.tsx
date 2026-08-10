import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/marketing/reset-password-form";

export const metadata = { title: "Reset your password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">Account</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-10 text-center">
        Choose a new password
      </h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
