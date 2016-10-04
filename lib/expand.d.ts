import { Token } from 'odata-v4-parser/lib/lexer';
import { Visitor } from 'odata-v4-mongodb/lib/visitor';
export declare namespace infrastructure {
    function createAst(query: string): Token;
}
export declare function createQuery(odataUri: string, config?: any): ExpandVisitor;
export declare class ExpandVisitor extends Visitor {
    includes: any[];
    navigationProperty: string;
    constructor();
    protected VisitExpand(node: Token, context: any): void;
    protected VisitExpandItem(node: Token, context: any): void;
    protected VisitExpandPath(node: Token, context: any): void;
}
