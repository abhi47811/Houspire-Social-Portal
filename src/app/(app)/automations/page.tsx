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
import { Loader2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export default function AutomationsPage() {
  const { user, loading: userLoading } = useUser();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [selectedAutomation, setSelectedAutomation] =
    useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAutomations, setUpdatingAutomations] = useState<Set<string>>(
    new Set()
  );
  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;

    const fetchAutomations = async () => {
      try {
        const { data, error } = await supabase
          .from('sm_automations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAutomations(data || []);
        if ((data || []).length > 0) {
          setSelectedAutomation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching automations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomations();
  }, [userLoading, supabase]);

  useEffect(() => {
    if (!selectedAutomation) return;

    const fetchRuns = async () => {
      try {
        const { data, error } = await supabase
          .from('sm_automation_runs')
          .select('*')
          .eq('automation_id', selectedAutomation.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setAutomationRuns(data || []);
      } catch (error) {
        console.error('Error fetching automation runs:', error);
      }
    };

    fetchRuns();
  }, [selectedAutomation, supabase]);

  const toggleAutomationActive = async (
    automationId: string,
    currentState: boolean
  ) => {
    setUpdatingAutomations((prev) => new Set(prev).add(automationId));
    try {
      const { error } = await supabase
        .from('sm_automations')
        .update({ is_active: !currentState })
        .eq('id', automationId);

      if (error) throw error;
      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === automationId
            ? { ...auto, is_active: !currentState }
            : auto
        )
      );
      if (selectedAutomation?.id === automationId) {
        setSelectedAutomation({
          ...selectedAutomation,
          is_active: !currentState,
        });
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

  const getRunStatus = (run: AutomationRun): string => {
    return run.success ? 'success' : 'failure';
  };

  const getRunStatusVariant = (
    run: AutomationRun
  ): 'default' | 'destructive' | 'secondary' => {
    return run.success ? 'default' : 'destructive';
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Automations</h1>
      </div>

      {automations.length === 0 ? (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>No Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any automations yet.
            </p>
            {isAdmin && (
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Automation
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
                      ? 'border-primary bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedAutomation(automation)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {automation.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {automation.trigger_event}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2"
                        >
                          <Switch
                            checked={automation.is_active}
                            onCheckedChange={() =>
                              toggleAutomationActive(
                                automation.id,
                                automation.is_active
                              )
                            }
                            disabled={updatingAutomations.has(automation.id)}
                          />
                          {updatingAutomations.has(automation.id) && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {automation.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          automation.is_active ? 'default' : 'secondary'
                        }
                      >
                        {automation.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Runs: {automation.run_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {isAdmin && (
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Automation
              </Button>
            )}
          </div>

          {/* Automation Detail and Runs */}
          {selectedAutomation && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedAutomation.name}</CardTitle>
                <CardDescription>
                  Created {formatDate(selectedAutomation.created_at)}
                  {selectedAutomation.last_run_at && (
                    <>
                      {' '}
                      &bull; Last run{' '}
                      {formatRelativeTime(selectedAutomation.last_run_at)}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="runs">
                      Runs ({automationRuns.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        Description
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAutomation.description}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        Trigger Event
                      </h3>
                      <Badge variant="outline">
                        {selectedAutomation.trigger_event}
                      </Badge>
                    </div>

                    {selectedAutomation.trigger_conditions &&
                      Object.keys(selectedAutomation.trigger_conditions)
                        .length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">
                            Conditions
                          </h3>
                          <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                            {JSON.stringify(
                              selectedAutomation.trigger_conditions,
                              null,
                              2
                            )}
                          </div>
                        </div>
                      )}

                    {selectedAutomation.actions &&
                      Object.keys(selectedAutomation.actions).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">
                            Actions
                          </h3>
                          <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                            {JSON.stringify(
                              selectedAutomation.actions,
                              null,
                              2
                            )}
                          </div>
                        </div>
                      )}

                    <div>
                      <h3 className="font-semibold text-sm mb-1">Status</h3>
                      <Badge
                        variant={
                          selectedAutomation.is_active
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {selectedAutomation.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        Total Runs
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAutomation.run_count} execution(s)
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 mt-6">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="runs" className="mt-4">
                    {automationRuns.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No automation runs yet.
                      </p>
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
                              <TableCell className="text-sm">
                                {formatRelativeTime(run.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRunStatusVariant(run)}>
                                  {getRunStatus(run)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {run.duration_ms
                                  ? `${run.duration_ms}ms`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-xs text-red-600 max-w-xs truncate">
                                {run.error_message || '-'}
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
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
}

interface AutomationRun {
  id: string;
  automation_id: string;
  trigger_data: Record<string, unknown>;
  result: Record<string, unknown>;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  created_at: string;
}

export default function AutomationsPage() {
  const { user, loading: userLoading } = useUser();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAutomations, setUpdatingAutomations] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;

    const fetchAutomations = async () => {
      try {
        const { data, error } = await supabase
          .from('sm_automations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setAutomations(data || []);
        if ((data || []).length > 0) {
          setSelectedAutomation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching automations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomations();
  }, [userLoading, supabase]);

  useEffect(() => {
    if (!selectedAutomation) return;

    const fetchRuns = async () => {
      try {
        const { data, error } = await supabase
          .from('sm_automation_runs')
          .select('*')
          .eq('automation_id', selectedAutomation.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setAutomationRuns(data || []);
      } catch (error) {
        console.error('Error fetching automation runs:', error);
      }
    };

    fetchRuns();
  }, [selectedAutomation, supabase]);

  const toggleAutomationActive = async (automationId: string, currentState: boolean) => {
    setUpdatingAutomations((prev) => new Set(prev).add(automationId));

    try {
      const { error } = await supabase
        .from('sm_automations')
        .update({ is_active: !currentState })
        .eq('id', automationId);

      if (error) throw error;

      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === automationId ? { ...auto, is_active: !currentState } : auto
        )
      );

      if (selectedAutomation?.id === automationId) {
        setSelectedAutomation({
          ...selectedAutomation,
          is_active: !currentState,
        });
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

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Automations</h1>
      </div>

      {automations.length === 0 ? (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>No Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You haven't created any automations yet.</p>
            {isAdmin && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
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
                      ? 'border-primary bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedAutomation(automation)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">{automation.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {automation.trigger_event}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2"
                        >
                          <Switch
                            checked={automation.is_active}
                            onCheckedChange={() =>
                              toggleAutomationActive(automation.id, automation.is_active)
                            }
                            disabled={updatingAutomations.has(automation.id)}
                          />
                          {updatingAutomations.has(automation.id) && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {automation.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                        {automation.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Runs: {automation.run_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isAdmin && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            )}
          </div>

          {/* Automation Detail and Runs */}
          {selectedAutomation && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedAutomation.name}</CardTitle>
                <CardDescription>
                  Created {formatDate(selectedAutomation.created_at)}
                  {selectedAutomation.last_run_at && (
                    <>
                      {' '}
                      • Last run {formatRelativeTime(selectedAutomation.last_run_at)}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="runs">
                      Runs ({automationRuns.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAutomation.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-1">Trigger Event</h3>
                      <Badge variant="outline">{selectedAutomation.trigger_event}</Badge>
                    </div>

                    {Object.keys(selectedAutomation.conditions).length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Conditions</h3>
                        <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(selectedAutomation.conditions, null, 2)}
                        </div>
                      </div>
                    )}

                    {Object.keys(selectedAutomation.actions).length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Actions</h3>
                        <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                          {JSON.stringify(selectedAutomation.actions, null, 2)}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-sm mb-1">Status</h3>
                      <Badge variant={selectedAutomation.is_active ? 'default' : 'secondary'}>
                        {selectedAutomation.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-1">Total Runs</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAutomation.run_count} execution(s)
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 mt-6">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Delete
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="runs" className="mt-4">
                    {automationRuns.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No automation runs yet.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Trigger Data</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {automationRuns.map((run) => (
                            <TableRow key={run.id}>
                              <TableCell className="text-sm">
                                {formatRelativeTime(run.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    run.status === 'success'
                                      ? 'default'
                                      : run.status === 'failure'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {run.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button className="text-xs text-primary hover:underline">
                                  View
                                </button>
                              </TableCell>
                              <TableCell>
                                <button className="text-xs text-primary hover:underline">
                                  View
                                </button>
                              </TableCell>
                              <TableCell className="text-xs text-red-600 max-w-xs truncate">
                                {run.error_message || '-'}
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
    </div>
  );
}
