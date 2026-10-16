import httpProxy from "http-proxy";
import logger from "./logger.js";

/**
 * Creates and configures an HTTP proxy instance.
 * @returns The configured HTTP proxy instance.
 */
export default function createProxy(): httpProxy {
    const proxy = httpProxy.createProxy();

    // Ensure `X-Forwarded-*` headers are set.
    proxy.on("proxyReq", (proxyReq, req) => {
        proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress ?? "");
        proxyReq.setHeader("X-Forwarded-Proto", "https");
        proxyReq.setHeader("X-Forwarded-Host", req.headers.host ?? "");
    });

    // Handle proxy errors.
    proxy.on("error", (err, _, res) => {
        logger.error(`Proxy error: ${err.message}`);

        if ("writeHead" in res) {
            res.writeHead(502, {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "Content-Type": "text/plain",
            });
            res.end("502 Bad Gateway");
        } else {
            res.destroy();
        }
    });

    return proxy;
}
