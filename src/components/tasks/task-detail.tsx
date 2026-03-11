"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SmTask,
  SmUser,
  SmTaskStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  formatDate,
} from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface TaskDetailProps {
  task: SmTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment_body: string;
  created_at: string;
  user?: SmUser;
}

export function TaskDetail({
  task: initialTask,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailProps) {
  const [task, setTask] = useState(initialTask);
  const [title, setTitle] = useState(initialTask.title);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<SmUser | null>(null);

  useEffect(() => {
    if (open) {
      setTask(initialTask);
      setTitle(initialTask.title);
      fetchComments();
      fetchCurrentUser();
    }
  }, [open, initialTask]);

  const fetchCurrentUser = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userData } = await supabase
        .from("sm_users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (userData) {
        setCurrentUser(userData);
      }
    }
  };

  const fetchComments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sm_task_comments")
      .select("*, user:user_id(*)")
      .eq("task_id", initialTask.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data || []);
    }
  };

  const updateTaskStatus = async (newStatus: SmTaskStatus) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("sm_tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating task:", error);
    } else {
      setTask({ ...task, status: newStatus });
      onTaskUpdated();
    }
  };

  const updateTaskTitle = async () => {
    if (title === task.title) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("sm_tasks")
      .update({ title })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating task title:", error);
      setTitle(task.title);
    } else {
      setTask({ ...task, title });
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("sm_task_comments").insert({
      task_id: task.id,
      user_id: currentUser.id,
      comment_body: newComment,
    });

    if (error) {
      console.error("Error adding comment:", error);
    } else {
      setNewComment("");
      fetchComments();
    }
    setLoading(false);
  };

  const getNextStatusOptions = (): {
    label: string;
    status: SmTaskStatus;
  }[] => {
    const options: { label: string; status: SmTaskStatus }[] = [];

    switch (task.status) {
      case "draft":
        options.push({ label: "Submit for Review", status: "pending_script_review" });
        break;
      case "pending_script_review":
        options.push(
          { label: "Approve", status: "script_approved" },
          { label: "Request Changes", status: "script_changes_requested" }
        );
        break;
      case "script_changes_requested":
        options.push({ label: "Submit for Review", status: "pending_script_review" });
        break;
      case "script_approved":
        options.push({ label: "Start Shooting", status: "shooting" });
        break;
      case "shooting":
        options.push({ label: "Submit for Edit", status: "pending_edit" });
        break;
      case "pending_edit":
        options.push({ label: "Start Editing", status: "editing" });
        break;
      case "editing":
        options.push({ label: "Submit Final Review", status: "pending_final_review" });
        break;
      case "pending_final_review":
        options.push(
          { label: "Final Approve", status: "final_approved" },
          { label: "Request Changes", status: "script_changes_requested" }
        );
        break;
      case "final_approved":
        options.push({ label: "Schedule", status: "scheduled" });
        break;
      case "scheduled":
        options.push({ label: "Publish Now", status: "published" });
        break;
    }

    return options;
  };

  const getPlatformColor = () => {
    switch (task.platform) {
      case "instagram":
        return "bg-pink-100 text-pink-700";
      case "linkedin":
        return "bg-blue-100 text-blue-700";
      case "both":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const ownerInitials = task.current_owner
    ? task.current_owner.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={updateTaskTitle}
              />
            </div>

            {/* Status Badge */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2">
                <Badge className={STATUS_COLORS[task.status] || ""}>
                  {STATUS_LABELS[task.status] || task.status}
                </Badge>
                {task.category && (
                  <Badge variant="outline">{task.category}</Badge>
                )}
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Badge className={getPlatformColor()}>
                {task.platform === "both" ? "Both Platforms" : task.platform}
              </Badge>
            </div>

            {/* Script/Caption */}
            {(task.script_body || task.caption) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {task.script_body ? "Script" : "Caption"}
                </label>
                <Textarea
                  value={task.script_body || task.caption || ""}
                  readOnly
                  className="resize-none"
                />
              </div>
            )}

            {/* Owner */}
            {task.current_owner && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Owner</label>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.current_owner.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {ownerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{task.current_owner.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.current_owner.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hashtags */}
            {task.hashtags && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Hashtags</label>
                <div className="flex flex-wrap gap-2">
                  {task.hashtags.split(" ").map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Date */}
            {task.scheduled_at && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date</label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(task.scheduled_at)}
                </p>
              </div>
            )}

            {/* Status Transitions */}
            {getNextStatusOptions().length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="flex flex-wrap gap-2">
                  {getNextStatusOptions().map((option) => (
                    <Button
                      key={option.status}
                      size="sm"
                      onClick={() => updateTaskStatus(option.status)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Comments */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Comments</label>

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.user && (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={comment.user.avatar_url || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {comment.user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <p className="text-xs font-medium">
                                {comment.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-sm">{comment.comment_body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              {currentUser && (
                <div className="space-y-2 pt-2 border-t">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={addComment}
                    disabled={!newComment.trim() || loading}
                  >
                    {loading ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
