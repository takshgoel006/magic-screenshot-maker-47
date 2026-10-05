import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, Eye, Target, Trophy } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard, EmptyState } from "@/components/chart-card";
import { RangeTabs } from "@/components/range-tabs";
import { listPredictions } from "@/lib/predictions.functions";
import { accuracyOf, filterByRange, predictionsKey, trendData } from "@/lib/queries";
import { formatCompact } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — YT Predict" },
      { name: "description", content: "Charts and statistics across all your predictions." },
      { property: "og:title", content: "Analytics — YT Predict" },
      { property: "og:description", content: "Charts and statistics across all your predictions." },
    ],
  }),
  component: Analytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Analytics() {
  const fetchList = useServerFn(listPredictions);
  const { data } = useQuery({ queryKey: predictionsKey, queryFn: () => fetchList() });
  const [range, setRange] = useState("all");
  const rows = filterByRange(data ?? [], range);

  const total = rows.reduce((s, r) => s + r.predicted_views, 0);
  const accs = rows.map(accuracyOf).filter((a): a is number => a != null);
  const avgAcc = accs.length ? (accs.reduce((a, b) => a + b, 0) / accs.length).toFixed(1) + "%" : "—";
  const best = rows.reduce((m, r) => Math.max(m, r.predicted_views), 0);

  const vsActual = rows.filter((r) => r.actual_views != null).slice(0, 8).reverse()
    .map((r) => ({ name: r.title.slice(0, 14), predicted: r.predicted_views, actual: r.actual_views }));
  const catMap = new Map<string, number>();
  rows.forEach((r) => catMap.set(r.category, (catMap.get(r.category) ?? 0) + 1));
  const cats = [...catMap].map(([name, value]) => ({ name, value }));
  const featMap = new Map<string, number[]>();
  rows.forEach((r) => r.feature_importance.forEach((f) => featMap.set(f.feature, [...(featMap.get(f.feature) ?? []), f.importance])));
  const feats = [...featMap].map(([feature, v]) => ({ feature, importance: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.importance - a.importance);

  const empty = <EmptyState title="Not enough data" message="Make a few predictions to fill this chart." />;

  return (
    <AppShell title="Analytics" subtitle="Performance across your predictions." actions={<div className="hidden sm:block"><RangeTabs value={range} onChange={setRange} /></div>}>
      <div className="space-y-6">
        <div className="sm:hidden"><RangeTabs value={range} onChange={setRange} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Predictions" value={String(rows.length)} icon={Activity} />
          <KpiCard label="Total Predicted Views" value={formatCompact(total)} icon={Eye} />
          <KpiCard label="Average Accuracy" value={avgAcc} icon={Target} />
          <KpiCard label="Best Prediction" value={best ? formatCompact(best) : "—"} icon={Trophy} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Predicted vs Actual Views" description="Predictions where you recorded actual views.">
            {vsActual.length ? (
              <div className="h-72"><ResponsiveContainer>
                <BarChart data={vsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={12} tickFormatter={formatCompact} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => formatCompact(v)} /><Legend />
                  <Bar dataKey="predicted" name="Predicted" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            ) : <EmptyState title="No actual views yet" message="Add actual views from the History page to compare." />}
          </ChartCard>
          <ChartCard title="Prediction Trend">
            {rows.length ? (
              <div className="h-72"><ResponsiveContainer>
                <LineChart data={trendData(rows)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={12} tickFormatter={formatCompact} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => formatCompact(v)} />
                  <Line type="monotone" dataKey="predicted" name="Predicted" stroke="var(--primary)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer></div>
            ) : empty}
          </ChartCard>
          <ChartCard title="Category Distribution">
            {cats.length ? (
              <div className="h-72"><ResponsiveContainer>
                <PieChart>
                  <Pie data={cats} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {cats.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer></div>
            ) : empty}
          </ChartCard>
          <ChartCard title="Feature Importance" description="Average contribution across predictions.">
            {feats.length ? (
              <div className="h-72"><ResponsiveContainer>
                <BarChart data={feats} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="feature" width={110} fontSize={12} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
                  <Bar dataKey="importance" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            ) : empty}
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}
