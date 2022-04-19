/**
 * @param {string} string
 * @returns {string}
 */
export const SafeDecode = (string) => {
	if (typeof string !== "string") return string;

	try {
		const decoded = decodeURIComponent(string);
		return SafeEscape(decoded);
	} catch (e) {
		return SafeEscape(string);
	}
};

/**
 * @param {string} string
 * @returns {string}
 */
export const SafeEscape = (string) => {
	if (typeof string !== "string") return string;

	return string
		.replace(/(\/+)/gi, "/")
		.replace(/\.\.\%2F/gi, "")
		.replace(/\.\.\//g, "");
};

/**
 * @param {string | string[]} path
 * @returns {string[]}
 */
export const ParsePath = (path) => {
	if (path instanceof Array) {
		if (path.every(part => typeof part == "string"))
			return [].concat(...path.map((part) => part.split("/"))).filter(part => !!part);
		else
			return path;
	} else if (typeof path == "string")
		return path.replace().split("/").filter(part => !!part);
	else
		return path;
};

/**
 * @param {string} query
 * @returns {{[queryName: string]: string | true}}
 */
export const ParseQuery = (query) => {
	if (!query) return {};

	const returningList = {};

	query.toString().replace(/^\?/, "").split("&").forEach((queryPair) => {
		try {
			if (queryPair.split("=")[1])
				returningList[queryPair.split("=")[0]] = decodeURIComponent(queryPair.split("=")[1]);
			else
				returningList[queryPair.split("=")[0]] = true;
		} catch (e) {
			returningList[queryPair.split("=")[0]] = (queryPair.split("=")[1] || true);
		}
	});

	return returningList;
};

/**
 * @param {string} urlAsString
 * @returns {URL}
 */
export const SafeParseURL = (urlAsString) => {
	try {
		const url = new URL(urlAsString);
		return url;
	} catch (e) {}

	try {
		const url = new URL(urlAsString, "https://example.com");
		return url;
	} catch (e) {}

	return new URL("https://example.com");
};

export default {
	SafeDecode,
	SafeEscape,
	SafeParseURL,
	ParsePath,
	ParseQuery
}