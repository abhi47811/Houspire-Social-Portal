"use client";

import { useEffect, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SmTask, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  linkedin: "bg-blue-600",
  both: "bg-purple-500",
};

interface TasksByDate {
  [key: string]: SmTask[];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<SmTask[]>([]);
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchCalendarTasks();
  }, [currentDate]);

  async function fetchCalendarTasks() {
    try {
      setLoading(true);
      const client = createClient();

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data, error } = await client
        .from("sm_tasks")
        .select("*")
        .gte("scheduled_at", monthStart.toISOString())
        .lte("scheduled_at", monthEnd.toISOString());

      if (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } else {
        const tasksData = (data || []) as SmTask[];
        setTasks(tasksData);

        // Group tasks by date
        const grouped: TasksByDate = {};
        tasksData.forEach((task) => {
          if (task.scheduled_at) {
            const dateKey = format(new Date(task.scheduled_at), "yyyy-MM-dd");
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push(task);
          }
        });
        setTasksByDate(grouped);
      }
    } catch (error) {
      console.error("Failed to fetch calendar tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (isMobile) {
    return (
      <div className="p-4 md:p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Calendar</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
          </div>

          {/* Mobile List View */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground">
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No tasks scheduled this month
              </div>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                >
                  <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block h-3 w-3 rounded-full",
                          PLATFORM_COLORS[task.platform]
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {task.scheduled_at
                          ? format(new Date(task.scheduled_at), "MMM dd, yyyy")
                          : "Not scheduled"}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

      <Card className="p-6">
        {/* Calendar Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-sm text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrentMonth = isSameDay(
                day,
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  currentDate.getDate()
                )
              )
                ? true
                : day.getMonth() === currentDate.getMonth();
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-24 border rounded-lg p-2 cursor-pointer transition-colors hover:bg-muted",
                    !isCurrentMonth && "bg-muted/50",
                    isTodayDate && "border-blue-500 border-2"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Task Pills */}
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={cn(
                            "truncate rounded px-2 py-1 text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity",
                            PLATFORM_COLORS[task.platform]
                          )}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      </Link>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 border-t pt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", PLATFORM_COLORS.instagram)} />
            <span>Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", PLATFORM_COLORS.linkedin)} />
            <span>LinkedIn</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", PLATFORM_COLORS.both)} />
            <span>Both Platforms</span>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="text-center text-muted-foreground">
          Loading calendar...
        </div>
      )}
    </div>
  );
}
