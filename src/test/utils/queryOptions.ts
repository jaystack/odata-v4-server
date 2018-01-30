import { Token, TokenType } from "odata-v4-parser/lib/lexer";

export const processQueries = async (_query: Token) => {
    const query = await clone(_query);
    return new Promise((resolve) => {
        const options = { skipNumber : 0, topNumber : 0, orderby: { fields: [], order: "" } }
        if (query && query.value && query.value.options) {
            for (let token of query.value.options) {
                if (token.type === "Skip") options.skipNumber = token.value.raw;
                if (token.type === "Top") options.topNumber = token.value.raw;
                if (token.type === "OrderBy") {
                    const raw = decodeURIComponent(token.raw).replace(/'/g, '').replace(/\"/g, "")
                    options.orderby.fields = raw.split("=")[1].split(" ")[0].split(",");
                    options.orderby.order = raw.split("=")[1].split(" ")[1] || "asc";
                }
            }
            return resolve(options);
        }
        return resolve(options);
    })
}

export const doOrderby = async (_response: any[], _options: any) => {
    const response = await clone(_response);
    const options = await clone(_options);
    return new Promise((resolve) => {
        if (options.orderby && !!options.orderby.fields && !!options.orderby.order) {
            const sorted = response.sort((a, b) => {
                if (a[`${options.orderby.fields[0]}`] > b[`${options.orderby.fields[0]}`]) {
                    return options.orderby.order === "asc" ? 1 : -1;
                }
                if (a[`${options.orderby.fields[0]}`] < b[`${options.orderby.fields[0]}`]) {
                    return options.orderby.order === "asc" ? -1 : 1;
                }
                return 0;
            })
            return resolve(sorted);
        }
        return resolve(response);
    })
}

export const doSkip = async (_response: any[], _options: any) => {
    const response = await clone(_response);
    const options = await clone(_options);
    return new Promise((resolve) => {
        if (options.skipNumber > 0) return resolve(response.filter((c, idx) => idx >= options.skipNumber));
        return resolve(response);
    })
}

export const doTop = async (_response: any[], _options: any) => {
    const response = await clone(_response);
    const options = await clone(_options);
    return new Promise((resolve) => {
        if (options.topNumber > 0) return resolve(response.filter((c, idx) => idx < options.topNumber));
        return resolve(response);
    })
}

export const clone = (object: any) => {
    return JSON.parse(JSON.stringify(object));
}