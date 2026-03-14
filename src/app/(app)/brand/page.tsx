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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Palette, Type, MessageSquare, Target, Hash, Sparkles } from 'lucide-react';

interface BrandKit {
  id: string;
  workspace_id: string;
  brand_name: string;
  tagline: string | null;
  brand_voice: string | null;
  brand_voice_description: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  text_color: string | null;
  font_primary: string | null;
  font_secondary: string | null;
  logo_light_id: string | null;
  logo_dark_id: string | null;
  logo_icon_id: string | null;
  watermark_id: string | null;
  target_audience: string | null;
  dos: string[] | null;
  donts: string[] | null;
  sample_captions: string[] | null;
  hashtag_bank: Record<string, string[]> | null;
  emoji_style: string | null;
  cta_phrases: string[] | null;
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
          tagline: formData.tagline,
          brand_voice: formData.brand_voice,
          brand_voice_description: formData.brand_voice_description,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          background_color: formData.background_color,
          text_color: formData.text_color,
          font_primary: formData.font_primary,
          font_secondary: formData.font_secondary,
          target_audience: formData.target_audience,
          dos: formData.dos,
          donts: formData.donts,
          sample_captions: formData.sample_captions,
          emoji_style: formData.emoji_style,
          cta_phrases: formData.cta_phrases,
        })
        .eq('id', brandKit.id);

      if (error) throw error;

      setBrandKit({ ...brandKit, ...formData } as BrandKit);
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

  // --- EDIT MODE ---
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
                <Label htmlFor="target_audience">Target Audience</Label>
                <Textarea
                  id="target_audience"
                  value={formData.target_audience || ''}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={formData.primary_color || '#000000'}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    id="primary_color"
                    value={formData.primary_color || ''}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#2563eb"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={formData.secondary_color || '#000000'}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    id="secondary_color"
                    value={formData.secondary_color || ''}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#1e40af"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accent_color">Accent Color</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={formData.accent_color || '#000000'}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    id="accent_color"
                    value={formData.accent_color || ''}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={formData.background_color || '#ffffff'}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    id="background_color"
                    value={formData.background_color || ''}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={formData.text_color || '#000000'}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    id="text_color"
                    value={formData.text_color || ''}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    placeholder="#111827"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="font_primary">Primary Font</Label>
                <Input
                  id="font_primary"
                  value={formData.font_primary || ''}
                  onChange={(e) => setFormData({ ...formData, font_primary: e.target.value })}
                  placeholder="Inter"
                />
              </div>
              <div>
                <Label htmlFor="font_secondary">Secondary Font</Label>
                <Input
                  id="font_secondary"
                  value={formData.font_secondary || ''}
                  onChange={(e) => setFormData({ ...formData, font_secondary: e.target.value })}
                  placeholder="Playfair Display"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand_voice">Voice Style</Label>
                <Input
                  id="brand_voice"
                  value={formData.brand_voice || ''}
                  onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                  placeholder="professional, friendly, authoritative..."
                />
              </div>
              <div>
                <Label htmlFor="brand_voice_description">Voice Description</Label>
                <Textarea
                  id="brand_voice_description"
                  value={formData.brand_voice_description || ''}
                  onChange={(e) => setFormData({ ...formData, brand_voice_description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="emoji_style">Emoji Style</Label>
                <Input
                  id="emoji_style"
                  value={formData.emoji_style || ''}
                  onChange={(e) => setFormData({ ...formData, emoji_style: e.target.value })}
                  placeholder="moderate, minimal, heavy..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Do&apos;s</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.dos || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, dos: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one example per line"
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Don&apos;ts</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.donts || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, donts: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one example per line"
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Captions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.sample_captions || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, sample_captions: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one caption per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={(formData.cta_phrases || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, cta_phrases: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Enter one CTA phrase per line"
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => { setEditing(false); setFormData(brandKit); }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW MODE ---
  const colorSwatches = [
    { label: 'Primary', value: brandKit.primary_color },
    { label: 'Secondary', value: brandKit.secondary_color },
    { label: 'Accent', value: brandKit.accent_color },
    { label: 'Background', value: brandKit.background_color },
    { label: 'Text', value: brandKit.text_color },
  ].filter(c => c.value);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{brandKit.brand_name}</h1>
          {brandKit.tagline && <p className="text-muted-foreground mt-1">{brandKit.tagline}</p>}
        </div>
        {isAdmin && (
          <Button onClick={() => setEditing(true)}>Edit Brand Kit</Button>
        )}
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" /> Identity
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Voice
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="flex items-center gap-1.5">
            <Target className="h-4 w-4" /> Guidelines
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex items-center gap-1.5">
            <Hash className="h-4 w-4" /> Hashtags
          </TabsTrigger>
        </TabsList>

        {/* IDENTITY TAB */}
        <TabsContent value="identity" className="space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Brand Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {colorSwatches.map((color) => (
                  <div key={color.label} className="text-center">
                    <div
                      className="h-16 w-16 rounded-lg border-2 border-gray-200 shadow-sm mx-auto"
                      style={{ backgroundColor: color.value || '#ccc' }}
                    />
                    <p className="text-sm font-medium mt-2">{color.label}</p>
                    <code className="text-xs text-muted-foreground">{color.value}</code>
                  </div>
                ))}
                {colorSwatches.length === 0 && (
                  <p className="text-sm text-muted-foreground">No colors configured</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandKit.font_primary && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Primary Font</Label>
                  <p className="text-xl" style={{ fontFamily: brandKit.font_primary }}>
                    {brandKit.font_primary}
                  </p>
                </div>
              )}
              {brandKit.font_secondary && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Secondary Font</Label>
                  <p className="text-xl" style={{ fontFamily: brandKit.font_secondary }}>
                    {brandKit.font_secondary}
                  </p>
                </div>
              )}
              {!brandKit.font_primary && !brandKit.font_secondary && (
                <p className="text-sm text-muted-foreground">No fonts configured</p>
              )}
            </CardContent>
          </Card>

          {/* Target Audience */}
          {brandKit.target_audience && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{brandKit.target_audience}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* VOICE TAB */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              {brandKit.brand_voice && (
                <CardDescription>
                  <Badge variant="secondary" className="capitalize">{brandKit.brand_voice}</Badge>
                  {brandKit.emoji_style && (
                    <Badge variant="outline" className="ml-2">Emoji: {brandKit.emoji_style}</Badge>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {brandKit.brand_voice_description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{brandKit.brand_voice_description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No voice description set</p>
              )}
            </CardContent>
          </Card>

          {/* Sample Captions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Sample Captions</CardTitle>
            </CardHeader>
            <CardContent>
              {(brandKit.sample_captions || []).length > 0 ? (
                <div className="space-y-3">
                  {(brandKit.sample_captions || []).map((caption, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg text-sm italic">
                      &ldquo;{caption}&rdquo;
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sample captions added yet</p>
              )}
            </CardContent>
          </Card>

          {/* CTA Phrases */}
          <Card>
            <CardHeader>
              <CardTitle>CTA Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(brandKit.cta_phrases || []).map((phrase, idx) => (
                  <Badge key={idx} variant="secondary">{phrase}</Badge>
                ))}
                {(!brandKit.cta_phrases || brandKit.cta_phrases.length === 0) && (
                  <p className="text-sm text-muted-foreground">No CTA phrases added</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GUIDELINES TAB */}
        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Do&apos;s</CardTitle>
            </CardHeader>
            <CardContent>
              {(brandKit.dos || []).length > 0 ? (
                <ul className="space-y-2">
                  {(brandKit.dos || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No guidelines added</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Don&apos;ts</CardTitle>
            </CardHeader>
            <CardContent>
              {(brandKit.donts || []).length > 0 ? (
                <ul className="space-y-2">
                  {(brandKit.donts || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 mt-0.5">&#10007;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No guidelines added</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HASHTAGS TAB */}
        <TabsContent value="hashtags" className="space-y-6">
          {brandKit.hashtag_bank && Object.keys(brandKit.hashtag_bank).length > 0 ? (
            Object.entries(brandKit.hashtag_bank).map(([category, tags]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(tags || []).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-blue-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">No hashtag bank configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
