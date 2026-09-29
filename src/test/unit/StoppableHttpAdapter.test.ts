import * as assert from "assert";
import * as http from "node:http";
import { describe, it, suite } from "mocha";
import { StoppableHttpAdapter } from "../../mcp/StoppableHttpAdapter.js";

async function listen(adapter: StoppableHttpAdapter): Promise<number> {
	await adapter.start(0);
	const address = (adapter as unknown as { _httpServer: http.Server })._httpServer.address();
	assert.ok(address && typeof address === "object");
	return address.port;
}

function request(port: number, method: string, path: string, body?: string, contentType?: string): Promise<{ status: number; body: string }> {
	return new Promise((resolve, reject) => {
		const req = http.request({ port, method, path }, (res) => {
			const chunks: Buffer[] = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () => resolve({
				status: res.statusCode ?? 0,
				body: Buffer.concat(chunks).toString("utf8"),
			}));
		});
		req.on("error", reject);
		if (contentType) { req.setHeader("Content-Type", contentType); }
		if (body !== undefined) { req.end(body); } else { req.end(); }
	});
}

suite("StoppableHttpAdapter Test Suite", () => {
	describe("routing", () => {
		it("serves a route with status().json() and parses a JSON body", async () => {
			const adapter = new StoppableHttpAdapter();
			adapter.registerRoute("POST", "/mcp", (req, res) => {
				const request = req as { path?: string; body?: unknown };
				res.status(201).json({ path: request.path, body: request.body });
			});
			const port = await listen(adapter);
			try {
				const response = await request(port, "POST", "/mcp?x=1", JSON.stringify({ method: "initialize" }), "application/json");
				assert.strictEqual(response.status, 201);
				assert.deepStrictEqual(JSON.parse(response.body), {
					path: "/mcp",
					body: { method: "initialize" },
				});
			} finally {
				await adapter.stop();
			}
		});

		it("runs prefix middleware before a later route when next() is called", async () => {
			const adapter = new StoppableHttpAdapter();
			const seen: string[] = [];
			adapter.registerMiddleware("/mcp", (_req, _res, next) => {
				seen.push("middleware");
				next();
			});
			adapter.registerRoute("GET", "/mcp", (_req, res) => {
				seen.push("route");
				res.status(200).json({ ok: true });
			});
			const port = await listen(adapter);
			try {
				const response = await request(port, "GET", "/mcp");
				assert.strictEqual(response.status, 200);
				assert.deepStrictEqual(seen, ["middleware", "route"]);
			} finally {
				await adapter.stop();
			}
		});

		it("does not fall through when middleware handles the request", async () => {
			const adapter = new StoppableHttpAdapter();
			adapter.registerMiddleware("/", (_req, res, next) => {
				const path = (_req as { path?: string }).path;
				if (path === "/health") {
					next();
					return;
				}
				res.status(204).end();
			});
			adapter.registerRoute("GET", "/health", (_req, res) => {
				res.status(200).json({ status: "ok" });
			});
			const port = await listen(adapter);
			try {
				const health = await request(port, "GET", "/health");
				assert.strictEqual(health.status, 200);
				assert.deepStrictEqual(JSON.parse(health.body), { status: "ok" });
				const other = await request(port, "POST", "/mcp");
				assert.strictEqual(other.status, 204);
			} finally {
				await adapter.stop();
			}
		});

		it("rejects a non-utf8 JSON charset", async () => {
			const adapter = new StoppableHttpAdapter();
			adapter.registerRoute("POST", "/mcp", (_req, res) => {
				res.status(200).end();
			});
			const port = await listen(adapter);
			try {
				const response = await request(port, "POST", "/mcp", "{}", "application/json; charset=iso-8859-1");
				assert.strictEqual(response.status, 415);
			} finally {
				await adapter.stop();
			}
		});
	});
});
