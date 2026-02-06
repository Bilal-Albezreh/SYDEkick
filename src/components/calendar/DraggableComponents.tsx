"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DraggableCardProps {
    id: string;
    children: ReactNode;
}

/**
 * DraggableCard - Wraps calendar event cards to make them draggable
 * Visual feedback: opacity 0.5 when dragging
 * CRITICAL: Renders children exactly to preserve existing card design
 */
export function DraggableCard({ id, children }: DraggableCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "touch-none cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50"
            )}
        >
            {children}
        </div>
    );
}

interface DroppableDayProps {
    date: string; // Date key in YYYY-MM-DD format
    children: ReactNode;
    className?: string;
    id?: string; // Optional ID for targeting (e.g., "today-cell")
}

/**
 * DroppableDay - Wraps calendar day cells to make them drop targets
 * Visual feedback: blue highlight when item is dragged over
 */
export function DroppableDay({ date, children, className, id }: DroppableDayProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: date,
    });

    return (
        <div
            id={id}
            ref={setNodeRef}
            className={cn(
                className,
                "transition-colors duration-150",
                isOver && "bg-blue-500/10 ring-2 ring-blue-500/30"
            )}
        >
            {children}
        </div>
    );
}
