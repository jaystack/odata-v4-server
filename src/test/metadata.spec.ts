/// <reference types="mocha" />
import { ODataController, ODataServer, ODataProcessor, Edm, odata, ODataStream, createODataServer } from "../lib/index";
import { PassThrough } from "stream";
import { ObjectID } from "mongodb";
const { expect } = require("chai");
const beautify = require("xml-beautifier");

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

    @Edm.EnumType(Edm.ForwardRef(() => Genre))
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
}

export enum Genre {
    Unknown,
    Pop,
    Rock,
    Metal,
    Classic
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
}

export class TestContainer extends Edm.ContainerBase {
    @Edm.Flags
    @Edm.Int64
    @Edm.URLSerialize((value: Genre) => `Server.Genre2'${value || 0}'`)
    @Edm.Serialize(value => `Server.Genre2'${value || 0}'`)
    Genre2 = Genre

    @Edm.String
    @Edm.URLDeserialize((value: string) => new ObjectID(value))
    @Edm.Deserialize(value => new ObjectID(value))
    ObjectID2 = ObjectID

    Test2 = TestEntity
}

@odata.namespace("Controller")
@odata.type(BaseMeta)
// @odata.type(Meta)
export class MetaController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let meta = new Meta();
        meta.Id = 1;
        meta.p0 = 1;
        meta.p1 = true;
        meta.p9 = 9;
        meta.p10 = 10;
        meta.MongoId = new ObjectID();
        return [meta];
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
    // insert( @odata.type() type: string) {

    // }

    @Edm.Action
    ControllerAction() {
        // console.log('ControllerAction');
    }

    @odata.namespace("Functions")
    @Edm.Function(Edm.String)
    ControllerFunction( @Edm.String str: string) {
        return str;
    }
}

@odata.namespace("Controller")
@odata.type(Media)
export class MediaController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let media = new Media();
        media.Id = 1
        return [media];
    }

    @odata.GET()
    findOne( @odata.key() key: number) {
        let media = new Media();
        media.Id = key;
        return media;
    }

    //POST$ref   Meta key == link

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
export class TestEntityController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let te = new TestEntity();
        te.test = 1;
        return [te];
    }

    @odata.method("GET")
    findOneByKeys( @odata.id id: number) {
        let te = new TestEntity();
        te.test = id;
        return te;
    }
}

@odata.namespace("Controller")
@odata.type(EmptyEntity)
export class EmptyEntityController extends ODataController {
    @odata.GET
    findAll( @odata.context __: any, @odata.result ___: any, @odata.stream ____: ODataProcessor) {
        let ee = new EmptyEntity();
        return [ee];
    }
}

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
@odata.controller(EmptyEntity4Controller, 'EmptyEntity4')
@odata.controller(EmptyEntity5Controller, 'EmptyEntity5')
@odata.controller(EmptyEntity6Controller, 'EmptyEntity6')
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
    objid( @Edm.TypeDefinition(ObjectID) v: ObjectID) {
        return v.toHexString();
    }
}

MetaTestServer.create();
MetaTestServer.create(4001);
MetaTestServer.create('/test', 4002);
createODataServer(MetaTestServer, "/test", 4003);

