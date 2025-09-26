import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function TableSkeleton() {
  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-auto overscroll-none rounded-md border">
      <Table className="table-auto">
        <TableHeader className="sticky top-0 z-[100]">
          <TableRow className="relative h-8 hover:bg-transparent">
            {Array.from({ length: 10 }).map((_, index) => (
              <TableHead
                key={index}
                className={cn(
                  "h-4 w-16",
                  index > 0 && "border-border border-l",
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
                    cellIndex > 0 && "border-border border-l",
                  )}
                >
                  <Skeleton className="bg-accent/60 h-4 w-full rounded" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
