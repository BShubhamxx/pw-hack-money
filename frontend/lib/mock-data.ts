
export type Node = {
    id: string
    riskScore: number
    suspicious: boolean
    ringId?: string
    patternType?: "cycle" | "smurfing" | "shell"
    totalTransactions: number
}

export type Edge = {
    id: string
    source: string
    target: string
    amount: number
    timestamp: string
}

export type Ring = {
    ringId: string
    patternType: string
    memberCount: number
    riskScore: number
    members: string[]
}

export type GraphResponse = {
    nodes: Node[]
    edges: Edge[]
    rings: Ring[]
}

export const mockGraphData: GraphResponse = {
    nodes: [
        // Cycle Ring Members
        { id: "A", riskScore: 85, suspicious: true, ringId: "ring-1", patternType: "cycle", totalTransactions: 15 },
        { id: "B", riskScore: 85, suspicious: true, ringId: "ring-1", patternType: "cycle", totalTransactions: 12 },
        { id: "C", riskScore: 85, suspicious: true, ringId: "ring-1", patternType: "cycle", totalTransactions: 18 },

        // Smurfing Ring
        { id: "SmurfMaster", riskScore: 95, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 50 },
        { id: "S1", riskScore: 60, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 5 },
        { id: "S2", riskScore: 60, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 4 },
        { id: "S3", riskScore: 60, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 6 },
        { id: "S4", riskScore: 60, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 3 },
        { id: "S5", riskScore: 60, suspicious: true, ringId: "ring-2", patternType: "smurfing", totalTransactions: 5 },

        // Normal Nodes
        { id: "N1", riskScore: 10, suspicious: false, totalTransactions: 100 },
        { id: "N2", riskScore: 15, suspicious: false, totalTransactions: 80 },
        { id: "N3", riskScore: 5, suspicious: false, totalTransactions: 120 },
    ],
    edges: [
        // Cycle Edges
        { id: "e1", source: "A", target: "B", amount: 5000, timestamp: "2023-10-26T10:00:00Z" },
        { id: "e2", source: "B", target: "C", amount: 4800, timestamp: "2023-10-26T12:00:00Z" },
        { id: "e3", source: "C", target: "A", amount: 4500, timestamp: "2023-10-26T14:00:00Z" },

        // Smurfing Edges
        { id: "e4", source: "S1", target: "SmurfMaster", amount: 900, timestamp: "2023-10-27T09:00:00Z" },
        { id: "e5", source: "S2", target: "SmurfMaster", amount: 950, timestamp: "2023-10-27T09:15:00Z" },
        { id: "e6", source: "S3", target: "SmurfMaster", amount: 850, timestamp: "2023-10-27T09:30:00Z" },
        { id: "e7", source: "S4", target: "SmurfMaster", amount: 920, timestamp: "2023-10-27T09:45:00Z" },
        { id: "e8", source: "S5", target: "SmurfMaster", amount: 880, timestamp: "2023-10-27T10:00:00Z" },

        // Normal Edges
        { id: "e9", source: "N1", target: "N2", amount: 50, timestamp: "2023-10-25T10:00:00Z" },
        { id: "e10", source: "N2", target: "N3", amount: 75, timestamp: "2023-10-25T10:30:00Z" },
    ],
    rings: [
        {
            ringId: "ring-1",
            patternType: "cycle",
            memberCount: 3,
            riskScore: 85,
            members: ["A", "B", "C"],
        },
        {
            ringId: "ring-2",
            patternType: "smurfing",
            memberCount: 6,
            riskScore: 95,
            members: ["SmurfMaster", "S1", "S2", "S3", "S4", "S5"],
        },
    ],
}
