'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-gray-100 text-gray-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-purple-100 text-purple-800',
};

const ITEMS_PER_PAGE = 25;

export default function AuditPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [uniqueEntityTypes, setUniqueEntityTypes] = useState<string[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    fetchLogs();
    fetchFilters();
  }, [user, currentPage, actionFilter, entityTypeFilter, userFilter, dateFilter]);

  const fetchFilters = async () => {
    try {
      const { data: allLogs } = await supabase
        .from('sm_audit_log')
        .select('action, entity_type, user:sm_users(id,name,email)', {
          count: 'exact',
        });

      if (allLogs) {
        const actions = Array.from(
          new Set(allLogs.map((log: any) => log.action).filter(Boolean))
        ) as string[];
        const entityTypes = Array.from(
          new Set(
            allLogs.map((log: any) => log.entity_type).filter(Boolean)
          )
        ) as string[];
        const users = Array.from(
          new Map(
            allLogs
              .filter((log: any) => log.user)
              .map((log: any) => [log.user.id, log.user])
          ).values()
        ) as Array<{ id: string; name: string; email: string }>;

        setUniqueActions(actions);
        setUniqueEntityTypes(entityTypes);
        setUniqueUsers(users);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('sm_audit_log')
        .select('*, user:sm_users(id,name,email)', { count: 'exact' });

      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      if (entityTypeFilter) {
        query = query.eq('entity_type', entityTypeFilter);
      }
      if (userFilter) {
        query = query.eq('user_id', userFilter);
      }
      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(
          currentPage * ITEMS_PER_PAGE,
          (currentPage + 1) * ITEMS_PER_PAGE - 1
        );

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const renderDiff = (oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null) => {
    if (!oldValues && !newValues) return <span className="text-muted-foreground">No changes recorded</span>;

    const changes = [];
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of Array.from(allKeys)) {
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];

      if (oldVal !== newVal) {
        changes.push(
          <div key={key} className="text-sm space-y-1">
            <p className="font-semibold">{key}</p>
            {oldVal !== undefined && (
              <p className="text-red-600">
                <span className="font-mono text-xs">- {String(oldVal)}</span>
              </p>
            )}
            {newVal !== undefined && (
              <p className="text-green-600">
                <span className="font-mono text-xs">+ {String(newVal)}</span>
              </p>
            )}
          </div>
        );
      }
    }

    return changes.length > 0 ? (
      <div className="space-y-2">{changes}</div>
    ) : (
      <span className="text-muted-foreground">No changes recorded</span>
    );
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Access Denied</CardTitle>
          <CardDescription className="text-red-800">
            You do not have permission to view the audit log. Only administrators can access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          Track all system actions and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {uniqueEntityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>
            Showing {logs.length} of {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <TableCell className="text-sm">
                          <div>{formatDate(log.created_at)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {log.user?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.user?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-mono text-xs">{log.entity_type}</div>
                          <div className="text-muted-foreground">
                            ID: {log.entity_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.old_values || log.new_values ? (
                            <Badge variant="outline">View</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              None
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedLog.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">User</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLog.user?.email}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Action</h3>
                    <Badge
                      className={ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-800'}
                    >
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Entity Type</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.entity_type}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Entity ID</h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {selectedLog.entity_id}
                    </p>
                  </div>
                </div>

                {selectedLog.ip_address && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1">IP Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.ip_address}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-sm mb-3">Changes</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-4">
                    {renderDiff(selectedLog.old_values, selectedLog.new_values)}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
