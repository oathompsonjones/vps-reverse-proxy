import config from "../config.json" with { type: "json" };
import fs from "fs/promises";
import logger from "./logger.js";

type SSL = {
    cert: Buffer;
    key: Buffer;
};

/**
 * Loads SSL certificates from the configured path.
 * @returns An object containing the SSL certificate and key as Buffers.
 */
export default async function loadSSL(): Promise<SSL> {
    let ssl: SSL;

    try {
        ssl = {
            cert: await fs.readFile(`${config.sslPath}/fullchain.pem`),
            key: await fs.readFile(`${config.sslPath}/privkey.pem`),
        };
        logger.info("SSL certificates loaded successfully.");
    } catch (err) {
        logger.error(`Failed to read SSL certificates: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    return ssl;
}
