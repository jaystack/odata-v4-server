import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import { Literal } from "odata-v4-literal";
import * as qs from "qs";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
import * as Edm from "./edm";

export interface KeyValuePair{
    name:string
    value:any,
    raw?:string
    node:Token
}

export interface NavigationPart{
    name:string
    type:TokenType
    key?:KeyValuePair[]
    params?:any
    node:Token
}

export const ODATA_TYPE = "@odata.type";
export const ODATA_TYPENAME = "@odata.type.name";
export class ResourcePathVisitor{
    private serverType: typeof ODataServer
    private entitySets: {
        [entitySet:string]: typeof ODataController
    }

    navigation:NavigationPart[]
    alias:any
    path:string
    singleton:string
    inlinecount:boolean
    id:string
    ast:Token
    navigationProperty:string
    query:any
    includes:{
        [navigationProperty: string]: ResourcePathVisitor
    } = {};

    constructor(serverType: typeof ODataServer, entitySets: { [entitySet:string]: typeof ODataController }){
        this.navigation = [];
        this.path = "";
        this.alias = {};
        this.serverType = serverType;
        this.entitySets = entitySets;
    }

    async Visit(node:Token, context?:any, type?: any):Promise<ResourcePathVisitor>{
        this.ast = this.ast || node;
        if (!type) type = this.serverType;
        context = context || {};

        if (node){
            node[ODATA_TYPE] = type;
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
                case "PrimitiveKeyProperty":
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
            
            if (visitor) await visitor.call(this, node, context, type);
        }

        return this;
    }

    protected async VisitODataUri(node:Token, context:any){
        await this.Visit(node.value.resource, context);
        await this.Visit(node.value.query, context);
        this.navigation.forEach(it => {
            if (it.params){
                for (let prop in it.params){
                    if (typeof it.params[prop] == "function"){
                        it.params[prop] = it.params[prop]();
                    }
                }
            }
        });
    }

    protected async VisitQueryOptions(node:Token, context:any){
        await Promise.all(node.value.options.map(async (option) => await this.Visit(option, Object.assign({}, context))));
    }

    protected async VisitExpand(node: Token, context: any) {
        await Promise.all(node.value.items.map(async (item) => {
            let expandPath = item.value.path.raw;
            let visitor = this.includes[expandPath];
            if (!visitor){
                visitor = new ResourcePathVisitor(node[ODATA_TYPE], this.entitySets);
                this.includes[expandPath] = visitor;
            }
            await visitor.Visit(item, Object.assign({}, context));
        }));
    }

    protected async VisitExpandItem(node: Token, context: any) {
        await this.Visit(node.value.path, context);
        if (node.value.options){
            this.ast = new Token(node);
            this.ast.type = TokenType.QueryOptions;
            this.ast.raw = node.value.options.map(n => n.raw).join("&");
            this.query = qs.parse(this.ast.raw);
            await Promise.all(node.value.options.map(async (item) => await this.Visit(item, Object.assign({}, context))));
        }
    }

    protected VisitExpandPath(node: Token) {
        this.navigationProperty = node.raw;
    }

    protected VisitId(node:Token){
        this.id = node.value;
    }

    protected VisitInlineCount(node:Token){
        this.inlinecount = Literal.convert(node.value.value, node.value.raw);
    }
    
    protected async VisitAliasAndValue(node:Token, context:any){
        await this.Visit(node.value.value.value, context);
        this.alias[node.value.alias.value.name] = context.literal;
        delete context.literal;
    }
    
    protected async VisitResourcePath(node:Token, context:any){
        await this.Visit(node.value.resource, context);
        await this.Visit(node.value.navigation, context, context[ODATA_TYPE]);
        delete context[ODATA_TYPE];
    }

    protected VisitSingletonEntity(node:Token){
        this.singleton = node.raw;
    }

    protected VisitEntitySetName(node:Token, context: any){
        node[ODATA_TYPE] = context[ODATA_TYPE] = this.entitySets[node.value.name].prototype.elementType;
        this.navigation.push({ name: node.value.name, type: node.type, node });
        this.path += "/" + node.value.name;
    }

