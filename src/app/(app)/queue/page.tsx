'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface QueueSlot {
  id: string;
  day_of_week: number;
  time_slot: string;
  platform: string;
  is_active: boolean;
  created_at: string;
}

interface ScheduleRule {
  id: string;
  rule_type: string;
  platform: string;
  value: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const PLATFORM_COLORS: { [key: string]: string } = {
  instagram: 'bg-pink-100 text-pink-800',
  facebook: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  tiktok: 'bg-black text-white',
  linkedin: 'bg-blue-600 text-white',
  youtube: 'bg-red-100 text-red-800',
};

export default function QueuePage() {
  const { user, loading: userLoading } = useUser();
  const [queueSlots, setQueueSlots] = useState<QueueSlot[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSlots, setUpdatingSlots] = useState<Set<string>>(new Set());
  const [updatingRules, setUpdatingRules] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;

    const fetchData = async () => {
      try {
        const [slotsRes, rulesRes] = await Promise.all([
          supabase
            .from('sm_queue_slots')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('time_slot', { ascending: true }),
          supabase
            .from('sm_schedule_rules')
            .select('*')
            .order('created_at', { ascending: true }),
        ]);

        if (slotsRes.error) throw slotsRes.error;
        if (rulesRes.error) throw rulesRes.error;

        setQueueSlots(slotsRes.data || []);
        setScheduleRules(rulesRes.data || []);
      } catch (error) {
        console.error('Error fetching queue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userLoading, supabase]);

  const toggleSlotActive = async (slotId: string, currentState: boolean) => {
    setUpdatingSlots((prev) => new Set(prev).add(slotId));
    try {
      const { error } = await supabase
        .from('sm_queue_slots')
        .update({ is_active: !currentState })
        .eq('id', slotId);

      if (error) throw error;
      setQueueSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId ? { ...slot, is_active: !currentState } : slot
        )
      );
    } catch (error) {
      console.error('Error updating queue slot:', error);
    } finally {
      setUpdatingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    }
  };

  const toggleRuleActive = async (ruleId: string, currentState: boolean) => {
    setUpdatingRules((prev) => new Set(prev).add(ruleId));
    try {
      const { error } = await supabase
        .from('sm_schedule_rules')
        .update({ is_active: !currentState })
        .eq('id', ruleId);

      if (error) throw error;
      setScheduleRules((prev) =>
        prev.map((rule) =>
          rule.id === ruleId ? { ...rule, is_active: !currentState } : rule
        )
      );
    } catch (error) {
      console.error('Error updating schedule rule:', error);
    } finally {
      setUpdatingRules((prev) => {
        const next = new Set(prev);
        next.delete(ruleId);
        return next;
      });
    }
  };

  const getRuleName = (rule: ScheduleRule): string => {
    if (rule.value && typeof rule.value === 'object' && 'name' in rule.value) {
      return String(rule.value.name);
    }
    return rule.rule_type || 'Unnamed Rule';
  };

  const getRuleDetail = (rule: ScheduleRule, key: string): string => {
    if (rule.value && typeof rule.value === 'object' && key in rule.value) {
      const val = (rule.value as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    }
    return '-';
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
        <h1 className="text-3xl font-bold">Publishing Queue & Scheduling</h1>
      </div>

      {/* Weekly Queue Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Publishing Queue</CardTitle>
          <CardDescription>
            Manage posting times for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySlotsA = queueSlots.filter(
                (slot) => slot.day_of_week === dayIndex
              );
              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{day}</h3>
                  {daySlotsA.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No queue slots configured
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {daySlotsA.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium">
                              {slot.time_slot}
                            </span>
                            <Badge
                              className={
                                PLATFORM_COLORS[slot.platform.toLowerCase()] ||
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {slot.platform}
                            </Badge>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.is_active}
                                onCheckedChange={() =>
                                  toggleSlotActive(slot.id, slot.is_active)
                                }
                                disabled={updatingSlots.has(slot.id)}
                              />
                              {updatingSlots.has(slot.id) && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          )}
                          {!isAdmin && (
                            <Badge
                              variant={slot.is_active ? 'default' : 'secondary'}
                            >
                              {slot.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isAdmin && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Slot
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Rules</CardTitle>
          <CardDescription>
            Define rules for automatic scheduling and post distribution
          </CardDescription>
          {isAdmin && (
            <Button className="mt-4" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {scheduleRules.length === 0 ? (
            <p className="text-muted-foreground">
              No schedule rules configured.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {getRuleName(rule)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.rule_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.platform ? (
                        <Badge
                          className={
                            PLATFORM_COLORS[rule.platform.toLowerCase()] ||
                            'bg-gray-100 text-gray-800'
                          }
                          variant="secondary"
                        >
                          {rule.platform}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          All
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {rule.value
                          ? Object.keys(rule.value)
                              .filter((k) => k !== 'name')
                              .slice(0, 3)
                              .map(
                                (k) =>
                                  `${k}: ${
                                    Array.isArray((rule.value as Record<string, unknown>)[k])
                                      ? (
                                          (rule.value as Record<string, unknown>)[k] as unknown[]
                                        ).length + ' items'
                                      : String((rule.value as Record<string, unknown>)[k])
                                  }`
                              )
                              .join(', ')
                          : 'No details'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() =>
                              toggleRuleActive(rule.id, rule.is_active)
                            }
                            disabled={updatingRules.has(rule.id)}
                          />
                          {updatingRules.has(rule.id) && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      ) : (
                        <Badge
                          variant={rule.is_active ? 'default' : 'secondary'}
                        >
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface QueueSlot {
  id: string;
  day_of_week: number;
  time_slot: string;
  platform: string;
  is_active: boolean;
  created_at: string;
}

interface ScheduleRule {
  id: string;
  name: string;
  rule_type: string;
  platforms: string[];
  days_of_week: number[];
  times_of_day: string[];
  max_posts_per_day: number;
  min_gap_hours: number;
  is_active: boolean;
  created_at: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PLATFORM_COLORS: { [key: string]: string } = {
  instagram: 'bg-pink-100 text-pink-800',
  facebook: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  tiktok: 'bg-black text-white',
  linkedin: 'bg-blue-600 text-white',
  youtube: 'bg-red-100 text-red-800',
};

export default function QueuePage() {
  const { user, loading: userLoading } = useUser();
  const [queueSlots, setQueueSlots] = useState<QueueSlot[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSlots, setUpdatingSlots] = useState<Set<string>>(new Set());
  const [updatingRules, setUpdatingRules] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;

    const fetchData = async () => {
      try {
        const [slotsRes, rulesRes] = await Promise.all([
          supabase.from('sm_queue_slots').select('*').order('day_of_week', { ascending: true }).order('time_slot', { ascending: true }),
          supabase.from('sm_schedule_rules').select('*').order('created_at', { ascending: true }),
        ]);

        if (slotsRes.error) throw slotsRes.error;
        if (rulesRes.error) throw rulesRes.error;

        setQueueSlots(slotsRes.data || []);
        setScheduleRules(rulesRes.data || []);
      } catch (error) {
        console.error('Error fetching queue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userLoading, supabase]);

  const toggleSlotActive = async (slotId: string, currentState: boolean) => {
    setUpdatingSlots((prev) => new Set(prev).add(slotId));

    try {
      const { error } = await supabase
        .from('sm_queue_slots')
        .update({ is_active: !currentState })
        .eq('id', slotId);

      if (error) throw error;

      setQueueSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId ? { ...slot, is_active: !currentState } : slot
        )
      );
    } catch (error) {
      console.error('Error updating queue slot:', error);
    } finally {
      setUpdatingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    }
  };

  const toggleRuleActive = async (ruleId: string, currentState: boolean) => {
    setUpdatingRules((prev) => new Set(prev).add(ruleId));

    try {
      const { error } = await supabase
        .from('sm_schedule_rules')
        .update({ is_active: !currentState })
        .eq('id', ruleId);

      if (error) throw error;

      setScheduleRules((prev) =>
        prev.map((rule) =>
          rule.id === ruleId ? { ...rule, is_active: !currentState } : rule
        )
      );
    } catch (error) {
      console.error('Error updating schedule rule:', error);
    } finally {
      setUpdatingRules((prev) => {
        const next = new Set(prev);
        next.delete(ruleId);
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
        <h1 className="text-3xl font-bold">Publishing Queue & Scheduling</h1>
      </div>

      {/* Weekly Queue Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Publishing Queue</CardTitle>
          <CardDescription>Manage posting times for each day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const daySlotsA = queueSlots.filter((slot) => slot.day_of_week === dayIndex);

              return (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{day}</h3>

                  {daySlotsA.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No queue slots configured</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {daySlotsA.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium">{slot.time_slot}</span>
                            <Badge
                              className={PLATFORM_COLORS[slot.platform.toLowerCase()] || 'bg-gray-100 text-gray-800'}
                            >
                              {slot.platform}
                            </Badge>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.is_active}
                                onCheckedChange={() => toggleSlotActive(slot.id, slot.is_active)}
                                disabled={updatingSlots.has(slot.id)}
                              />
                              {updatingSlots.has(slot.id) && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          )}

                          {!isAdmin && (
                            <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                              {slot.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isAdmin && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Rules</CardTitle>
          <CardDescription>Define rules for automatic scheduling and post distribution</CardDescription>
          {isAdmin && (
            <Button className="mt-4" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {scheduleRules.length === 0 ? (
            <p className="text-muted-foreground">No schedule rules configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Times</TableHead>
                  <TableHead>Max Posts/Day</TableHead>
                  <TableHead>Min Gap (hrs)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.rule_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            className={PLATFORM_COLORS[platform.toLowerCase()] || 'bg-gray-100 text-gray-800'}
                            variant="secondary"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {rule.days_of_week.length === 7 ? 'All Days' : `${rule.days_of_week.length} days`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rule.times_of_day.length} slot(s)</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rule.max_posts_per_day}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rule.min_gap_hours}</span>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleActive(rule.id, rule.is_active)}
                            disabled={updatingRules.has(rule.id)}
                          />
                          {updatingRules.has(rule.id) && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      ) : (
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
