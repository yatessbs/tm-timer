import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{padding:16}}>Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
