import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Settings", "Manage your Seowidpnkj account and content workspace."),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account & workspace preferences." />
      <div className="px-8 pb-12 space-y-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Account</h3>
          <p className="text-sm text-muted-foreground mt-1">Signed in as {user.email}</p>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1">Bulk CSV upload, auto-publish scheduler, image generation toggles, per-site publish settings.</p>
        </div>
      </div>
    </div>
  );
}
