import { ObjectID } from "mongodb";
import { Edm } from "../../lib/index";

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

@Edm.Annotate({
    term: "UI.DisplayName",
    string: "StreamProduct"
})
export class StreamProduct {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "StreamProduct identifier" },
        { term: "UI.ControlHint", string: "ReadOnly" }
    )
    _id: ObjectID

    @Edm.String
    @Edm.Required
    @Edm.Convert(toObjectID)
    CategoryId: ObjectID

    @Edm.ForeignKey("CategoryId")
    @Edm.Partner("StreamProduct")
    @Edm.EntityType(Edm.ForwardRef(() => StreamCategory))
    StreamCategory: StreamCategory

    @Edm.Boolean
    Discontinued: boolean

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "StreamProduct title" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    Name: string

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "StreamProduct English name" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    QuantityPerUnit: string

    @Edm.Decimal
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Unit price of StreamProduct"
    }, {
            term: "UI.ControlHint",
            string: "Decimal"
        })
    UnitPrice: number
}

@Edm.OpenType
@Edm.Annotate({
    term: "UI.DisplayName",
    string: "StreamCategory"
})
export class StreamCategory {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "StreamCategory identifier" },
        { term: "UI.ControlHint", string: "ReadOnly" }
    )
    _id: ObjectID

    @Edm.String
    Description: string

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "CategoryPromise name" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    Name: string

    @Edm.ForeignKey("CategoryId")
    @Edm.Partner("StreamCategory")
    @Edm.Collection(Edm.EntityType(StreamProduct))
    StreamProducts: StreamProduct[]

    @Edm.Collection(Edm.String)
    @Edm.Function
    echo() { return ["echotest"]; }
}