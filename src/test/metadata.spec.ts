/// <reference types="mocha" />
import { ODataController, ODataServer, ODataProcessor, Edm, odata, ODataStream, createODataServer } from "../lib/index";
import { PassThrough } from "stream";
import { ObjectID } from "mongodb";
const { expect } = require("chai");
const beautify = require("xml-beautifier");

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

export enum Genre {
    Unknown,
    Pop,
    Rock,
    Metal,
    Classic
}

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

export class SimpleEntity {
    @Edm.Key
    @Edm.Computed
    @Edm.TypeDefinition(ObjectID)
    MongoId: ObjectID
}

export class MyType {
    "@odata.type" = "Server.MyType"
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
    'Meta.MongoId': ObjectID

    @Edm.String
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
    p5: number

    @Edm.Double
    p6: number

    @Edm.Duration
    p7: number

    @Edm.Guid
    p8: string

    @Edm.Int16
    @Edm.Key
    p9: number

    @Edm.Int32
    @Edm.Key
    p10: number

    @Edm.Int64
    p11: number

    @Edm.SByte
    p12: number

    @Edm.Single
    p13: number

    @Edm.Stream("test")
    p14: ODataStream

    @Edm.String
    @Edm.ForeignKey('c0')
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

    @Edm.EnumType(Edm.ForwardRef(() => Genre))
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

export class TestContainer extends Edm.ContainerBase {
    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `Server.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `Server.Genre2'${value || 0}'`)
    Genre2 = Genre

    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `Server.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `Server.Genre2'${value || 0}'`)
    'Genre.2' = Genre

    @Edm.String
    @Edm.URLSerialize((value: ObjectID) => `'${value.toHexString()}'`)
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    ObjectID2 = ObjectID

    @Edm.String
    @Edm.URLSerialize((value: ObjectID) => `'${value.toHexString()}'`)
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    'ObjectI.D2' = ObjectID

    Test2 = TestEntity
}

@odata.namespace("Container")
export class TypeDefContainer extends Edm.ContainerBase {
    @Edm.String
    @Edm.URLSerialize((value: ObjectID) => `'${value.toHexString()}'`)
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    ObjectID2 = ObjectID
}

