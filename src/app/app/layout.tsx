import "../workspace.css";
import { redirect } from "next/navigation";
import { getCurrentAuthContext } from "@/lib/auth";
import { WorkspaceProvider } from "@/components/workspace-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentAuthContext();

  if (!context) redirect("/login");
  if (!context.tenant || !context.membership) redirect("/onboarding");

  return (
    <WorkspaceProvider
      value={{
        workspaceName: context.tenant.name,
        userName: context.user.full_name || context.user.email,
        userEmail: context.user.email,
        role: context.membership.role,
        isSuperAdmin: context.isSuperAdmin,
      }}
    >
      {children}
    </WorkspaceProvider>
  );
}
