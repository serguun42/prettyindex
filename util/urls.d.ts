export function SafeDecode(string: string): string;
export function SafeEscape(string: string): string;
export function ParsePath(path: string | string[]): string[];
export function ParseQuery(query: string): {
    [queryName: string]: string | true;
};
export function SafeParseURL(urlAsString: string): URL;
declare namespace _default {
    export { SafeDecode };
    export { SafeEscape };
    export { SafeParseURL };
    export { ParsePath };
    export { ParseQuery };
}
export default _default;
