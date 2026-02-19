"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { StatsCards } from "@/components/analytics/stats-cards";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSessions, SessionSummary } from "@/lib/api";

export default function Page() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalAccounts: 0,
    suspiciousCount: 0,
    ringsDetected: 0,
    avgProcessingTime: 0,
  });

  useEffect(() => {
    async function loadData() {
      const data = await fetchSessions();
      setSessions(data.slice(0, 5)); // Show only recent 5

      if (data.length > 0) {
        const totalJobs = data.length;
        const totalAccounts = data.reduce(
          (sum, s) => sum + s.total_accounts,
          0,
        );
        const suspiciousCount = data.reduce(
          (sum, s) => sum + s.suspicious_count,
          0,
        );
        const ringsDetected = data.reduce(
          (sum, s) => sum + s.rings_detected,
          0,
        );
        const totalTime = data.reduce((sum, s) => sum + s.processing_time, 0);
        const avgProcessingTime = totalTime / totalJobs;

        setStats({
          totalJobs,
          totalAccounts,
          suspiciousCount,
          ringsDetected,
          avgProcessingTime,
        });
      }
    }

    loadData();
  }, []);

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
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Overview of your financial forensics analysis.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button asChild>
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  New Analysis
                </Link>
              </Button>
            </div>
          </div>

          <StatsCards {...stats} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Analysis Sessions</CardTitle>
                <CardDescription>
                  Your most recent file uploads and their detection results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSessions sessions={sessions} />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-10">
                    <Upload size={100} />
                  </div>
                  <h3 className="font-semibold text-lg">
                    Upload Transaction Data
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analyze new CSV files for potential money laundering
                    activities.
                  </p>
                  <Button className="w-fit" asChild>
                    <Link href="/upload">
                      Upload File <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-10">
                    <BarChart3 size={100} />
                  </div>
                  <h3 className="font-semibold text-lg">Deep Dive Analytics</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore the transaction graph and investigate fraud rings.
                  </p>
                  <Button variant="outline" className="w-fit" asChild>
                    <Link href="/analytics">
                      Go to Analytics <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
