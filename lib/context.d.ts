import { Provider } from "./provider";
export interface EntityContextConfiguration {
    provider: typeof Provider;
    providerConfiguration: any;
}
export declare class EntityContext {
    provider: Provider;
    configuration: any;
    constructor();
}
export declare class Queryable {
}
export declare class Entity {
    constructor(entity: Object);
}
