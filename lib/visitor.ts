import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import { Literal } from "odata-v4-literal";

export interface KeyValuePair{
    name:string
    value:any,
    raw?:string
}

export interface NavigationPart{
    name:string
    type:TokenType
    key?:KeyValuePair[]
    params?:any
}

export class ResourcePathVisitor{
    navigation:NavigationPart[]
    alias:any
    path:string
    singleton:string
    inlinecount:boolean
    ast:Token

    constructor(){
        this.navigation = [];
        this.path = "";
        this.alias = {};
    }

    Visit(node:Token, context?:any):ResourcePathVisitor{
        this.ast = this.ast || node;
        context = context || {};

        if (node){
            let visitor;
            switch (node.type){
                case "PrimitiveFunctionImportCall":
                case "PrimitiveCollectionFunctionImportCall":
                case "ComplexFunctionImportCall":
                case "ComplexCollectionFunctionImportCall":
                case "EntityFunctionImportCall":
                case "EntityCollectionFunctionImportCall":
                    visitor = this.VisitFunctionImportCall;
                    break;
                case "BoundPrimitiveFunctionCall":
                case "BoundPrimitiveCollectionFunctionCall":
                case "BoundComplexFunctionCall":
                case "BoundComplexCollectionFunctionCall":
                case "BoundEntityFunctionCall":
                case "BoundEntityCollectionFunctionCall":
                    visitor = this.VisitBoundFunctionCall;
                    break;
                case "PrimitiveProperty":
                case "PrimitiveCollectionProperty":
                case "ComplexProperty":
                case "ComplexCollectionProperty":
                case "EntityNavigationProperty":
                case "EntityCollectionNavigationProperty":
                    visitor = this.VisitProperty;
                    break;
                default:
                    visitor = this[`Visit${node.type}`];
            }
            
            if (visitor) visitor.call(this, node, context);
        }

        return this;
    }

    protected VisitODataUri(node:Token, context:any){
        this.Visit(node.value.query, context);
        this.Visit(node.value.resource, context);
    }

    protected VisitQueryOptions(node:Token, context:any){
        node.value.options.forEach((option) => this.Visit(option, context));
    }

    protected VisitInlineCount(node:Token, context:any){
        this.inlinecount = Literal.convert(node.value.value, node.value.raw);
    }
    
    protected VisitAliasAndValue(node:Token, context:any){
        this.Visit(node.value.value.value, context);
        this.alias[node.value.alias.value.name] = context.literal;
        delete context.literal;
    }
    
    protected VisitResourcePath(node:Token, context:any){
        this.Visit(node.value.resource, context);
        this.Visit(node.value.navigation, context);
    }

    protected VisitSingletonEntity(node:Token, context:any){
        this.singleton = node.raw;
    }

    protected VisitEntitySetName(node:Token, context:any){
        this.navigation.push({ name: node.value.name, type: node.type });
        this.path += "/" + node.value.name;
    }

    protected VisitCountExpression(node:Token, context:any){
        this.navigation.push({
            name: "$count",
            type: TokenType.BoundPrimitiveFunctionCall,
            params: {}
        });
        this.path += "/$count";
    };

    protected VisitCollectionNavigation(node:Token, context:any){
        this.Visit(node.value.path, context);
    }

    protected VisitCollectionNavigationPath(node:Token, context:any){
        this.Visit(node.value.predicate, context);
        this.Visit(node.value.navigation, context);
    }

    protected VisitSimpleKey(node:Token, context:any){
        let lastNavigationPart = this.navigation[this.navigation.length - 1];
        lastNavigationPart.key = [{
            name: node.value.key,
            value: Literal.convert(node.value.value.value, node.value.value.raw),
            raw: node.value.value.raw
        }];
        this.path += "(\\(([^,]+)\\))";
    }

    protected VisitCompoundKey(node:Token, context:any){
        this.path += "(\\(";
        let lastNavigationPart = this.navigation[this.navigation.length - 1];
        lastNavigationPart.key = node.value.map((pair, i) => {
            this.path += i == node.value.length -1 ? "([^,]+)" : "([^,]+,)";
            return {
                name: pair.value.key.value.name,
                value: Literal.convert(pair.value.value.value, pair.value.value.raw),
                raw: pair.value.value.raw
            };
        });
        this.path += "\\))";
    }

    protected VisitSingleNavigation(node:Token, context:any){
        this.Visit(node.value.path, context);
    }

    protected VisitPropertyPath(node:Token, context:any){
        this.Visit(node.value.path, context);
        this.Visit(node.value.navigation, context);
    }

    protected VisitProperty(node:Token, context:any){
        this.navigation.push({ name: node.value.name, type: node.type });
        this.path += "/" + node.value.name;
    };

    protected VisitValueExpression(node:Token, context:any){
        this.navigation.push({
            name: "$value",
            type: TokenType.BoundPrimitiveFunctionCall,
            params: {}
        });
        this.path += "/$value";
    }

    protected VisitRefExpression(node:Token, context:any){
        this.navigation.push({
            name: "$ref",
            type: TokenType.BoundPrimitiveFunctionCall,
            params: {}
        });
        this.path += "/$ref";
    }

    protected VisitBoundOperation(node:Token, context:any){
        this.Visit(node.value.operation, context);
        this.Visit(node.value.navigation, context);
    }

    protected VisitBoundActionCall(node:Token, context:any){
        let part = {
            type: node.type,
            name: node.raw
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }

    protected VisitBoundFunctionCall(node:Token, context:any){
        let part = {
            type: node.type,
            name: node.value.call.value.namespace + "." + node.value.call.value.name,
            params: {}
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        node.value.params.value.forEach((param, i) => {
            this.Visit(param, context);
            if (i < node.value.params.value.length - 1) this.path += ",";
        });
        this.path += "\\))";
    }
    
    protected VisitFunctionImportCall(node:Token, context:any){
        let part = {
            type: node.type,
            name: node.value.import.value.name,
            params: {}
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        node.value.params.forEach((param) => this.Visit(param, context));
        this.path += "\\))";
    }
    
    protected VisitFunctionParameter(node:Token, context:any){
        this.Visit(node.value.value, context);
        let params = this.navigation[this.navigation.length - 1].params;
        params[node.value.name.value.name] = this.alias[node.value.name.value.name] || context.literal;
        this.path += node.value.name.value.name + "=([^,]+)";
        delete context.literal;
    }

    protected VisitActionImportCall(node:Token, context:any){
        let part = {
            type: node.value.type,
            name: node.value.value.name
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }
    
    protected VisitParameterAlias(node:Token, context:any){
        context.literal = this.alias[node.value.name];
    }
    
    protected VisitLiteral(node:Token, context:any){
        context.literal = Literal.convert(node.value, node.raw);
    }
}