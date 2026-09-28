/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    testMatch: ["**/test/mcp/**/*.test.ts"],
    setupFiles: ["dotenv/config"],
    moduleNameMapper: {
        "^vscode$": "<rootDir>/src/test/mcp/vscode-mock.ts",
        // Source imports use ESM .js specifiers; Jest loads the TypeScript sources.
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testTimeout: 60_000,
    transform: {
        "^.+\\.[tj]sx?$": ["ts-jest", {
            tsconfig: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
                // Jest still transforms the extension sources as CommonJS.
                // The published extension itself is ESM (package.json "type": "module").
                module: "commonjs",
                moduleResolution: "node",
                esModuleInterop: true,
            },
        }],
    },
    // Allow Jest to transform ESM-only packages (jose, @frontmcp/testing, etc.)
    transformIgnorePatterns: [
        "node_modules/(?!(jose|@frontmcp)/)",
    ]
};
