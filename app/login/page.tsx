import { Suspense } from "react";
import { AuthForm } from "@/components/marketing/auth-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">Account</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-10 text-center">
        Sign in to WanderWorld
      </h1>
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
