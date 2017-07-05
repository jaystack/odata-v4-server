import { Edm, odata, ODataController, ODataServer } from "../lib";

@odata.namespace("InheritanceSchema")
export class Category{
    @Edm.Key
    @Edm.Computed
    @Edm.Int32
    id: number;

    @Edm.String
    title: string;

    constructor(title:string){
        this.id = Math.floor(Math.random() * 100);
        this.title = title;
    }
}

@odata.namespace("Default")
export class Subcategory extends Category{
    @Edm.String
    subtitle: string;

    constructor(title:string, subtitle:string){
        super(title);
        this.subtitle = subtitle;
    }
}

@odata.namespace("Default")
export class Subcategory2 extends Category{
    @Edm.String
    subtitle2: string;

    constructor(title:string, subtitle:string){
        super(title);
        this.subtitle2 = subtitle;
    }
}

export class SubcategoryDetails extends Subcategory{
    @Edm.String
    description: string;

    @Edm.Key
    @Edm.Int32
    subid: number

    constructor(title:string, subtitle:string, description:string){
        super(title, subtitle);
        this.description = description;
        this.subid = Math.floor(Math.random() * 100) + 1000;
    }
}

@odata.type(Subcategory)
export class InheritanceController extends ODataController{
    @odata.GET
    all(){
        return [
            { id: 123, title: "Games", "@odata.type": Category },
            new Category("Games"),
            new Subcategory("Games", "Hearthstone"),
            new Subcategory2("Games", "Diablo 3"),
            new SubcategoryDetails("Games", "Diablo 3", "RPG game")
        ];
    }

    @odata.GET
    one(@odata.key _: number, @odata.key __: number){
        return new SubcategoryDetails("Games", "Diablo 3", "RPG game");
    }

    @odata.POST
    insert(@odata.body data:any, @odata.type type:string){
        console.log('@odata.type', type, data);
        return data;
    }
}

@odata.controller(InheritanceController, true)
@odata.controller(InheritanceController, "Inheritance2")
export class InheritanceServer extends ODataServer{}

InheritanceServer.create(3000);