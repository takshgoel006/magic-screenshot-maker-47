import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/chart-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePrediction, listPredictions } from "@/lib/predictions.functions";
import { accuracyOf, filterByRange, predictionsKey } from "@/lib/queries";
import { CATEGORIES, DATE_RANGES, formatCompact } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — YT Predict" },
      { name: "description", content: "All your past YouTube view predictions." },
      { property: "og:title", content: "History — YT Predict" },
      { property: "og:description", content: "All your past YouTube view predictions." },
    ],
  }),
  component: HistoryPage,
});

const PAGE = 8;

function HistoryPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listPredictions);
  const del = useServerFn(deletePrediction);
  const { data, isLoading } = useQuery({ queryKey: predictionsKey, queryFn: () => fetchList() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [range, setRange] = useState("all");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = filterByRange(data ?? [], range);
    if (cat !== "all") r = r.filter((x) => x.category === cat);
    if (q.trim()) r = r.filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));
    return r;
  }, [data, q, cat, range]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del({ data: { id: toDelete } });
      await qc.invalidateQueries({ queryKey: predictionsKey });
      toast.success("Prediction deleted");
    } catch {
      toast.error("Couldn't delete this prediction.");
    }
    setToDelete(null);
  }

  return (
    <AppShell title="History" subtitle="Every prediction you've made.">
      <div className="card-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Select value={cat} onValueChange={(v) => { setCat(v); setPage(1); }}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => { setRange(v); setPage(1); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{DATE_RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="mt-5 overflow-x-auto">
          {isLoading ? <Skeleton className="h-64" /> : shown.length === 0 ? (
            <EmptyState title="No predictions found" message="Try another filter, or make a new prediction." />
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  {["#", "Video Title", "Category", "Predicted", "Actual", "Accuracy", "Date", ""].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const acc = accuracyOf(r);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-3 text-muted-foreground">{(page - 1) * PAGE + i + 1}</td>
                      <td className="max-w-[220px] truncate px-3 py-3 font-medium">{r.title}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{r.category}</span></td>
                      <td className="px-3 py-3 font-semibold">{formatCompact(r.predicted_views)}</td>
                      <td className="px-3 py-3">{r.actual_views != null ? formatCompact(r.actual_views) : "—"}</td>
                      <td className="px-3 py-3">{acc != null ? `${acc}%` : <span className="text-muted-foreground">Pending</span>}</td>
                      <td className="px-3 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" asChild aria-label="View"><Link to="/result/$id" params={{ id: r.id }}><Eye className="h-4 w-4" /></Link></Button>
                          <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setToDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > PAGE ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this prediction?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