    protected VisitCountExpression(node:Token){
        this.navigation.push({
            name: "$count",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$count";
    };

    protected async VisitCollectionNavigation(node:Token, context:any, type: any){
        await this.Visit(node.value.path, context, type);
    }

    protected async VisitCollectionNavigationPath(node:Token, context:any, type: any){
        await this.Visit(node.value.predicate, context, type);
        await this.Visit(node.value.navigation, context, type);
    }

    protected async VisitSimpleKey(node:Token, _:any, type:any){
        let lastNavigationPart = this.navigation[this.navigation.length - 1];
        node[ODATA_TYPENAME] = Edm.getTypeName(type, node.value.key, this.serverType.container);
        node[ODATA_TYPE] = Edm.getType(type, node.value.key, this.serverType.container);
        let value = Literal.convert(node.value.value.value, node.value.value.raw);
        let deserializer = Edm.getURLDeserializer(type, node.value.key, node[ODATA_TYPE], this.serverType.container);
        if (typeof deserializer == "function") value = await deserializer(value);
        lastNavigationPart.key = [{
            name: node.value.key,
            value,
            raw: node.value.value.raw,
            node
        }];
        this.path += "(\\(([^,]+)\\))";
    }

    protected async VisitCompoundKey(node:Token, _:any, type:any){
        this.path += "(\\(";
        let lastNavigationPart = this.navigation[this.navigation.length - 1];
        lastNavigationPart.key = await Promise.all<KeyValuePair>(node.value.map(async (pair, i) => {
            this.path += i == node.value.length -1 ? "([^,]+)" : "([^,]+,)";
            node[ODATA_TYPENAME] = Edm.getTypeName(type, pair.value.key.value.name, this.serverType.container);
            node[ODATA_TYPE] = Edm.getType(type, pair.value.key.value.name, this.serverType.container);
            let value = Literal.convert(pair.value.value.value, pair.value.value.raw);
            let deserializer = Edm.getURLDeserializer(type, pair.value.key.value.name, node[ODATA_TYPE], this.serverType.container);
            if (typeof deserializer == "function") value = await deserializer(value);
            return {
                name: pair.value.key.value.name,
                value,
                raw: pair.value.value.raw,
                node
            };
        }));
        this.path += "\\))";
    }

    protected async VisitSingleNavigation(node:Token, context:any, type: any){
        await this.Visit(node.value.path, context, type);
    }

    protected async VisitPropertyPath(node:Token, context:any, type: any){
        await this.Visit(node.value.path, context, type);
        await this.Visit(node.value.navigation, context, type);
    }

    protected VisitProperty(node:Token, _:any){
        node[ODATA_TYPENAME] = Edm.getTypeName(node[ODATA_TYPE], node.value.name, this.serverType.container);
        node[ODATA_TYPE] = Edm.getType(node[ODATA_TYPE], node.value.name, this.serverType.container);
        this.navigation.push({ name: node.value.name, type: node.type, node });
        this.path += "/" + node.value.name;
    };

    protected VisitValueExpression(node:Token){
        this.navigation.push({
            name: "$value",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$value";
    }

    protected VisitRefExpression(node:Token){
        this.navigation.push({
            name: "$ref",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$ref";
    }

    protected async VisitBoundOperation(node:Token, context:any){
        await this.Visit(node.value.operation, context);
        await this.Visit(node.value.navigation, context);
    }

    protected VisitBoundActionCall(node:Token){
        let part = {
            type: node.type,
            name: node.raw,
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }

    protected async VisitBoundFunctionCall(node:Token){
        let part = {
            type: node.type,
            name: node.value.call.value.namespace + "." + node.value.call.value.name,
            params: {},
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        await Promise.all(node.value.params.value.map(async (param, i) => {
            await this.Visit(param, context);
            if (i < node.value.params.value.length - 1) this.path += ",";
        }));
        this.path += "\\))";
    }
    
    protected async VisitFunctionImportCall(node:Token, context:any){
        let part = {
            type: node.type,
            name: node.value.import.value.name,
            params: {},
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        await Promise.all(node.value.params.map(async (param) => await this.Visit(param, context)));
        this.path += "\\))";
    }
    
    protected async VisitFunctionParameter(node:Token, context:any){
        await this.Visit(node.value.value, context = Object.assign({}, context));
        let params = this.navigation[this.navigation.length - 1].params;
        params[node.value.name.value.name] = (literal => _ => typeof literal == "function" ? literal() : literal)(context.literal);
        this.path += node.value.name.value.name + "=([^,]+)";
        delete context.literal;
    }

    protected VisitActionImportCall(node:Token){
        let part = {
            type: node.value.type,
            name: node.value.value.name,
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }
    
    protected VisitParameterAlias(node:Token, context:any){
        context.literal = (name => _ => this.alias[name])(node.value.name);
    }
    
    protected VisitLiteral(node:Token, context:any){
        context.literal = Literal.convert(node.value, node.raw);
    }
}