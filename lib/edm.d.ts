import "reflect-metadata";
import { ODataController } from "./controller";
export declare namespace Edm {
    const Binary: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Boolean: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Byte: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Date: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const DateTimeOffset: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Decimal: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Double: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Duration: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Guid: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Int16: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Int32: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Int64: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const SByte: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Single: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Stream: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const String: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const TimeOfDay: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Geography: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyPoint: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyLineString: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyPolygon: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyMultiPoint: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyMultiLineString: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyMultiPolygon: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeographyCollection: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const Geometry: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryPoint: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryLineString: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryPolygon: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryMultiPoint: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryMultiLineString: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryMultiPolygon: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    const GeometryCollection: (target?: any, targetKey?: string, parameterIndex?: number) => any;
    function Collection(elementType: Function): (target: any, targetKey: any, parameterIndex?: number) => void;
    function getTypeName(target: Function, propertyKey: string): string;
    function getType(target: Function, propertyKey: string): Function | string;
    function isCollection(target: Function, propertyKey: string): boolean;
    function getProperties(target: Function): string[];
    function getParameters(target: Function, targetKey: string): any[];
    const Key: (target: any, targetKey: any) => void;
    function isKey(target: Function, propertyKey: string): boolean;
    function getKeyProperties(target: Function): string[];
    function escape(value: any, type: any): any;
    const Computed: (target: any, targetKey: any) => void;
    function isComputed(target: Function, propertyKey: string): boolean;
    const Nullable: (target: any, targetKey: any, parameterIndex?: number) => void;
    function isNullable(target: Function, propertyKey: string): boolean;
    const Required: (target: any, targetKey: any, parameterIndex?: number) => void;
    function isRequired(target: Function, propertyKey: string): boolean;
    const ActionImport: (target: any, targetKey: any) => void;
    const Action: (target: any, targetKey: any) => void;
    function FunctionImport(returnType: any): (target: any, targetKey: any) => void;
    function Function(returnType: any): (target: any, targetKey: any) => void;
    function getOperations(target: Function): string[];
    function getReturnTypeName(target: Function, propertyKey: string): string;
    function getReturnType(target: Function, propertyKey: string): Function | string;
    function isActionImport(target: Function, propertyKey: string): boolean;
    function isFunctionImport(target: Function, propertyKey: string): boolean;
    function isAction(target: Function, propertyKey: string): boolean;
    function isFunction(target: Function, propertyKey: string): boolean;
    function ComplexType(type: Function): (target: any, targetKey: any) => void;
    function isComplexType(target: Function, propertyKey: string): boolean;
    function MediaEntity(contentType: string): {
        (target: Function): void;
        (target: Object, targetKey: string | symbol): void;
    };
    function isMediaEntity(target: Function): boolean;
    function getContentType(target: Function): any;
    const OpenType: {
        (target: Function): void;
        (target: Object, targetKey: string | symbol): void;
    };
    function isOpenType(target: Function): boolean;
    function EntityType(type?: Function | string): (target: any, targetKey?: string) => void;
    function isEntityType(target: Function, propertyKey: string): boolean;
    function register(type: Function): void;
    function Convert(converter: Function): (target: any, targetKey: any) => void;
    function getConverter(target: Function, propertyKey: string): Function;
    function Annotate(...annotation: any[]): (target: any, targetKey?: string) => void;
    function getAnnotations(target: Function, targetKey?: string): any[];
    function ForeignKey(...keys: string[]): (target: any, targetKey?: string) => void;
    function getForeignKeys(target: Function, targetKey?: string): string[];
    function Partner(property: string): {
        (target: Function): void;
        (target: Object, targetKey: string | symbol): void;
    };
    function getPartner(target: any, targetKey: string): any;
    function EntitySet(name: string): (controller: typeof ODataController) => void;
}
