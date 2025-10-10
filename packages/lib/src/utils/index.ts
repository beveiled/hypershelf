import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { assetsEqual, fieldsEqual, filtersEqual } from "./zustand";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export { assetsEqual, fieldsEqual, filtersEqual };
