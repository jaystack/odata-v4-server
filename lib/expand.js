"use strict";
const visitor_1 = require('odata-v4-mongodb/lib/visitor');
const parser_1 = require('odata-v4-parser/lib/parser');
var infrastructure;
(function (infrastructure) {
    function createAst(query) {
        const p = new parser_1.Parser();
        const ast = p.query(query);
        return ast;
    }
    infrastructure.createAst = createAst;
})(infrastructure = exports.infrastructure || (exports.infrastructure = {}));
function createQuery(odataUri, config) {
    return new ExpandVisitor().Visit(infrastructure.createAst(odataUri));
}
exports.createQuery = createQuery;
class ExpandVisitor extends visitor_1.Visitor {
    constructor() {
        super();
        this.includes = [];
    }
    VisitExpand(node, context) {
        var innerContexts = {};
        node.value.items.forEach((item) => {
            var expandPath = item.value.path.raw;
            var innerVisitor = this.includes.filter(v => v.navigationProperty === expandPath)[0];
            if (!innerVisitor) {
                innerVisitor = new ExpandVisitor();
                innerContexts[expandPath] = {
                    query: {},
                    sort: {},
                    projection: {},
                    options: {}
                };
                this.includes.push(innerVisitor);
            }
            let innerContext = innerContexts[expandPath] || {};
            innerVisitor.Visit(item, innerContext);
            innerVisitor.query = innerContext.query || innerVisitor.query || {};
            innerVisitor.sort = innerContext.sort || innerVisitor.sort;
            innerVisitor.projection = innerContext.projection || innerVisitor.projection;
        });
    }
    VisitExpandItem(node, context) {
        this.Visit(node.value.path, context);
        node.value.options && node.value.options.forEach((item) => this.Visit(item, context));
    }
    VisitExpandPath(node, context) {
        this.navigationProperty = node.raw;
    }
}
exports.ExpandVisitor = ExpandVisitor;
//# sourceMappingURL=expand.js.map