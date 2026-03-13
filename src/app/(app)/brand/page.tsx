'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
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
  tagline: string | null;
  logo_url: string | null;
  primary_colors: string[];
  secondary_colors: string[];
  fonts: string[];
  tone_of_voice: string;
  guidelines_url: string | null;
  do_examples: string[];
  dont_examples: string[];
  notes: string | null;
  created_at?: string;
  updated_at?: string;
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
          tagline: formData.tagline,
          primary_colors: formData.primary_colors,
          secondary_colors: formData.secondary_colors,
          fonts: formData.fonts,
          tone_of_voice: formData.tone_of_voice,
          guidelines_url: formData.guidelines_url,
          do_examples: formData.do_examples,
          dont_examples: formData.dont_examples,
          notes: formData.notes,
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

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="primary_colors">Primary Colors (comma-separated hex codes)</Label>
                <Input
                  id="primary_colors"
                  value={(formData.primary_colors || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, primary_colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="#1a1a1a, #ffffff"
                />
              </div>

              <div>
                <Label htmlFor="secondary_colors">Secondary Colors (comma-separated hex codes)</Label>
                <Input
                  id="secondary_colors"
                  value={(formData.secondary_colors || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, secondary_colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="#666666, #cccccc"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fonts">Fonts (comma-separated)</Label>
                <Input
                  id="fonts"
                  value={(formData.fonts || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, fonts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Inter, Playfair Display"
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
              <CardTitle>Brand Guidelines URL</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.guidelines_url || ''}
                onChange={(e) => setFormData({ ...formData, guidelines_url: e.target.value })}
                placeholder="https://..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Do Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.do_examples || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, do_examples: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one example per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Don't Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.dont_examples || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, dont_examples: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one example per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <CardDescription>{brandKit.tagline || 'No tagline set'}</CardDescription>
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
            <div>
              <Label className="text-sm font-medium">Primary Colors</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {(brandKit.primary_colors || []).map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded border" style={{ backgroundColor: color }} />
                    <code className="text-sm text-muted-foreground">{color}</code>
                  </div>
                ))}
                {(!brandKit.primary_colors || brandKit.primary_colors.length === 0) && (
                  <p className="text-sm text-muted-foreground">No primary colors set</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Secondary Colors</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {(brandKit.secondary_colors || []).map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded border" style={{ backgroundColor: color }} />
                    <code className="text-sm text-muted-foreground">{color}</code>
                  </div>
                ))}
                {(!brandKit.secondary_colors || brandKit.secondary_colors.length === 0) && (
                  <p className="text-sm text-muted-foreground">No secondary colors set</p>
                )}
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
            {(brandKit.fonts || []).length > 0 ? (
              (brandKit.fonts || []).map((font, idx) => (
                <div key={idx}>
                  <Label className="text-sm font-medium">Font {idx + 1}</Label>
                  <p className="text-base" style={{ fontFamily: font }}>{font}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No fonts configured</p>
            )}
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
        {brandKit.guidelines_url && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={brandKit.guidelines_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                {brandKit.guidelines_url}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Do Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Do Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(brandKit.do_examples || []).map((phrase, idx) => (
                <Badge key={idx} variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  {phrase}
                </Badge>
              ))}
              {(!brandKit.do_examples || brandKit.do_examples.length === 0) && (
                <p className="text-sm text-muted-foreground">No examples added</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Don't Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Don't Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(brandKit.dont_examples || []).map((phrase, idx) => (
                <Badge key={idx} variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">
                  {phrase}
                </Badge>
              ))}
              {(!brandKit.dont_examples || brandKit.dont_examples.length === 0) && (
                <p className="text-sm text-muted-foreground">No examples added</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
