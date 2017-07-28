# Test cases

* ~~Inherited ODataController: LogsController extends InMemoryController{}~~
* ~~Type definition URL deserializer (to handle ObjectID conversion from Edm.String to ObjectID instance)~~
* ~~Type definition URL serializer (to handle ObjectID conversion from ObjectID to Edm.String as entity key)~~
* ~~Type definition with @odata.type property to define type name, without using Edm.ContainerBase~~
* ~~Type definition in Edm.ContainerBase and use full name for type name, like 'Sytem.ObjectID'~~
* ~~Type definition with new schema namespace in server~~
* ~~Same as above 3 for EnumTypes~~
* More inheritance test cases
* ~~Entity and entity collection bound function with entity type as return type~~
* ~~Entity and entity collection bound function with enum and type definition parameters~~
* ~~Entity and entity collection bound action with parameters~~
* ~~More enum types and type definitions~~
* ~~@odata.type as action/function parameter~~
* ~~Use @odata.method('methodname', 'navprop')~~
* ~~Use @odata.link('keyname')~~
* ~~Use @odata.id~~
* ~~Use .define() to define models, controllers, server, see es6.js example~~
* ~~Create HTTP Accept headers tests~~
* ~~Throw NotImplementedError~~
* ~~Use controller class static .on() like @odata.GET, etc.~~
* ~~Use controller class static .enableFilter() like @odata.filter~~
* ~~Enum type on inherited entity type~~
* ~~Enum type as action/function parameters~~
* ~~Type definition on inherited entity type~~
* ~~Multi-level inheritance for Edm.Container~~ 
* ~~Use server .execute() with context object as first parameter~~
* ~~Use server as stream~~
* ~~Use server static .addController() like @odata.controller~~
* ~~Use metadata JSON for public $metadata definition, like in the bigdata.ts example~~
* ~~Use HTTP header OData-MaxVersion with less than 4.0~~
* ~~Use HTTP Accept headers with text/html, */*, some xml and an unsupported type~~
* ~~Try to use OData query parameters on service document, expect 500 Unsupported query error~~
* ~~Start server on specific hostname (localhost)~~
* ~~Set some HTTP headers and response status code in controller or action/function import~~
* ~~Use $select OData query, expect @odata.context to be valid based on selection~~
* ~~Use resource path like Categories(1)/Products(1)~~
* ~~PUT handler in ODataController implement upsert, return entity if it was an insert, return null/undefined/void if it was an update~~
* ~~Use $count on empty result set~~
* ~~Use $count with bad result set~~
* ~~Use @odata.key aliases (different key and parameter name)~~
* ~~Use $value on primitive property~~
* ~~Use $value on stream property~~
* ~~Use @odata.GET.$ref~~
* ~~Use @odata.link aliases~~
* ~~Use generator function and Promise result in $ref handler~~
* ~~Use advanced generator functions returning Promise, stream or another generator function~~
* Use stream result when using $expand
* ~~Try to access non-existent entity set~~
* ~~Implement inline count for stream result with @odata.count or inlinecount~~
* Use navigation property on stream result
* ~~Use HTTP Accept header including odata.metadata=full|none~~
* ~~Implement navigation property with @odata.GET('navprop')~~
* ~~Implement navigation property POST (to insert into a navigation property set)~~
* ~~Implement unexposed controllers (without a public entity set, available on a navigation property)~~
* ~~Implement primitive property DELETE with PATCH handler~~
* More Edm.Stream properties test cases, like /Data/$value
* Test $expand with subquery, multiple cases
* ~~POST new entity to entity set using inheritance~~
* ~~Implement deserializer using @Edm.Deserializer to deserialize POST body~~
* ~~Include @odata field in POST body~~
* ~~Implement action/function with generator function and stream as result (like Fetch in stream.ts example)~~
* ~~Use $count after stream result set (Categories(1)/Products/$count)~~
* ~~Use @odata.type as function pointer in inheritance result set~~
* ~~Use $expand with single entity~~
* ~~Use $expand with HTTP Accept header odata.metadata=full, expect @odata.associationLink and @odata.navigationLink in result~~
* Use ODataStream class for Edm.Stream property implementation
* Use ODataResult static Created, Ok, NoContent directly