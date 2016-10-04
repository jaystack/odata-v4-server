import { Token } from 'odata-v4-parser/lib/lexer'
import { Visitor } from 'odata-v4-mongodb/lib/visitor'
import { Parser } from 'odata-v4-parser/lib/parser'

export namespace infrastructure {
    export function createAst(query:string):Token{
        const p = new Parser();
        const ast = p.query(query);
        return ast;
    }
}

export function createQuery(odataUri:string, config?:any){
    return new ExpandVisitor().Visit(infrastructure.createAst(odataUri));
}

export class ExpandVisitor extends Visitor {
    includes:any[]
    navigationProperty:string

    constructor() {
        super()
        this.includes = [];
    }

    protected VisitExpand(node: Token, context: any) {
        var innerContexts:any = {};
        node.value.items.forEach((item) => {
            var expandPath = item.value.path.raw;
            var innerVisitor = this.includes.filter(v => v.navigationProperty === expandPath)[0];
            if (!innerVisitor){
                innerVisitor = new ExpandVisitor();

                innerContexts[expandPath] = {
                    query: {},
                    sort: {},
                    projection: {},
                    options: {}
                };

                this.includes.push(innerVisitor);
            }

            let innerContext:any = innerContexts[expandPath] || {};
            innerVisitor.Visit(item, innerContext);

            innerVisitor.query = innerContext.query || innerVisitor.query || {};
            innerVisitor.sort = innerContext.sort || innerVisitor.sort;
            innerVisitor.projection = innerContext.projection || innerVisitor.projection;
        });
    }

    protected VisitExpandItem(node: Token, context: any) {
        this.Visit(node.value.path, context);
        node.value.options && node.value.options.forEach((item) => this.Visit(item, context));
    }

    protected VisitExpandPath(node: Token, context: any) {
        this.navigationProperty = node.raw;
    }
}