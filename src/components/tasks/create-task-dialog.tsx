"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTaskDialogProps {
  onCreated?: () => void;
  onTaskCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTaskDialog({ onCreated, onTaskCreated, open: controlledOpen, onOpenChange }: CreateTaskDialogProps) {
  const supabase = createClient();
  const { user, loading: userLoading } = useUser();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    platform: "instagram" as "instagram" | "linkedin" | "both",
    category: "",
    script_body: "",
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("User not authenticated");
        setLoading(false);
        return;
      }

      if (!formData.title || !formData.category) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("sm_tasks").insert({
        title: formData.title,
        platform: formData.platform,
        category: formData.category,
        script_body: formData.script_body,
        status: "draft",
        created_by: user.id,
      });

      if (error) {
        toast.error(error.message || "Failed to create task");
        setLoading(false);
        return;
      }

      toast.success("Task created successfully");
      setFormData({
        title: "",
        platform: "instagram",
        category: "",
        script_body: "",
      });
      setOpen(false);

      if (onCreated) onCreated();
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Create New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Social Media Task</DialogTitle>
          <DialogDescription>
            Add a new task to your social media workflow
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Monday Engagement Post"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading || userLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value: "instagram" | "linkedin" | "both") =>
                setFormData({ ...formData, platform: value })
              }
              disabled={loading || userLoading}
            >
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              placeholder="e.g., Engagement, Announcement, Tutorial"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={loading || userLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script_body">Script Body</Label>
            <Textarea
              id="script_body"
              placeholder="Enter your script or post content..."
              value={formData.script_body}
              onChange={(e) => setFormData({ ...formData, script_body: e.target.value })}
              disabled={loading || userLoading}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || userLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || userLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
