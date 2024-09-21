import { readFileSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import https from "node:https";
import { ParsePath, SafeDecode, SafeEscape, SafeParseURL } from "./util/urls.js";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { readdir, stat } from "node:fs/promises";

const gzipPromise = promisify(gzip);


/** @type {Partial<import("./types/prettyindexconfig").RootFolder>} */
const ROOT_FOLDER_DEFAULT = JSON.parse(readFileSync("./config/defaults/rootfolder.json").toString());
/** @type {import("./types/prettyindexconfig").RootFolder} */
const ROOT_FOLDER_WITH_CHOICE = {
	path: "",
	alias: "Choose root",
	nginx_port: 80
};

/** @type {Partial<import("./types/prettyindexconfig").ZipServer>} */
const ZIP_SERVER_DEFAULT = JSON.parse(readFileSync("./config/defaults/zipserver.json").toString());

/** @type {Partial<import("./types/prettyindexconfig").PrettyIndexConfig>} */
const CONFIG_DEFAULT = JSON.parse(readFileSync("./config/defaults/prettyindex.json").toString());
/** @type {import("./types/prettyindexconfig").PrettyIndexConfig} */
const CONFIG_USER = JSON.parse(readFileSync("./config/prettyindex.json").toString());

/** @type {import("./types/prettyindexconfig").PrettyIndexConfig} */
const config = { ...CONFIG_DEFAULT, ...CONFIG_USER };



if (!config.port) throw new Error("Define param <port>");
if (!config.host) throw new Error("Define param <host>");

if (!config.root_folders?.length) throw new Error("Param <root_folders> must contain something");
config.root_folders = config.root_folders.map((folder) => ({ ...ROOT_FOLDER_DEFAULT, ...folder }));

if (config.https) {
	if (typeof config.https.cert !== "string")
		throw new Error("Param <https.cert> must be string. You can skip <https>");
	if (typeof config.https.key !== "string")
		throw new Error("Param <https.key> must be string. You can skip <https>");

	config.https.cert = readFileSync(config.https.cert);
	config.https.key = readFileSync(config.https.key);
}

if (config.zip_server) {
	if (typeof config.zip_server.port !== "number")
		throw new Error("Param <zip_server.port> must be number. You can skip <zip_server>");

	config.zip_server = { ...ZIP_SERVER_DEFAULT, ...config.zip_server };
}


const PAGE_TEMPLATE = readFileSync("./public/template.html").toString();
const FAVICON_BASE64 = readFileSync("./public/favicon.ico").toString("base64");
const STYLES = readFileSync("./public/styles.css").toString();


/**
 * @param {string | string[]} [content]
 * @param {string} [title]
 * @returns {string}
 */
const PreparePage = (content = "", title = "") => PAGE_TEMPLATE
		.replace(/__CONTENT__/, Array.isArray(content) ? [
			`<a class="entry entry--directory" href="" id="up">
				<div class="entry__icon icon icon-up"></div>
				<div class="entry__name">..</div>
				<div class="entry__size"></div>
			</a>
			<script>
				document.getElementById("up")
				.setAttribute(
					"href",
					"/" + location.pathname
						.split("/")
						.filter((part) => !!part)
						.slice(0, -1)
						.join("/")
				);
			</script>
			`
		].concat(content).join("") : content)
		.replace(/__TITLE__/g, title || "Unknown page")
		.replace(/__FAVICON_BASE64__/, FAVICON_BASE64)
		.replace(/__STYLES__/, STYLES);

/**
 * @param {Error} error
 * @returns {string}
 */
const PrepareError = (error) => PreparePage(
	`<div class="error">
		<p>${error}</p>
		<p>
			<a onclick="window.history.back()" href="javascript:window.history.back()">Go back</a>
			<a href="/">Main page</a>
		</p>
	</div>`,
	"Error"
);

/**
 * @param {import("./types/prettyindexconfig").RootFolder} rootFolder
 * @param {string[]} pathParts
 * @param {string} requestedHostname
 * @returns {string}
 */
const LinkForFile = (rootFolder, pathParts, requestedHostname) => new URL(`http${rootFolder.nginx_https ? "s" : ""}://${
	rootFolder.nginx_hostname || requestedHostname
}:${rootFolder.nginx_port}/${pathParts.join("/")}`).href;

/**
 * @param {import("./types/prettyindexconfig").RootFolder} rootFolder
 * @param {string[]} pathParts
 * @param {string} requestedHostname
 * @returns {string}
 */
const LinkForZip = (rootFolder, pathParts, requestedHostname) => {
	if (!config.zip_server) return "";

	return new URL(`http${config.zip_server?.https ? "s" : ""}://${
		config.zip_server?.hostname || requestedHostname
	}:${config.zip_server?.port}/?path=${join(rootFolder.path, ...pathParts)}`).href;
};

/**
 * @param {number} bytes
 * @returns {string}
 */
const HumanReadableSize = (bytes) => {
	if (!bytes) return "";

	const power = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, power)).toFixed(power ? 2 : 0)} ${["B", "kB", "MB", "GB", "TB"][power]}`;
};

/**
 * @param {import("./types/prettyindexconfig").RootFolder} rootFolder
 * @param {string[]} pathParts
 * @param {string} requestedHostname
 * @returns {Promise<string>}
 */
async function BuildPage(rootFolder, pathParts, requestedHostname) {
	if (!rootFolder) return PrepareError(`No such root folder`);

	const title = rootFolder.alias || rootFolder.path;

	if (rootFolder === ROOT_FOLDER_WITH_CHOICE)
		return PreparePage(
			config.root_folders.map((folder) =>
				`<a class="root" href="/${encodeURIComponent(folder.alias || folder.path)}">
					<div class="root__alias">
						<span class="icon icon-root icon--big"></span>
						<span>${folder.alias || folder.path}</span>
					</div>
					<div class="root__path">${folder.alias ? folder.path : ""}</div>
				</a>`
			).join(""),
			title
		);

	const fileOrDirectoryPath = join(rootFolder.path, ...pathParts);

	return stat(fileOrDirectoryPath)
	.then((fileOrDirectoryStats) => {
		if (fileOrDirectoryStats.isFile())
			return PreparePage(`<script>window.location.assign("${
				LinkForFile(rootFolder, pathParts, requestedHostname)
			}")</script>`, title);

		if (fileOrDirectoryStats.isDirectory())
			return readdir(fileOrDirectoryPath)
			.then((list) => Promise.all(list.map((filename) =>
				stat(join(fileOrDirectoryPath, filename))
				.then((fileStats) => ({
					filename,
					link: (
						fileStats.isDirectory() ?
							`/${
								encodeURIComponent(rootFolder.alias || rootFolder.path)
							}/${[...pathParts, filename].join("/")}` :
							LinkForFile(rootFolder, [...pathParts, filename], requestedHostname)),
					zip: LinkForZip(rootFolder, [...pathParts, filename], requestedHostname),
					size: HumanReadableSize(fileStats.size || 0),
					isDirectory: fileStats.isDirectory(),
				}))
				.catch(() => Promise.resolve({
					filename,
					link: LinkForFile(rootFolder, [...pathParts, filename], requestedHostname),
					zip: LinkForZip(rootFolder, [...pathParts, filename], requestedHostname),
					size: "",
					isDirectory: false,
				}))
			)))
			.then((list) => PreparePage(
				list
				.sort((prev, next) => {
					if (prev.isDirectory && !next.isDirectory)
						return -1;
					if (!prev.isDirectory && next.isDirectory)
						return 1;
					if (prev.isDirectory && next.isDirectory)
						return prev.filename.localeCompare(next.filename);
					if (!prev.isDirectory && !next.isDirectory)
						return prev.filename.localeCompare(next.filename);
				})
				.map((fileStats) =>
					`<a
						class="entry entry--${
							fileStats.isDirectory ? "directory" : "file"
						} ${fileStats.isDirectory && config.zip_server ? "entry--with-extra-link" : ""}"
						href="${fileStats.link}"
					>
						<div class="entry__icon icon icon-${
							fileStats.isDirectory ? "directory" : "file"
						}"></div>
						<div class="entry__name">${fileStats.filename}</div>
						<div class="entry__size">${fileStats.size}</div>
					</a>
					${fileStats.isDirectory && config.zip_server ?
					`<a
						class="entry-extra-link entry--directory"
						href="${fileStats.zip}"
						download="${fileStats.filename}"
						title="${fileStats.filename}"
					>
						<div class="entry-extra-link__icon icon icon-zip"></div>
						<div class="entry-extra-link__text">Zip</div>
					</a>` : ""}`
				), fileOrDirectoryPath
			));

		return PrepareError("Neither file nor directory");
	});
};

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @returns {void}
 */
