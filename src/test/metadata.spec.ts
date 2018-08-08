/// <reference types="mocha" />
import { ODataController, ODataServer, ODataProcessor, Edm, odata, ODataStream, createODataServer, ODataQuery } from "../lib/index";
import { createFilter } from "odata-v4-mongodb";
import { PassThrough } from "stream";
import { ObjectID } from "mongodb";
import * as fs from "fs";
import * as path from "path";
const { expect } = require("chai");
const beautify = require("xml-beautifier");

const serverCache = [];
if (typeof after == "function"){
    after(function(){
        serverCache.forEach(server => server.close());
    });
}

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;
let schemaJson = {
    version: "4.0",
    dataServices: {
        schema: [{
            namespace: "SchemJsonTest",
            entityType: [{
                name: "Index",
                key: [{
                    propertyRef: [{
                        name: "id"
                    }]
                }],
                property: [{
                    name: "id",
                    type: "Edm.Int64",
                    nullable: false
                }]
            }],
            entityContainer: {
                name: "SchemJsonTestContext",
                entitySet: [{
                    name: "SchemJsonTest",
                    entityType: "SchemJsonTest.Index"
                }]
            }
        }]
    }
};

let defineEntities = {
    namespace: 'Default',
    containerName: 'Container',
    entities: [
        {
            name: 'Kitten',
            collectionName: 'Kittens',
            keys: ['Id'],
            computedKey: true,
            properties: {
                Id: 'Edm.String',
                Name: 'Edm.String',
                Age: 'Edm.Int32',
                Lives: 'Edm.Int32',
                Owner: 'Edm.String'
            },
            annotations:[
                { name: 'UI.DisplayName', value: 'Meww' },
                { property: 'Id', name: 'UI.ReadOnly', value: 'true' },
                { property: 'Title', name: 'UI.DisplayName', value: 'Meww Meww' },
            ]
        }
    ]
};

export enum Genre {
    Unknown,
    Pop,
    Rock,
    Metal,
    Classic
}
Edm.Annotate({
    term: "foo",
    string: "bar"
})(Genre)
Edm.Annotate({
    term: "foo",
    string: "bar"
})(Genre, "Rock")

@Edm.OpenType
class Index {
    @Edm.Int64
    id: number
}

@odata.namespace("Media")
@Edm.Annotate({
    term: "UI.DisplayName",
    string: "Media"
})
@Edm.MediaEntity("audio/mp3")
export class Media extends PassThrough {
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    Id: number

    @Edm.Key
    @Edm.String
    StringId: String

    @Edm.EntityType(Edm.ForwardRef(() => Meta))
    @Edm.Partner("MediaList")
    Meta: Meta
}

export class CompoundKey {
    @Edm.Decimal
    @Edm.Key
    bc0: number

    @Edm.Binary
    @Edm.Key
    bc1: number

    @Edm.Boolean
    @Edm.Key
    bc2: boolean

    @Edm.Byte
    @Edm.Key
    bc3: number

    @Edm.Guid
    @Edm.Key
    bc4: string

    @Edm.Double
    @Edm.Key
    bc5: number
}

export class BaseComplex {
    @Edm.String
    bc0: string

    @Edm.EnumType(Genre)
    Genre: Genre
}

export class SubComplex extends BaseComplex {
    @Edm.String
    sc0: string
}

export class Complex extends SubComplex {
    @Edm.String
    c0: string
}

@Edm.String
export class SimpleObjectID extends ObjectID{
    static "@odata.type" = "Simple.ObjectID"
}
export class SimpleEntity {
    @Edm.Key
    @Edm.Computed
    @Edm.TypeDefinition(SimpleObjectID)
    MongoId: SimpleObjectID
}

@Edm.String
export class MyType {
    static "@odata.type" = "Server.MyType"
}

export enum Color {
    Red,
    Green,
    Blue,
    "@odata.type" = <any>"Color2"
}

export class BaseMeta {
    @Edm.Key
    @Edm.Computed
    @Edm.TypeDefinition(ObjectID)
    @Edm.Deserialize(toObjectID)
    MongoId: ObjectID

    @Edm.String
    b0: string

