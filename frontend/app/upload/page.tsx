"use client";

import { useState } from "react";
import {
  IconUpload,
  IconFileText,
  IconX,
  IconCloudUpload,
  IconLoader,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile: File) => {
    if (
      selectedFile.type !== "text/csv" &&
      !selectedFile.name.endsWith(".csv")
    ) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
    toast.success("Analysis complete!");
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
          <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="grid gap-2 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
              <p className="text-muted-foreground">
                Upload your CSV file to start analyzing the financial data.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Drag and drop your CSV file here or click to browse.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center gap-6 py-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <IconLoader className="h-10 w-10 animate-spin text-primary" />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h3 className="text-xl font-semibold">Analyzing Data</h3>
                      <p className="text-muted-foreground w-64 md:w-80">
                        Please wait while we process your CSV file and extract
                        insights.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {!file ? (
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
                          isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50",
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file")?.click()}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <IconCloudUpload className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">
                              <span className="cursor-pointer text-primary hover:underline">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              CSV files only (max 10MB)
                            </p>
                          </div>
                        </div>
                        <input
                          id="file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                          onClick={(e) =>
                            ((e.target as HTMLInputElement).value = "")
                          }
                        />
                      </div>
                    ) : (
                      <div className="relative flex items-center gap-4 rounded-lg border p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <IconFileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={removeFile}
                        >
                          <IconX className="h-4 w-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!file}
                      onClick={handleAnalyze}
                    >
                      <IconUpload className="mr-2 h-4 w-4" /> Analyze Data
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
