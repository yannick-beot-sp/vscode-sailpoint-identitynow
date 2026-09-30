import * as http from "node:http";
import { FrontMcpServer, HttpMethod, ServerRequest, ServerRequestHandler, ServerResponse } from "@frontmcp/sdk";

/**
 * Stoppable HTTP adapter for FrontMCP, built on node:http.
 *
 * FrontMCP handlers use a small slice of the Express request/response API:
 * req.body, req.path, and res.status().json() / res.end(). This adapter
 * provides that slice without pulling Express, body-parser, or iconv-lite
 * into the extension bundle.
 *
 * Passed to FrontMcpInstance.createForGraph() via http.hostFactory.
 * FrontMCP calls registerMiddleware / registerRoute / prepare during
 * initialisation, then start() when the listener should open.
 */
const JSON_BODY_LIMIT = 4 * 1024 * 1024;

interface RouteLayer {
    kind: "route";
    method: string;
    path: string;
    handler: ServerRequestHandler;
}

interface MiddlewareLayer {
    kind: "middleware";
    path: string;
    handler: ServerRequestHandler;
}

type Layer = RouteLayer | MiddlewareLayer;

export class StoppableHttpAdapter extends FrontMcpServer {
    private readonly _layers: Layer[] = [];
    private _httpServer?: http.Server;

    registerRoute(method: HttpMethod, path: string, handler: ServerRequestHandler): void {
        this._layers.push({
            kind: "route",
            method: method.toUpperCase(),
            path: normalizePath(path),
            handler: this.enhancedHandler(handler),
        });
    }

    registerMiddleware(entryPath: string, handler: ServerRequestHandler): void {
        this._layers.push({
            kind: "middleware",
            path: normalizePath(entryPath),
            handler: this.enhancedHandler(handler),
        });
    }

    enhancedHandler(handler: ServerRequestHandler): ServerRequestHandler {
        return (req, res, next) => handler(req, res, next);
    }

    prepare(): void {
        // Routes are stored as they are registered. prepare() exists because
        // FrontMCP calls it before start(); there is no separate mount step.
    }

    getHandler(): http.RequestListener {
        this.prepare();
        return (req, res) => {
            void this._handle(req, res);
        };
    }

