"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLabel, todayDateString } from "@/lib/day-filter";

interface DayFilterProps {
  value: string;
  onChange: (date: string) => void;
}

export function DayFilter({ value, onChange }: DayFilterProps) {
  const isToday = value === todayDateString();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="day-filter" className="text-xs text-stone-500">
          Dia
        </Label>
        <Input
          id="day-filter"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-auto"
        />
      </div>
      {!isToday && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(todayDateString())}>
          Hoje
        </Button>
      )}
      <p className="pb-2 text-sm text-stone-500">{formatDateLabel(value)}</p>
    </div>
  );
}
