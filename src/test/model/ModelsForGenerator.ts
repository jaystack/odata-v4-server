import { ObjectID } from "mongodb";
import { Edm } from "../../lib/index";

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

@Edm.Annotate({ term: "UI.DisplayName", string: "GeneratorProduct" })
export class GeneratorProduct {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "ProductPromise identifier" },
        { term: "UI.ControlHint", string: "ReadOnly" }
    )
    _id: ObjectID

    @Edm.String
    @Edm.Required
    @Edm.Convert(toObjectID)
    CategoryId: ObjectID

    @Edm.ForeignKey("CategoryId")
    @Edm.EntityType(Edm.ForwardRef(() => GeneratorCategory))
    @Edm.Partner("GeneratorProduct")
    GeneratorCategory: GeneratorCategory

    @Edm.Boolean
    Discontinued: boolean

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "GeneratorProduct title" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    Name: string

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "GeneratorProduct English name" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    QuantityPerUnit: string

    @Edm.Decimal
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "Unit price of GeneratorProduct" },
        { term: "UI.ControlHint", string: "Decimal" }
    )
    UnitPrice: number
}

@Edm.OpenType
@Edm.Annotate({ term: "UI.DisplayName", string: "GeneratorCategory" })
export class GeneratorCategory {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "GeneratorCategory identifier" },
        { term: "UI.ControlHint", string: "ReadOnly" }
    )
    _id: ObjectID

    @Edm.String
    Description: string

    @Edm.String
    @Edm.Annotate(
        { term: "UI.DisplayName", string: "GeneratorCategory name" },
        { term: "UI.ControlHint", string: "ShortText" }
    )
    Name: string

    @Edm.ForeignKey("CategoryId")
    @Edm.Collection(Edm.EntityType(GeneratorProduct))
    @Edm.Partner("GeneratorCategory")
    GeneratorProducts: GeneratorProduct[]

    @Edm.Collection(Edm.String)
    @Edm.Function
    echo() {
        return ["echotest"];
    }
}