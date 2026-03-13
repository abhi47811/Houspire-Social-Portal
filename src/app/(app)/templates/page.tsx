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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SmTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string;
  caption_template: string | null;
  hashtag_groups: string[] | null;
  media_specs: Record<string, unknown> | null;
  checklist: Record<string, unknown> | null;
  is_default: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  reel: 'bg-red-100 text-red-800',
  carousel: 'bg-blue-100 text-blue-800',
  story: 'bg-purple-100 text-purple-800',
  post: 'bg-green-100 text-green-800',
  poll: 'bg-orange-100 text-orange-800',
};

export default function TemplatesPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [templates, setTemplates] = useState<SmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SmTemplate | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'post',
    platform: '',
    caption_template: '',
    hashtag_groups: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sm_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: SmTemplate) => {
    toast.success(`Template "${template.name}" ready to use!`);
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.platform.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsCreating(true);
      const { error } = await supabase.from('sm_templates').insert([
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          platform: formData.platform,
          caption_template: formData.caption_template || null,
          hashtag_groups: formData.hashtag_groups
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0) || null,
        },
      ]);

      if (error) throw error;

      toast.success('Template created successfully');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        category: 'post',
        platform: '',
        caption_template: '',
        hashtag_groups: '',
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      (template.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage social media content templates
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Add a new content template for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monday Motivation"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this template for?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category*</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="poll">Poll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform*</Label>
                    <Input
                      id="platform"
                      placeholder="Instagram, Facebook, etc"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="caption">Caption Template</Label>
                  <Textarea
                    id="caption"
                    placeholder="Your caption template here..."
                    value={formData.caption_template}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caption_template: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="hashtags">Hashtag Groups</Label>
                  <Input
                    id="hashtags"
                    placeholder="tag1, tag2, tag3"
                    value={formData.hashtag_groups}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hashtag_groups: e.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="post">Post</SelectItem>
            <SelectItem value="reel">Reel</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="poll">Poll</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No templates found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedTemplate(template);
                setIsDetailOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.platform}
                    </CardDescription>
                  </div>
                  <Badge className={CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-800'}>
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:w-96 overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTemplate.name}</SheetTitle>
                <SheetDescription>
                  Created {formatDate(selectedTemplate.created_at)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge
                      className={CATEGORY_COLORS[selectedTemplate.category] || 'bg-gray-100 text-gray-800'}
                    >
                      {selectedTemplate.category}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTemplate.platform}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>

                {selectedTemplate.caption_template && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Caption Template
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded text-muted-foreground whitespace-pre-wrap">
                      {selectedTemplate.caption_template}
                    </p>
                  </div>
                )}

                {selectedTemplate.hashtag_groups &&
                  selectedTemplate.hashtag_groups.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        Hashtag Groups
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.hashtag_groups.map(
                          (tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              #{tag}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <Button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="w-full"
                >
                  Use Template
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SmTemplate {
  id: string;
  name: string;
  description: string;
  category: 'reel' | 'carousel' | 'story' | 'post' | 'poll';
  platform: string;
  script_template: string | null;
  caption_template: string | null;
  hashtag_suggestions: string[] | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  reel: 'bg-red-100 text-red-800',
  carousel: 'bg-blue-100 text-blue-800',
  story: 'bg-purple-100 text-purple-800',
  post: 'bg-green-100 text-green-800',
  poll: 'bg-orange-100 text-orange-800',
};

export default function TemplatesPage() {
  const { user, loading: userLoading } = useUser();
  const supabase = createClient();

  const [templates, setTemplates] = useState<SmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SmTemplate | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'post' as SmTemplate['category'],
    platform: '',
    script_template: '',
    caption_template: '',
    hashtag_suggestions: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sm_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: SmTemplate) => {
    toast.success(`Template "${template.name}" ready to use!`);
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.platform.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsCreating(true);
      const { data, error } = await supabase.from('sm_templates').insert([
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          platform: formData.platform,
          script_template: formData.script_template || null,
          caption_template: formData.caption_template || null,
          hashtag_suggestions: formData.hashtag_suggestions
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0) || null,
          is_active: true,
        },
      ]);

      if (error) throw error;
      toast.success('Template created successfully');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        category: 'post',
        platform: '',
        script_template: '',
        caption_template: '',
        hashtag_suggestions: '',
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage social media content templates
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Add a new content template for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monday Motivation"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this template for?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category*</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          category: value as SmTemplate['category'],
                        })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="poll">Poll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform*</Label>
                    <Input
                      id="platform"
                      placeholder="Instagram, Facebook, etc"
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({ ...formData, platform: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="caption">Caption Template</Label>
                  <Textarea
                    id="caption"
                    placeholder="Your caption template here..."
                    value={formData.caption_template}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caption_template: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="script">Script Template</Label>
                  <Textarea
                    id="script"
                    placeholder="Script for video content..."
                    value={formData.script_template}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        script_template: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="hashtags">Hashtag Suggestions</Label>
                  <Input
                    id="hashtags"
                    placeholder="tag1, tag2, tag3"
                    value={formData.hashtag_suggestions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hashtag_suggestions: e.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="post">Post</SelectItem>
            <SelectItem value="reel">Reel</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="poll">Poll</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No templates found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedTemplate(template);
                setIsDetailOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.platform}
                    </CardDescription>
                  </div>
                  <Badge className={CATEGORY_COLORS[template.category]}>
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:w-96 overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTemplate.name}</SheetTitle>
                <SheetDescription>
                  Created {formatDate(selectedTemplate.created_at)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge className={CATEGORY_COLORS[selectedTemplate.category]}>
                      {selectedTemplate.category}
                    </Badge>
                    <Badge variant="outline">
                      {selectedTemplate.platform}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>

                {selectedTemplate.caption_template && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Caption Template
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded text-muted-foreground whitespace-pre-wrap">
                      {selectedTemplate.caption_template}
                    </p>
                  </div>
                )}

                {selectedTemplate.script_template && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Script Template
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded text-muted-foreground whitespace-pre-wrap">
                      {selectedTemplate.script_template}
                    </p>
                  </div>
                )}

                {selectedTemplate.hashtag_suggestions &&
                  selectedTemplate.hashtag_suggestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        Hashtag Suggestions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.hashtag_suggestions.map(
                          (tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              #{tag}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <Button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="w-full"
                >
                  Use Template
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
