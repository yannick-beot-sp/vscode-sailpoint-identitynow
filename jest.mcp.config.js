/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    testMatch: ["**/test/mcp/**/*.test.ts"],
    setupFiles: ["dotenv/config"],
    moduleNameMapper: {
        "^vscode$": "<rootDir>/src/test/mcp/vscode-mock.ts",
    },
    testTimeout: 60_000,
    transform: {
        "^.+\\.[tj]sx?$": ["ts-jest", {
            tsconfig: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
            },
        }],
    },
    // Allow Jest to transform ESM-only packages (jose, @frontmcp/testing, etc.)
    transformIgnorePatterns: [
        "node_modules/(?!(jose|@frontmcp)/)",
    ],
};
