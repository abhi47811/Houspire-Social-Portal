import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  return (
    <Card className={cn("p-6 border-l-4", color)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
    </Card>
  );
}
