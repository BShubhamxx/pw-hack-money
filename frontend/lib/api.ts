
export interface SessionSummary {
    id: string;
    filename: string;
    total_accounts: number;
    suspicious_count: number;
    rings_detected: number;
    processing_time: number;
    created_at: string;
}

const API_BASE_URL = "http://localhost:8000/api";

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
