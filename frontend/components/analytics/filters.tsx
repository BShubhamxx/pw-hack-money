"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface FiltersPanelProps {
  minRiskScore: number;
  onRiskChange: (value: number) => void;
  selectedPattern: string;
  onPatternChange: (value: string) => void;
  selectedRingId: string | null;
  onRingIdChange: (value: string | null) => void;
  ringIds: string[];
  onReset: () => void;
}

export function FiltersPanel({
  minRiskScore,
  onRiskChange,
  selectedPattern,
  onPatternChange,
  selectedRingId,
  onRingIdChange,
  ringIds,
  onReset,
}: FiltersPanelProps) {
  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter graph view.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Min Risk Score</Label>
            <span className="text-sm text-muted-foreground">
              {minRiskScore}
            </span>
          </div>
          <Slider
            value={[minRiskScore]}
            min={0}
            max={100}
            step={1}
            onValueChange={(vals: number[]) => onRiskChange(vals[0])}
            className="w-full"
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Fraud Pattern</Label>
          <Select value={selectedPattern} onValueChange={onPatternChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Patterns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patterns</SelectItem>
              <SelectItem value="cycle">Cycle</SelectItem>
              <SelectItem value="smurfing">Smurfing</SelectItem>
              <SelectItem value="shell">Shell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Ring ID</Label>
          <Select
            value={selectedRingId || "all"}
            onValueChange={(val) => onRingIdChange(val === "all" ? null : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Rings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rings</SelectItem>
              {ringIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full" onClick={onReset}>
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