async function ServerHandle(req, res) {
	const pathParts = ParsePath(SafeParseURL(SafeEscape(req.url)).pathname)
		.map((part) => SafeDecode(part));

	const rootFolder = (!pathParts[0] ?
		ROOT_FOLDER_WITH_CHOICE :
		config.root_folders.find((folder) => folder.path === pathParts[0]) ||
		config.root_folders.find((folder) => folder.alias === pathParts[0])
	);


	/** @type {string} */
	const requestedHostname = (
		req.headers["origin"] ? 
		SafeParseURL(req.headers["origin"]).hostname :
		req.headers["host"] ?
		req.headers["host"] :
		""
	);


	const builtPage = await BuildPage(rootFolder, pathParts.slice(1), requestedHostname)
	.catch((e) => {
		if (process.env.NODE_ENV === "development") console.warn(e);
		return PrepareError(e);
	}) || PrepareError("No index ready");


	const acceptEncoding = req.headers["accept-encoding"] || "";
	res.setHeader("Content-Type", "text/html; charset=UTF-8");
	res.setHeader("Cache-Control", "no-cache, no-store");


	if (acceptEncoding.match(/\bgzip\b/i) && builtPage?.length > 200)
		gzipPromise(builtPage)
		.then((compressed) => {
			res.setHeader("Content-Encoding", "gzip");
			res.end(compressed);
		})
		.catch(() => res.end(builtPage));
	else
		res.end(builtPage);
};


const server = config.https ? https.createServer(config.https, ServerHandle) : http.createServer(ServerHandle);
server.listen(config.port, config.host);
