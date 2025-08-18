/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { z, ZodError, ZodSchema, ZodTypeAny } from "zod";
import { FieldType, ValueType } from "./schema";
import { Id } from "./_generated/dataModel";

type Extra = NonNullable<FieldType["extra"]>;
type FieldKind = FieldType["type"];

export const buildValuesSchema = (
  fields: FieldType[]
): ZodSchema<Record<string, unknown>> => {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    const { type, required = false, extra = {} } = field;

    let schema: ZodTypeAny;

    if (type === "array") {
      const itemSchema = buildPrimitiveSchema(
        extra.listObjectType ?? "string",
        extra.listObjectExtra || {}
      );

      schema = z.array(itemSchema);

      if (extra.minItems !== undefined && schema instanceof z.ZodArray)
        schema = schema.min(extra.minItems);
      if (extra.maxItems !== undefined && schema instanceof z.ZodArray)
        schema = schema.max(extra.maxItems);
    } else {
      schema = buildPrimitiveSchema(type, extra);
    }

    if (required) {
      schema = schema.refine(
        v =>
          !(typeof v === "string" && v.trim() === "") &&
          v !== undefined &&
          v !== null,
        "Это поле обязательное"
      );
    } else {
      schema = schema.optional();
    }

    shape[field._id] = schema;
  }

  return z.object(shape);
};

export const buildSchema = ({
  type,
  extra,
  required
}: {
  type: FieldType["type"];
  extra?: FieldType["extra"];
  required?: boolean;
}): ZodTypeAny => {
  let schema: ZodTypeAny;
  extra ??= {};

  if (type === "array") {
    const itemSchema = buildPrimitiveSchema(
      extra.listObjectType ?? "string",
      extra.listObjectExtra || {}
    );

    schema = z.array(itemSchema);

    if (extra.minItems !== undefined && schema instanceof z.ZodArray)
      schema = schema.min(extra.minItems);
    if (extra.maxItems !== undefined && schema instanceof z.ZodArray)
      schema = schema.max(extra.maxItems);
  } else {
    schema = buildPrimitiveSchema(type, extra);
  }

  if (required) {
    schema = schema.refine(
      v =>
        !(typeof v === "string" && v.trim() === "") &&
        v !== undefined &&
        v !== null,
      "Это поле обязательное"
    );
  } else {
    schema = schema.optional();
  }
  return schema;
};

const ipInSubnet = (ip: string, subnet: string): boolean => {
  const ipToInt = (ip: string): number => {
    const parts = ip.split(".").map(Number);
    if (
      parts.length !== 4 ||
      parts.some(p => p < 0 || p > 255) ||
      parts.some(isNaN)
    )
      throw new Error("Invalid IP");
    return parts.reduce((acc, part) => (acc << 8) + part, 0);
  };

  const [subnetIp, prefixStr] = subnet.split("/");
  if (!prefixStr) throw new Error("Invalid subnet");
  const prefix = parseInt(prefixStr, 10);
  if (prefix < 0 || prefix > 32) throw new Error("Invalid subnet prefix");

  try {
    const ipInt = ipToInt(ip);
    const subnetInt = ipToInt(subnetIp);
    const mask = prefix === 0 ? 0 : 0xffffffff << (32 - prefix);

    return (ipInt & mask) === (subnetInt & mask);
  } catch {
    return false;
  }
};

const buildPrimitiveSchema = (
  kind: FieldKind | string,
  extra: Extra
): ZodTypeAny => {
  if (extra.options?.length)
    return z.enum([...extra.options] as [string, ...string[]]);

  let schema: ZodTypeAny;

  switch (kind) {
    case "number":
      schema = z.number({
        invalid_type_error: "Значение должно быть числом",
        coerce: true
      });
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "email":
      schema = z.string().email("Кривая почта");
      break;
    case "url":
      schema = z.string().url("Кривая ссылка");
      break;
    case "date":
      schema = z.preprocess(
        v => (typeof v === "string" || v instanceof Date ? new Date(v) : v),
        z.date({
          invalid_type_error: "Значение должно быть датой"
        })
      );
      break;
    case "ip":
      schema = z
        .string()
        .regex(
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([1-2]?[0-9]|3[0-2]))?$/,
          "Кривой IP адрес"
        );
      if (extra.subnet) {
        schema = schema.refine(
          v => ipInSubnet(v, extra.subnet as string),
          `IP адрес должен быть в подсети ${extra.subnet}`
        );
      }
      break;

    default:
      schema = z.string();
  }

  if (schema instanceof z.ZodString) {
    if (extra.regex)
      schema = schema.regex(
        new RegExp(extra.regex),
        extra.regexError || "Значение не соответствует регулярке"
      );
    if (extra.minLength && schema instanceof z.ZodString)
      schema = schema.min(extra.minLength);
    if (extra.maxLength && schema instanceof z.ZodString)
      schema = schema.max(extra.maxLength);
  }

  if (schema instanceof z.ZodNumber) {
    if (extra.minValue !== undefined && schema instanceof z.ZodNumber)
      schema = schema.min(extra.minValue);
    if (extra.maxValue !== undefined && schema instanceof z.ZodNumber)
      schema = schema.max(extra.maxValue);
  }

  return schema;
};

export const validateFields = (
  fields: FieldType[],
  values: Record<Id<"fields">, ValueType>
): Record<string, string> | null => {
  const schema = buildValuesSchema(fields);
  const errors: Record<string, string> = {};

  try {
    schema.parse(values);
  } catch (err) {
    if (err instanceof ZodError) {
      for (const issue of err.issues) {
        if (issue.path.length >= 1 && typeof issue.path[0] === "string") {
          const fieldId = issue.path[0];
          errors[fieldId] = issue.message;
        }
      }
    } else {
      throw err;
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }

  return null;
};

export const validateField = (
  field: {
    type: FieldType["type"];
    extra?: FieldType["extra"];
    required?: boolean;
  },
  value: ValueType
): string | null => {
  const schema = buildSchema(field);
  try {
    schema.parse(value);
  } catch (err) {
    if (err instanceof ZodError) {
      return err.issues[0]?.message || "Неверное значение";
    } else {
      throw err;
    }
  }
  return null;
};