if (typeof describe == "function") {
    describe("Metadata test", () => {
        it("should return metadata xml", () => {
            expect(beautify(MetaTestServer.$metadata().document())).to.equal(
                beautify(`<?xml version="1.0" encoding="UTF-8"?><edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Default"><EntityType Name="Category" OpenType="true"><Key><PropertyRef Name="_id"/></Key><Property Name="_id" Type="Edm.String" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/><Annotation Term="UI.DisplayName" String="Category identifier"/><Annotation Term="UI.ControlHint" String="ReadOnly"/></Property><Property Name="Description" Type="Edm.String"/><Property Name="Name" Type="Edm.String"><Annotation Term="UI.DisplayName" String="Category name"/><Annotation Term="UI.ControlHint" String="ShortText"/></Property><NavigationProperty Name="Products" Type="Collection(Default.Product)" Partner="Category"/><Annotation Term="UI.DisplayName" String="Categories"/></EntityType><EntityType Name="Foobar"><Key><PropertyRef Name="id"/></Key><Property Name="id" Type="Edm.Int32" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property><Property Name="a" Type="Edm.Int16"/><Property Name="foo" Type="Edm.String"/></EntityType><EntityType Name="Image"><Key><PropertyRef Name="Id"/></Key><Property Name="Id" Type="Edm.Int32" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property><Property Name="Filename" Type="Edm.String"/><Property Name="Data" Type="Edm.Stream"/><Property Name="Data2" Type="Edm.Stream"/></EntityType><EntityType Name="Music" HasStream="true"><Key><PropertyRef Name="Id"/></Key><Property Name="Id" Type="Edm.Int32" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/></Property><Property Name="Artist" Type="Edm.String"/><Property Name="Title" Type="Edm.String"/></EntityType><EntityType Name="Object" OpenType="true"></EntityType><EntityType Name="Product"><Key><PropertyRef Name="_id"/></Key><Property Name="_id" Type="Edm.String" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed" Bool="true"/><Annotation Term="UI.DisplayName" String="Product identifier"/><Annotation Term="UI.ControlHint" String="ReadOnly"/></Property><Property Name="CategoryId" Type="Edm.String" Nullable="false"/><Property Name="Discontinued" Type="Edm.Boolean"/><Property Name="Name" Type="Edm.String"><Annotation Term="UI.DisplayName" String="Product title"/><Annotation Term="UI.ControlHint" String="ShortText"/></Property><Property Name="QuantityPerUnit" Type="Edm.String"><Annotation Term="UI.DisplayName" String="Product English name"/><Annotation Term="UI.ControlHint" String="ShortText"/></Property><Property Name="UnitPrice" Type="Edm.Decimal"><Annotation Term="UI.DisplayName" String="Unit price of product"/><Annotation Term="UI.ControlHint" String="Decimal"/></Property><NavigationProperty Name="Category" Type="Default.Category" Partner="Products"/><Annotation Term="UI.DisplayName" String="Products"/></EntityType><EntityType Name="User"><Key><PropertyRef Name="Id"/></Key><Property Name="Id" Type="Edm.Int32" Nullable="false"/><Property Name="Location" Type="Default.Location"/></EntityType><ComplexType Name="Location"><Property Name="City" Type="Edm.String"/><Property Name="Address" Type="Edm.String"/></ComplexType><Action Name="Foo" IsBound="true"><Parameter Name="bindingParameter" Type="Default.Foobar"/></Action><Action Name="Action" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Default.Foobar)"/></Action><Action Name="ActionImport" IsBound="false"/><Action Name="ActionImportParams" IsBound="false"><Parameter Name="value" Type="Edm.Int32"/></Action><Function Name="echo" IsBound="true"><Parameter Name="bindingParameter" Type="Default.Category"/><ReturnType Type="Collection(Edm.String)"/></Function><Function Name="Bar" IsBound="true"><Parameter Name="bindingParameter" Type="Default.Foobar"/><ReturnType Type="Edm.String"/></Function><Function Name="Function" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Default.Foobar)"/><Parameter Name="value" Type="Edm.Int16"/><ReturnType Type="Edm.String"/></Function><Function Name="FunctionMore" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Default.Foobar)"/><Parameter Name="value" Type="Edm.Int64"/><Parameter Name="message" Type="Edm.String"/><ReturnType Type="Edm.String"/></Function><Function Name="getFoo" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Default.Foobar)"/><ReturnType Type="Default.Foobar"/></Function><Function Name="FunctionImport" IsBound="false"><Parameter Name="value" Type="Edm.Int64"/><ReturnType Type="Edm.String"/></Function><Function Name="FunctionImportMore" IsBound="false"><Parameter Name="value" Type="Edm.Int64"/><Parameter Name="message" Type="Edm.String"/><ReturnType Type="Edm.String"/></Function><EntityContainer Name="Default"><EntitySet Name="Users" EntityType="Default.User"/><EntitySet Name="Categories" EntityType="Default.Category"/><EntitySet Name="Products" EntityType="Default.Product"/><EntitySet Name="MusicControllerEntitySet" EntityType="Default.Music"/><EntitySet Name="ImagesControllerEntitySet" EntityType="Default.Image"/><EntitySet Name="BoundOperationEntitySet" EntityType="Default.Foobar"/><EntitySet Name="InlineCountEntitySet" EntityType="Default.Foobar"/><EntitySet Name="AsyncEntitySet" EntityType="Default.Foobar"/><EntitySet Name="GeneratorEntitySet" EntityType="Default.Foobar"/><EntitySet Name="EntitySet" EntityType="Default.Foobar"/><ActionImport Name="ActionImport" Action="Default.ActionImport"/><ActionImport Name="ActionImportParams" Action="Default.ActionImportParams"/><FunctionImport Name="FunctionImport" Function="Default.FunctionImport"/><FunctionImport Name="FunctionImportMore" Function="Default.FunctionImportMore"/></EntityContainer></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Echo"><Function Name="echo" IsBound="true"><Parameter Name="bindingParameter" Type="Default.Foobar"/><Parameter Name="message" Type="Edm.String"/><ReturnType Type="Edm.String"/></Function><Function Name="echoMany" IsBound="true"><Parameter Name="bindingParameter" Type="Default.Foobar"/><Parameter Name="message" Type="Edm.String"/><ReturnType Type="Collection(Edm.String)"/></Function></Schema><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Session"><Action Name="logout" IsBound="true"><Parameter Name="bindingParameter" Type="Collection(Default.User)"/></Action></Schema></edmx:DataServices></edmx:Edmx>`)
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
                        "name": "EmptyEntity6",
                        "kind": "EntitySet",
                        "url": "EmptyEntity6"
                    },
                    {
                        "name": "EmptyEntity5",
                        "kind": "EntitySet",
                        "url": "EmptyEntity5"
                    },
                    {
                        "name": "EmptyEntity4",
                        "kind": "EntitySet",
                        "url": "EmptyEntity4"
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
                    }
                ]
            });
        });
    });
}