    constructor() {
        this.b0 = 'b0';
    }
}

@odata.namespace("Meta")
export class Meta extends BaseMeta {
    @Edm.Key
    @Edm.Computed
    @Edm.Required
    @Edm.Int32
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Identifier"
    },
        {
            term: "UI.ControlHint",
            string: "ReadOnly"
        })
    Id: number

    @Edm.TypeDefinition(ObjectID)
    MongoId: ObjectID

    @Edm.TypeDefinition(MyType)
    myType: MyType

    @Edm.Binary
    @Edm.Nullable
    p0: number

    @Edm.Boolean
    p1: boolean

    @Edm.Byte
    p2: number

    @Edm.Date
    p3: Date

    @Edm.DateTimeOffset
    p4: number

    @Edm.Decimal
    @Edm.Precision(13)
    @Edm.Scale(2)
    p5: number

    @Edm.Double
    p6: number

    @Edm.Duration
    p7: number

    @Edm.Guid
    @Edm.ConcurrencyMode("custom")
    p8: string

    @Edm.Int16
    @Edm.Key
    p9: number

    @Edm.Int32
    @Edm.Key
    p10: number

    @Edm.Int64
    @Edm.DefaultValue(256)
    p11: number

    @Edm.SByte
    p12: number

    @Edm.Single
    p13: number

    @Edm.Stream("test")
    p14: ODataStream

    @Edm.String
    @Edm.ForeignKey('c0')
    @Edm.Unicode
    p15: string

    @Edm.TimeOfDay
    p16: number

    @Edm.Geography
    p17: any

    @Edm.GeographyPoint
    p18: any

    @Edm.GeographyLineString
    p19: any

    @Edm.GeographyPolygon
    p20: any

    @Edm.GeographyMultiPoint
    p21: any

    @Edm.GeographyMultiLineString
    p22: any

    @Edm.GeographyMultiPolygon
    p23: any

    @Edm.GeographyCollection
    p24: any

    @Edm.Geometry
    p25: any

    @Edm.GeometryPoint
    @Edm.SRID(123)
    p26: any

    @Edm.GeometryLineString
    p27: any

    @Edm.GeometryPolygon
    p28: any

    @Edm.GeometryMultiPoint
    p29: any

    @Edm.GeometryMultiLineString
    p30: any

    @Edm.GeometryMultiPolygon
    p31: any

    @Edm.GeometryCollection
    p32: any

    @Edm.Collection(Edm.Binary)
    @Edm.Nullable
    p33: number[]

    @Edm.Collection(Edm.Boolean)
    p34: boolean[]

    @Edm.Collection(Edm.Byte)
    p35: number[]

    @Edm.Collection(Edm.Date)
    p36: Date[]

    @Edm.Collection(Edm.DateTimeOffset)
    p37: number[]

    @Edm.Collection(Edm.Decimal)
    p38: number[]

    @Edm.Collection(Edm.Double)
    p39: number[]

    @Edm.Collection(Edm.Duration)
    p40: number[]

    @Edm.Collection(Edm.Guid)
    p41: string[]

    @Edm.Collection(Edm.Int16)
    p42: number[]

    @Edm.Collection(Edm.Int32)
    p43: number[]

    @Edm.Collection(Edm.Int64)
    p44: number[]

    @Edm.Collection(Edm.SByte)
    p45: number[]

    @Edm.Collection(Edm.Single)
    p46: number[]

    @Edm.Collection(Edm.Stream("test"))
    p47: ODataStream[]

    @Edm.Collection(Edm.String)
    p48: string[]

    @Edm.Collection(Edm.TimeOfDay)
    p49: number[]

    @Edm.Collection(Edm.Geography)
    p50: any[]

    @Edm.Collection(Edm.GeographyPoint)
    p51: any[]

    @Edm.Collection(Edm.GeographyLineString)
    p52: any[]

    @Edm.Collection(Edm.GeographyPolygon)
    p53: any[]

    @Edm.Collection(Edm.GeographyMultiPoint)
    p54: any[]

    @Edm.Collection(Edm.GeographyMultiLineString)
    p55: any[]

    @Edm.Collection(Edm.GeographyMultiPolygon)
    p56: any[]

    @Edm.Collection(Edm.GeographyCollection)
    p57: any[]

    @Edm.Collection(Edm.Geometry)
    p58: any[]

    @Edm.Collection(Edm.GeometryPoint)
    p59: any[]

    @Edm.Collection(Edm.GeometryLineString)
    p60: any[]

    @Edm.Collection(Edm.GeometryPolygon)
    p61: any[]

    @Edm.Collection(Edm.GeometryMultiPoint)
    p62: any[]

    @Edm.Collection(Edm.GeometryMultiLineString)
    p63: any[]

    @Edm.Collection(Edm.GeometryMultiPolygon)
    p64: any[]

    @Edm.Collection(Edm.GeometryCollection)
    p65: any[]

    @Edm.Stream
    p66: ODataStream

    // TODO: not implemented
    // @Edm.Collection(Edm.Collection(Edm.String))
    // p67: string[][]

    @Edm.ComplexType(Edm.ForwardRef(() => Complex))
    Complex: Complex

    @Edm.Collection(Edm.ComplexType(Edm.ForwardRef(() => Complex)))
    ComplexList: Complex[]

    @Edm.Action
    a0() { }

    @odata.namespace("Functions")
    @Edm.Function(Edm.String)
    f0() {
        return "f";
    }

    @odata.namespace("Functions")
    @Edm.Function(Edm.String)
    f2( @Edm.String message) {
        return message;
    }

    @Edm.Collection(Edm.EntityType(Media))
    @Edm.Partner("Meta")
    MediaList: Media[]

    @Edm.EnumType(Genre)
    Genre: Genre

    @Edm.EnumType(Color)
    Color: Color
}

