import { Token, TokenType } from "odata-v4-parser/lib/lexer";
import { Literal } from "odata-v4-literal";
import * as qs from "qs";
import { ODataServer } from "./server";
import { ODataController } from "./controller";
import * as Edm from "./edm";

export interface KeyValuePair {
    name: string
    value: any,
    raw?: string
    node: Token
}

export interface NavigationPart {
    name: string
    type: TokenType
    key?: KeyValuePair[]
    params?: any
    node: Token
}

export interface ISelect {
    [property: string]: ISelect
}

export const ODATA_TYPE = "@odata.type";
export const ODATA_TYPENAME = "@odata.type.name";
export class ResourcePathVisitor {
    private serverType: typeof ODataServer
    private entitySets: {
        [entitySet: string]: typeof ODataController
    }

    navigation: NavigationPart[]
    select: ISelect
    alias: any
    path: string
    singleton: string
    inlinecount: boolean
    id: string
    ast: Token
    navigationProperty: string
    query: any
    includes: {
        [navigationProperty: string]: ResourcePathVisitor
    } = {};

    constructor(serverType: typeof ODataServer, entitySets: { [entitySet: string]: typeof ODataController }) {
        this.navigation = [];
        this.path = "";
        this.alias = {};
        this.serverType = serverType;
        this.entitySets = entitySets;
    }

    async Visit(node: Token, context?: any, type?: any): Promise<ResourcePathVisitor> {
        this.ast = this.ast || node;
        if (!type) type = this.serverType;
        context = context || {};

        if (node) {
            node[ODATA_TYPE] = type;
            let visitor;
            switch (node.type) {
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
                case "QualifiedEntityTypeName":
                case "QualifiedComplexTypeName":
                    visitor = this.VisitQualifiedTypeName;
                    break;
                default:
                    visitor = this[`Visit${node.type}`];
            }

            if (visitor) await visitor.call(this, node, context, type);
        }

        return this;
    }

    protected async VisitODataUri(node: Token, context: any) {
        await this.Visit(node.value.resource, context);
        await this.Visit(node.value.query, context, this.navigation[this.navigation.length - 1].node[ODATA_TYPE]);
        this.navigation.forEach(it => {
            if (it.params) {
                for (let prop in it.params) {
                    if (typeof it.params[prop] == "function") {
                        it.params[prop] = it.params[prop]();
                    }
                }
            }
        });
    }

    protected async VisitQueryOptions(node: Token, context: any, type: any) {
        await Promise.all(node.value.options.map(async (option) => await this.Visit(option, Object.assign({}, context), type)));
    }

    protected VisitSelect(node: Token, context: any, type: any) {
        this.select = {};
        node.value.items.forEach((item) => this.Visit(item, context));
    }

    protected VisitSelectItem(node: Token, context: any, type: any) {
        let select = this.select;
        node.raw.split("/").forEach(part => {
            select = select[part] = select[part] || {};
        });
    }

    protected async VisitFilter(node: Token, context: any, type: any) {
        context = Object.assign({ filter: true }, context);
        await this.Visit(node.value, context, type);
    }

