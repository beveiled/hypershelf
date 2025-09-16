import { QueryBuilderShadcnUi } from "@/components/querybuilder";
import { api } from "@/convex/_generated/api";
import { AssetType, FieldType } from "@/convex/schema";
import { FunctionReturnType } from "convex/server";
import { add_operation, apply as jlApply } from "json-logic-js";
import { Dispatch, SetStateAction, useMemo } from "react";
import QueryBuilder, {
  Operator,
  Option as QueryOption,
  RuleGroupType,
  type ValueEditorType,
  formatQuery,
  jsonLogicAdditionalOperators,
} from "react-querybuilder";

export type RowData = { asset: AssetType };

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
  defaultOperators.map(op => [op.name, op]),
);

const pick = (names: Operator["name"][]): Operator[] =>
  names.map(n => {
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

export function useQueryPredicate(filters: RuleGroupType | undefined) {
  return useMemo(() => {
    if (!filters) return () => true;
    return (row: RowData) =>
      jlApply(formatQuery(filters, "jsonlogic"), row.asset.metadata);
  }, [filters]);
}

export function HyperQueryBuilder({
  fields,
  users,
  filters,
  setFilters,
}: {
  fields: { field: FieldType }[] | null;
  users: FunctionReturnType<typeof api.users.get>["users"];
  filters: RuleGroupType | undefined;
  setFilters: Dispatch<SetStateAction<RuleGroupType | undefined>>;
}) {
  const queryBuilderFields = useMemo(() => {
    if (!fields || !users) return [];

    return fields.map(f => ({
      name: f.field._id,
      value: f.field._id,
      label: f.field.name,
      operators: operatorOptions[f.field.type],
      valueEditorType:
        f.field.type === "array"
          ? customFieldTypeToQueryBuilderMap[
              (f.field.extra?.listObjectType ?? "string") as Exclude<
                FieldType["type"],
                "array"
              > &
                NonNullable<FieldType["extra"]>["listObjectType"]
            ]
          : customFieldTypeToQueryBuilderMap[f.field.type],
      ...(f.field.type === "user" && {
        values: users.map(u => ({
          name: u.email,
          label: u.email,
        })) as QueryOption[],
      }),
      ...(f.field.type === "select" && {
        values: f.field.extra?.options?.map(o => ({
          label: o,
          name: o,
        })) as QueryOption[],
      }),
      ...(f.field.type === "array" &&
        f.field.extra?.listObjectType === "select" && {
          values: f.field.extra?.options?.map(o => ({
            label: o,
            name: o,
          })) as QueryOption[],
        }),
      ...(f.field.type === "array" &&
        f.field.extra?.listObjectType === "user" && {
          values: users.map(u => ({
            name: u.email,
            label: u.email,
          })) as QueryOption[],
        }),
    }));
  }, [fields, users]);

  return (
    <QueryBuilderShadcnUi>
      <QueryBuilder
        fields={queryBuilderFields}
        query={filters}
        onQueryChange={setFilters}
      />
    </QueryBuilderShadcnUi>
  );
}
