import { CellSize, DAY_LABELS } from "@/config/constants";
import { useScheduleContext } from "@/hooks/use-schedule-context";
import { DndContext, DragEndEvent, Modifier, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { PropsWithChildren, useCallback } from "react";

function createSnapModifier(): Modifier {
  return ({ transform, containerNodeRect, draggingNodeRect }) => {
    const containerTop = containerNodeRect?.top ?? 0;
    const containerLeft = containerNodeRect?.left ?? 0;
    const containerBottom = containerNodeRect?.bottom ?? 0;
    const containerRight = containerNodeRect?.right ?? 0;

    const { top = 0, left = 0, bottom = 0, right = 0 } = draggingNodeRect ?? {};

    const minX = containerLeft - left + 120 + 1;
    const minY = containerTop - top + 40 + 1;
    const maxX = containerRight - right;
    const maxY = containerBottom - bottom;

    return {
      ...transform,
      x: Math.min(Math.max(Math.round(transform.x / CellSize.WIDTH) * CellSize.WIDTH, minX), maxX),
      y: Math.min(Math.max(Math.round(transform.y / CellSize.HEIGHT) * CellSize.HEIGHT, minY), maxY),
    };
  };
}

const modifiers = [createSnapModifier()];

export const ScheduleDndProvider = ({ children }: PropsWithChildren) => {
  const { setSchedulesMap } = useScheduleContext();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const { x, y } = delta;

      setSchedulesMap((prev) => {
        const next = { ...prev };

        const [tableId, idx] = String(active.id).split(":");
        const index = Number(idx);
        const schedule = next[tableId][index];
        const nowDayIndex = DAY_LABELS.indexOf(schedule.day as (typeof DAY_LABELS)[number]);
        const moveDayIndex = Math.floor(x / 80);
        const moveTimeIndex = Math.floor(y / 30);

        next[tableId][index] = {
          ...next[tableId][index],
          day: DAY_LABELS[nowDayIndex + moveDayIndex],
          range: next[tableId][index].range.map((time) => time + moveTimeIndex),
        };
        return next;
      });
    },
    [setSchedulesMap]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={modifiers}>
      {children}
    </DndContext>
  );
};
