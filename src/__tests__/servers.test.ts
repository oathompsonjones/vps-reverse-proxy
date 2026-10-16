import type { IncomingMessage, ServerResponse } from "http";
import { afterEach, describe, expect, test, vi } from "vitest";
import createHttpServer from "../http.js";
import createHttpsServer from "../https.js";
import createProxy from "../proxy.js";
import type httpProxy from "http-proxy";
import logger from "../logger.js";

/**
 * Creates a mock HTTP response object for testing purposes.
 * @returns An object containing the mock response and its methods.
 */
function createResponse(): {
    response: ServerResponse;
    writeHead: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
} {
    const writeHead = vi.fn();
    const end = vi.fn();

    return {
        end,
        response: { end, writeHead } as unknown as ServerResponse,
        writeHead,
    };
}

describe("HTTP server", () => {
    test("redirects requests to HTTPS and preserves the URL", () => {
        const server = createHttpServer();
        const { response, writeHead, end } = createResponse();

        server.emit(
            "request",
            { headers: { host: "example.com" }, url: "/path?query=value" } as IncomingMessage,
            response,
        );

        expect(writeHead).toHaveBeenCalledWith(301, { Location: "https://example.com/path?query=value" });
        expect(end).toHaveBeenCalledWith("<h1>301 Moved Permanently</h1>");
    });

    test("returns 400 when the Host header is missing", () => {
        const server = createHttpServer();
        const { response, writeHead, end } = createResponse();

        server.emit("request", { headers: {}, url: "/" } as IncomingMessage, response);

        expect(writeHead).toHaveBeenCalledWith(400, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "text/plain",
        });
        expect(end).toHaveBeenCalledWith("Bad Request");
    });
});

describe("HTTPS server", () => {
    const ssl: Parameters<typeof createHttpsServer>[1] = {};

    test.each([
        ["oathompsonjones.co.uk", "http://localhost:3000"],
        ["www.oathompsonjones.co.uk", "http://localhost:3000"],
        ["haskell-playground.co.uk", "http://localhost:3001"],
    ])("proxies requests for %s to the configured backend", (host, target) => {
        const web = vi.fn();
        const proxy = { web } as unknown as httpProxy;
        const server = createHttpsServer(proxy, ssl);
        const request = { headers: { host } } as IncomingMessage;
        const response = {} as ServerResponse;

        server.emit("request", request, response);

        expect(web).toHaveBeenCalledWith(request, response, { target });
    });

    test.each([undefined, "unknown.example.com"])("returns 421 for host %s", (host) => {
        const web = vi.fn();
        const proxy = { web } as unknown as httpProxy;
        const server = createHttpsServer(proxy, ssl);
        const { response, writeHead, end } = createResponse();

        server.emit("request", { headers: { host } } as IncomingMessage, response);

        expect(web).not.toHaveBeenCalled();
        expect(writeHead).toHaveBeenCalledWith(421, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "text/plain",
        });
        expect(end).toHaveBeenCalledWith("421 Misdirected Request");
    });
});

describe("proxy errors", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("returns 502 when the backend request fails", () => {
        const errorLog = vi.spyOn(logger, "error").mockImplementation(() => undefined);
        const proxy = createProxy();
        const { response, writeHead, end } = createResponse();

        proxy.emit("error", new Error("backend unavailable"), {}, response);

        expect(errorLog).toHaveBeenCalledWith("Proxy error: backend unavailable");
        expect(writeHead).toHaveBeenCalledWith(502, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "text/plain",
        });
        expect(end).toHaveBeenCalledWith("502 Bad Gateway");
    });

    test("destroys a socket when the proxy error has no HTTP response", () => {
        vi.spyOn(logger, "error").mockImplementation(() => undefined);
        const proxy = createProxy();
        const destroy = vi.fn();

        proxy.emit("error", new Error("socket closed"), {}, { destroy });

        expect(destroy).toHaveBeenCalledOnce();
    });
});