    async start(portOrSocketPath: number | string = 0, bindAddress?: string): Promise<void> {
        this.prepare();
        const server = http.createServer(this.getHandler());
        server.requestTimeout = 0;
        server.headersTimeout = 0;
        server.keepAliveTimeout = 75_000;
        this._httpServer = server;

        await new Promise<void>((resolve, reject) => {
            server.on("error", reject);
            const onListening = () => resolve();
            if (typeof portOrSocketPath === "string") {
                server.listen(portOrSocketPath, onListening);
            } else if (bindAddress) {
                server.listen(portOrSocketPath, bindAddress, onListening);
            } else {
                server.listen(portOrSocketPath, onListening);
            }
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

    private async _handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const request = decorateRequest(req);
        const response = decorateResponse(res);
        try {
            await readBody(req);
        } catch (error) {
            const statusCode = statusOf(error);
            if (!res.headersSent) {
                res.statusCode = statusCode;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Bad Request" }));
            }
            return;
        }
        if (!res.headersSent) {
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        dispatch(this._layers, request, response);
    }
}

function dispatch(layers: Layer[], req: ServerRequest, res: ServerResponse): void {
    const nodeRes = res as unknown as http.ServerResponse;
    const fail = (): void => {
        if (!nodeRes.headersSent) {
            nodeRes.statusCode = 500;
            nodeRes.setHeader("Content-Type", "text/plain; charset=utf-8");
            nodeRes.end("Internal Server Error");
        }
    };
    const step = (index: number): void => {
        if (nodeRes.writableEnded) { return; }
        if (index >= layers.length) {
            if (!nodeRes.headersSent) {
                nodeRes.statusCode = 404;
                nodeRes.end();
            }
            return;
        }
        const layer = layers[index];
        if (!matches(layer, req)) {
            step(index + 1);
            return;
        }
        let continued = false;
        const next = (): void => {
            if (continued) { return; }
            continued = true;
            step(index + 1);
        };
        try {
            const result = layer.handler(req, res, next);
            if (isPromise(result)) {
                result.catch(() => fail());
            }
        } catch {
            fail();
        }
    };
    step(0);
}

function matches(layer: Layer, req: ServerRequest): boolean {
    const pathname = req.path || "/";
    if (layer.kind === "route") {
        if (layer.method !== "ALL" && layer.method !== (req.method ?? "GET").toUpperCase()) {
            return false;
        }
        return pathname === layer.path;
    }
    if (layer.path === "/" || layer.path === "") { return true; }
    return pathname === layer.path || pathname.startsWith(`${layer.path}/`);
}

function decorateRequest(req: http.IncomingMessage): ServerRequest {
    const rawUrl = req.url ?? "/";
    let pathname = rawUrl.split("?")[0] || "/";
    let query: Record<string, string> = {};
    try {
        const parsed = new URL(rawUrl, "http://localhost");
        pathname = parsed.pathname || "/";
        query = Object.fromEntries(parsed.searchParams);
    } catch {
        // Keep the path split from req.url.
    }
    const decorated = req as unknown as ServerRequest & { originalUrl: string; protocol: string };
    decorated.path = pathname;
    decorated.originalUrl = rawUrl;
    decorated.protocol = "http";
    decorated.query = query;
    return decorated;
}

function decorateResponse(res: http.ServerResponse): ServerResponse {
    const expressLike = res as http.ServerResponse & {
        status: (code: number) => ServerResponse;
        json: (body: unknown) => void;
        send: (payload: unknown) => void;
        redirect: (statusOrUrl: number | string, url?: string) => void;
    };
    expressLike.status = (code: number) => {
        res.statusCode = code;
        return expressLike as unknown as ServerResponse;
    };
    expressLike.json = (body: unknown) => {
        if (!res.getHeader("Content-Type")) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        res.end(JSON.stringify(body));
    };
    expressLike.send = (payload: unknown) => {
        if (payload !== null && typeof payload === "object" && !Buffer.isBuffer(payload)) {
            expressLike.json(payload);
            return;
        }
        res.end(payload === undefined ? undefined : String(payload));
    };
    expressLike.redirect = (statusOrUrl: number | string, url?: string) => {
        const location = typeof statusOrUrl === "string" ? statusOrUrl : (url ?? "/");
        res.statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
        res.setHeader("Location", location);
        res.end();
    };
    return expressLike as unknown as ServerResponse;
}

function readBody(req: http.IncomingMessage): Promise<void> {
    const type = String(req.headers["content-type"] ?? "").toLowerCase();
    const isJson = type.includes("application/json");
    const isForm = type.includes("application/x-www-form-urlencoded");
    if (!isJson && !isForm) {
        (req as http.IncomingMessage & { body?: unknown }).body = undefined;
        return Promise.resolve();
    }
    const charset = /charset=("?)([^";]+)\1/i.exec(type)?.[2]?.trim().toLowerCase();
    if (charset && charset !== "utf-8" && charset !== "utf8") {
        return Promise.reject(httpError(415, `Unsupported charset: ${charset}`));
    }
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > JSON_BODY_LIMIT) {
                reject(httpError(413, "Payload too large"));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            try {
                const target = req as http.IncomingMessage & { body?: unknown };
                if (isForm) {
                    target.body = Object.fromEntries(new URLSearchParams(raw));
                } else if (raw.length === 0) {
                    target.body = {};
                } else {
                    target.body = JSON.parse(raw);
                }
                resolve();
            } catch {
                reject(httpError(400, "Invalid JSON"));
            }
        });
        req.on("error", reject);
    });
}

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
    return Object.assign(new Error(message), { statusCode });
}

function statusOf(error: unknown): number {
    if (typeof error === "object" && error !== null && "statusCode" in error) {
        const statusCode = (error as { statusCode?: unknown }).statusCode;
        if (typeof statusCode === "number") { return statusCode; }
    }
    return 400;
}

function normalizePath(path: string): string {
    if (path === "" || path === "/") { return path === "" ? "" : "/"; }
    const withSlash = path.startsWith("/") ? path : `/${path}`;
    return withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === "object" && value !== null && typeof (value as Promise<unknown>).then === "function";
}
