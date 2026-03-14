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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SmHashtagSet {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  hashtags: string[];
  platform: string | null;
  category: string | null;
  times_used: number | null;
  avg_engagement_rate: number | null;
  avg_reach: number | null;
  best_performing_tag: string | null;
  is_pinned: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SmHashtagAnalytics {
  id: string;
  workspace_id: string;
  hashtag: string;
  platform: string;
  times_used: number | null;
  total_impressions: number | null;
  total_reach: number | null;
  total_engagement: number | null;
  avg_engagement_rate: number | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok'];

export default function HashtagsPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [hashtagSets, setHashtagSets] = useState<SmHashtagSet[]>([]);
  const [analytics, setAnalytics] = useState<SmHashtagAnalytics[]>([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState<SmHashtagAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    hashtags: '',
    platform: '',
    category: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [setsRes, analyticsRes] = await Promise.all([
          supabase
            .from('sm_hashtag_sets')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('sm_hashtag_analytics')
            .select('*')
            .order('avg_engagement_rate', { ascending: false }),
        ]);

        if (setsRes.error) throw setsRes.error;
        if (analyticsRes.error) throw analyticsRes.error;

        setHashtagSets(setsRes.data || []);
        setAnalytics(analyticsRes.data || []);
      } catch (error) {
        console.error('Error fetching hashtag data:', error);
        toast.error('Failed to fetch hashtag data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    let filtered = [...analytics];

    if (analyticsFilter === 'high_engagement') {
      filtered = filtered.filter(
        (a) => (a.avg_engagement_rate || 0) > 0.05
      );
    }

    filtered.sort((a, b) => {
      const aVal = a.avg_engagement_rate || 0;
      const bVal = b.avg_engagement_rate || 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    setFilteredAnalytics(filtered);
  }, [analytics, analyticsFilter, sortAsc]);

  const handleCreateHashtagSet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.name || !formData.hashtags) {
      toast.error('Name and hashtags are required');
      return;
    }

    try {
      setIsCreating(true);

      const hashtags = formData.hashtags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from('sm_hashtag_sets').insert({
        workspace_id: user.id,
        name: formData.name,
        hashtags,
        platform: formData.platform || null,
        category: formData.category || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Hashtag set created successfully');
      setDialogOpen(false);
      setFormData({ name: '', hashtags: '', platform: '', category: '' });

      const { data } = await supabase
        .from('sm_hashtag_sets')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setHashtagSets(data);
    } catch (error) {
      console.error('Error creating hashtag set:', error);
      toast.error('Failed to create hashtag set');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (hashtags: string[]) => {
    navigator.clipboard.writeText(hashtags.join(' '));
    toast.success('Hashtags copied to clipboard');
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

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
          <h1 className="text-3xl font-bold">Hashtags</h1>
          <p className="text-gray-500 mt-1">
            Manage hashtag sets and view analytics
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Hashtag Set</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Hashtag Set</DialogTitle>
                <DialogDescription>
                  Add a new collection of hashtags
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHashtagSet} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Real Estate Marketing"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags *</Label>
                  <Textarea
                    id="hashtags"
                    placeholder="#realestate, #property, #home"
                    value={formData.hashtags}
                    onChange={(e) =>
                      setFormData({ ...formData, hashtags: e.target.value })
                    }
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Separate with commas
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) =>
                      setFormData({ ...formData, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Marketing, Lifestyle"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="sets">
        <TabsList>
          <TabsTrigger value="sets">Hashtag Sets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          {hashtagSets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  No hashtag sets yet. Create your first set!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hashtagSets.map((set) => (
                <Card key={set.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{set.name}</CardTitle>
                        {set.description && (
                          <CardDescription>{set.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(set.hashtags)}
                      >
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {(set.hashtags || []).slice(0, 5).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(set.hashtags || []).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{set.hashtags.length - 5} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Used {set.times_used || 0} times</span>
                      <span>
                        Eng: {((set.avg_engagement_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {set.platform && (
                      <Badge variant="outline">{set.platform}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hashtags</SelectItem>
                <SelectItem value="high_engagement">
                  High Engagement (&gt; 5%)
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortAsc(!sortAsc)}
            >
              Sort: {sortAsc ? 'Lowest First' : 'Highest First'}
            </Button>
          </div>

          {filteredAnalytics.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  No analytics data available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hashtag</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Times Used</TableHead>
                      <TableHead>Total Reach</TableHead>
                      <TableHead>Total Impressions</TableHead>
                      <TableHead>Avg Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnalytics.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.hashtag}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.platform}</Badge>
                        </TableCell>
                        <TableCell>{item.times_used || 0}</TableCell>
                        <TableCell>
                          {(item.total_reach || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(item.total_impressions || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {((item.avg_engagement_rate || 0) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
