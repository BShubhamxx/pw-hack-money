import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SessionSummary } from "@/lib/api";

interface RecentSessionsProps {
  sessions: SessionSummary[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Date Analyzed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Findings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No analysis sessions found. Upload a file to get started.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {session.filename}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(session.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {session.suspicious_count > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Suspicious
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 text-green-600 border-green-200 bg-green-50"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Clean
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                    <span>{session.suspicious_count} Suspicious Accts</span>
                    <span>{session.rings_detected} Fraud Rings</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/analytics?session=${session.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
