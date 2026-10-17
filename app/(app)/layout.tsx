import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();
  const user = session?.user ?? null;

  return (
    <>
      <nav className="p-4 border-b flex gap-4 items-center">
        <Link href="/">Home</Link>
        <Link href="/history">History</Link>
        <Link href="/periods">Periods</Link>
        {user && (
          <span className="ml-auto flex items-center gap-3 text-sm">
            {user.email}
            <SignOutButton />
          </span>
        )}
      </nav>
      {children}
    </>
  );
}
