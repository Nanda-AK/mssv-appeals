import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import Sidebar from "@/components/layout/Sidebar";
import { UserRole } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const userName = profile.name ?? "User";
  const userRole = (profile?.role ?? "staff") as UserRole;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
