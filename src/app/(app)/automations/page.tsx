'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  trigger_conditions: Record<string, unknown> | null;
  actions: Record<string, unknown> | null;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AutomationRun {
  id: string;
  automation_id: string;
  trigger_event: string;
  trigger_data: Record<string, unknown> | null;
  actions_executed: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

const TRIGGER_EVENTS = [
  { value: 'task_status_changed', label: 'Task Status Changed' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_assigned', label: 'Task Assigned' },
  { value: 'task_published', label: 'Task Published' },
  { value: 'deadline_approaching', label: 'Deadline Approaching' },
  { value: 'review_requested', label: 'Review Requested' },
];

const defaultForm = {
  name: '',
  description: '',
  trigger_event: 'task_status_changed',
  is_active: true,
};

export default function AutomationsPage() {
  const { user, loading: userLoading } = useUser();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAutomations, setUpdatingAutomations] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;
    fetchAutomations();
  }, [userLoading]);

  useEffect(() => {
    if (!selectedAutomation) return;
    fetchRuns(selectedAutomation.id);
  }, [selectedAutomation]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('sm_automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAutomations(data || []);
      if ((data || []).length > 0 && !selectedAutomation) {
        setSelectedAutomation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async (automationId: string) => {
    try {
      const { data, error } = await supabase
        .from('sm_automation_runs')
        .select('*')
        .eq('automation_id', automationId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setAutomationRuns(data || []);
    } catch (error) {
      console.error('Error fetching automation runs:', error);
    }
  };

  const toggleAutomationActive = async (automationId: string, currentState: boolean) => {
    setUpdatingAutomations((prev) => new Set(prev).add(automationId));
    try {
      const { error } = await supabase
        .from('sm_automations')
        .update({ is_active: !currentState })
        .eq('id', automationId);
      if (error) throw error;
      setAutomations((prev) =>
        prev.map((a) => (a.id === automationId ? { ...a, is_active: !currentState } : a))
      );
      if (selectedAutomation?.id === automationId) {
        setSelectedAutomation({ ...selectedAutomation, is_active: !currentState });
      }
    } catch (error) {
      console.error('Error updating automation:', error);
    } finally {
      setUpdatingAutomations((prev) => {
        const next = new Set(prev);
        next.delete(automationId);
        return next;
      });
    }
  };

  const openCreate = () => {
    setEditingAutomation(null);
    setFormData(defaultForm);
    setShowDialog(true);
  };

  const openEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || '',
      trigger_event: automation.trigger_event,
      is_active: automation.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingAutomation) {
        const { error } = await supabase
          .from('sm_automations')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingAutomation.id);
        if (error) throw error;
        setAutomations((prev) =>
          prev.map((a) => (a.id === editingAutomation.id ? { ...a, ...formData } : a))
        );
        if (selectedAutomation?.id === editingAutomation.id) {
          setSelectedAutomation({ ...selectedAutomation, ...formData });
        }
      } else {
        const { data, error } = await supabase
          .from('sm_automations')
          .insert({
            ...formData,
            created_by: user?.id,
            actions: [],
            trigger_conditions: {},
          })
          .select()
          .single();
        if (error) throw error;
        setAutomations((prev) => [data, ...prev]);
        setSelectedAutomation(data);
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Save automation error:', error);
      alert('Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (automationId: string) => {
    if (!confirm('Delete this automation? This cannot be undone.')) return;
    setDeleting(automationId);
    try {
      const { error } = await supabase.from('sm_automations').delete().eq('id', automationId);
      if (error) throw error;
      setAutomations((prev) => prev.filter((a) => a.id !== automationId));
      if (selectedAutomation?.id === automationId) {
        const remaining = automations.filter((a) => a.id !== automationId);
        setSelectedAutomation(remaining[0] ?? null);
      }
    } catch (error) {
      console.error('Delete automation error:', error);
      alert('Failed to delete automation');
    } finally {
      setDeleting(null);
    }
  };

  const getRunStatusVariant = (run: AutomationRun): 'default' | 'destructive' | 'secondary' =>
    run.success ? 'default' : 'destructive';

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Automations</h1>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Automation
          </Button>
        )}
      </div>

      {automations.length === 0 ? (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>No Automations Yet</CardTitle>
            <CardDescription>
              Automations trigger actions automatically when events happen — like sending a notification when a task is assigned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Automation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8">
          {/* Automations Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Automations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {automations.map((automation) => (
                <Card
                  key={automation.id}
                  className={`cursor-pointer transition-colors ${
                    selectedAutomation?.id === automation.id
                      ? 'border-primary ring-1 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAutomation(automation)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{automation.name}</CardTitle>
                      <Switch
                        checked={automation.is_active}
                        disabled={updatingAutomations.has(automation.id) || !isAdmin}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAutomationActive(automation.id, automation.is_active);
                        }}
                      />
                    </div>
                    <CardDescription className="text-xs line-clamp-2">
                      {automation.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {TRIGGER_EVENTS.find((t) => t.value === automation.trigger_event)?.label ||
                          automation.trigger_event}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {automation.run_count} runs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Automation Detail */}
          {selectedAutomation && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedAutomation.name}</CardTitle>
                    <CardDescription>{selectedAutomation.description}</CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(selectedAutomation)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={deleting === selectedAutomation.id}
                        onClick={() => handleDelete(selectedAutomation.id)}
                      >
                        {deleting === selectedAutomation.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="runs">Run History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h3 className="font-semibold mb-1">Trigger Event</h3>
                        <Badge variant="outline">
                          {TRIGGER_EVENTS.find((t) => t.value === selectedAutomation.trigger_event)?.label ||
                            selectedAutomation.trigger_event}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Status</h3>
                        <Badge variant={selectedAutomation.is_active ? 'default' : 'secondary'}>
                          {selectedAutomation.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Total Runs</h3>
                        <p className="text-muted-foreground">{selectedAutomation.run_count} execution(s)</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Last Run</h3>
                        <p className="text-muted-foreground">
                          {selectedAutomation.last_run_at
                            ? formatRelativeTime(selectedAutomation.last_run_at)
                            : 'Never'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Created</h3>
                        <p className="text-muted-foreground">{formatDate(selectedAutomation.created_at)}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="runs" className="mt-4">
                    {automationRuns.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No automation runs yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {automationRuns.map((run) => (
                            <TableRow key={run.id}>
                              <TableCell className="text-sm">{formatRelativeTime(run.created_at)}</TableCell>
                              <TableCell>
                                <Badge variant={getRunStatusVariant(run)}>
                                  {run.success ? 'success' : 'failed'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {run.duration_ms ? `${run.duration_ms}ms` : '–'}
                              </TableCell>
                              <TableCell className="text-xs text-red-600 max-w-xs truncate">
                                {run.error_message || '–'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAutomation ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
            <DialogDescription>
              {editingAutomation
                ? 'Update the automation details below.'
                : 'Set up a new automation to run when events happen.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="auto-name">Name *</Label>
              <Input
                id="auto-name"
                placeholder="e.g. Notify on task assignment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="auto-desc">Description</Label>
              <Input
                id="auto-desc"
                placeholder="What does this automation do?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="auto-trigger">Trigger Event</Label>
              <select
                id="auto-trigger"
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={formData.trigger_event}
                onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
              >
                {TRIGGER_EVENTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Active immediately</Label>
            </div>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingAutomation ? 'Save Changes' : 'Create Automation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
