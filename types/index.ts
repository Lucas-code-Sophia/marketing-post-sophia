// User types
export type UserRole = 'admin' | 'manager' | 'user'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

// Platform types
export type PlatformType = 'facebook' | 'instagram' | 'gmb'

export type PostType = 'text' | 'image' | 'carrousel' | 'video' | 'link' | 'reel' | 'story' | 'stories'

export type PostStatus = 'draft' | 'pending_validation' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'rejected'

export type MediaType = 'image' | 'video'

// Agency
export interface Agency {
  id: string
  hektor_id: string | null
  name: string
  city: string | null
  gmb_location_id: string | null
  gmb_access_token: string | null
  created_at: string
  updated_at: string
}

// Social Account
export interface SocialAccount {
  id: string
  platform: PlatformType
  account_id: string
  account_name: string
  access_token: string
  token_expires_at: string | null
  created_at: string
  updated_at: string
}

// Media item in post
export interface MediaItem {
  url: string
  type: MediaType
}

// User tag for Instagram
export interface UserTag {
  username: string
  x: number
  y: number
}

// Post
export interface Post {
  id: string
  platform: PlatformType
  post_type: PostType
  caption: string | null
  medias: MediaItem[]
  link: string | null
  location_id: string | null
  user_tags: UserTag[] | null
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  validated_by: string | null
  validated_at: string | null
  rejection_reason: string | null
  external_post_id: string | null
  error_message: string | null
  social_account_id: string | null
  agency_id: string | null
  property_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined fields
  creator?: User
  validator?: User
  social_account?: SocialAccount
}

// Media (uploaded files)
export interface Media {
  id: string
  file_path: string
  public_url: string
  file_type: MediaType
  file_size: number | null
  post_id: string | null
  uploaded_by: string
  uploaded_at: string
  published_at: string | null
  to_delete_at: string | null
}

// Form types
export interface CreatePostForm {
  platform: PlatformType
  post_type: PostType
  caption: string
  link?: string
  location_id?: string
  scheduled_at?: Date
  social_account_id: string
}

export interface LoginForm {
  email: string
  password: string
}
