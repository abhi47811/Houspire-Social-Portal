'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { SmMedia, formatRelativeTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Search, FileIcon, PlayCircle } from 'lucide-react';

export default function MediaPage() {
  const { user, loading: userLoading } = useUser();
  const [media, setMedia] = useState<SmMedia[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<SmMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState<SmMedia | null>(null);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!userLoading) {
      fetchMedia();
    }
  }, [userLoading]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sm_media')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
      setFilteredMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = media;

    if (selectedFolder !== 'All') {
      filtered = filtered.filter((item) => item.folder === selectedFolder);
    }

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMedia(filtered);
  }, [searchQuery, selectedFolder, media]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(fileName);

      // Determine file type based on MIME type
      let fileType = 'documents';
      if (file.type.startsWith('image/')) {
        fileType = 'images';
      } else if (file.type.startsWith('video/')) {
        fileType = 'videos';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      }

      const { error: insertError } = await supabase.from('sm_media').insert({
        file_name: fileName,
        original_name: file.name,
        file_url: publicUrl,
        file_type: fileType,
        file_size: file.size,
        folder: fileType,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await fetchMedia();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading media library...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Media Library</h1>
        <p className="text-gray-600">Manage your media files and assets</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <Input
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload size={18} />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>
                Upload an image, video, audio, or document file
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <p className="text-sm text-blue-600">Uploading...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedFolder} onValueChange={setSelectedFolder}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedFolder} className="mt-6">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No media files found
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <Sheet key={item.id}>
                  <SheetTrigger asChild>
                    <Card
                      className="cursor-pointer hover:shadow-lg transition"
                      onClick={() => setSelectedMedia(item)}
                    >
                      <CardContent className="p-4">
                        <div className="relative mb-2 bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                          {item.file_type === 'images' && item.file_url ? (
                            <img
                              src={item.file_url}
                              alt={item.original_name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.file_type === 'videos' ? (
                            <PlayCircle
                              className="text-gray-400"
                              size={40}
                            />
                          ) : (
                            <FileIcon
                              className="text-gray-400"
                              size={40}
                            />
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {item.original_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(item.file_size)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(new Date(item.created_at))}
                        </p>
                      </CardContent>
                    </Card>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Media Details</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {selectedMedia && (
                        <>
                          <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                            {selectedMedia.file_type === 'images' &&
                            selectedMedia.file_url ? (
                              <img
                                src={selectedMedia.file_url}
                                alt={selectedMedia.original_name}
                                className="w-full h-full object-cover"
                              />
                            ) : selectedMedia.file_type === 'videos' ? (
                              <PlayCircle
                                className="text-gray-400"
                                size={64}
                              />
                            ) : (
                              <FileIcon
                                className="text-gray-400"
                                size={64}
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-600">
                              Original Name
                            </p>
                            <p className="text-sm">
                              {selectedMedia.original_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-600">
                              File Type
                            </p>
                            <p className="text-sm capitalize">
                              {selectedMedia.file_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-600">
                              File Size
                            </p>
                            <p className="text-sm">
                              {formatFileSize(selectedMedia.file_size)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-600">
                              Uploaded
                            </p>
                            <p className="text-sm">
                              {formatRelativeTime(
                                new Date(selectedMedia.created_at)
                              )}
                            </p>
                          </div>
                          {selectedMedia.alt_text && (
                            <div>
                              <p className="text-sm font-semibold text-gray-600">
                                Alt Text
                              </p>
                              <p className="text-sm">
                                {selectedMedia.alt_text}
                              </p>
                            </div>
                          )}
                          {selectedMedia.tags &&
                            selectedMedia.tags.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-600">
                                  Tags
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedMedia.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
