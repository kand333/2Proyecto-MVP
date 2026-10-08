import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta.",
};

export default function RegisterPage() {
  return (
    <AuthPageLayout title="Crear cuenta" description="Regístrate con tu nombre, email, una contraseña y tu fecha de nacimiento.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthPageLayout>
  );
}
