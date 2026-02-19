
export type Node = {
    id: string
    riskScore: number
    suspicious: boolean
    ringId?: string
    patternType?: "cycle" | "smurfing" | "shell" | null
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
