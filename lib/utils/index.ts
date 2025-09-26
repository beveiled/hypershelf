import { getEdgeParams } from "./flow";
import { assetsEqual, fieldsEqual, shallowPositional } from "./zustand";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export { assetsEqual, fieldsEqual, shallowPositional, getEdgeParams };
