'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Upload, 
  Loader2, 
  MoreVertical, 
  Instagram, 
  Trash2, 
  Image as ImageIcon,
  Video,
  FolderOpen,
  Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  description: string | null
  file_path: string
  public_url: string
  file_type: string
  category: string | null
  created_at: string
}

const CATEGORIES = [
  { value: 'story', label: 'Story', icon: '📱' },
  { value: 'post', label: 'Post', icon: '📷' },
  { value: 'promo', label: 'Promo', icon: '🏷️' },
  { value: 'menu', label: 'Menu', icon: '🍽️' },
  { value: 'event', label: 'Événement', icon: '🎉' },
  { value: 'other', label: 'Autre', icon: '📁' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('story')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  
  // Story modal
  const [storyModalOpen, setStoryModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setTemplates(data)
    setLoading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      setUploadPreview(URL.createObjectURL(file))
      if (!uploadName) {
        setUploadName(file.name.split('.')[0])
      }
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadName) return
    
    setUploading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `templates/${fileName}`
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('medias')
        .upload(filePath, uploadFile)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medias')
        .getPublicUrl(filePath)
      
      // Determine file type
      const fileType = uploadFile.type.startsWith('video/') ? 'video' : 'image'
      
      // Insert template
      const { error: insertError } = await supabase.from('templates').insert({
        name: uploadName,
        file_path: filePath,
        public_url: publicUrl,
        file_type: fileType,
        category: uploadCategory,
        created_by: user.id,
      })
      
      if (insertError) throw insertError
      
      // Reset and refresh
      setUploadModalOpen(false)
      setUploadFile(null)
      setUploadPreview(null)
      setUploadName('')
      fetchTemplates()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(template: Template) {
    if (!confirm(`Supprimer "${template.name}" ?`)) return
    
    // Delete from storage
    await supabase.storage.from('medias').remove([template.file_path])
    
    // Delete from database
    await supabase.from('templates').delete().eq('id', template.id)
    
    fetchTemplates()
  }

  function openStoryModal(template: Template) {
    setSelectedTemplate(template)
    setScheduledAt('')
    setStoryModalOpen(true)
  }

  async function handlePostStory() {
    if (!selectedTemplate) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      
      // Get Instagram account
      const { data: instagramAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', 'instagram')
        .single()
      
      if (!instagramAccount) {
        alert('Aucun compte Instagram configuré')
        return
      }
      
      // Create post
      const { error } = await supabase.from('posts').insert({
        platform: 'instagram',
        post_type: 'story',
        caption: selectedTemplate.name,
        medias: [{ url: selectedTemplate.public_url, type: selectedTemplate.file_type }],
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        social_account_id: instagramAccount.id,
        created_by: user.id,
      })
      
      if (error) throw error
      
      setStoryModalOpen(false)
      router.push('/posts')
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création')
    }
  }

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Vos visuels réutilisables pour les posts et stories
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un template
        </Button>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Tous ({templates.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = templates.filter(t => t.category === cat.value).length
          return (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.icon} {cat.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Grille de templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden group">
              <div className="relative aspect-[9/16] bg-gray-100">
                {template.file_type === 'video' ? (
                  <video
                    src={template.public_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={template.public_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Badge type */}
                <div className="absolute top-2 left-2">
                  {template.file_type === 'video' ? (
                    <div className="bg-black/50 rounded p-1">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="bg-black/50 rounded p-1">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Menu */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openStoryModal(template)}>
                        <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                        Poster en Story
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-pink-500 to-purple-500"
                    onClick={() => openStoryModal(template)}
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Story
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES.find(c => c.value === template.category)?.label || 'Autre'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium">Aucun template</p>
            <p className="text-sm text-muted-foreground mb-4">
              Uploadez vos premiers visuels
            </p>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Ajouter un template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal Upload */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            <div className="border-2 border-dashed rounded-lg p-4">
              {uploadPreview ? (
                <div className="relative aspect-[9/16] max-h-[300px] mx-auto">
                  {uploadFile?.type.startsWith('video/') ? (
                    <video
                      src={uploadPreview}
                      className="w-full h-full object-contain rounded"
                      controls
                    />
                  ) : (
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded"
                    />
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            
            {uploadPreview && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setUploadFile(null)
                  setUploadPreview(null)
                }}
              >
                Changer de fichier
              </Button>
            )}
            
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Ex: Promo été 2024"
              />
            </div>
            
            {/* Catégorie */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={uploadCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadCategory(cat.value)}
                  >
                    {cat.icon} {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!uploadFile || !uploadName || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Post Story */}
      <Dialog open={storyModalOpen} onOpenChange={setStoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              Poster en Story Instagram
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-[9/16] max-h-[250px] mx-auto bg-gray-100 rounded-lg overflow-hidden">
                {selectedTemplate.file_type === 'video' ? (
                  <video
                    src={selectedTemplate.public_url}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={selectedTemplate.public_url}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              <p className="text-center font-medium">{selectedTemplate.name}</p>
              
              {/* Programmation */}
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Programmer (optionnel)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour créer un brouillon
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handlePostStory}
              className="bg-gradient-to-r from-pink-500 to-purple-500"
            >
              {scheduledAt ? 'Programmer' : 'Créer le brouillon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
