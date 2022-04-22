/** Root folder with its path and nginx server (target). */
export type RootFolder = {
	/**
	 * Absolute path to root folder.
	 * Also serves as its name, if `alias` parameter was omitted.
	 */
	path: string;
	/**
	 * Name to be used as title instead of `path`
	 * @default null
	 */
	alias?: string;
	/**
	 * Port which nginx server (with same root folder) is listening to.
	 */
	nginx_port: number;
	/**
	 * Use https to connect to nginx server (with same root folder).
	 * @default false
	 */
	nginx_https?: boolean;
	/**
	 * Set if nginx target server's hostname differs from Pretty Index server's `host`.
	 * @default null
	 */
	nginx_hostname?: string;
};

/** Use https serving instead of http. If not set, http applies. */
export type HTTPSOptions = {
	/** Path to certificate file */
	cert: string;
	/** Path to key file */
	key: string;
};

/**
 * Standalone server just for downloading folders as ZIP.
 * Adds option in the files list next to each folder to download it as ZIP.
 * @see https://github.com/serguun42/zip-downloader
 */
export type ZipServer = {
	/**
	 * Port which zip downloader server is listening to.
	 */
	port: number;
	/**
	 * Use https to connect to zip downloader server.
	 * @default false
	 */
	https?: boolean;
	/**
	 * Set if zip downloader server's hostname differs from Pretty Index server's `host`.
	 * @default null
	 */
	hostname?: string;
};

export interface PrettyIndexConfig {
	/** Root folders with their paths and nginx servers (targets). */
	root_folders: RootFolder[];
	/**
	 * Pretty Index server's port.
	 * @default 80
	 */
	port?: number;
	/**
	 * Pretty Index server's host.
	 * @default "0.0.0.0"
	 */
	host?: string;
	/**
	 * Use https serving instead of http. If not set, http applies.
	 * @default null
	 */
	https?: HTTPSOptions;
	/**
	 * Standalone server just for downloading folders as ZIP, optional as well.
	 * @default null
	 */
	zip_server?: ZipServer;
}
