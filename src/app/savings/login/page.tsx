import LoginForm from "@/components/savings/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="font-display text-2xl text-ink">Savings</h1>
      <p className="mt-2 text-sm text-muted">Private. Enter your password to continue.</p>
      <LoginForm />
    </div>
  );
}
