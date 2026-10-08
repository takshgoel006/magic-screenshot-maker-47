import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set New Password — YT Predict" },
      { name: "description", content: "Choose a new password for your YT Predict account." },
      { property: "og:title", content: "Set New Password — YT Predict" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [recoveryValid, setRecoveryValid] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setRecoveryValid(params.get("type") === "recovery");
  }, []);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {recoveryValid === null ? null : recoveryValid ? (
        <form onSubmit={submit} className="card-surface w-full max-w-md space-y-4 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <div className="space-y-2">
            <Label htmlFor="pw">New Password</Label>
            <Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      ) : (
        <div className="card-surface w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold">This reset link is invalid or expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">Request a new password reset link to continue.</p>
          <Button className="mt-5" asChild><a href="/forgot-password">Request a new link</a></Button>
        </div>
      )}
    </div>
  );
}