export class TestEntity {
    @Edm.Int32
    @Edm.Key
    @Edm.Required
    test: number

    @Edm.EnumType(Genre)
    Genre: Genre
}

export class EmptyEntity {
    @Edm.Action
    enumTypeAction( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        // console.log(type, value);
    }

    @Edm.Function(Edm.EnumType(Genre))
    enumTypeFunction( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        return value;
    }
}
export class EmptyEntity2 {
}
export class EmptyEntity3 {
}
export class EmptyEntity4 {
}
export class EmptyEntity5 {
}
export class EmptyEntity6 {
}
export class EmptyEntity7 {
}
export class HiddenEmptyEntity {
}

export class TestContainerBase extends Edm.ContainerBase {
    Test2 = TestEntity
}

export enum FuncEnum {
    Default = 42
}

export enum FuncEnum2 {
    Default = 13
}

export enum FuncEnum3 {
    ActionEnumMemberName = 42
}

export enum FuncEnum4 {
    FunctionEnumMemberName = 42
}

export class Foobar {
    toString() {
        return "foobar";
    }
}

export class TestContainer extends TestContainerBase {
    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `EnumSchema.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `EnumSchema.Genre2'${value || 0}'`)
    @odata.namespace("EnumSchema")
    Genre2 = Genre

    @Edm.String
    @Edm.URLSerialize((value: ObjectID) => `'${value.toHexString()}'`)
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    ObjectID2 = ObjectID

    @Edm.Int64
    @odata.namespace("FuncEnumSchema")
    FuncEnum = FuncEnum

    @Edm.Int64
    @odata.namespace("FuncEnumSchema")
    FuncEnum2 = FuncEnum2

    @Edm.Int64
    @odata.namespace("FuncEnumSchema")
    FuncEnum3 = FuncEnum3

    @Edm.Int64
    @odata.namespace("FuncEnumSchema")
    FuncEnum4 = FuncEnum4

    @Edm.String
    "Foo.Bar" = Foobar
}

@odata.namespace("Container")
export class TypeDefContainer extends Edm.ContainerBase {
    @Edm.String
    @Edm.URLSerialize((value: ObjectID) => `'${value.toHexString()}'`)
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    'Object.ID2' = ObjectID
}

@odata.namespace("Container")
export class EnumContainer {
    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `Server.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `Server.Genre2'${value || 0}'`)
    'Server.Genre2' = Genre
}

