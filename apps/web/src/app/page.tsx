import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IconShieldCheck, IconChartBar, IconAlertTriangle, IconArrowRight } from "@tabler/icons-react";

const features = [
  {
    icon: IconShieldCheck,
    title: "Risk Assessment",
    description: "Identify, evaluate, and prioritize risks across your organisation in real time.",
  },
  {
    icon: IconChartBar,
    title: "Analytics & Reporting",
    description: "Data-driven dashboards that surface trends and compliance status at a glance.",
  },
  {
    icon: IconAlertTriangle,
    title: "Incident Tracking",
    description: "Log, assign, and resolve incidents with full audit trails and escalation paths.",
  },
];

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Riskbase</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-col flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-3xl flex flex-col items-center gap-12 text-center">

        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          <Badge variant="secondary">Early Access</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Welcome to <span className="text-primary">Riskbase</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
            A modern risk management platform built for teams who care about clarity, speed, and compliance.
          </p>
          <div className="flex gap-3 mt-2">
            <Button size="lg">
              Get started <IconArrowRight className="ml-1 size-4" />
            </Button>
            <Button size="lg" variant="outline">
              Learn more
            </Button>
          </div>
        </div>

        <Separator />

        {/* Feature cards */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <Icon className="size-6 text-primary mb-1" />
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </main>
    </>
  );
}
