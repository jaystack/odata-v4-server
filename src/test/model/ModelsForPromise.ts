import { ObjectID } from "mongodb";
import { Edm } from "../../lib/index";

const toObjectID = _id => _id && !(_id instanceof ObjectID) ? ObjectID.createFromHexString(_id) : _id;

@Edm.Annotate({
    term: "UI.DisplayName",
    string: "ProductPromise"
})
export class ProductPromise {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "ProductPromise identifier"
    }, {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID

    @Edm.String
    @Edm.Required
    @Edm.Convert(toObjectID)
    CategoryId:ObjectID

    @Edm.ForeignKey("CategoryId")
    @Edm.EntityType(Edm.ForwardRef(() => CategoryPromise))
    @Edm.Partner("ProductPromise")
    CategoryPromise:CategoryPromise

    @Edm.Boolean
    Discontinued:boolean

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "ProductPromise title"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "ProductPromise English name"
    }, {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    QuantityPerUnit:string

    @Edm.Decimal
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "Unit price of ProductPromise"
    }, {
        term: "UI.ControlHint",
        string: "Decimal"
    })
    UnitPrice:number
}

@Edm.OpenType
@Edm.Annotate({
    term: "UI.DisplayName",
    string: "CategoriesPromise"
})
export class CategoryPromise {
    @Edm.Key
    @Edm.Computed
    @Edm.String
    @Edm.Convert(toObjectID)
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "CategoryPromise identifier"
    },
    {
        term: "UI.ControlHint",
        string: "ReadOnly"
    })
    _id:ObjectID

    @Edm.String
    Description:string

    @Edm.String
    @Edm.Annotate({
        term: "UI.DisplayName",
        string: "CategoryPromise name"
    },
    {
        term: "UI.ControlHint",
        string: "ShortText"
    })
    Name:string

    @Edm.ForeignKey("CategoryId")
    @Edm.Collection(Edm.EntityType(ProductPromise))
    @Edm.Partner("CategoryPromise")
    ProductPromises:ProductPromise[]

    @Edm.Collection(Edm.String)
    @Edm.Function
    echo(){
        return ["echotest"];
    }
}