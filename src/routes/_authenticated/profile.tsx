import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfile, listPredictions, updateProfile } from "@/lib/predictions.functions";
import { predictionsKey, profileKey } from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — YT Predict" },
      { name: "description", content: "Manage your YT Predict account and settings." },
      { property: "og:title", content: "Profile — YT Predict" },
      { property: "og:description", content: "Manage your YT Predict account and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const fetchList = useServerFn(listPredictions);
  const save = useServerFn(updateProfile);
  const { data, isLoading } = useQuery({ queryKey: profileKey, queryFn: () => fetchProfile() });
  const { data: preds } = useQuery({ queryKey: predictionsKey, queryFn: () => fetchList() });
  const [form, setForm] = useState({ full_name: "", default_category: "Education", notifications_enabled: true, theme_preference: "light" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({ full_name: p.full_name ?? "", default_category: p.default_category, notifications_enabled: p.notifications_enabled, theme_preference: p.theme_preference });
    }
  }, [data]);

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: form });
      await qc.invalidateQueries({ queryKey: profileKey });
      toast.success("Changes saved");
    } catch {
      toast.error("Couldn't save your changes.");
    }
    setSaving(false);
  }

  if (isLoading) return <AppShell title="Profile"><Skeleton className="h-96 rounded-xl" /></AppShell>;
  const initial = (form.full_name || data?.email || "U").charAt(0).toUpperCase();

  return (
    <AppShell title="Profile" subtitle="Manage your account and preferences.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface h-fit p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary">{initial}</div>
          <p className="mt-4 font-semibold">{form.full_name || "Your name"}</p>
          <p className="text-sm text-muted-foreground">{data?.email}</p>
          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-left text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Member since</dt><dd>{data?.profile ? new Date(data.profile.created_at).toLocaleDateString() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Predictions</dt><dd>{preds?.length ?? 0}</dd></div>
          </dl>
        </div>

        <div className="card-surface space-y-6 p-6 lg:col-span-2">
          <section className="space-y-4">
            <h2 className="font-semibold">Edit Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={data?.email ?? ""} disabled />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-semibold">Model Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Category</Label>
                <Select value={form.default_category} onValueChange={(v) => setForm({ ...form, default_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <Select value={form.theme_preference} onValueChange={(v) => setForm({ ...form, theme_preference: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border border-border p-4">
              <span>
                <span className="block text-sm font-medium">Notifications</span>
                <span className="block text-xs text-muted-foreground">Get notified when predictions are ready.</span>
              </span>
              <Switch checked={form.notifications_enabled} onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })} />
            </label>
          </section>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
