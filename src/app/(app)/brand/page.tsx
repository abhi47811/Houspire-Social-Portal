'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface BrandKit {
  id: string;
  workspace_id: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  tone_of_voice: string;
  brand_guidelines: string;
  do_phrases: string[];
  dont_phrases: string[];
  created_at: string;
  updated_at: string;
}

export default function BrandPage() {
  const { user, loading: userLoading } = useUser();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandKit>>({});

  const supabase = createClient();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (userLoading) return;

    const fetchBrandKit = async () => {
      try {
        const { data, error } = await supabase
          .from('sm_brand_kit')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setBrandKit(data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Error fetching brand kit:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandKit();
  }, [userLoading, supabase]);

  const handleSave = async () => {
    if (!brandKit) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sm_brand_kit')
        .update({
          brand_name: formData.brand_name,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          font_primary: formData.font_primary,
          font_secondary: formData.font_secondary,
          tone_of_voice: formData.tone_of_voice,
          brand_guidelines: formData.brand_guidelines,
          do_phrases: formData.do_phrases,
          dont_phrases: formData.dont_phrases,
          updated_at: new Date().toISOString(),
        })
        .eq('id', brandKit.id);

      if (error) throw error;

      setBrandKit(formData as BrandKit);
      setEditing(false);
    } catch (error) {
      console.error('Error saving brand kit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brandKit) {
    return (
      <div className="container py-8">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Brand Kit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No brand kit found. Please set up your brand kit first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editing && isAdmin) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Brand Kit</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name || ''}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color || '#000000'}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color || ''}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color || '#000000'}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color || ''}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={formData.accent_color || '#000000'}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.accent_color || ''}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="font_primary">Primary Font</Label>
                <Input
                  id="font_primary"
                  value={formData.font_primary || ''}
                  onChange={(e) => setFormData({ ...formData, font_primary: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="font_secondary">Secondary Font</Label>
                <Input
                  id="font_secondary"
                  value={formData.font_secondary || ''}
                  onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tone of Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.tone_of_voice || ''}
                onChange={(e) => setFormData({ ...formData, tone_of_voice: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.brand_guidelines || ''}
                onChange={(e) => setFormData({ ...formData, brand_guidelines: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Do Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.do_phrases || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, do_phrases: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one phrase per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Don't Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.dont_phrases || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, dont_phrases: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one phrase per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Brand Kit</h1>
        {isAdmin && (
          <Button onClick={() => setEditing(true)}>Edit Brand Kit</Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Brand Logo and Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>Updated {formatDate(brandKit.updated_at)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Brand Name</Label>
              <p className="text-lg">{brandKit.brand_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Color Swatches */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Primary Color</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded border"
                    style={{ backgroundColor: brandKit.primary_color }}
                  />
                  <code className="text-sm text-muted-foreground">{brandKit.primary_color}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Secondary Color</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded border"
                    style={{ backgroundColor: brandKit.secondary_color }}
                  />
                  <code className="text-sm text-muted-foreground">{brandKit.secondary_color}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Accent Color</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded border"
                    style={{ backgroundColor: brandKit.accent_color }}
                  />
                  <code className="text-sm text-muted-foreground">{brandKit.accent_color}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Primary Font</Label>
              <p className="text-base" style={{ fontFamily: brandKit.font_primary }}>
                {brandKit.font_primary}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Secondary Font</Label>
              <p className="text-base" style={{ fontFamily: brandKit.font_secondary }}>
                {brandKit.font_secondary}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tone of Voice */}
        <Card>
          <CardHeader>
            <CardTitle>Tone of Voice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{brandKit.tone_of_voice}</p>
          </CardContent>
        </Card>

        {/* Brand Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{brandKit.brand_guidelines}</p>
          </CardContent>
        </Card>

        {/* Do Phrases */}
        <Card>
          <CardHeader>
            <CardTitle>Do Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brandKit.do_phrases.map((phrase, idx) => (
                <Badge key={idx} variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  ✓ {phrase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Don't Phrases */}
        <Card>
          <CardHeader>
            <CardTitle>Don't Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brandKit.dont_phrases.map((phrase, idx) => (
                <Badge key={idx} variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">
                  ✗ {phrase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
