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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SmTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string;
  platform: string;
  caption_template: string | null;
  hashtag_groups: string[] | null;
  media_specs: Record<string, unknown> | null;
  checklist: Record<string, unknown> | null;
  example_media_ids: string[] | null;
  is_default: boolean | null;
  usage_count: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['all', 'reel', 'carousel', 'story', 'post', 'poll'];
const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok'];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'pink',
  linkedin: 'blue',
  twitter: 'sky',
  facebook: 'indigo',
  tiktok: 'purple',
};

export default function TemplatesPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [templates, setTemplates] = useState<SmTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SmTemplate | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    platform: '',
    caption_template: '',
    hashtag_groups: '',
  });

  // Fetch templates
  useEffect(() => {
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
        toast.error('Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [supabase]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    if (
      !formData.name ||
      !formData.category ||
      !formData.platform
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);

      const hashtag_groups = formData.hashtag_groups
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase.from('sm_templates').insert({
        workspace_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        platform: formData.platform,
        caption_template: formData.caption_template || null,
        hashtag_groups: hashtag_groups.length > 0 ? hashtag_groups : null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Template created successfully');
      setDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        platform: '',
        caption_template: '',
        hashtag_groups: '',
      });

      // Refresh templates
      const { data } = await supabase
        .from('sm_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
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
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-gray-500 mt-1">
            Manage your social media content templates
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Add a new social media content template
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Product Launch Reel"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the template purpose..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value) =>
                        setFormData({ ...formData, platform: value })
                      }
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((plat) => (
                          <SelectItem key={plat} value={plat}>
                            {plat.charAt(0).toUpperCase() + plat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption Template</Label>
                  <Textarea
                    id="caption"
                    placeholder="Enter the caption template..."
                    value={formData.caption_template}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caption_template: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtag Groups</Label>
                  <Input
                    id="hashtags"
                    placeholder="e.g., #marketing, #socialmedia, #content"
                    value={formData.hashtag_groups}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hashtag_groups: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple hashtags with commas
                  </p>
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
                    Create Template
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              {templates.length === 0
                ? 'No templates yet. Create your first template!'
                : 'No templates match your search criteria.'}
            </p>
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
                setSheetOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={`bg-${PLATFORM_COLORS[template.platform] || 'gray'}-100`}
                  >
                    {template.platform}
                  </Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Used {template.usage_count || 0} times
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTemplate.name}</SheetTitle>
                <SheetDescription>
                  Created on{' '}
                  {new Date(selectedTemplate.created_at).toLocaleDateString()}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {selectedTemplate.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">
                      {selectedTemplate.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Platform</h3>
                    <Badge
                      className={`bg-${PLATFORM_COLORS[selectedTemplate.platform] || 'gray'}-100`}
                    >
                      {selectedTemplate.platform}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <Badge variant="outline">{selectedTemplate.category}</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Usage Count</h3>
                  <p className="text-gray-700">
                    {selectedTemplate.usage_count || 0}
                  </p>
                </div>

                {selectedTemplate.caption_template && (
                  <div>
                    <h3 className="font-semibold mb-2">Caption Template</h3>
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedTemplate.caption_template}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTemplate.hashtag_groups &&
                  selectedTemplate.hashtag_groups.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Hashtag Groups</h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedTemplate.hashtag_groups || []).map(
                          (tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {selectedTemplate.media_specs && (
                  <div>
                    <h3 className="font-semibold mb-2">Media Specifications</h3>
                    <div className="bg-gray-50 p-3 rounded border">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(selectedTemplate.media_specs, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedTemplate.checklist && (
                  <div>
                    <h3 className="font-semibold mb-2">Checklist</h3>
                    <div className="bg-gray-50 p-3 rounded border">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(selectedTemplate.checklist, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
