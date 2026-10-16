import createHttpServer from "./http.js";
import createHttpsServer from "./https.js";
import createProxy from "./proxy.js";
import loadSSL from "./ssl.js";
import logger from "./logger.js";

const proxy = createProxy();
const ssl = await loadSSL();
const httpsServer = createHttpsServer(proxy, ssl);
const httpServer = createHttpServer();

try {
    httpsServer.listen(443, () => logger.info("HTTPS server listening on port 443"));
    httpServer.listen(80, () => logger.info("HTTP server listening on port 80"));
} catch (err) {
    logger.error(`Server startup error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}
