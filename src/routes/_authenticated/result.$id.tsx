import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Info } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { ChartCard } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getPrediction } from "@/lib/predictions.functions";
import { formatCompact, formatDuration, formatNumber } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/result/$id")({
  head: () => ({
    meta: [
      { title: "Prediction Result — YT Predict" },
      { name: "description", content: "Estimated views and insights for your video." },
      { property: "og:title", content: "Prediction Result — YT Predict" },
      { property: "og:description", content: "Estimated views and insights for your video." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const fetchOne = useServerFn(getPrediction);
  const { data: p, isLoading } = useQuery({ queryKey: ["prediction", id], queryFn: () => fetchOne({ data: { id } }) });

  if (isLoading) return <AppShell title="Prediction Result"><Skeleton className="h-64 rounded-xl" /></AppShell>;
  if (!p)
    return (
      <AppShell title="Prediction Result">
        <div className="card-surface p-10 text-center">
          <p className="font-medium">Prediction not found.</p>
          <Button className="mt-4" asChild><Link to="/predict">Make a prediction</Link></Button>
        </div>
      </AppShell>
    );

  const info = [
    ["Title", p.title], ["Category", p.category], ["Duration", formatDuration(p.duration)],
    ["Upload", `${p.upload_day} at ${p.upload_time}`], ["Subscribers", formatNumber(p.subscribers)],
    ["Average Views", formatNumber(p.average_views)], ["Likes", formatNumber(p.likes)],
    ["Comments", formatNumber(p.comments)], ["Tags", p.tags || "—"],
  ];

  return (
    <AppShell title="Prediction Result" subtitle={p.title} actions={<Button asChild><Link to="/predict">New Prediction</Link></Button>}>
      <div className="space-y-6">
        <section className="card-surface overflow-hidden">
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Eye className="h-4 w-4 text-primary" /> Estimated Views</p>
              <p className="mt-2 text-5xl font-bold tracking-tight text-primary">{formatNumber(p.predicted_views)}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Expected range: <span className="font-semibold text-foreground">{formatCompact(p.lower_range)} – {formatCompact(p.upper_range)}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Model Confidence</p>
              <p className="mt-2 text-3xl font-semibold">{Math.round(p.confidence)}%</p>
              <Progress value={p.confidence} className="mt-3" />
              <p className="mt-3 flex gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Placeholder score from the built-in model — not a statistical guarantee until the trained model is connected.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Video Information">
            <dl className="divide-y divide-border text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </ChartCard>
          <ChartCard title="Prediction Insights" description="How much each factor contributed to this estimate.">
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={p.feature_importance} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="feature" width={110} fontSize={12} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
                  <Bar dataKey="importance" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}
