import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BrandingSettingsForm } from "@/components/branding-settings-form";
import { getCurrentAuthContext } from "@/lib/auth";
import { getTenantBranding, getTenantSettings } from "@/lib/tenants";
import { DatabaseNotConfiguredError } from "@/lib/db";

export default async function BrandingPage() {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  if (!context.tenant || !context.membership) redirect("/onboarding");
  if (!["owner", "admin"].includes(context.membership.role)) {
    return <AppShell title="Website & brand" subtitle="Workspace branding settings"><p className="empty-state">Only workspace owners and admins can manage branding.</p></AppShell>;
  }

  try {
    const [branding, settings] = await Promise.all([
      getTenantBranding(context.tenant.id),
      getTenantSettings(context.tenant.id),
    ]);
    return (
      <AppShell title="Website & brand" subtitle={`Manage the public website identity for ${context.tenant.name}.`}>
        <BrandingSettingsForm
          primaryColor={branding?.primary_color ?? "#12634b"}
          secondaryColor={branding?.secondary_color ?? "#ffffff"}
          accentColor={branding?.accent_color ?? "#c6a36b"}
          heroTitle={branding?.hero_title ?? ""}
          heroSubtitle={branding?.hero_subtitle ?? ""}
          seoTitle={settings?.seo_title ?? context.tenant.name}
          seoDescription={settings?.seo_description ?? ""}
          customDomain={settings?.custom_domain ?? ""}
          workspaceSlug={context.tenant.slug}
        />
      </AppShell>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <AppShell title="Website & brand" subtitle="Workspace branding settings"><p className="empty-state">Connect DATABASE_URL and apply migrations to manage branding.</p></AppShell>;
    }
    throw error;
  }
}
