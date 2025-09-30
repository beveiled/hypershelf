import { AssetType, ExtendedAssetType, FieldType } from "@/convex/schema";
import { isEqual } from "lodash";
import { RuleGroupType } from "react-querybuilder";

const compareMetadata = (
  a: AssetType["metadata"],
  b: AssetType["metadata"],
) => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka)
      if (
        !Object.is(
          a[k as keyof AssetType["metadata"]],
          b[k as keyof AssetType["metadata"]],
        )
      )
        return false;
    return true;
  }
  return false;
};

const compareLocks = (
  a: ExtendedAssetType["locks"] | undefined,
  b: ExtendedAssetType["locks"] | undefined,
) => {
  if (Object.is(a, b)) return true;
  if ((!a && b) || (a && !b)) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const lockA = a[i];
    const lockB = b[i];
    if (
      lockA.fieldId !== lockB.fieldId ||
      lockA.holder?.id !== lockB.holder?.id
    ) {
      return false;
    }
  }
  return true;
};

export const assetsEqual = (a: ExtendedAssetType, b: ExtendedAssetType) => {
  if (a.asset._id !== b.asset._id) return false;
  return (
    compareMetadata(a.asset.metadata ?? {}, b.asset.metadata ?? {}) &&
    compareLocks(a.locks, b.locks)
  );
};

export const fieldsEqual = (a: FieldType, b: FieldType) => {
  const compare_keys = ["_id", "slug", "name", "type", "required"];
  if (a.editingBy !== b.editingBy) return false;
  for (const key of compare_keys) {
    if (!Object.is(a[key as keyof FieldType], b[key as keyof FieldType]))
      return false;
  }
  if (a.extra && b.extra) {
    const aExtraKeys = Object.keys(a.extra);
    const bExtraKeys = Object.keys(b.extra);
    if (aExtraKeys.length !== bExtraKeys.length) return false;
    if (aExtraKeys.some(key => !bExtraKeys.includes(key))) return false;
    if (bExtraKeys.some(key => !aExtraKeys.includes(key))) return false;
    for (const key of aExtraKeys) {
      if (
        !Object.is(
          a.extra[key as keyof FieldType["extra"]],
          b.extra[key as keyof FieldType["extra"]],
        )
      )
        return false;
    }
  } else if (a.extra || b.extra) {
    return false;
  }
  return true;
};

const omitId = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(omitId);
  }
  if (obj && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = obj as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, omitId(value)]),
    );
  }
  return obj;
};

export const filtersEqual = (
  a: RuleGroupType | null,
  b: RuleGroupType | null,
) => {
  return isEqual(omitId(a), omitId(b));
};