    protected async VisitAndExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitOrExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitBoolParenExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value, context, type);
    }

    protected async VisitCommonExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value, context, type);
    }

    protected async VisitFirstMemberExpression(node: Token, context: any, type: any) {
        const firstMemberContext = { ...context, isFirstMemberExpression: true };
        await this.Visit(node.value, firstMemberContext, type);
        if (firstMemberContext.qualifiedType && firstMemberContext.qualifiedTypeName){
            type = firstMemberContext.qualifiedType || type;
            node.raw = node.raw.split('/').pop();
        }
        context.type = Edm.getType(type, node.raw, this.serverType.container);
        context.typeName = Edm.getTypeName(type, node.raw, this.serverType.container);
        context.deserializer = Edm.getURLDeserializer(type, node.raw, context.type, this.serverType.container);
        if (Edm.isEnumType(type, node.raw)) {
            const containerType = Object.getPrototypeOf(this.serverType.container).constructor;
            const enumType = context.type;
            const prop = node.raw;
            let enumName = context.typeName;
            let enumNamespace = containerType.namespace;

            if (enumName.indexOf(".") > 0) {
                enumNamespace = enumName.slice(0, enumName.lastIndexOf("."));
                enumName = enumName.slice(enumName.lastIndexOf(".") + 1);
            }
            context.typeName = Edm.getTypeName(containerType, enumName, this.serverType.container) ||
                Edm.getTypeName(containerType, `${enumNamespace}.${enumName}`, this.serverType.container) ||
                "Edm.Int32";
        }
    }

    protected async VisitMemberExpression(node: Token, context: any, type: any) {
        if (node.value && node.value.name && node.value.value){
            await this.Visit(node.value.name, context, type);
            await this.Visit(node.value.value, context, type);
        } else await this.Visit(node.value, context, type);
    }

    protected async VisitPropertyPathExpression(node: Token, context: any, type: any) {
        if (node.value.current && node.value.next) {
            await this.Visit(node.value.current, context, type);
            await this.Visit(node.value.next, context, type);
        } else await this.Visit(node.value, context, type);
    }

    protected async VisitNotExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value, context, type);
    }

    protected async VisitEqualsExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitNotEqualsExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitLesserThanExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitLesserOrEqualsExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitGreaterThanExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitGreaterOrEqualsExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitHasExpression(node: Token, context: any, type: any) {
        await this.Visit(node.value.left, context, type);
        await this.Visit(node.value.right, context, type);
    }

    protected async VisitExpand(node: Token, context: any, type: any) {
        await Promise.all(node.value.items.map(async (item) => {
            let expandPath = item.value.path.raw;
            let visitor = this.includes[expandPath];
            if (!visitor) {
                visitor = new ResourcePathVisitor(node[ODATA_TYPE], this.entitySets);
                this.includes[expandPath] = visitor;
            }
            await visitor.Visit(item, Object.assign({}, context), type);
        }));
    }

    protected async VisitExpandItem(node: Token, context: any, type: any) {
        await this.Visit(node.value.path, context, type);
        type = this.navigation[this.navigation.length - 1].node[ODATA_TYPE] || type;
        if (node.value.options) {
            this.ast = new Token(node);
            this.ast.type = TokenType.QueryOptions;
            this.ast.raw = node.value.options.map(n => n.raw).join("&");
            this.query = qs.parse(this.ast.raw);
            await Promise.all(node.value.options.map(async (item) => await this.Visit(item, Object.assign({}, context), type)));
        }
        if (node.value.ref) await this.Visit(node.value.ref, Object.assign({}, context), type);
        if (node.value.count) await this.Visit(node.value.count, Object.assign({}, context), type);
    }

    protected async VisitExpandPath(node: Token, context: any, type: any) {
        for (let item of node.value) {
            await this.Visit(item, Object.assign({}, context), type);
            type = item[ODATA_TYPE] || type;
        }
        for (let i = this.navigation.length - 1; i >= 0; i--) {
            let nav = this.navigation[i];
            if (nav.type == TokenType.EntityCollectionNavigationProperty || nav.type == TokenType.EntityNavigationProperty) {
                this.navigationProperty = nav.name;
                break;
            }
        }
    }

    protected VisitId(node: Token) {
        this.id = node.value;
    }

    protected VisitInlineCount(node: Token) {
        this.inlinecount = Literal.convert(node.value.value, node.value.raw);
    }

    protected async VisitAliasAndValue(node: Token, context: any) {
        await this.Visit(node.value.value.value, context);
        this.alias[node.value.alias.value.name] = context.literal;
        delete context.literal;
    }

    protected async VisitResourcePath(node: Token, context: any) {
        await this.Visit(node.value.resource, context);
        await this.Visit(node.value.navigation, context, context[ODATA_TYPE]);
        delete context[ODATA_TYPE];
    }

    protected VisitSingletonEntity(node: Token) {
        this.singleton = node.raw;
    }

    protected VisitEntitySetName(node: Token, context: any) {
        node[ODATA_TYPE] = context[ODATA_TYPE] = this.entitySets[node.value.name].prototype.elementType;
        this.navigation.push({ name: node.value.name, type: node.type, node });
        this.path += "/" + node.value.name;
    }

    protected VisitCountExpression(node: Token) {
        this.navigation.push({
            name: "$count",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$count";
    };

    protected async VisitCollectionNavigation(node: Token, context: any, type: any) {
        context.isCollection = true;
        await this.Visit(node.value.name, context, type);
        await this.Visit(node.value.path, context, type);
        delete context.isCollection;
    }

    protected async VisitCollectionNavigationPath(node: Token, context: any, type: any) {
        await this.Visit(node.value.predicate, context, type);
        await this.Visit(node.value.navigation, context, type);
    }

    protected async VisitSimpleKey(node: Token, _: any, type: any) {
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

    protected async VisitCompoundKey(node: Token, _: any, type: any) {
        this.path += "(\\(";
        let lastNavigationPart = this.navigation[this.navigation.length - 1];
        lastNavigationPart.key = await Promise.all<KeyValuePair>(node.value.map(async (pair, i) => {
            this.path += i == node.value.length - 1 ? "([^,]+)" : "([^,]+,)";
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

    protected VisitQualifiedTypeName(node: Token, context: any, type: any) {
        const children = Edm.getChildren(node[ODATA_TYPE]);
        const child = children.find(t => `${t.namespace}.${t.name}` == node.raw);
        if (child) {
            node[ODATA_TYPE] = child;
            node[ODATA_TYPENAME] = node.raw;
            if (context.isFirstMemberExpression){
                context.qualifiedType = child;
                context.qualifiedTypeName = node.raw;
            }else{
                this.navigation.push({
                    name: node.raw,
                    type: node.type,
                    node
                });
                this.path += `/${node.raw}`;
            }
        }
    }

    protected async VisitSingleNavigation(node: Token, context: any, type: any) {
        context.isCollection = false;
        if (node.value.name) await this.Visit(node.value.name, context, type);
        await this.Visit(node.value.path, context, type);
        delete context.isCollection;
    }

    protected async VisitPropertyPath(node: Token, context: any, type: any) {
        await this.Visit(node.value.path, context, type);
        await this.Visit(node.value.navigation, context, type);
    }

    protected VisitProperty(node: Token, _: any) {
        node[ODATA_TYPENAME] = Edm.getTypeName(node[ODATA_TYPE], node.value.name, this.serverType.container);
        node[ODATA_TYPE] = Edm.getType(node[ODATA_TYPE], node.value.name, this.serverType.container);
        this.navigation.push({ name: node.value.name, type: node.type, node });
        this.path += "/" + node.value.name;
    };

    protected VisitValueExpression(node: Token) {
        this.navigation.push({
            name: "$value",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$value";
    }

    protected VisitRefExpression(node: Token) {
        this.navigation.push({
            name: "$ref",
            type: node.type,
            params: {},
            node
        });
        this.path += "/$ref";
    }

    protected async VisitBoundOperation(node: Token, context: any, type: any) {
        await this.Visit(node.value.operation, context, type);
        await this.Visit(node.value.navigation, context, type);
    }

    protected VisitBoundActionCall(node: Token) {
        let part = {
            type: node.type,
            name: node.raw,
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }

    protected async VisitBoundFunctionCall(node: Token, context: any, type: any) {
        let part = {
            type: node.type,
            name: node.value.call.value.namespace + "." + node.value.call.value.name,
            params: {},
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        if (context.isCollection) {
            type = this.serverType.getController(type);
        }
        context.parameters = Edm.getParameters(type, part.name.split(".").pop());
        await Promise.all(node.value.params.value.map(async (param, i) => {
            await this.Visit(param, context);
            if (i < node.value.params.value.length - 1) this.path += ",";
        }));
        delete context.parameters;
        this.path += "\\))";
    }

    protected async VisitFunctionImportCall(node: Token, context: any) {
        let part = {
            type: node.type,
            name: node.value.import.value.name,
            params: {},
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
        this.path += "(\\(";
        context.parameters = Edm.getParameters(node[ODATA_TYPE], part.name);
        await Promise.all(node.value.params.map(async (param) => await this.Visit(param, Object.assign({}, context))));
        delete context.parameters;
        this.path += "\\))";
    }

    protected async VisitFunctionParameter(node: Token, context: any) {
        let edmParam = context.parameters.find(p => p.name == [node.value.name.value.name]);
        let deserializer = (edmParam && Edm.getURLDeserializer(node[ODATA_TYPE], edmParam.name, edmParam.type, this.serverType.container)) || (_ => _);

        context = Object.assign({}, context);
        await this.Visit(node.value.value, context, edmParam && edmParam.type);

        let params = this.navigation[this.navigation.length - 1].params;
        params[node.value.name.value.name] = (literal => _ => deserializer(typeof literal == "function" ? literal() : literal))(context.literal);
        this.path += node.value.name.value.name + "=([^,]+)";
        delete context.literal;
    }

    protected VisitActionImportCall(node: Token) {
        let part = {
            type: node.value.type,
            name: node.value.value.name,
            node
        };
        this.navigation.push(part);
        this.path += "/" + part.name;
    }

    protected VisitParameterAlias(node: Token, context: any) {
        context.literal = (name => _ => this.alias[name])(node.value.name);
    }

    protected async VisitLiteral(node: Token, context: any, type: any) {
        let literal = Literal.convert(node.value, node.raw);
        if (node.value != context.typeName) {
            node.raw = await (context.deserializer || (_ => _))(literal);
            node.value = context.typeName;
            literal = node.raw;
        }
        context.literal = literal;
    }

    protected VisitObject(node: Token, context: any, type: any) {
        context.literal = JSON.parse(node.raw);
    }

    protected async VisitEnum(node: Token, context: any, type: any) {
        const enumName = node.value.name.raw.split('.');
        context.enumName = enumName.pop();
        context.enumNamespace = enumName.join('.');
        await this.Visit(node.value.value, context, type);
    }

    protected async VisitEnumValue(node: Token, context: any, type: any) {
        await this.Visit(node.value.values[0], context, type);
    }

    protected async VisitEnumerationMember(node: Token, context: any, type: any) {
        if (context.filter && type) {
            node.type = TokenType.EnumMemberValue;
            const deserializer = Edm.getURLDeserializer(type, context.typeName, context.type, this.serverType.container);
            if (deserializer){
                node.raw = await deserializer(node.value.name);
                node.value = node.raw;
            }else{
                const { enumNamespace, enumName } = context;
                const qualifiedEnumTypeName = `${enumNamespace}.${enumName}`;
                if (!(context.type || context.typeName) && enumNamespace && enumName){
                    context.type = this.serverType.container[qualifiedEnumTypeName] || this.serverType.container[context.enumName];
                    const containerType = Object.getPrototypeOf(this.serverType.container).constructor;
                    context.typeName =
                        Edm.getTypeName(containerType, qualifiedEnumTypeName, this.serverType.container) ||
                        Edm.getTypeName(containerType, enumName, this.serverType.container) ||
                        "Edm.Int32";
                }
                node[ODATA_TYPE] = context.type;
                node[ODATA_TYPENAME] = context.typeName;
                node.raw = `${context.type && context.type[node.value.name]}`;
                node.value = context.typeName;
            }
        } else {
            context.literal = (type && type[node.value.name]) || node.value.name;
        }
    }

    protected VisitEnumMemberValue(node: Token, context: any, type: any) {
        context.literal = Literal.convert(node.value, node.raw);
    }

    protected async VisitRootExpression(node: Token, context: any, type: any) {
        let rootValue = await this.serverType.execute(node.raw.replace('$root/', ''), 'GET');
        node.type = TokenType.Literal;
        node.value = rootValue.elementType;
        node.raw = await <any>Edm.escape(rootValue.body.value, node.value);
        await this.Visit(node, context, type);
    }
}