import * as http from "node:http";
import { FrontMcpServer, HttpMethod, ServerRequestHandler } from "@frontmcp/sdk";

/**
 * A stoppable Express-based HTTP server adapter for FrontMCP.
 *
 * Replicates the behaviour of the SDK's built-in `ExpressHostAdapter` but
 * exposes an explicit `stop()` method so that the enclosing `McpServer` can
 * cleanly close the underlying `http.Server` on demand.
 *
 * The adapter is passed to `FrontMcpInstance.createForGraph()` via the
 * `http.hostFactory` option.  FrontMCP calls `registerMiddleware` /
 * `registerRoute` / `prepare` on it during initialisation, then `start(port)`
 * when the HTTP listener should be opened.
 */
export class StoppableExpressAdapter extends FrontMcpServer {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    private readonly _express: any = require("express");
    private readonly _app: any;
    private readonly _router: any;
    private _prepared = false;
    private _httpServer?: http.Server;

    constructor() {
        super();
        this._app    = this._express();
        this._router = this._express.Router();

        this._app.use(this._express.json());
        this._app.use(this._express.urlencoded({ extended: true }));
        this._app.use((_req: any, res: any, next: any) => {
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            next();
        });
    }

    registerRoute(method: HttpMethod, path: string, handler: ServerRequestHandler): void {
        this._router[method.toLowerCase()](path, this.enhancedHandler(handler));
    }

    registerMiddleware(entryPath: string, handler: ServerRequestHandler): void {
        this._router.use(entryPath, handler);
    }

    enhancedHandler(handler: ServerRequestHandler) {
        return (req: any, res: any, next: any) => handler(req, res, next);
    }

    prepare(): void {
        if (this._prepared) { return; }
        this._prepared = true;
        this._app.use("/", this._router);
    }

    getHandler(): unknown {
        this.prepare();
        return this._app;
    }

    async start(portOrSocketPath: number | string): Promise<void> {
        this.prepare();
        const server = http.createServer(this._app);
        server.requestTimeout  = 0;
        server.headersTimeout  = 0;
        server.keepAliveTimeout = 75_000;
        this._httpServer = server;

        await new Promise<void>((resolve, reject) => {
            server.on("error", reject);
            server.listen(portOrSocketPath, () => resolve());
        });
    }

    /** Gracefully closes the underlying HTTP server. */
    async stop(): Promise<void> {
        if (!this._httpServer) { return; }
        const server = this._httpServer;
        this._httpServer = undefined;
        await new Promise<void>((resolve, reject) => {
            server.close(err => (err ? reject(err) : resolve()));
        });
    }
}
