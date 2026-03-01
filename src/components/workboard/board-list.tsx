"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkboardItemsResponse } from "@/components/workboard/types";

type BoardListProps = {
  data: WorkboardItemsResponse | undefined;
  onRowClick: (workItemId: string) => void;
};

export function BoardList({ data, onRowClick }: BoardListProps) {
  const rows = (data?.columns ?? []).flatMap((columnEntry) =>
    columnEntry.items.map((item) => ({
      ...item,
      columnName: columnEntry.column.name,
    }))
  );

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Work item</TableHead>
            <TableHead>Column</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Goal</TableHead>
            <TableHead>Checklist</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onRowClick(row.id)}
            >
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.columnName}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.priority}</Badge>
              </TableCell>
              <TableCell>{row.primary_goal?.title ?? "Unlinked"}</TableCell>
              <TableCell>
                {row.checklist.done}/{row.checklist.total}
              </TableCell>
              <TableCell>{row.due_date ?? "—"}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground text-center"
              >
                No work items in this view.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
