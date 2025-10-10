import type {
  Operator,
  Option as QueryOption,
  RuleGroupType,
  ValueEditorType,
} from "react-querybuilder";
import { useMemo } from "react";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import { add_operation } from "json-logic-js";
import { isEqual } from "lodash";
import * as ReactDnD from "react-dnd";
import * as ReactDndBackend from "react-dnd-html5-backend";
import QueryBuilder, {
  jsonLogicAdditionalOperators,
  formatQuery as rqbFormatQuery,
} from "react-querybuilder";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { FieldType } from "@hypershelf/convex/schema";
import { useHypershelf } from "@hypershelf/lib/stores";
import { filtersEqual } from "@hypershelf/lib/utils";

import { QueryBuilderShadcnUi } from "~/components/querybuilder";

const customFieldTypeToQueryBuilderMap: Record<
  Exclude<FieldType["type"], "array"> &
    NonNullable<FieldType["extra"]>["listObjectType"],
  ValueEditorType
> = {
  select: "multiselect",
  boolean: "checkbox",
  date: "text",
  user: "multiselect",
  url: "text",
  ip: "text",
  markdown: "textarea",
  email: "text",
  number: "text",
  string: "text",
};

const defaultOperators = [
  { name: "=", value: "=", label: "=" },
  { name: "!=", value: "!=", label: "!=" },
  { name: "<", value: "<", label: "<" },
  { name: ">", value: ">", label: ">" },
  { name: "<=", value: "<=", label: "<=" },
  { name: ">=", value: ">=", label: ">=" },
  { name: "contains", value: "contains", label: "включает в себя" },
  { name: "beginsWith", value: "beginsWith", label: "начинается с" },
  { name: "endsWith", value: "endsWith", label: "заканчивается на" },
  {
    name: "doesNotContain",
    value: "doesNotContain",
    label: "не включает в себя",
  },
  {
    name: "doesNotBeginWith",
    value: "doesNotBeginWith",
    label: "не начинается с",
  },
  {
    name: "doesNotEndWith",
    value: "doesNotEndWith",
    label: "не заканчивается на",
  },
  { name: "null", value: "null", label: "пустой" },
  { name: "notNull", value: "notNull", label: "не пустой" },
  { name: "in", value: "in", label: "один из" },
  { name: "notIn", value: "notIn", label: "не один из" },
  { name: "between", value: "between", label: "между" },
  { name: "notBetween", value: "notBetween", label: "не между" },
];

const operatorByName = new Map<Operator["name"], Operator>(
  defaultOperators.map((op) => [op.name, op]),
);

const pick = (names: Operator["name"][]): Operator[] =>
  names.map((n) => {
    const op = operatorByName.get(n);
    if (!op) throw new Error(`Unknown operator: ${n}`);
    return op;
  });

const operatorOptions: Record<FieldType["type"], Operator[]> = {
  number: pick([
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "between",
    "notBetween",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
  string: pick([
    "=",
    "!=",
    "contains",
    "doesNotContain",
    "beginsWith",
    "doesNotBeginWith",
    "endsWith",
    "doesNotEndWith",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
  boolean: pick(["="]),
  date: pick([
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "between",
    "notBetween",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
  select: pick(["in", "notIn", "null", "notNull"]),
  user: pick(["in", "notIn", "null", "notNull"]),
  url: pick([
    "=",
    "!=",
    "contains",
    "doesNotContain",
    "beginsWith",
    "doesNotBeginWith",
    "endsWith",
    "doesNotEndWith",
    "null",
    "notNull",
  ]),
  ip: pick([
    "=",
    "!=",
    "beginsWith",
    "doesNotBeginWith",
    "endsWith",
    "doesNotEndWith",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
  markdown: pick([
    "=",
    "!=",
    "contains",
    "doesNotContain",
    "beginsWith",
    "doesNotBeginWith",
    "endsWith",
    "doesNotEndWith",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
  array: pick(["contains", "doesNotContain", "in", "notIn", "null", "notNull"]),
  email: pick([
    "=",
    "!=",
    "contains",
    "doesNotContain",
    "beginsWith",
    "doesNotBeginWith",
    "endsWith",
    "doesNotEndWith",
    "in",
    "notIn",
    "null",
    "notNull",
  ]),
};

Object.entries(jsonLogicAdditionalOperators).forEach(([op, fn]) =>
  add_operation(op, fn),
);

export function formatQuery(filters: RuleGroupType) {
  return rqbFormatQuery(filters, "jsonlogic");
}

export function HyperQueryBuilder() {
  const fields = useStoreWithEqualityFn(
    useHypershelf,
    (s) =>
      Object.values(s.fields)
        .map((f) => f.field)
        .map((f) => ({
          id: f._id,
          name: f.name,
          type: f.type,
          listObjectType: f.extra?.listObjectType,
          options: f.extra?.options,
        })),
    isEqual,
  );

  const users = useStoreWithEqualityFn(
    useHypershelf,
    (s) => Object.entries(s.users).map(([id, email]) => ({ id, email })),
    isEqual,
  );

  const filters = useStoreWithEqualityFn(
    useHypershelf,
    (s) => s.filters ?? { combinator: "and", rules: [] },
    filtersEqual,
  );
  const setFilters = useHypershelf((s) => s.setFilters);

  const queryBuilderFields = useMemo(() => {
    return fields.map((f) => ({
      name: f.id,
      value: f.id,
      label: f.name,
      operators: operatorOptions[f.type],
      valueEditorType:
        f.type === "array"
          ? customFieldTypeToQueryBuilderMap[f.listObjectType ?? "string"]
          : customFieldTypeToQueryBuilderMap[f.type],
      ...(f.type === "user" && {
        values: users.map((u) => ({
          name: u.email,
          label: u.email,
          value: u.id,
        })) as QueryOption[],
      }),
      ...(f.type === "select" && {
        values: f.options?.map((o) => ({
          label: o,
          name: o,
        })) as QueryOption[],
      }),
      ...(f.type === "array" &&
        f.listObjectType === "select" && {
          values: f.options?.map((o) => ({
            label: o,
            name: o,
          })) as QueryOption[],
        }),
      ...(f.type === "array" &&
        f.listObjectType === "user" && {
          values: users.map((u) => ({
            name: u.email,
            label: u.email,
          })) as QueryOption[],
        }),
    }));
  }, [fields, users]);

  return (
    <QueryBuilderShadcnUi>
      <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndBackend }}>
        <QueryBuilder
          fields={queryBuilderFields}
          query={filters}
          onQueryChange={setFilters}
        />
      </QueryBuilderDnD>
    </QueryBuilderShadcnUi>
  );
}
