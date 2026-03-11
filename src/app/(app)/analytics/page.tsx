'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { formatDate, formatRelativeTime } from '@/lib/utils';
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
  platform: string;
  date: string;
  followers: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profile_visits: number;
  website_clicks: number;
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  platform: string;
  handle: string;
  follower_count: number;
  avg_engagement_rate: number;
  notes: string | null;
  last_checked_at: string;
}

interface CompetitorMetric {
  id: string;
  competitor_id: string;
  date: string;
  follower_count: number;
  engagement_rate: number;
}

type DateRangeOption = '7' | '30' | '90';

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const [dateRange, setDateRange] = useState<DateRangeOption>('30');
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorMetrics, setCompetitorMetrics] = useState<CompetitorMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (userLoading) return;

    const fetchData = async () => {
      try {
        const daysAgo = getDaysAgo(parseInt(dateRange));

        const [metricsRes, competitorsRes] = await Promise.all([
          supabase
            .from('sm_daily_metrics')
            .select('*')
            .gte('date', daysAgo)
            .order('date', { ascending: true }),
          supabase.from('sm_competitors').select('*'),
        ]);

        if (metricsRes.error) throw metricsRes.error;
        if (competitorsRes.error) throw competitorsRes.error;

        setMetrics(metricsRes.data || []);
        setCompetitors(competitorsRes.data || []);

        if ((competitorsRes.data || []).length > 0) {
          const { data: compMetrics, error: compMetricsError } = await supabase
            .from('sm_competitor_metrics')
            .select('*')
            .gte('date', daysAgo);

          if (compMetricsError) throw compMetricsError;
          setCompetitorMetrics(compMetrics || []);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userLoading, dateRange, supabase]);

  const calculateKPIs = () => {
    const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalReach = metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
    const avgEngagementRate =
      metrics.length > 0 ? (metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / metrics.length).toFixed(2) : '0';
    const followerGrowth =
      metrics.length > 1
        ? metrics[metrics.length - 1].followers - metrics[0].followers
        : 0;

    return {
      totalImpressions,
      totalReach,
      avgEngagementRate,
      followerGrowth,
    };
  };

  const prepareChartData = () => {
    return metrics.map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: m.impressions,
      reach: m.reach,
    }));
  };

  const prepareEngagementData = () => {
    const platformData: { [key: string]: { likes: number; comments: number; shares: number; saves: number } } = {};

    metrics.forEach((m) => {
      if (!platformData[m.platform]) {
        platformData[m.platform] = { likes: 0, comments: 0, shares: 0, saves: 0 };
      }
      platformData[m.platform].likes += m.likes || 0;
      platformData[m.platform].comments += m.comments || 0;
      platformData[m.platform].shares += m.shares || 0;
      platformData[m.platform].saves += m.saves || 0;
    });

    return Object.entries(platformData).map(([platform, data]) => ({
      platform,
      ...data,
    }));
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = calculateKPIs();
  const chartData = prepareChartData();
  const engagementData = prepareEngagementData();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>

        <div className="flex gap-2">
          {(['7', '30', '90'] as DateRangeOption[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
            >
              Last {range} Days
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalReach.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgEngagementRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.followerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpis.followerGrowth >= 0 ? '+' : ''}{kpis.followerGrowth.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impressions and Reach Chart */}
      {chartData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Impressions & Reach Trend</CardTitle>
            <CardDescription>Daily metrics over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="reach" stroke="#8b5cf6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Engagement Breakdown Chart */}
      {engagementData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Engagement Breakdown by Platform</CardTitle>
            <CardDescription>Aggregated engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" stackId="a" fill="#ef4444" />
                <Bar dataKey="comments" stackId="a" fill="#f59e0b" />
                <Bar dataKey="shares" stackId="a" fill="#10b981" />
                <Bar dataKey="saves" stackId="a" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Competitor Comparison */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Comparison</CardTitle>
            <CardDescription>Latest competitor metrics and engagement rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Avg Engagement Rate</TableHead>
                  <TableHead>Last Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>{competitor.platform}</TableCell>
                    <TableCell>{competitor.handle}</TableCell>
                    <TableCell>{competitor.follower_count.toLocaleString()}</TableCell>
                    <TableCell>{competitor.avg_engagement_rate.toFixed(2)}%</TableCell>
                    <TableCell>{formatRelativeTime(competitor.last_checked_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {metrics.length === 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No analytics data available for the selected period.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
