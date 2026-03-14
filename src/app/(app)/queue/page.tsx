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
  workspace_id: string;
  day_of_week: number;
  time_slot: string;
  platform: string;
  is_active: boolean | null;
  label: string | null;
  recommended: boolean | null;
  avg_engagement_rate: number | null;
  created_at: string;
}

interface ScheduleRule {
  id: string;
  workspace_id: string;
  rule_type: string;
  platform: string | null;
  value: Record<string, unknown>;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-800',
  linkedin: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  facebook: 'bg-indigo-100 text-indigo-800',
  tiktok: 'bg-purple-100 text-purple-800',
};

function getRuleName(rule: ScheduleRule): string {
  if (rule.value && typeof rule.value === 'object' && 'name' in rule.value) {
    return String(rule.value.name);
  }
  return rule.rule_type;
}

function getRuleDetail(rule: ScheduleRule, key: string): string {
  if (rule.value && typeof rule.value === 'object' && key in rule.value) {
    const val = rule.value[key];
    if (Array.isArray(val)) return val.join(', ');
    if (val !== null && val !== undefined) return String(val);
  }
  return '—';
}

export default function QueuePage() {
  const { user } = useUser();
  const supabase = createClient();

  const [slots, setSlots] = useState<QueueSlot[]>([]);
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [slotsRes, rulesRes] = await Promise.all([
          supabase
            .from('sm_queue_slots')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('time_slot', { ascending: true }),
          supabase
            .from('sm_schedule_rules')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (slotsRes.error) throw slotsRes.error;
        if (rulesRes.error) throw rulesRes.error;

        setSlots(slotsRes.data || []);
        setRules(rulesRes.data || []);
      } catch (error) {
        console.error('Error fetching queue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const toggleSlotActive = async (slot: QueueSlot) => {
    const newActive = !slot.is_active;
    const { error } = await supabase
      .from('sm_queue_slots')
      .update({ is_active: newActive })
      .eq('id', slot.id);

    if (error) {
      console.error('Error updating slot:', error);
      return;
    }

    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, is_active: newActive } : s))
    );
  };

  const toggleRuleActive = async (rule: ScheduleRule) => {
    const newActive = !rule.is_active;
    const { error } = await supabase
      .from('sm_schedule_rules')
      .update({ is_active: newActive })
      .eq('id', rule.id);

    if (error) {
      console.error('Error updating rule:', error);
      return;
    }

    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: newActive } : r))
    );
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  // Group slots by day
  const slotsByDay: Record<number, QueueSlot[]> = {};
  slots.forEach((slot) => {
    if (!slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week] = [];
    }
    slotsByDay[slot.day_of_week].push(slot);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publishing Queue</h1>
          <p className="text-gray-500 mt-1">
            Manage your publishing schedule and rules
          </p>
        </div>
      </div>

      {/* Queue Slots Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Queue Slots</h2>
        {Object.keys(slotsByDay).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No queue slots configured.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(slotsByDay)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, daySlots]) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="text-lg">{dayNames[Number(day)]}</CardTitle>
                  <CardDescription>{daySlots.length} slot(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium">
                            {slot.time_slot}
                          </span>
                          <Badge
                            className={
                              PLATFORM_COLORS[slot.platform] || 'bg-gray-100 text-gray-800'
                            }
                          >
                            {slot.platform}
                          </Badge>
                          {slot.label && (
                            <span className="text-sm text-gray-600">{slot.label}</span>
                          )}
                          {slot.recommended && (
                            <Badge variant="outline" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                          {slot.avg_engagement_rate != null && (
                            <span className="text-xs text-gray-500">
                              Eng: {((slot.avg_engagement_rate || 0) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <Switch
                              checked={slot.is_active ?? false}
                              onCheckedChange={() => toggleSlotActive(slot)}
                            />
                          ) : (
                            <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                              {slot.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Schedule Rules Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Schedule Rules</h2>
        {rules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No schedule rules configured.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
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
                  {rules.map((rule) => (
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
                              PLATFORM_COLORS[rule.platform] || 'bg-gray-100 text-gray-800'
                            }
                          >
                            {rule.platform}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {rule.value && typeof rule.value === 'object'
                          ? Object.entries(rule.value)
                              .filter(([k]) => k !== 'name')
                              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                              .join(' | ')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Switch
                            checked={rule.is_active ?? false}
                            onCheckedChange={() => toggleRuleActive(rule)}
                          />
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
