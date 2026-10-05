import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPrediction } from "@/lib/predictions.functions";
import { CATEGORIES, UPLOAD_DAYS } from "@/lib/constants";
import { predictionsKey } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/predict")({
  head: () => ({
    meta: [
      { title: "Predict Views — YT Predict" },
      { name: "description", content: "Enter video details to predict YouTube views." },
      { property: "og:title", content: "Predict Views — YT Predict" },
      { property: "og:description", content: "Enter video details to predict YouTube views." },
    ],
  }),
  component: PredictPage,
});

const initial = {
  title: "", category: "", duration: "", tags: "", upload_day: "", upload_time: "",
  subscribers: "", average_views: "", likes: "", comments: "",
};
type Form = typeof initial;

const TIPS = [
  "Use a clear, descriptive title with your main keyword.",
  "Add 5–10 relevant tags separated by commas.",
  "Upload when your audience is most active (often evenings and weekends).",
  "Higher likes and comments on past videos signal stronger engagement.",
];

function PredictPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createPrediction);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.title.trim().length < 3) e.title = "Enter a title (min 3 characters)";
    if (!form.category) e.category = "Choose a category";
    if (!form.upload_day) e.upload_day = "Choose a day";
    if (!form.upload_time) e.upload_time = "Choose a time";
    (["duration", "subscribers", "average_views", "likes", "comments"] as const).forEach((k) => {
      const n = Number(form[k]);
      if (form[k] === "" || !Number.isFinite(n) || n < 0) e[k] = "Enter a valid number";
    });
    if (Number(form.duration) < 1) e.duration = "Duration must be at least 1 second";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFailed(false);
    try {
      const { id } = await create({
        data: {
          title: form.title, category: form.category, duration: Math.round(Number(form.duration)),
          tags: form.tags, upload_day: form.upload_day, upload_time: form.upload_time,
          subscribers: Math.round(Number(form.subscribers)), average_views: Math.round(Number(form.average_views)),
          likes: Math.round(Number(form.likes)), comments: Math.round(Number(form.comments)),
        },
      });
      await qc.invalidateQueries({ queryKey: predictionsKey });
      toast.success("Prediction ready");
      navigate({ to: "/result/$id", params: { id } });
    } catch (err) {
      console.error(err);
      setFailed(true);
      toast.error("We couldn't reach the prediction service.");
    } finally {
      setLoading(false);
    }
  }

  const num = (k: keyof Form, label: string, placeholder: string) => (
    <Field label={label} error={errors[k]} id={k}>
      <Input id={k} type="number" min={0} placeholder={placeholder} value={form[k]} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );

  return (
    <AppShell title="Predict Views" subtitle="Enter your video details to estimate its view count.">
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="card-surface space-y-5 p-6 lg:col-span-2">
          <Field label="Video Title" error={errors.title} id="title">
            <Input id="title" placeholder="e.g. Learn Python in 10 Minutes" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" error={errors.category} id="category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            {num("duration", "Duration (seconds)", "600")}
          </div>
          <Field label="Tags (comma separated)" id="tags">
            <Input id="tags" placeholder="python, tutorial, coding" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Upload Day" error={errors.upload_day} id="upload_day">
              <Select value={form.upload_day} onValueChange={(v) => set("upload_day", v)}>
                <SelectTrigger id="upload_day"><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>{UPLOAD_DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Upload Time" error={errors.upload_time} id="upload_time">
              <Input id="upload_time" type="time" value={form.upload_time} onChange={(e) => set("upload_time", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {num("subscribers", "Channel Subscribers", "50000")}
            {num("average_views", "Average Views (past videos)", "12000")}
            {num("likes", "Expected Likes", "800")}
            {num("comments", "Expected Comments", "120")}
          </div>

          {failed ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <span className="text-destructive">The prediction service didn't respond. Your inputs are kept.</span>
              <Button type="button" variant="outline" size="sm" onClick={() => submit()}>
                <RefreshCw className="mr-1 h-4 w-4" /> Retry
              </Button>
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing video data...</>) : "Predict Views"}
          </Button>
        </form>

        <aside className="card-surface h-fit p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Tips for better predictions</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {TIPS.map((t) => (
              <li key={t} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t}</li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, error, id, children }: { label: string; error?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