@odata.namespace("Controller")
@odata.type(BaseMeta)
// @odata.type(Meta)
export class MetaController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return [
            { MongoId: new ObjectID('5968aad95eb7eb3a94a264f7'), b0: "basemeta", "@odata.type": BaseMeta },
            { Id: 1, p0: 1, p1: true, p9: 9, p10: 10, MongoId: new ObjectID('5968aad95eb7eb3a94a264f6'), "@odata.type": Meta }
        ];
    }

    @odata.method("GET")
    findOneByKeys( @odata.query query:ODataQuery, @odata.key('Id') key1: number, @odata.key('p10') key2: number, @odata.key('p9') key3: number, @odata.key('MongoId') key4: string) {
        let meta = new Meta();
        meta.Id = key1;
        meta.p9 = key3;
        meta.p10 = key2;
        meta.MongoId = new ObjectID(key4);
        return meta;
    }

    @odata.POST
    insert( @odata.body body: Meta ) {
        return body;
    }

    @odata.GET("MediaList")
    getMedia( @odata.result result: Meta) {
        let media = new Media();
        media.Id = 1;
        media.StringId = 'two';
        return [media];
    }

    @odata.GET("MediaList")
    getMediaByKey( @odata.key('Id') key1: number, @odata.key('StringId') key2: string, @odata.result result: Meta) {
        let media = new Media();
        media.Id = key1;
        media.StringId = key2;
        return media;
    }

    @odata.GET("MediaList").$ref
    getMediaRef( @odata.link('Id') link1: number, @odata.link('StringId') link2: number, @odata.key('MongoId') k1: string, @odata.key('p9') k2: number, @odata.key('p10') k3: number, @odata.key('Id') k4: number, @odata.result result: any) {
        let meta = new Meta();
        meta.Id = k4;
        meta.p9 = k2;
        meta.p10 = k3;
        meta.MongoId = new ObjectID(k1);
        return meta;
    }

    @Edm.Action
    ControllerAction() {
        // console.log('ControllerAction');
    }

    @odata.namespace("Functions")
    @Edm.Function(Edm.String)
    ControllerFunction( @Edm.String str: string) {
        return str;
    }

    @Edm.Function(Edm.EntityType(BaseMeta))
    useOdataType( @odata.type type: any) {
        return [
            { MongoId: new ObjectID('5968aad95eb7eb3a94a264f7'), b0: "basemeta", "@odata.type": BaseMeta },
            { Id: 1, p0: 1, p1: true, p9: 9, p10: 10, MongoId: new ObjectID('5968aad95eb7eb3a94a264f6'), "@odata.type": Meta },
            type.namespace
        ];
    }
}

@odata.namespace("Controller")
@odata.type(Media)
export class MediaController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let media = new Media();
        media.Id = 1;
        media.StringId = 'two';
        return [media];
    }

    @odata.GET()
    findOne( @odata.key('Id') key1: number, @odata.key('StringId') key2: string) {
        let media = new Media();
        media.Id = key1;
        media.StringId = key2;
        return media;
    }

    @Edm.Action
    ControllerAction( @Edm.Int32 value: number) {
        value += 1;
    }

    @odata.namespace("Functions")
    @Edm.Function()
    @Edm.String
    ControllerFunction() {
        return 'ControllerFunction';
    }
}

@odata.namespace("Controller")
@odata.type(CompoundKey)
export class CompoundKeyController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let ck = new CompoundKey();
        ck.bc0 = 1;
        ck.bc1 = 2;
        ck.bc2 = true;
        ck.bc3 = 4;
        ck.bc4 = '5';
        ck.bc5 = 6;
        return [ck];
    }

    @odata.method("GET")
    findOneByKeys( @odata.key('bc0') key1: number, @odata.key('bc1') key2: number, @odata.key('bc2') key3: boolean, @odata.key('bc3') key4: number, @odata.key('bc4') key5: string, @odata.key('bc5') key6: number) {
        let ck = new CompoundKey();
        ck.bc0 = key1;
        ck.bc1 = key2;
        ck.bc2 = key3;
        ck.bc3 = key4;
        ck.bc4 = key5;
        ck.bc5 = key6;
        return ck;
    }
}

