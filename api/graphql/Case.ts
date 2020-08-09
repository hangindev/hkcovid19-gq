import { schema } from "nexus";

schema.objectType({
  name: "Case",
  definition(t) {
    t.model.id();
    t.model.age();
    t.model.reportDate();
    t.model.onsetDate();
    t.model.admissionDate();
    t.model.dischargeDate();
    t.model.deceaseDate();
    t.model.gender();
    t.model.status();
    t.model.classification();
    t.model.isHkResident();
    t.model.confirmed();
    t.model.asymptomatic();
    t.model.buildings({ filtering: true });
  },
});

schema.extendType({
  type: "Query",
  definition(t) {
    t.crud.case();
    t.crud.cases({
      filtering: true,
      ordering: true,
    });
  },
});
