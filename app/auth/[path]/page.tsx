import { AuthView } from "@neondatabase/auth-ui";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main className="flex-1 flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthView path={path} localization={{ SIGN_IN: "Login to your account" }} />
      </div>
    </main>
  );
}
