import http from "http";

/**
 * Creates and configures an HTTP server that redirects all requests to HTTPS.
 * @returns The configured HTTP server instance.
 */
export default function createHttpServer(): http.Server {
    return http.createServer((req, res) => {
        if (req.headers.host === undefined) {
            res.writeHead(400, {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "Content-Type": "text/plain",
            });

            return res.end("Bad Request");
        }

        res.writeHead(301, { Location: `https://${req.headers.host}${req.url ?? ""}` });

        return res.end("<h1>301 Moved Permanently</h1>");
    });
}
