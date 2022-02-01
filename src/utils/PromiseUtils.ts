import * as vscode from 'vscode';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCancelPromise(token: vscode.CancellationToken, errorConstructor?: new (...a: any[]) => Error, ...args: unknown[]): Promise<never> {
    return new Promise((resolve, reject) => {
        const disposable = token.onCancellationRequested(() => {
            disposable.dispose();

            if (errorConstructor) {
                reject(new errorConstructor(args));
            } else {
                reject(new Error('Operation cancelled.'));
            }
        });
    });
}