@odata.namespace("Controller")
@odata.type(TestEntity)
export class BaseTestEntityController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let te = new TestEntity();
        te.test = 10;
        return [te];
    }

    @odata.POST
    insert( @odata.body body: TestEntity) {
        return body;
    }
}

@odata.namespace("Controller")
@odata.type(TestEntity)
export class TestEntityController extends BaseTestEntityController {
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor, @odata.filter $filter?:ODataQuery) {
        // console.log($filter, createFilter($filter));
        let te = new TestEntity();
        te.test = 1;
        return [te];
    }

    findOneByKeys( @odata.id id: number) {
        let te = new TestEntity();
        te.test = id;
        return te;
    }
}
TestEntityController.on('GET', 'findAll', 'findOneByKeys');

@odata.namespace("Controller")
@odata.type(EmptyEntity)
export class EmptyEntityController extends ODataController {
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let ee = new EmptyEntity();
        return [ee];
    }

    @Edm.Action
    emptyEntityAction( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        // console.log(type, value);
    }

    @Edm.Function(Edm.EnumType(Genre))
    emptyEntityFunction( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        return value;
    }
}
EmptyEntityController.on('GET', 'findAll')

@odata.namespace("Controller")
@odata.type(EmptyEntity2)
export class EmptyEntity2Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return [];
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity3)
export class EmptyEntity3Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return 'test';
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity4)
export class EmptyEntity4Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return '';
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity5)
export class EmptyEntity5Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return true;
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity6)
export class EmptyEntity6Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return 42;
    }
}

@odata.namespace("Controller")
@odata.type(SimpleEntity)
export class SimpleEntityController extends ODataController {
    @odata.GET
    findAll( @odata.key key: string) {
        let simple = new SimpleEntity()
        simple.MongoId = new ObjectID('5968aad95eb7eb6b94a354g7')
        return [simple];
    }

    @odata.GET
    find( @odata.key key: string) {
        let simple = new SimpleEntity()
        simple.MongoId = new ObjectID(key)
        return simple;
    }
}

@odata.namespace("Controller")
@odata.type(HiddenEmptyEntity)
export class HiddenEmptyController extends ODataController { }

@odata.type(Index)
class SchemaJsonTestController extends ODataController { }

@odata.namespace("SchemaJsonTest")
@odata.controller(SchemaJsonTestController, true)
class SchemaJsonServer extends ODataServer { }
SchemaJsonServer.$metadata(schemaJson);
serverCache.push(SchemaJsonServer.create("/schemaJsonTest", 4004));

class DefineEntitiesServer extends ODataServer{}
DefineEntitiesServer.$metadata(defineEntities);
serverCache.push(DefineEntitiesServer.create("/defineEntitiesTest", 4005));

@Edm.Container(TestContainer)
@odata.namespace("Server")
@odata.container("MetadataContainer")
@odata.cors
@odata.controller(MetaController, "Meta")
@odata.controller(MediaController, "Media")
@odata.controller(CompoundKeyController, 'CompoundKey')
@odata.controller(TestEntityController, 'TestEntity')
@odata.controller(EmptyEntityController, 'EmptyEntity')
@odata.controller(EmptyEntity2Controller, 'EmptyEntity2')
@odata.controller(EmptyEntity3Controller, 'EmptyEntity3')
@odata.controller(SimpleEntityController, "SimpleEntity")
export class MetaTestServer extends ODataServer {
    @odata.container("ActionImportContainer")
    @Edm.ActionImport
    ActionImport() {
        // console.log('Server ActionImport')
    }

    @Edm.ActionImport
    ActionImportParams( @Edm.Collection(Edm.Int32) value: number[]) {
        // console.log(`Server ActionImport ${value.length}`)
    }

    @odata.namespace("Functions")
    @Edm.FunctionImport(Edm.String)
    FunctionImport(
        @Edm.String
        @Edm.Required
        message: string,

        @Edm.Collection(Edm.Int32)
        @Edm.Required
        @Edm.Nullable
        value: number[]) {
        return `Server FunctionImport ${message}`;
    }

