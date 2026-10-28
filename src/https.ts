import config from "../config.json" with { type: "json" };
import type httpProxy from "http-proxy";
import https from "https";

const sites: Record<string, number> = config.sites;

/**
 * Creates and configures an HTTPS server.
 * @param proxy - The HTTP proxy instance used to forward requests.
 * @param ssl - The SSL configuration options for the HTTPS server.
 * @returns The configured HTTPS server instance.
 */
export default function createHttpsServer(proxy: httpProxy, ssl: https.ServerOptions): https.Server {
    return https.createServer(ssl, (req, res) => {
        const host = req.headers.host?.toLowerCase().replace(/:\d+$/u, "").replace(/^www\./u, "");
        const matchedSite = host === undefined
            ? undefined
            : Object.entries(sites)
                .filter(([domain]) => host === domain || host.endsWith(`.${domain}`))
                .sort(([domainA], [domainB]) => domainB.length - domainA.length)[0];

        if (matchedSite === undefined) {
            res.writeHead(421, {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "Content-Type": "text/plain",
            });
            res.end("421 Misdirected Request");
        } else {
            const [, port] = matchedSite;

            proxy.web(req, res, { target: `http://localhost:${port}` });
        }
    });
}
