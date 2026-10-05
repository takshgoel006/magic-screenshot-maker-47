import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot Password — YT Predict" },
      { name: "description", content: "Reset your YT Predict password." },
      { property: "og:title", content: "Forgot Password — YT Predict" },
      { property: "og:description", content: "Reset your YT Predict password." },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    setSent(true);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Link to="/"><Brand className="text-xl" /></Link></div>
        <div className="card-surface p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          {sent ? (
            <p className="mt-3 text-sm text-muted-foreground">If an account exists for {email}, a reset link is on its way.</p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
          )}
          <Link to="/auth" className="mt-6 block text-center text-sm text-primary hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