@odata.namespace("Container")
export class EnumContainer extends Edm.ContainerBase {
    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `Server.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `Server.Genre2'${value || 0}'`)
    Genre2 = Genre
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
    findOneByKeys( @odata.key('Id') key1: number, @odata.key('p10') key2: number, @odata.key('p9') key3: number, @odata.key('MongoId') key4: string) {
        let meta = new Meta();
        meta.Id = key1;
        meta.p9 = key3;
        meta.p10 = key2;
        meta.MongoId = new ObjectID(key4);
        return meta;
    }

    // @odata.POST
    // insert( @odata.body body: any, @odata.type type: string) {
    //     console.log(type, body);
    // }

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
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
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
@odata.type(EmptyEntity)
export class EmptyEntity2Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return [];
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity)
export class EmptyEntity3Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return 'test';
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity)
export class EmptyEntity4Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return '';
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity)
export class EmptyEntity5Controller extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        return true;
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity)
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
@odata.type(EmptyEntity)
export class HiddenEmptyController extends ODataController { }

@odata.type(Index)
class SchemaJsonTestController extends ODataController { }

@odata.namespace("SchemaJsonTest")
@odata.controller(SchemaJsonTestController, true)
class SchemaJsonServer extends ODataServer { }
SchemaJsonServer.$metadata(schemaJson);
SchemaJsonServer.create("/schemaJsonTest", 4004);

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
TypeDefServer.create(4010);

@Edm.Container(EnumContainer)
@odata.cors
@odata.controller(SimpleEntityController, "SimpleEntity")
export class EnumServer extends ODataServer {

}
EnumServer.create(4011);

MetaTestServer.addController(HiddenEmptyController);
MetaTestServer.addController(EmptyEntity4Controller, true);
MetaTestServer.addController(EmptyEntity5Controller, true, EmptyEntity);
MetaTestServer.addController(EmptyEntity6Controller, 'EmptyEntity6', EmptyEntity);

MetaTestServer.create();
MetaTestServer.create(4001);
MetaTestServer.create('/test', 4002);
createODataServer(MetaTestServer, "/test", 4003);

if (typeof describe == "function") {
    describe("Metadata test", () => {
        it("should return metadata xml", () => {
            expect(beautify(MetaTestServer.$metadata().document())).to.equal(
                beautify(`<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Controller"><EntityContainer Name="Default"><EntitySet Name="SimpleEntity" EntityType="Default.SimpleEntity"/><EntitySet Name="EmptyEntity3" EntityType="Server.EmptyEntity"/><EntitySet Name="EmptyEntity2" EntityType="Server.EmptyEntity"/><EntitySet Name="EmptyEntity" EntityType="Server.EmptyEntity"/><EntitySet Name="TestEntity" EntityType="Server.Test2"/><EntitySet Name="CompoundKey" EntityType="Server.CompoundKey"/><EntitySet Name="Media" EntityType="Media.Media"/><EntitySet Name="Meta" EntityType="Meta.BaseMeta"/><EntitySet Name="EmptyEntity4" EntityType="Server.EmptyEntity"/><EntitySet Name="EmptyEntity5" EntityType="Server.EmptyEntity"/><EntitySet Name="EmptyEntity6" EntityType="Server.EmptyEntity"/></EntityContainer></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Default"><EntityType Name="SimpleEntity"><Key><PropertyRef Name="MongoId"/></Key><Property Name="MongoId" Type="Server.ObjectID2" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property></EntityType></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Functions"><Function Name="f0" IsBound="true"><Parameter Name="bindingParameter" Type="Meta.Meta"/><ReturnType Type="Edm.String"/></Function><Function Name="f2" IsBound="true"><Parameter Name="bindingParameter" Type="Meta.Meta"/><Parameter Name="message" Type="Edm.String"/><ReturnType Type="Edm.String"/></Function><Function Name="ControllerFunction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Media.Media)"/><ReturnType Type="Edm.String"/></Function><Function Name="ControllerFunction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Meta.BaseMeta)"/><Parameter Name="str" Type="Edm.String"/><ReturnType Type="Edm.String"/></Function><Function Name="FunctionImport" IsBound="false"><Parameter Name="value" Type="Collection(Edm.Int32)" Nullable="false"/><Parameter Name="message" Type="Edm.String" Nullable="false"/><ReturnType Type="Edm.String"/></Function><Function Name="FunctionImport2" IsBound="false"><Parameter Name="message" Type="Edm.String" Nullable="true"/><ReturnType Type="Edm.String"/></Function><EntityContainer Name="Default"><FunctionImport Name="FunctionImport" Function="Functions.FunctionImport"/><FunctionImport Name="FunctionImport2" Function="Functions.FunctionImport2"/></EntityContainer></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Media"><EntityType Name="Media" HasStream="true"><Key><PropertyRef Name="Id"/></Key><Property Name="Id" Type="Edm.Int32" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property><Property Name="StringId" Type="Edm.String" Nullable="false"/><NavigationProperty Name="Meta" Type="Media.Meta" Partner="MediaList"/><Annotation Term="UI.DisplayName" String="Media"/></EntityType><Action Name="ControllerAction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Media.Media)"/><Parameter Name="value" Type="Edm.Int32"/></Action></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Meta"><EntityType Name="BaseMeta"><Key><PropertyRef Name="MongoId"/></Key><Property Name="MongoId" Type="Server.ObjectID2" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property><Property Name="b0" Type="Edm.String"/></EntityType><EntityType Name="Meta" BaseType="Meta.BaseMeta"><Key><PropertyRef Name="Id"/></Key><Property Name="Id" Type="Edm.Int32" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/><Annotation Term="UI.DisplayName" String="Identifier"/><Annotation Term="UI.ControlHint" String="ReadOnly"/></Property><Property Name="Meta.MongoId" Type="Server.ObjectID2"/><Property Name="myType" Type="Server.myType"/><Property Name="p0" Type="Edm.Binary" Nullable="true"/><Property Name="p1" Type="Edm.Boolean"/><Property Name="p2" Type="Edm.Byte"/><Property Name="p3" Type="Edm.Date"/><Property Name="p4" Type="Edm.DateTimeOffset"/><Property Name="p5" Type="Edm.Decimal"/><Property Name="p6" Type="Edm.Double"/><Property Name="p7" Type="Edm.Duration"/><Property Name="p8" Type="Edm.Guid"/><Property Name="p9" Type="Edm.Int16" Nullable="false"/><Property Name="p10" Type="Edm.Int32" Nullable="false"/><Property Name="p11" Type="Edm.Int64"/><Property Name="p12" Type="Edm.SByte"/><Property Name="p13" Type="Edm.Single"/><Property Name="p14" Type="Edm.Stream"/><Property Name="p15" Type="Edm.String"/><Property Name="p16" Type="Edm.TimeOfDay"/><Property Name="p17" Type="Edm.Geography"/><Property Name="p18" Type="Edm.GeographyPoint"/><Property Name="p19" Type="Edm.GeographyLineString"/><Property Name="p20" Type="Edm.GeographyPolygon"/><Property Name="p21" Type="Edm.GeographyMultiPoint"/><Property Name="p22" Type="Edm.GeographyMultiLineString"/><Property Name="p23" Type="Edm.GeographyMultiPolygon"/><Property Name="p24" Type="Edm.GeographyCollection"/><Property Name="p25" Type="Edm.Geometry"/><Property Name="p26" Type="Edm.GeometryPoint"/><Property Name="p27" Type="Edm.GeometryLineString"/><Property Name="p28" Type="Edm.GeometryPolygon"/><Property Name="p29" Type="Edm.GeometryMultiPoint"/><Property Name="p30" Type="Edm.GeometryMultiLineString"/><Property Name="p31" Type="Edm.GeometryMultiPolygon"/><Property Name="p32" Type="Edm.GeometryCollection"/><Property Name="p33" Type="Collection(Edm.Binary)" Nullable="true"/><Property Name="p34" Type="Collection(Edm.Boolean)"/><Property Name="p35" Type="Collection(Edm.Byte)"/><Property Name="p36" Type="Collection(Edm.Date)"/><Property Name="p37" Type="Collection(Edm.DateTimeOffset)"/><Property Name="p38" Type="Collection(Edm.Decimal)"/><Property Name="p39" Type="Collection(Edm.Double)"/><Property Name="p40" Type="Collection(Edm.Duration)"/><Property Name="p41" Type="Collection(Edm.Guid)"/><Property Name="p42" Type="Collection(Edm.Int16)"/><Property Name="p43" Type="Collection(Edm.Int32)"/><Property Name="p44" Type="Collection(Edm.Int64)"/><Property Name="p45" Type="Collection(Edm.SByte)"/><Property Name="p46" Type="Collection(Edm.Single)"/><Property Name="p47" Type="Collection(Edm.Stream)"/><Property Name="p48" Type="Collection(Edm.String)"/><Property Name="p49" Type="Collection(Edm.TimeOfDay)"/><Property Name="p50" Type="Collection(Edm.Geography)"/><Property Name="p51" Type="Collection(Edm.GeographyPoint)"/><Property Name="p52" Type="Collection(Edm.GeographyLineString)"/><Property Name="p53" Type="Collection(Edm.GeographyPolygon)"/><Property Name="p54" Type="Collection(Edm.GeographyMultiPoint)"/><Property Name="p55" Type="Collection(Edm.GeographyMultiLineString)"/><Property Name="p56" Type="Collection(Edm.GeographyMultiPolygon)"/><Property Name="p57" Type="Collection(Edm.GeographyCollection)"/><Property Name="p58" Type="Collection(Edm.Geometry)"/><Property Name="p59" Type="Collection(Edm.GeometryPoint)"/><Property Name="p60" Type="Collection(Edm.GeometryLineString)"/><Property Name="p61" Type="Collection(Edm.GeometryPolygon)"/><Property Name="p62" Type="Collection(Edm.GeometryMultiPoint)"/><Property Name="p63" Type="Collection(Edm.GeometryMultiLineString)"/><Property Name="p64" Type="Collection(Edm.GeometryMultiPolygon)"/><Property Name="p65" Type="Collection(Edm.GeometryCollection)"/><Property Name="p66" Type="Edm.Stream"/><Property Name="Complex" Type="Meta.Complex"/><Property Name="ComplexList" Type="Collection(Meta.Complex)"/><Property Name="Genre" Type="Meta.undefined"/><Property Name="Color" Type="Server.Color2"/><NavigationProperty Name="MediaList" Type="Collection(Media.Media)" Partner="Meta"/></EntityType><ComplexType Name="Complex"></ComplexType><ComplexType Name="fwd"></ComplexType><EnumType Name="undefined" UnderlyingType="Edm.Int32"><Member Name="__forward__ref__" Value="true"/></EnumType><Action Name="a0" IsBound="true"><Parameter Name="bindingParameter" Type="Meta.Meta"/></Action><Action Name="ControllerAction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Meta.BaseMeta)"/></Action><Function Name="useOdataType" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Meta.BaseMeta)"/><ReturnType Type="Meta.BaseMeta"/></Function></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Server"><EntityType Name="CompoundKey"><Key><PropertyRef Name="bc0"/></Key><Property Name="bc0" Type="Edm.Decimal" Nullable="false"/><Property Name="bc1" Type="Edm.Binary" Nullable="false"/><Property Name="bc2" Type="Edm.Boolean" Nullable="false"/><Property Name="bc3" Type="Edm.Byte" Nullable="false"/><Property Name="bc4" Type="Edm.Guid" Nullable="false"/><Property Name="bc5" Type="Edm.Double" Nullable="false"/></EntityType><EntityType Name="EmptyEntity"></EntityType><EntityType Name="ObjectID2"></EntityType><EntityType Name="Test2"><Key><PropertyRef Name="test"/></Key><Property Name="test" Type="Edm.Int32" Nullable="false"/><Property Name="Genre" Type="Server.Genre2"/></EntityType><EnumType Name="Color2" UnderlyingType="Edm.Int32"><Member Name="Red" Value="0"/><Member Name="Green" Value="1"/><Member Name="Blue" Value="2"/></EnumType><EnumType Name="Genre2" UnderlyingType="Edm.Int64" IsFlags="true"><Member Name="Unknown" Value="0"/><Member Name="Pop" Value="1"/><Member Name="Rock" Value="2"/><Member Name="Metal" Value="3"/><Member Name="Classic" Value="4"/></EnumType><Action Name="enumTypeAction" IsBound="true"><Parameter Name="bindingParameter" Type="Server.EmptyEntity"/><Parameter Name="value" Type="Server.Genre2"/></Action><Action Name="emptyEntityAction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Server.EmptyEntity)"/><Parameter Name="value" Type="Server.Genre2"/></Action><Action Name="ActionImport" IsBound="false"/><Action Name="ActionImportParams" IsBound="false"><Parameter Name="value" Type="Collection(Edm.Int32)"/></Action><Action Name="ServerEnumTypeActionImport" IsBound="false"><Parameter Name="value" Type="Server.Genre2"/></Action><Function Name="enumTypeFunction" IsBound="true"><Parameter Name="bindingParameter" Type="Server.EmptyEntity"/><Parameter Name="value" Type="Server.Genre2"/><ReturnType Type="Server.Genre2"/></Function><Function Name="emptyEntityFunction" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Server.EmptyEntity)"/><Parameter Name="value" Type="Server.Genre2"/><ReturnType Type="Server.Genre2"/></Function><Function Name="ObjId" IsBound="false"><Parameter Name="v" Type="Server.ObjectID2"/><ReturnType Type="Server.ObjectID2"/></Function><Function Name="ServerEnumTypeFunctionImport" IsBound="false"><Parameter Name="value" Type="Server.Genre2"/><ReturnType Type="Server.Genre2"/></Function><EntityContainer Name="ActionImportContainer"><ActionImport Name="ActionImport" Action="Server.ActionImport"/></EntityContainer><EntityContainer Name="Default"><ActionImport Name="ActionImportParams" Action="Server.ActionImportParams"/><ActionImport Name="ServerEnumTypeActionImport" Action="Server.ServerEnumTypeActionImport"/><FunctionImport Name="ObjId" Function="Server.ObjId"/><FunctionImport Name="ServerEnumTypeFunctionImport" Function="Server.ServerEnumTypeFunctionImport"/></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>`)
            );
        });

        it("should return SchemaJsonServer metadata xml", () => {
            expect(beautify(SchemaJsonServer.$metadata().document())).to.equal(
                beautify(`<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="SchemJsonTest"><EntityType Name="Index"><Key><PropertyRef Name="id"/></Key><Property Name="id" Type="Edm.Int64" Nullable="false"/></EntityType><EntityContainer Name="SchemJsonTestContext"><EntitySet Name="SchemJsonTest" EntityType="SchemJsonTest.Index"/></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>`)
            );
        });

        it("should return TypeDefServer metadata xml", () => {
            expect(beautify(TypeDefServer.$metadata().document())).to.equal(
                beautify(`<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Container"></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Controller"><EntityContainer Name="Default"><EntitySet Name="SimpleEntity" EntityType="Default.SimpleEntity"/></EntityContainer></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Default"><EntityType Name="SimpleEntity"><Key><PropertyRef Name="MongoId"/></Key><Property Name="MongoId" Type="Container.ObjectID2" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property></EntityType></Schema></edmx:DataServices></edmx:Edmx>`)
            );
        });

        it("should return EnumServer metadata xml", () => {
            expect(beautify(EnumServer.$metadata().document())).to.equal(
                beautify(`<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Container"></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Controller"><EntityContainer Name="Default"><EntitySet Name="SimpleEntity" EntityType="Default.SimpleEntity"/></EntityContainer></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Default"><EntityType Name="SimpleEntity"><Key><PropertyRef Name="MongoId"/></Key><Property Name="MongoId" Type="Container.MongoId" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property></EntityType></Schema></edmx:DataServices></edmx:Edmx>`)
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
