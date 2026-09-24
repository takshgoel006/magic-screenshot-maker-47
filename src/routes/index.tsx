import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Target, Zap, LineChart, BrainCircuit, ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YT Predict — Predict YouTube Views with AI" },
      {
        name: "description",
        content:
          "Estimate the potential views of your YouTube videos using machine learning and data-driven insights.",
      },
      { property: "og:title", content: "YT Predict — Predict YouTube Views with AI" },
      {
        property: "og:description",
        content:
          "Estimate the potential views of your YouTube videos using machine learning and data-driven insights.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Target,
    title: "Accurate Predictions",
    text: "Estimates built from channel reach, engagement and publishing patterns.",
  },
  {
    icon: Zap,
    title: "Fast & Easy",
    text: "Fill in a few video details and get an estimate in seconds.",
  },
  {
    icon: LineChart,
    title: "Data-Driven Insights",
    text: "See which factors contribute most to your expected view count.",
  },
  {
    icon: BrainCircuit,
    title: "AI/ML Powered",
    text: "A prediction model ready to plug into your own trained backend.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand className="text-lg" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#home" className="transition-colors hover:text-foreground">
              Home
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <section id="home" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Play className="h-3 w-3 fill-primary" />
              Machine Learning Project
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Predict YouTube Video Views with AI
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Estimate the potential views of your YouTube videos using machine learning and
              data-driven insights.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start Predicting
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>

          <div className="card-surface overflow-hidden p-2">
            <img
              src={heroImage}
              alt="YouTube views prediction analytics dashboard"
              width={1280}
              height={960}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Everything you need to forecast performance
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card-surface card-interactive p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                <feature.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">About YT Predict</h2>
          <p className="mt-4 text-muted-foreground">
            YT Predict is an AI/ML application that estimates YouTube view counts from video and
            channel signals such as category, duration, tags, publishing time, subscriber count and
            engagement. Predictions shown in the app come from a built-in model and can be switched
            to a trained Python model without changing the interface.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link to="/signup">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Brand />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} YT Predict. Built for an AI/ML project demonstration.
          </p>
        </div>
      </footer>
    </div>
  );
}
