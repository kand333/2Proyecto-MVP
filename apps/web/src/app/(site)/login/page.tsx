import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresa a tu cuenta.",
};

export default function LoginPage() {
  return (
    <AuthPageLayout title="Ingresar" description="Ingresa con tu email y contraseña.">
      {/* useSearchParams (?next=) needs a Suspense boundary so the page can be prerendered. */}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthPageLayout>
  );
}
