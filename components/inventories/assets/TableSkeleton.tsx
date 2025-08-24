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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow
} from "@/components/ui/table";

export function TableSkeleton() {
  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border">
      <Table className="table-auto">
        <TableHeader className="sticky top-0 z-[100]">
          <TableRow className="relative h-8 hover:bg-transparent">
            {Array.from({ length: 10 }).map((_, index) => (
              <TableHead
                key={index}
                className={index > 0 ? "border-border border-l" : ""}
              >
                <Skeleton className="h-4 w-16 rounded-md" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="relative">
          {Array.from({ length: 30 }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="h-10">
              {Array.from({ length: 10 }).map((_, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className={cellIndex > 0 ? "border-border border-l" : ""}
                >
                  <Skeleton className="bg-accent/60 h-4 w-16 rounded" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
