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
	 * Port on which nginx server with same root folder.
	 */
	nginx_port: number;
	/**
	 * Use https to connect to nginx server with same root folder.
	 * @default false
	 */
	nginx_https?: boolean;
	/**
	 * Set if nginx target server's hostname differs from Pretty Index server's `host`.
	 * @default null
	 */
	nginx_hostname?: string;
};

export type HTTPSOptions = {
	/** Path to certificate file */
	cert: string;
	/** Path to key file */
	key: string;
};

export interface PrettyIndexConfig {
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
}
