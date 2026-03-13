"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { SmTask, SmUser } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDetail } from "@/components/tasks/task-detail";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { ChevronDown } from "lucide-react";

type FilterType = "all" | "my-tasks" | "instagram" | "linkedin" | "both";

export default function TasksPage() {
  const { user: currentUser, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<(SmTask & { current_owner?: SmUser })[]>(
    []
  );
  const [selectedTask, setSelectedTask] = useState<SmTask | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!userLoading && currentUser) {
      fetchTasks();
    }
  }, [currentUser, userLoading, filter]);

  const fetchTasks = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("sm_tasks")
      .select("*, current_owner:current_owner_id(*)");

    if (filter === "my-tasks" && currentUser) {
      query = query.eq("current_owner_id", currentUser.id);
    } else if (filter !== "all" && filter in { instagram: 1, linkedin: 1, both: 1 }) {
      query = query.eq("platform", filter);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleTaskCreated = () => {
    fetchTasks();
    setIsCreateDialogOpen(false);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setSelectedTask(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Filter: {filter === "all" ? "All" : filter === "my-tasks" ? "My Tasks" : filter}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("my-tasks")}>
                My Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("instagram")}>
                Instagram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("linkedin")}>
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("both")}>
                Both Platforms
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : (
          <TaskBoard tasks={tasks} onTaskSelect={setSelectedTask} />
        )}
      </div>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTaskCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}
