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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Loader2, ArrowUpDown, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SmHashtagSet {
  id: string;
  name: string;
  hashtags: string[];
  platform: string;
  category: string;
  times_used: number;
  avg_engagement_rate: number | null;
  avg_reach: number | null;
  best_performing_tag: string | null;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
}

interface SmHashtagAnalytics {
  id: string;
  hashtag: string;
  platform: string;
  times_used: number;
  total_impressions: number;
  total_reach: number;
  total_engagement: number;
  avg_engagement_rate: number;
  last_used_at: string | null;
  created_at: string;
}

type SortField = 'hashtag' | 'total_reach' | 'total_impressions' | 'avg_engagement_rate' | 'times_used';
type SortOrder = 'asc' | 'desc';

export default function HashtagsPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [hashtagSets, setHashtagSets] = useState<SmHashtagSet[]>([]);
  const [analytics, setAnalytics] = useState<SmHashtagAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<SmHashtagSet | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sortField, setSortField] = useState<SortField>('avg_engagement_rate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    hashtags: '',
    platform: '',
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
      console.error('Error fetching data:', error);
      toast.error('Failed to load hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHashtags = (hashtags: string[]) => {
    const text = hashtags.map((tag) => `#${tag}`).join(' ');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCreateSet = async () => {
    if (!formData.name.trim() || !formData.hashtags.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsCreating(true);

      const tagsArray = formData.hashtags
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from('sm_hashtag_sets').insert([
        {
          name: formData.name,
          hashtags: tagsArray,
          platform: formData.platform || null,
          category: formData.category || null,
          times_used: 0,
        },
      ]);

      if (error) throw error;

      toast.success('Hashtag set created successfully');
      setIsCreateOpen(false);
      setFormData({ name: '', hashtags: '', platform: '', category: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating hashtag set:', error);
      toast.error('Failed to create hashtag set');
    } finally {
      setIsCreating(false);
    }
  };

  const sortedAnalytics = [...analytics]
    .filter((item) => {
      if (analyticsFilter === 'all') return true;
      if (analyticsFilter === 'high-engagement')
        return (item.avg_engagement_rate || 0) > 0.05;
      if (analyticsFilter === 'most-used')
        return (item.times_used || 0) > 5;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortableHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <TableHead
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-4 h-4" />
      </div>
    </TableHead>
  );

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hashtags</h1>
          <p className="text-muted-foreground mt-1">
            Manage hashtag sets and view performance analytics
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Hashtag Set</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Hashtag Set</DialogTitle>
                <DialogDescription>
                  Create a new collection of hashtags for your campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Set Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Campaign"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="hashtags">Hashtags*</Label>
                  <Textarea
                    id="hashtags"
                    placeholder={"Enter hashtags separated by commas (with or without #)\ne.g., summer, vacation, travel, wanderlust"}
                    value={formData.hashtags}
                    onChange={(e) =>
                      setFormData({ ...formData, hashtags: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Input
                      id="platform"
                      placeholder="Instagram, TikTok, etc"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Seasonal"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateSet}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Set
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="sets" className="w-full">
        <TabsList>
          <TabsTrigger value="sets">Hashtag Sets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          {hashtagSets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hashtag sets yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hashtagSets.map((set) => (
                <Card
                  key={set.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedSet(set)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{set.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {set.hashtags.length} hashtags
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyHashtags(set.hashtags);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {set.hashtags.slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                        {set.hashtags.length > 5 && (
                          <Badge variant="outline">
                            +{set.hashtags.length - 5}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {set.platform && <p>Platform: {set.platform}</p>}
                        {set.category && <p>Category: {set.category}</p>}
                        <p>Used {set.times_used || 0} times</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedSet && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSet.name}</CardTitle>
                <CardDescription>All hashtags in this set</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSet.hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => handleCopyHashtags(selectedSet.hashtags)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Hashtags
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex gap-2">
            <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hashtags</SelectItem>
                <SelectItem value="most-used">Most Used (&gt; 5)</SelectItem>
                <SelectItem value="high-engagement">
                  High Engagement (&gt; 5%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hashtag</TableHead>
                      <TableHead>Platform</TableHead>
                      <SortableHeader field="total_reach" label="Reach" />
                      <SortableHeader
                        field="total_impressions"
                        label="Impressions"
                      />
                      <SortableHeader
                        field="avg_engagement_rate"
                        label="Engagement"
                      />
                      <SortableHeader field="times_used" label="Times Used" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalytics.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No analytics data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAnalytics.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            #{item.hashtag}
                          </TableCell>
                          <TableCell>{item.platform}</TableCell>
                          <TableCell>
                            {(item.total_reach || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {(item.total_impressions || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {((item.avg_engagement_rate || 0) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>{item.times_used || 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Copy,
  Loader2,
  ArrowUpDown,
  TrendingUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SmHashtagSet {
  id: string;
  name: string;
  hashtags: string[];
  platform: string;
  category: string;
  times_used: number;
  avg_engagement_rate: number | null;
  avg_reach: number | null;
  best_performing_tag: string | null;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
}

interface SmHashtagAnalytics {
  id: string;
  hashtag: string;
  platform: string;
  reach: number;
  impressions: number;
  engagement_rate: number;
  posts_count: number;
  trending_score: number;
  period_start: string;
  period_end: string;
}

type SortField = 'hashtag' | 'reach' | 'impressions' | 'engagement_rate' | 'trending_score' | 'posts_count';
type SortOrder = 'asc' | 'desc';

export default function HashtagsPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [hashtagSets, setHashtagSets] = useState<SmHashtagSet[]>([]);
  const [analytics, setAnalytics] = useState<SmHashtagAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<SmHashtagSet | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sortField, setSortField] = useState<SortField>('trending_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    hashtags: '',
    platform: '',
    category: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
          .order('trending_score', { ascending: false }),
      ]);

      if (setsRes.error) throw setsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;

      setHashtagSets(setsRes.data || []);
      setAnalytics(analyticsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHashtags = (hashtags: string[]) => {
    const text = hashtags.map(tag => `#${tag}`).join(' ');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCreateSet = async () => {
    if (!formData.name.trim() || !formData.hashtags.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsCreating(true);
      const tagsArray = formData.hashtags
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from('sm_hashtag_sets').insert([
        {
          name: formData.name,
          hashtags: tagsArray,
          platform: formData.platform || null,
          category: formData.category || null,
          times_used: 0,
        },
      ]);

      if (error) throw error;
      toast.success('Hashtag set created successfully');
      setIsCreateOpen(false);
      setFormData({ name: '', hashtags: '', platform: '', category: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating hashtag set:', error);
      toast.error('Failed to create hashtag set');
    } finally {
      setIsCreating(false);
    }
  };

  const sortedAnalytics = [...analytics]
    .filter((item) => {
      if (analyticsFilter === 'all') return true;
      if (analyticsFilter === 'trending') return item.trending_score > 75;
      if (analyticsFilter === 'high-engagement') return item.engagement_rate > 0.05;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-4 h-4" />
      </div>
    </TableHead>
  );

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hashtags</h1>
          <p className="text-muted-foreground mt-1">
            Manage hashtag sets and view performance analytics
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Hashtag Set</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Hashtag Set</DialogTitle>
                <DialogDescription>
                  Create a new collection of hashtags for your campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Set Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Campaign"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="hashtags">Hashtags*</Label>
                  <Textarea
                    id="hashtags"
                    placeholder="Enter hashtags separated by commas (with or without #)&#10;e.g., summer, vacation, travel, wanderlust"
                    value={formData.hashtags}
                    onChange={(e) =>
                      setFormData({ ...formData, hashtags: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Input
                      id="platform"
                      placeholder="Instagram, TikTok, etc"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Seasonal"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateSet}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Set
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="sets" className="w-full">
        <TabsList>
          <TabsTrigger value="sets">Hashtag Sets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="space-y-4">
          {hashtagSets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hashtag sets yet. Create your first one!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hashtagSets.map((set) => (
                <Card
                  key={set.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedSet(set)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{set.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {set.hashtags.length} hashtags
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyHashtags(set.hashtags);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {set.hashtags.slice(0, 5).map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                        {set.hashtags.length > 5 && (
                          <Badge variant="outline">
                            +{set.hashtags.length - 5}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {set.platform && <p>Platform: {set.platform}</p>}
                        {set.category && <p>Category: {set.category}</p>}
                        <p>Used {set.times_used || 0} times</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedSet && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSet.name}</CardTitle>
                <CardDescription>All hashtags in this set</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSet.hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => handleCopyHashtags(selectedSet.hashtags)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Hashtags
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex gap-2">
            <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hashtags</SelectItem>
                <SelectItem value="trending">Trending (Score &gt; 75)</SelectItem>
                <SelectItem value="high-engagement">
                  High Engagement (&gt; 5%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hashtag</TableHead>
                      <TableHead>Platform</TableHead>
                      <SortableHeader field="reach" label="Reach" />
                      <SortableHeader field="impressions" label="Impressions" />
                      <SortableHeader field="engagement_rate" label="Engagement" />
                      <SortableHeader field="posts_count" label="Posts" />
                      <TableHead className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Trending Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalytics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No analytics data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAnalytics.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            #{item.hashtag}
                          </TableCell>
                          <TableCell>{item.platform}</TableCell>
                          <TableCell>{item.reach.toLocaleString()}</TableCell>
                          <TableCell>
                            {item.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {(item.engagement_rate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>{item.posts_count}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.trending_score > 75
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {item.trending_score.toFixed(0)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
