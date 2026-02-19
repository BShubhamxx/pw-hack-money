import { GraphResponse } from "./mock-data";

// ── Types ────────────────────────────────────────────────────────

export interface SessionSummary {
    id: string;
    filename: string;
    total_accounts: number;
    suspicious_count: number;
    rings_detected: number;
    processing_time: number;
    created_at: string;
}

export interface SuspiciousAccount {
    account_id: string;
    suspicion_score: number;
    detected_patterns: string[];
    ring_id: string;
}

export interface FraudRing {
    ring_id: string;
    member_accounts: string[];
    pattern_type: string;
    risk_score: number;
}

export interface AnalysisSummary {
    total_accounts_analyzed: number;
    suspicious_accounts_flagged: number;
    fraud_rings_detected: number;
    processing_time_seconds: number;
}

export interface UploadResponse {
    session_id: string;
    suspicious_accounts: SuspiciousAccount[];
    fraud_rings: FraudRing[];
    graph: GraphResponse;
    summary: AnalysisSummary;
}

// ── Config ───────────────────────────────────────────────────────

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ── API Functions ────────────────────────────────────────────────

/**
 * Upload a CSV file for analysis.
 * POST /api/upload
 */
export async function uploadCSV(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Upload failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * List all past analysis sessions (summaries only).
 * GET /api/sessions
 */
export async function fetchSessions(): Promise<SessionSummary[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`);
        if (!response.ok) {
            throw new Error(`Error fetching sessions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return [];
    }
}

/**
 * Get full detail for a single session.
 * GET /api/sessions/{sessionId}
 */
export async function fetchSessionDetail(
    sessionId: string,
): Promise<SessionSummary | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch session detail:", error);
        return null;
    }
}

/**
 * Get graph visualization data for a session.
 * GET /api/sessions/{sessionId}/graph
 */
export async function fetchSessionGraph(
    sessionId: string,
): Promise<GraphResponse | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/sessions/${sessionId}/graph`,
        );
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch session graph:", error);
        return null;
    }
}

/**
 * Delete an analysis session.
 * DELETE /api/sessions/{sessionId}
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: "DELETE",
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to delete session:", error);
        return false;
    }
}
