"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchSessions, SessionSummary } from "@/lib/api";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    async function loadData() {
      const data = await fetchSessions();
      setSessions(data);
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
              <h2 className="text-3xl font-bold tracking-tight">
                Analysis History
              </h2>
              <p className="text-muted-foreground">
                Complete log of all processed transaction files and findings.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Analysis Sessions</CardTitle>
              <CardDescription>
                Review past analyses and their results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSessions sessions={sessions} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
