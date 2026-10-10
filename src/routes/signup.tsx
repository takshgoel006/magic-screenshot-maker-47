import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Account — YT Predict" },
      { name: "description", content: "Create a YT Predict account to start predicting YouTube views." },
      { property: "og:title", content: "Create Account — YT Predict" },
      { property: "og:description", content: "Start predicting YouTube video views with AI." },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function SignupPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  const field = (id: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} value={form[id]} onChange={set(id)} />
      {errors[id] ? <p className="text-xs text-destructive">{errors[id]}</p> : null}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/"><Brand className="text-xl" /></Link>
        </div>
        <div className="card-surface p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {form.email}. Confirm it to sign in.
              </p>
              <Button className="mt-6 w-full" variant="outline" asChild>
                <Link to="/auth">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Start predicting YouTube views in minutes.</p>
              <form className="mt-6 space-y-4" onSubmit={submit}>
                {field("full_name", "Full Name", "text", "Jane Doe")}
                {field("email", "Email Address", "email", "you@example.com")}
                {field("password", "Password", "password", "At least 8 characters")}
                {field("confirm", "Confirm Password", "password")}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="font-medium text-primary hover:underline">Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
