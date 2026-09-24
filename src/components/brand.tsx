import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Play className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
      </span>
      <span className={tone === "light" ? "text-sidebar-foreground" : "text-foreground"}>
        YT Predict
      </span>
    </span>
  );
}
