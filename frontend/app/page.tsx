import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 text-primary-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <span className="font-semibold text-lg">MuleDetect</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          Graph-Powered Detection
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Uncover Money Muling
          <br />
          <span className="text-primary">Networks Instantly</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Advanced graph algorithms detect circular routing, smurfing patterns,
          and layered shell networks from your transaction data in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/upload">
            <Button size="lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload CSV
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Detection Capabilities
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Our engine uses proven graph theory algorithms to identify fraudulent
          transaction patterns.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="size-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-red-500"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </div>
              <CardTitle>Circular Routing</CardTitle>
              <CardDescription>
                Detect closed loops (3-5 nodes) where funds cycle back to origin
                through intermediaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">DFS/BFS Algorithm</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-orange-500"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <CardTitle>Smurfing Detection</CardTitle>
              <CardDescription>
                Identify fan-in/fan-out patterns with 10+ transactions within
                72-hour windows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Temporal Analysis</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-purple-500"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <CardTitle>Shell Networks</CardTitle>
              <CardDescription>
                Trace layered chains (3+ hops) through low-activity intermediary
                accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Path Finding</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: "1",
              title: "Upload CSV",
              desc: "Drop your transaction data file",
            },
            {
              step: "2",
              title: "Build Graph",
              desc: "Accounts become nodes, transactions become edges",
            },
            {
              step: "3",
              title: "Detect Patterns",
              desc: "Algorithms scan for fraud signatures",
            },
            {
              step: "4",
              title: "Export Results",
              desc: "Download JSON report with risk scores",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">{"<30s"}</div>
            <p className="text-muted-foreground">Processing Time</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-muted-foreground">Transactions Supported</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">3</div>
            <p className="text-muted-foreground">Fraud Pattern Types</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Ready to Detect Fraud Rings?
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Upload your transaction data and get results in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/upload">
              <Button variant="secondary" size="lg">
                Start Analysis Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>Built for financial forensic analysts</p>
        </div>
      </footer>
    </div>
  );
}
