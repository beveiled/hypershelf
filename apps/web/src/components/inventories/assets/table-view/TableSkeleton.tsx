import { cn } from "@hypershelf/lib/utils";
import { Skeleton } from "@hypershelf/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hypershelf/ui/primitives/table";

export function TableSkeleton() {
  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border">
      <Table className="table-auto">
        <TableHeader className="top-0 sticky z-[100]">
          <TableRow className="h-8 relative hover:bg-transparent">
            {Array.from({ length: 10 }).map((_, index) => (
              <TableHead
                key={index}
                className={cn(
                  "h-4 w-16",
                  index > 0 && "border-l border-border",
                )}
              >
                <Skeleton className="h-4 w-full rounded-md" />
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
                  className={cn(
                    "h-4 w-16",
                    cellIndex > 0 && "border-l border-border",
                  )}
                >
                  <Skeleton className="h-4 rounded w-full bg-accent/60" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
