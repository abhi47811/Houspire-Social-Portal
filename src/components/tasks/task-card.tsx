import { SmTask, STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TaskCardProps {
  task: SmTask;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
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

  const initials = task.current_owner
    ? task.current_owner.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Card
      className="p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <div className="space-y-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className={`text-xs ${getPlatformColor()}`}>
            {task.platform === "both" ? "Both" : task.platform}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-xs ${STATUS_COLORS[task.status] || ""}`}
          >
            {STATUS_LABELS[task.status] || task.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {task.current_owner ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.current_owner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {task.current_owner.name}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>
        </div>

        {task.scheduled_at && (
          <div className="text-xs text-muted-foreground pt-1 border-t">
            {formatDate(task.scheduled_at)}
          </div>
        )}
      </div>
    </Card>
  );
}