    @odata.namespace("Functions")
    @Edm.FunctionImport
    @Edm.String
    FunctionImport2(
        @Edm.String
        @Edm.Nullable
        @Edm.Required
        message: string) {
        return `Server FunctionImport ${message}`;
    }

    @odata.namespace("Functions")
    @Edm.FunctionImport(Edm.String)
    FunctionImport3(
        @Edm.String
        @Edm.MaxLength(8)
        @Edm.Unicode
        message: string,

        @Edm.Decimal
        @Edm.Required
        @Edm.Nullable
        @Edm.Precision(13)
        @Edm.Scale(2)
        value: number[],
    
        @Edm.GeometryPoint
        @Edm.SRID(1)
        geo: any) {
        return `Server FunctionImport ${message}`;
    }

    @Edm.TypeDefinition(ObjectID)
    @Edm.FunctionImport
    ObjId( @Edm.TypeDefinition(ObjectID) v: ObjectID) {
        return v.toHexString();
    }

    @Edm.ActionImport
    ServerEnumTypeActionImport( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        // console.log(type, value);
    }

    @Edm.FunctionImport(Edm.EnumType(Genre))
    ServerEnumTypeFunctionImport( @Edm.EnumType(Genre) value: Genre, @odata.type type: any) {
        // console.log(type, value);        
        return value;
    }
}

@Edm.Container(TypeDefContainer)
@odata.cors
@odata.controller(SimpleEntityController, "SimpleEntity")
export class TypeDefServer extends ODataServer {

}
serverCache.push(TypeDefServer.create(4010));

@Edm.Container(EnumContainer)
@odata.cors
@odata.controller(SimpleEntityController, "SimpleEntity")
export class EnumServer extends ODataServer {

}
serverCache.push(EnumServer.create(4011));

MetaTestServer.addController(HiddenEmptyController);
MetaTestServer.addController(EmptyEntity4Controller, true);
MetaTestServer.addController(EmptyEntity5Controller, true, EmptyEntity5);
MetaTestServer.addController(EmptyEntity6Controller, 'EmptyEntity6', EmptyEntity6);

MetaTestServer.create();
serverCache.push(MetaTestServer.create(4001));
serverCache.push(MetaTestServer.create('/test', 4002));
serverCache.push(createODataServer(MetaTestServer, "/test", 4003));

@Edm.OpenType
export class Executor {
    @Edm.Action
    @Edm.String
    action() {
        return "foobar";
    }

    @Edm.Action(Edm.String)
    action2() {
        return "foobar";
    }

    @Edm.Function
    @Edm.ComplexType(Complex)
    func(@Edm.ComplexType(Complex) complex: Complex) {
        return complex.c0;
    }

    @Edm.Function
    @Edm.EntityType(Meta)
    func2(@Edm.EntityType(Meta) meta: Meta) {
        return meta.b0;
    }
}

@odata.type(Executor)
export class ActionFunctionController extends ODataController {
    @Edm.Action
    @Edm.String
    action() {
        return "foobar";
    }

    @Edm.Action(Edm.String)
    action2() {
        return "foobar";
    }

    @Edm.Function
    @Edm.String
    func(@Edm.ComplexType(Complex) complex: Complex) {
        return complex.c0;
    }

    @Edm.Function
    @Edm.String
    func2(@Edm.EntityType(Meta) meta: Meta) {
        return meta.b0;
    }
}

export class FuncComplex{}
export class FuncComplex2{}

export class FuncEntity{}
export class FuncEntity2{}

@Edm.Container(TestContainer)
@odata.controller(ActionFunctionController, "Execute")
export class ActionFunctionServer extends ODataServer {
    @Edm.ActionImport
    @Edm.String
    action() {
        return "foobar";
    }

    @Edm.ActionImport(Edm.String)
    action2() {
        return "foobar";
    }

    @Edm.ActionImport
    @Edm.EnumType(FuncEnum)
    action3() {
        return FuncEnum.Default;
    }

    @Edm.ActionImport
    @Edm.ComplexType(FuncComplex)
    action4() {
        return new FuncComplex();
    }

