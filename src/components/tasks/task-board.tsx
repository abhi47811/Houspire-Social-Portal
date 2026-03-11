import { SmTask, SmTaskStatus, STATUS_LABELS } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskBoardProps {
  tasks: SmTask[];
  onTaskSelect: (task: SmTask) => void;
}

const COLUMN_CONFIG: {
  title: string;
  statuses: SmTaskStatus[];
}[] = [
  {
    title: "To Do",
    statuses: ["draft", "script_changes_requested"],
  },
  {
    title: "In Review",
    statuses: ["pending_script_review", "pending_final_review"],
  },
  {
    title: "In Production",
    statuses: ["script_approved", "shooting", "pending_edit", "editing"],
  },
  {
    title: "Ready",
    statuses: ["final_approved", "scheduled"],
  },
  {
    title: "Published",
    statuses: ["published", "tracking", "archived"],
  },
];

export function TaskBoard({ tasks, onTaskSelect }: TaskBoardProps) {
  const getTasksForColumn = (statuses: SmTaskStatus[]) => {
    return tasks.filter((task) => statuses.includes(task.status));
  };

  return (
    <div className="w-full h-full overflow-x-auto">
      <div className="grid grid-cols-5 gap-4 p-6 h-full min-w-max md:min-w-full">
        {COLUMN_CONFIG.map((column) => {
          const columnTasks = getTasksForColumn(column.statuses);
          return (
            <div
              key={column.title}
              className="flex flex-col bg-muted/40 rounded-lg border border-border"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background p-4">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  {columnTasks.length}
                </span>
              </div>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-3 p-4">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskSelect(task)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
