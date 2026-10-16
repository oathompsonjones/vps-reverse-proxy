import httpProxy from "http-proxy";
import logger from "./logger.js";

/* eslint-disable @typescript-eslint/naming-convention */
const securityHeaders: Record<string, string> = {
    // A deliberately conservative CSP; script/style sources are left to each site as they vary.
    "content-security-policy": "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
};
/* eslint-enable @typescript-eslint/naming-convention */

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

    // Add security headers unless the upstream app already sets them.
    proxy.on("proxyRes", (proxyRes) => {
        for (const [name, value] of Object.entries(securityHeaders))
            proxyRes.headers[name] ??= value;
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
