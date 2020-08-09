import { schema } from "nexus";

schema.objectType({
  name: "Cluster",
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.cases({ filtering: true, ordering: true });
  },
});

schema.extendType({
  type: "Query",
  definition(t) {
    t.crud.cluster();
    t.crud.clusters({
      filtering: true,
      ordering: true,
    });
  },
});
