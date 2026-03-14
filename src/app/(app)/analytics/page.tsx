'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DailyMetric {
  id: string;
  workspace_id: string;
  date: string;
  platform: string;
  posts_published: number | null;
  total_impressions: number | null;
  total_reach: number | null;
  total_likes: number | null;
  total_comments: number | null;
  total_shares: number | null;
  total_saves: number | null;
  avg_engagement_rate: number | null;
  follower_count: number | null;
  follower_change: number | null;
  top_post_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Competitor {
  id: string;
  workspace_id: string;
  name: string;
  instagram_handle: string | null;
  linkedin_page_url: string | null;
  website_url: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface CompetitorMetric {
  id: string;
  competitor_id: string;
  snapshot_date: string;
  platform: string;
  follower_count: number | null;
  follower_change: number | null;
  posts_count: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  avg_engagement_rate: number | null;
  top_post_url: string | null;
  top_post_likes: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorMetrics, setCompetitorMetrics] = useState<CompetitorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - period);
        const dateStr = daysAgo.toISOString().split('T')[0];

        const [metricsRes, competitorsRes] = await Promise.all([
          supabase
            .from('sm_daily_metrics')
            .select('*')
            .gte('date', dateStr)
            .order('date', { ascending: true }),
          supabase.from('sm_competitors').select('*'),
        ]);

        if (metricsRes.error) throw metricsRes.error;
        if (competitorsRes.error) throw competitorsRes.error;

        setDailyMetrics(metricsRes.data || []);
        setCompetitors(competitorsRes.data || []);

        // Fetch competitor metrics
        if (competitorsRes.data && competitorsRes.data.length > 0) {
          const { data: cMetrics, error: cError } = await supabase
            .from('sm_competitor_metrics')
            .select('*')
            .gte('snapshot_date', dateStr)
            .order('snapshot_date', { ascending: false });

          if (!cError && cMetrics) {
            setCompetitorMetrics(cMetrics);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, period]);

  // Aggregate KPIs
  const totalImpressions = dailyMetrics.reduce(
    (sum, m) => sum + (m.total_impressions || 0),
    0
  );
  const totalReach = dailyMetrics.reduce(
    (sum, m) => sum + (m.total_reach || 0),
    0
  );
  const avgEngagement =
    dailyMetrics.length > 0
      ? dailyMetrics.reduce((sum, m) => sum + (m.avg_engagement_rate || 0), 0) /
        dailyMetrics.length
      : 0;
  const followerGrowth = dailyMetrics.reduce(
    (sum, m) => sum + (m.follower_change || 0),
    0
  );

  // Chart data - aggregate by date
  const chartDataMap = new Map<string, { date: string; impressions: number; reach: number }>();
  dailyMetrics.forEach((m) => {
    const existing = chartDataMap.get(m.date) || {
      date: m.date,
      impressions: 0,
      reach: 0,
    };
    existing.impressions += m.total_impressions || 0;
    existing.reach += m.total_reach || 0;
    chartDataMap.set(m.date, existing);
  });
  const chartData = Array.from(chartDataMap.values());

  // Engagement by platform
  const platformEngagement = new Map<
    string,
    { platform: string; likes: number; comments: number; shares: number; saves: number }
  >();
  dailyMetrics.forEach((m) => {
    const existing = platformEngagement.get(m.platform) || {
      platform: m.platform,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };
    existing.likes += m.total_likes || 0;
    existing.comments += m.total_comments || 0;
    existing.shares += m.total_shares || 0;
    existing.saves += m.total_saves || 0;
    platformEngagement.set(m.platform, existing);
  });
  const engagementData = Array.from(platformEngagement.values());

  // Get latest competitor metric
  const getLatestCompetitorMetric = (competitorId: string): CompetitorMetric | undefined => {
    return competitorMetrics.find((m) => m.competitor_id === competitorId);
  };

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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your social media performance
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={period === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Impressions</CardDescription>
            <CardTitle className="text-2xl">
              {totalImpressions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reach</CardDescription>
            <CardTitle className="text-2xl">
              {totalReach.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Engagement Rate</CardDescription>
            <CardTitle className="text-2xl">
              {(avgEngagement * 100).toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Follower Growth</CardDescription>
            <CardTitle className="text-2xl">
              {followerGrowth >= 0 ? '+' : ''}
              {followerGrowth.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Impressions & Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="likes" fill="#8884d8" />
                  <Bar dataKey="comments" fill="#82ca9d" />
                  <Bar dataKey="shares" fill="#ffc658" />
                  <Bar dataKey="saves" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Tracking</CardTitle>
          <CardDescription>
            Monitor competitor performance across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <p className="text-center text-gray-500">
              No competitors tracked yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>LinkedIn</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Avg Engagement</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => {
                  const latestMetric = getLatestCompetitorMetric(competitor.id);
                  return (
                    <TableRow key={competitor.id}>
                      <TableCell className="font-medium">
                        {competitor.name}
                      </TableCell>
                      <TableCell>
                        {competitor.instagram_handle || '—'}
                      </TableCell>
                      <TableCell>
                        {competitor.linkedin_page_url ? (
                          <a
                            href={competitor.linkedin_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-[200px]"
                          >
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {latestMetric
                          ? (latestMetric.follower_count || 0).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {latestMetric
                          ? ((latestMetric.avg_engagement_rate || 0) * 100).toFixed(1) + '%'
                          : '—'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {competitor.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
