import { schema } from "nexus";

schema.objectType({
  name: "Building",
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.district();
    t.model.lastDateOfResidenceOfCases();
    t.model.isResidential();
    t.model.cases({ alias: "relatedCases", filtering: true, ordering: true });
  },
});

schema.extendType({
  type: "Query",
  definition(t) {
    t.crud.building();
    t.crud.buildings({
      filtering: true,
      ordering: true,
    });
  },
});
