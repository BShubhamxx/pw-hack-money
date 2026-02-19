"use client";

import { GraphView } from "@/components/analytics/graph-view";
import { FraudTable } from "@/components/analytics/fraud-table";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { mockGraphData } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FiltersPanel } from "@/components/analytics/filters";
import { useState, useMemo } from "react";

export default function AnalyticsPage() {
  const [minRiskScore, setMinRiskScore] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState("all");
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let nodes = mockGraphData.nodes;
    let edges = mockGraphData.edges;
    let rings = mockGraphData.rings;

    // Filter by Risk Score
    nodes = nodes.filter((node) => node.riskScore >= minRiskScore);

    // Filter by Pattern
    if (selectedPattern !== "all") {
      nodes = nodes.filter((node) => node.patternType === selectedPattern);
      rings = rings.filter((ring) => ring.patternType === selectedPattern);
    }

    // Filter by Ring ID
    if (selectedRingId) {
      nodes = nodes.filter((node) => node.ringId === selectedRingId);
      rings = rings.filter((ring) => ring.ringId === selectedRingId);
    }

    // Filter edges to only include those between visible nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    edges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

    return { nodes, edges, rings };
  }, [minRiskScore, selectedPattern, selectedRingId]);

  const uniqueRingIds = Array.from(
    new Set(mockGraphData.rings.map((r) => r.ringId)),
  );

  const handleReset = () => {
    setMinRiskScore(0);
    setSelectedPattern("all");
    setSelectedRingId(null);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Fraud Analytics
              </h2>
              <p className="text-muted-foreground">
                Detailed analysis of financial transaction patterns and detected
                fraud rings.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-12 lg:grid-cols-12 md:h-[calc(100vh-12rem)]">
            <div className="col-span-12 md:col-span-3 lg:col-span-2">
              <Card className="h-full">
                <CardContent className="p-4 h-full">
                  <FiltersPanel
                    minRiskScore={minRiskScore}
                    onRiskChange={setMinRiskScore}
                    selectedPattern={selectedPattern}
                    onPatternChange={setSelectedPattern}
                    selectedRingId={selectedRingId}
                    onRingIdChange={setSelectedRingId}
                    ringIds={uniqueRingIds}
                    onReset={handleReset}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 md:col-span-9 lg:col-span-10 flex flex-col gap-4 h-full">
              <Card className="flex-1 min-h-100">
                <CardHeader>
                  <CardTitle>Transaction Graph</CardTitle>
                  <CardDescription>
                    Interactive visualization of relationships. Red nodes
                    indicate high suspicion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[calc(100%-5rem)] p-0">
                  <div className="h-full w-full">
                    <GraphView data={filteredData} />
                  </div>
                </CardContent>
              </Card>

              <Card className="h-1/3 min-h-64 flex flex-col">
                <CardHeader>
                  <CardTitle>Detected Fraud Rings</CardTitle>
                  <CardDescription>
                    Summary of all identified fraud rings and their risk scores.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex-1 overflow-auto">
                    <FraudTable data={filteredData.rings} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
