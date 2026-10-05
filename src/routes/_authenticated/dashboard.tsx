import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, Target, Trophy, ArrowRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard, EmptyState } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listPredictions } from "@/lib/predictions.functions";
import { accuracyOf, filterByRange, predictionsKey, trendData } from "@/lib/queries";
import { DATE_RANGES, formatCompact } from "@/lib/constants";
import { RangeTabs } from "@/components/range-tabs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — YT Predict" },
      { name: "description", content: "Your YouTube views prediction overview." },
      { property: "og:title", content: "Dashboard — YT Predict" },
      { property: "og:description", content: "Your YouTube views prediction overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchList = useServerFn(listPredictions);
  const { data, isLoading } = useQuery({ queryKey: predictionsKey, queryFn: () => fetchList() });
  const [range, setRange] = useState<string>(DATE_RANGES[1].value);
  const rows = data ?? [];
  const accs = rows.map(accuracyOf).filter((a): a is number => a != null);
  const avgAcc = accs.length ? (accs.reduce((a, b) => a + b, 0) / accs.length).toFixed(1) + "%" : "—";
  const best = rows.reduce((m, r) => Math.max(m, r.predicted_views), 0);
  const chart = trendData(filterByRange(rows, range));

  return (
    <AppShell title="Welcome back" subtitle="Here's how your predictions are performing.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <KpiCard label="Total Predictions" value={String(rows.length)} icon={Activity} />
              <KpiCard label="Average Accuracy" value={avgAcc} hint={accs.length ? `${accs.length} with actual views` : "Add actual views in History"} icon={Target} />
              <KpiCard label="Best Prediction" value={best ? formatCompact(best) : "—"} hint="Highest predicted views" icon={Trophy} />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Predicted Views Trend" action={<RangeTabs value={range} onChange={setRange} />}>
            {chart.length ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={12} stroke="var(--muted-foreground)" />
                    <YAxis fontSize={12} stroke="var(--muted-foreground)" tickFormatter={formatCompact} />
                    <Tooltip formatter={(v: number) => formatCompact(v)} />
                    <Line type="monotone" dataKey="predicted" name="Predicted" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No predictions yet" message="Run your first prediction to see your trend here." />
            )}
          </ChartCard>

          <div className="card-surface flex flex-col justify-between bg-sidebar p-6">
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Ready to predict?</h2>
              <p className="mt-2 text-sm text-sidebar-foreground/70">
                Enter your video details and get an estimated view count in seconds.
              </p>
            </div>
            <Button className="mt-6" asChild>
              <Link to="/predict">Predict Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
