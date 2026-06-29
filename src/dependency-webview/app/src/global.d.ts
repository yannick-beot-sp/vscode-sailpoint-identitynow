export {};

declare global {
    interface Window {
        data: {
            resourceType: string;
            resourceId: string;
            resourceName: string;
            label: string;
        };
    }
}
