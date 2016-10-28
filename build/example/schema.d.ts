declare var _default: {
    "version": string;
    "dataServices": {
        "schema": ({
            "namespace": string;
            "entityType": {
                "name": string;
                "key": {
                    "propertyRef": {
                        "name": string;
                    }[];
                }[];
                "property": {
                    "name": string;
                    "type": string;
                    "nullable": string;
                }[];
            }[];
            "annotations": {
                "target": string;
                "annotation": {
                    "term": string;
                    "string": string;
                }[];
            }[];
        } | {
            "namespace": string;
            "action": {
                "name": string;
            };
            "entityContainer": {
                "name": string;
                "entitySet": {
                    "name": string;
                    "entityType": string;
                }[];
                "actionImport": {
                    "name": string;
                    "action": string;
                };
            };
        })[];
    };
};
export = _default;
