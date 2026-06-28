export {};

declare global {
    interface Window {
        data: {
            resourceType: string;
            resourceId: string;
            label: string;
        };
    }
}
