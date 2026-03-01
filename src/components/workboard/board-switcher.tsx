"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkboardBoard } from "@/components/workboard/types";

type BoardSwitcherProps = {
  boards: WorkboardBoard[];
  value: string;
  onValueChange: (nextBoardId: string) => void;
};

export function BoardSwitcher({
  boards,
  value,
  onValueChange,
}: BoardSwitcherProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full min-w-[220px] md:w-[320px]">
        <SelectValue placeholder="Select board" />
      </SelectTrigger>
      <SelectContent>
        {boards.map((board) => (
          <SelectItem key={board.id} value={board.id}>
            {board.name} {board.type === "user" ? "(My board)" : "(Team board)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
