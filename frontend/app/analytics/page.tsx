"use client";

import dynamic from "next/dynamic";
import { FraudTable } from "@/components/analytics/fraud-table";

const GraphView = dynamic(
  () =>
    import("@/components/analytics/graph-view").then((mod) => mod.GraphView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  },
);
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GraphResponse } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FiltersPanel } from "@/components/analytics/filters";
import { useState, useMemo, useEffect, Suspense } from "react";
import {
  fetchSessions,
  fetchSessionGraph,
  fetchSessionDetail,
  UploadResponse,
} from "@/lib/api";
import { StatsCards } from "@/components/analytics/stats-cards";
import { useSearchParams } from "next/navigation";
import { IconLoader } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useCallback } from "react";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minRiskScore, setMinRiskScore] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState("all");
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalAccounts: 0,
    suspiciousCount: 0,
    ringsDetected: 0,
    avgProcessingTime: 0,
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        if (sessionId) {
          // Load graph data for a specific session
          const graph = await fetchSessionGraph(sessionId);
          if (graph) {
            setGraphData(graph);
          } else {
            setError("Session not found. It may have been deleted.");
          }

          // Load session detail for stats
          const detail = await fetchSessionDetail(sessionId);
          if (detail) {
            setStats({
              totalJobs: 1,
              totalAccounts: detail.total_accounts,
              suspiciousCount: detail.suspicious_count,
              ringsDetected: detail.rings_detected,
              avgProcessingTime: detail.processing_time,
            });
          }
        } else {
          // No session ID — load aggregate stats
          const sessions = await fetchSessions();
          if (sessions.length > 0) {
            const totalJobs = sessions.length;
            const totalAccounts = sessions.reduce(
              (sum, s) => sum + s.total_accounts,
              0,
            );
            const suspiciousCount = sessions.reduce(
              (sum, s) => sum + s.suspicious_count,
              0,
            );
            const ringsDetected = sessions.reduce(
              (sum, s) => sum + s.rings_detected,
              0,
            );
            const totalTime = sessions.reduce(
              (sum, s) => sum + s.processing_time,
              0,
            );
            const avgProcessingTime = totalTime / totalJobs;

            setStats({
              totalJobs,
              totalAccounts,
              suspiciousCount,
              ringsDetected,
              avgProcessingTime,
            });

            // Load graph from the most recent session
            const latestGraph = await fetchSessionGraph(sessions[0].id);
            if (latestGraph) {
              setGraphData(latestGraph);
            }
          }
        }
      } catch (err) {
        setError("Failed to load data. Make sure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [sessionId]);

  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [], rings: [] };

    let nodes = graphData.nodes;
    let edges = graphData.edges;
    let rings = graphData.rings;

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
  }, [graphData, minRiskScore, selectedPattern, selectedRingId]);

  const uniqueRingIds = graphData
    ? Array.from(new Set(graphData.rings.map((r) => r.ringId)))
    : [];

  const handleReset = () => {
    setMinRiskScore(0);
    setSelectedPattern("all");
    setSelectedRingId(null);
  };

  const handleDownloadJSON = useCallback(() => {
    if (!graphData) return;

    // Build suspicious_accounts from nodes that are suspicious, sorted by riskScore descending
    const suspiciousAccounts = graphData.nodes
      .filter((node) => node.suspicious)
      .sort((a, b) => b.riskScore - a.riskScore)
      .map((node) => ({
        account_id: node.id,
        suspicion_score: Math.round(node.riskScore * 10) / 10,
        detected_patterns: node.patternType
          ? [node.patternType, node.riskScore > 80 ? "high_velocity" : null].filter(Boolean)
          : [],
        ring_id: node.ringId || null,
      }));

    // Build fraud_rings from rings array
    const fraudRings = graphData.rings.map((ring) => ({
      ring_id: ring.ringId,
      member_accounts: ring.members,
      pattern_type: ring.patternType,
      risk_score: Math.round(ring.riskScore * 10) / 10,
    }));

    // Build summary from stats
    const summary = {
      total_accounts_analyzed: stats.totalAccounts,
      suspicious_accounts_flagged: stats.suspiciousCount,
      fraud_rings_detected: stats.ringsDetected,
      processing_time_seconds: Math.round(stats.avgProcessingTime * 100) / 100,
    };

    const outputData = {
      suspicious_accounts: suspiciousAccounts,
      fraud_rings: fraudRings,
      summary,
    };

    // Create and download the JSON file
    const blob = new Blob([JSON.stringify(outputData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fraud-analysis-${sessionId || "report"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [graphData, stats, sessionId]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fraud Analytics</h2>
          <p className="text-muted-foreground">
            {sessionId
              ? "Analysis results for the uploaded dataset."
              : "Detailed analysis of financial transaction patterns and detected fraud rings."}
          </p>
        </div>
        {graphData && graphData.nodes.length > 0 && (
          <Button onClick={handleDownloadJSON} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
        )}
      </div>

      <StatsCards {...stats} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <IconLoader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analysis data...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">{error}</p>
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload a File
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">
              No analysis data available. Upload a CSV file to get started.
            </p>
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload a File
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-12 h-[calc(100vh-16rem)]">
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

          <div className="col-span-12 md:col-span-9 lg:col-span-10 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col min-h-75">
              <CardHeader className="shrink-0">
                <CardTitle>Transaction Graph</CardTitle>
                <CardDescription>
                  Interactive visualization of relationships. Red nodes indicate
                  high suspicion.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-4 pt-0">
                <div className="h-full w-full">
                  <GraphView data={filteredData} />
                </div>
              </CardContent>
            </Card>

            <Card className="shrink-0 h-70 flex flex-col">
              <CardHeader className="shrink-0">
                <CardTitle>Detected Fraud Rings</CardTitle>
                <CardDescription>
                  Summary of all identified fraud rings and their risk scores.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <FraudTable data={filteredData.rings} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
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
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <IconLoader className="h-10 w-10 animate-spin text-primary" />
            </div>
          }
        >
          <AnalyticsContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
