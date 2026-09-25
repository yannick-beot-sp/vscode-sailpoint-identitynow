export interface HecateJobStatus {
    id: string;
    status: string;
    description?: string;
    resultJson?: string | Record<string, unknown> | null;
}
