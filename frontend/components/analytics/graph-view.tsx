"use client";

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
// @ts-ignore
const popper = require("cytoscape-popper");
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraphResponse, Node } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  CreditCard,
  Users,
  AlertTriangle,
} from "lucide-react";

cytoscape.use(coseBilkent);
// cytoscape-popper exports a factory that returns the registration function
// We pass a dummy factory because we only use popperRef() which doesn't need Popper
cytoscape.use(popper(() => {}));

interface GraphViewProps {
  data: GraphResponse;
}

export function GraphView({ data }: GraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = [
    ...data.nodes.map((node) => ({
      data: { ...node, label: node.id },
      classes: [
        node.suspicious ? "suspicious" : "",
        node.patternType || "",
        node.riskScore > 80 ? "high-risk" : "",
      ].join(" "),
    })),
    ...data.edges.map((edge) => ({
      data: { ...edge },
    })),
  ];

  const stylesheet: any[] = [
    {
      selector: "node",
      style: {
        "background-color": "#94a3b8",
        label: "data(label)",
        width: 30,
        height: 30,
        color: "#fff",
        "text-valign": "center",
        "text-halign": "center",
        "text-outline-width": 2,
        "text-outline-color": "#94a3b8",
        "font-size": 12,
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#cbd5e1",
        "target-arrow-color": "#cbd5e1",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
    {
      selector: ".suspicious",
      style: {
        "background-color": "#ef4444",
        "border-width": 4,
        "border-color": "#7f1d1d",
        width: 40,
        height: 40,
        "text-outline-color": "#ef4444",
      },
    },
    {
      selector: ".cycle",
      style: {
        "background-color": "#2563eb",
        "text-outline-color": "#2563eb",
      },
    },
    {
      selector: ".smurfing",
      style: {
        "background-color": "#f97316",
        "text-outline-color": "#f97316",
      },
    },
    {
      selector: ".shell",
      style: {
        "background-color": "#8b5cf6",
        "text-outline-color": "#8b5cf6",
      },
    },
    {
      selector: ":selected",
      style: {
        "border-width": 4,
        "border-color": "#000",
      },
    },
  ];

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // Tooltip logic
    const makeTippy = (node: cytoscape.NodeSingular, text: string) => {
      const ref = (node as any).popperRef();
      const dummyDomEle = document.createElement("div");
      const tip = tippy(dummyDomEle, {
        getReferenceClientRect: ref.getBoundingClientRect,
        trigger: "manual",
        content: () => {
          const div = document.createElement("div");
          div.innerHTML = text;
          return div;
        },
        arrow: true,
        placement: "bottom",
        hideOnClick: false,
        sticky: "reference",
        interactive: true,
        appendTo: document.body,
      });
      return tip;
    };

    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      const data = node.data();
      const content = `
        <div class="px-2 py-1 text-xs">
          <strong>ID:</strong> ${data.id}<br/>
          <strong>Risk Score:</strong> ${data.riskScore}<br/>
          <strong>Transactions:</strong> ${data.totalTransactions}
        </div>
      `;
      const tippyInstance = makeTippy(node, content);
      tippyInstance.show();
      node.data("tippy", tippyInstance);
    });

    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      const tippyInstance = node.data("tippy");
      if (tippyInstance) {
        tippyInstance.destroy();
      }
    });

    // Click handler for sheet
    cy.on("tap", "node", (event) => {
      const nodeData = event.target.data();
      setSelectedNode(nodeData as Node);
    });

    // Clean up
    return () => {
      cy.removeAllListeners();
    };
  }, []);

  return (
    <>
      <div className="h-full w-full border rounded-lg overflow-hidden bg-background">
        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          stylesheet={stylesheet}
          cy={(cy: cytoscape.Core) => {
            cyRef.current = cy;
          }}
          layout={{ name: "cose-bilkent", animationDuration: 500 }}
        />
      </div>

      <Sheet
        open={!!selectedNode}
        onOpenChange={(open) => !open && setSelectedNode(null)}
      >
        <SheetContent>
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  selectedNode?.riskScore && selectedNode.riskScore > 80
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedNode?.riskScore && selectedNode.riskScore > 80 ? (
                  <ShieldAlert size={24} />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-xl">
                  Account {selectedNode?.id}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <CreditCard size={14} /> Transaction Node
                  {selectedNode?.patternType && (
                    <>
                      <span>•</span>
                      <span className="capitalize">
                        {selectedNode.patternType}
                      </span>
                    </>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {selectedNode && (
            <div className="space-y-6">
              {/* STATUS CARD */}
              <div className="rounded-lg border p-4 shadow-sm bg-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity size={16} /> Risk Analysis
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      selectedNode.riskScore > 80
                        ? "text-red-600"
                        : "text-foreground"
                    }`}
                  >
                    {selectedNode.riskScore}
                    <span className="text-sm text-muted-foreground ml-1">
                      /100
                    </span>
                  </span>
                </div>
                <Progress
                  value={selectedNode.riskScore}
                  className="h-2"
                  indicatorClassName={
                    selectedNode.riskScore > 80 ? "bg-red-600" : "bg-primary"
                  }
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  {selectedNode.riskScore > 80
                    ? "Critical risk detected. Recommended for immediate suspension."
                    : "Account activity is within normal behavioral patterns."}
                </p>
              </div>

              <Separator />

              {/* KEY METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Transactions
                  </span>
                  <div className="text-2xl font-bold">
                    {selectedNode.totalTransactions}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pattern Type
                  </span>
                  <div className="text-2xl font-bold capitalize">
                    {selectedNode.patternType || "None"}
                  </div>
                </div>
              </div>

              {/* CONTEXT ALERT */}
              {selectedNode.ringId && (
                <div className="mt-4 rounded-lg bg-orange-50 p-4 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <Users className="text-orange-600 mt-0.5" size={18} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-orange-900">
                        Fraud Ring Member
                      </h4>
                      <p className="text-xs text-orange-800 leading-relaxed">
                        Linked to{" "}
                        <span className="font-medium">
                          {selectedNode.ringId}
                        </span>
                        .
                        <br />
                        Suggest investigating related accounts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