    @Edm.ActionImport
    @Edm.EntityType(FuncEntity)
    action5() {
        return new FuncEntity();
    }

    @Edm.ActionImport
    @Edm.String
    action6(
        @Edm.EnumType(FuncEnum3)
        enumValue:FuncEnum3
    ) {
        return FuncEnum3[enumValue];
    }

    @Edm.FunctionImport
    @Edm.String
    func(@Edm.ComplexType(Complex) complex: Complex) {
        return complex.c0;
    }

    @Edm.FunctionImport
    @Edm.String
    func2(@Edm.EntityType(Meta) meta: Meta) {
        return meta.b0;
    }

    @Edm.FunctionImport
    @Edm.EnumType(FuncEnum2)
    func3() {
        return FuncEnum2.Default;
    }

    @Edm.FunctionImport
    @Edm.ComplexType(FuncComplex2)
    func4() {
        return new FuncComplex2();
    }

    @Edm.FunctionImport
    @Edm.EntityType(FuncEntity2)
    func5() {
        return new FuncEntity2();
    }

    @Edm.FunctionImport
    @Edm.String
    func6(
        @Edm.EnumType(FuncEnum4)
        enumValue:FuncEnum4
    ) {
        return FuncEnum4[enumValue];
    }

    @Edm.FunctionImport
    @Edm.String
    func7(
        @Edm.TypeDefinition(Foobar)
        foobar:Foobar
    ) {
        return foobar;
    }
}

if (typeof describe == "function") {
    describe("Metadata test", () => {
        it("should return metadata xml", () => {
            expect(beautify(MetaTestServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$metadata.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });

        it("should return SchemaJsonServer metadata xml", () => {
            expect(beautify(SchemaJsonServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$schemajson.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });

        it("should return DefineEntitiesServer metadata xml", () => {
            expect(beautify(DefineEntitiesServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$defineentities.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });

        it("should return TypeDefServer metadata xml", () => {
            expect(beautify(TypeDefServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$typedefserver.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });

        it("should return EnumServer metadata xml", () => {
            expect(beautify(EnumServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$enumserver.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });

        it("should return ActionFunctionServer metadata xml", () => {
            expect(beautify(ActionFunctionServer.$metadata().document())).to.equal(
                beautify(fs.readFileSync(path.join(__dirname, "metadata", "$actionfunction.xml"), "utf8").replace(/" \/>/gi, "\"/>"))
            );
        });
    });

    describe("Root", () => {
        it("should return root result", () => {
            expect(MetaTestServer.document().document()).to.deep.equal({
                // "@odata.context": "http://localhost:3001/$metadata",
                "@odata.context": undefined,
                "value": [
                    {
                        "name": "SimpleEntity",
                        "kind": "EntitySet",
                        "url": "SimpleEntity"
                    },
                    {
                        "name": "EmptyEntity3",
                        "kind": "EntitySet",
                        "url": "EmptyEntity3"
                    },
                    {
                        "name": "EmptyEntity2",
                        "kind": "EntitySet",
                        "url": "EmptyEntity2"
                    },
                    {
                        "name": "EmptyEntity",
                        "kind": "EntitySet",
                        "url": "EmptyEntity"
                    },
                    {
                        "name": "TestEntity",
                        "kind": "EntitySet",
                        "url": "TestEntity"
                    },
                    {
                        "name": "CompoundKey",
                        "kind": "EntitySet",
                        "url": "CompoundKey"
                    },
                    {
                        "name": "Media",
                        "kind": "EntitySet",
                        "url": "Media"
                    },
                    {
                        "name": "Meta",
                        "kind": "EntitySet",
                        "url": "Meta"
                    },
                    {
                        "name": "EmptyEntity4",
                        "kind": "EntitySet",
                        "url": "EmptyEntity4"
                    },
                    {
                        "name": "EmptyEntity5",
                        "kind": "EntitySet",
                        "url": "EmptyEntity5"
                    },
                    {
                        "name": "EmptyEntity6",
                        "kind": "EntitySet",
                        "url": "EmptyEntity6"
                    }
                ]
            });
        });
    });
}

process.on("warning", warning => {
    console.log(warning.stack);
});