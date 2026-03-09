import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <>
      <main className="min-h-screen max-w-lg mx-auto pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
