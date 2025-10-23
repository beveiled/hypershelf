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
import { HypershelfIcon, pickIcon, VSphereIcon } from "@hypershelf/ui/icons";

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

  const portgroups = useStoreWithEqualityFn(
    useHypershelf,
    (s) =>
      [
        ...new Set(
          s.indexedVMs.map((v) => v.portgroup).filter(Boolean) as string[],
        ),
      ].sort(),
    isEqual,
  );

  const oses = useStoreWithEqualityFn(
    useHypershelf,
    (s) => {
      const prettifyOsName = (os: string): string => {
        if (!os) return "";
        const lowerOs = os.toLowerCase();

        if (lowerOs.includes("windows server 2022"))
          return "Windows Server 2022";
        if (lowerOs.includes("windows server 2019"))
          return "Windows Server 2019";
        if (lowerOs.includes("windows server 2016"))
          return "Windows Server 2016";
        if (lowerOs.includes("windows server 2012"))
          return "Windows Server 2012";
        if (lowerOs.includes("windows server 2008"))
          return "Windows Server 2008";

        if (lowerOs.includes("windows")) {
          return os
            .replace("Microsoft ", "")
            .replace(/ \(\d{2}-bit\)$/, "")
            .trim();
        }

        if (lowerOs.includes("ubuntu")) return "Ubuntu";
        if (lowerOs.includes("kali")) return "Kali Linux";
        if (lowerOs.includes("alpine")) return "Alpine Linux";
        if (lowerOs.includes("arch")) return "Arch Linux";
        if (lowerOs.includes("astra")) return "Astra Linux";
        if (lowerOs.includes("mint")) return "Linux Mint";
        if (lowerOs.includes("redhat") || lowerOs.includes("rhel"))
          return "Red Hat Enterprise Linux";
        if (lowerOs.includes("debian")) {
          const match = /Debian(?: GNU\/Linux)? (\d+(\.\d+)*)/.exec(os);
          return match ? `Debian ${match[1]}` : "Debian";
        }
        if (lowerOs.includes("centos")) {
          const match = /CentOS(?: Linux)? (\d+)/.exec(os);
          return match ? `CentOS ${match[1]}` : "CentOS";
        }
        if (lowerOs.includes("linux")) {
          return os
            .replace("Other ", "")
            .replace(/ \(\d{2}-bit\)$/, "")
            .trim();
        }

        if (lowerOs.includes("mac") || lowerOs.includes("darwin")) {
          const match = /(\d+\.\d+(\.\d+)?)/.exec(os);
          return match ? `macOS ${match[1]}` : "macOS";
        }

        return os.replace(/ \(\d{2}-bit\)$/, "").trim();
      };

      return [...new Set(s.indexedVMs.map((v) => v.guestOs))]
        .sort()
        .filter(Boolean)
        .map((raw) => {
          if (!raw) throw new Error("Unexpected empty OS string");
          return {
            raw: raw,
            pretty: prettifyOsName(raw),
            icon: pickIcon(raw),
          };
        });
    },
    (a, b) =>
      isEqual(
        a.map((o) => o.raw),
        b.map((o) => o.raw),
      ),
  );

  const setFilters = useHypershelf((s) => s.setFilters);

  const queryBuilderFields = useMemo(() => {
    return [
      ...fields
        .filter((f) => f.type !== "markdown")
        .map((f) => ({
          name: f.id,
          value: f.id,
          label: f.name,
          operators: operatorOptions[f.type],
          icon: (
            <div className="relative flex">
              <HypershelfIcon className="text-foreground" />
              <div className="bottom-0 left-0 rounded absolute h-px w-full bg-brand" />
            </div>
          ),
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
        })),
      {
        name: "vsphere__hostname",
        value: "vsphere__hostname",
        label: "FQDN",
        operators: operatorOptions.string,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__cluster",
        value: "vsphere__cluster",
        label: "Кластер",
        operators: operatorOptions.string,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__guestOs",
        value: "vsphere__guestOs",
        label: "Гостевая ОС",
        operators: operatorOptions.select,
        valueEditorType: "multiselect",
        values: oses.map((os) => ({
          label: os.pretty,
          name: os.raw,
          icon: os.icon,
        })) as QueryOption[],
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__cpuCores",
        value: "vsphere__cpuCores",
        label: "Ядра CPU",
        operators: operatorOptions.number,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__memoryMb",
        value: "vsphere__memoryMb",
        label: "RAM (MB)",
        operators: operatorOptions.number,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__ips",
        value: "vsphere__ips",
        label: "IP-адреса",
        operators: operatorOptions.array,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__primaryIp",
        value: "vsphere__primaryIp",
        label: "Основной IP",
        operators: operatorOptions.string,
        valueEditorType: "text",
        icon: <VSphereIcon colored={true} />,
      } as const,
      {
        name: "vsphere__portgroup",
        value: "vsphere__portgroup",
        label: "Портгруппа",
        operators: operatorOptions.select,
        valueEditorType: "multiselect",
        values: portgroups.map((pg) => ({
          label: pg,
          name: pg,
        })) as QueryOption[],
        icon: <VSphereIcon colored={true} />,
      } as const,
    ];
  }, [fields, users, portgroups, oses]);

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
