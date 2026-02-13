import type { Post, SocialAccount, MediaItem, UserTag } from '@/types'

const N8N_WEBHOOK_BASE_URL =
  process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/+$/, '') ||
  'https://n8n.srv1367878.hstgr.cloud'

// Mapping des webhooks n8n selon plateforme et type
export const WEBHOOK_URLS = {
  instagram: {
    image: `${N8N_WEBHOOK_BASE_URL}/webhook/instagram-post-image`,
    carrousel: `${N8N_WEBHOOK_BASE_URL}/webhook/instagram-post-carrousel`,
    story: `${N8N_WEBHOOK_BASE_URL}/webhook/instagram-post-stories`,
    stories: `${N8N_WEBHOOK_BASE_URL}/webhook/instagram-post-stories`,
    reel: `${N8N_WEBHOOK_BASE_URL}/webhook/instagram-post-reels`,
  },
  facebook: {
    text: `${N8N_WEBHOOK_BASE_URL}/webhook/facebook-post-texte`,
    image: `${N8N_WEBHOOK_BASE_URL}/webhook/facebook-post-image`,
    video: `${N8N_WEBHOOK_BASE_URL}/webhook/facebook-post-video`,
    carrousel: `${N8N_WEBHOOK_BASE_URL}/webhook/facebook-post-carrousel`,
    link: `${N8N_WEBHOOK_BASE_URL}/webhook/facebook-post-linkpreview`,
  },
} as const

/**
 * Construit le body pour un post Instagram
 */
export function buildInstagramBody(
  post: Post,
  socialAccount: SocialAccount
): { url: string; body: Record<string, any> } {
  const { post_type, caption, medias, location_id, user_tags } = post
  const accessToken = socialAccount.access_token?.trim()

  if (!accessToken) {
    throw new Error('Access token Instagram manquant pour ce compte social')
  }

  let url: string
  let body: Record<string, any> = {}

  switch (post_type) {
    case 'image':
      url = WEBHOOK_URLS.instagram.image
      body = {
        caption: caption || '',
        url: medias?.[0]?.url || '',
      }
      if (location_id) body.location_id = location_id
      if (user_tags && user_tags.length > 0) body.user_tags = user_tags
      break

    case 'carrousel':
      url = WEBHOOK_URLS.instagram.carrousel
      body = {
        caption: caption || '',
        medias: (medias || []).map((media: MediaItem) => ({
          url: media.url,
          type: media.type,
        })),
      }
      if (location_id) body.location_id = location_id
      if (user_tags && user_tags.length > 0) body.user_tags = user_tags
      break

    case 'story':
    case 'stories':
      url = WEBHOOK_URLS.instagram.story
      const storyMedia = medias?.[0]
      body = {
        url: storyMedia?.url || '',
        type: storyMedia?.type || 'image',
      }
      break

    case 'reel':
      url = WEBHOOK_URLS.instagram.reel
      body = {
        caption: caption || '',
        url: medias?.[0]?.url || '',
      }
      if (location_id) body.location_id = location_id
      break

    default:
      throw new Error(`Type de post Instagram non supporté: ${post_type}`)
  }

  body.access_token = accessToken

  return { url, body }
}

/**
 * Construit le body pour un post Facebook
 */
export function buildFacebookBody(
  post: Post,
  socialAccount: SocialAccount
): { url: string; body: Record<string, any> } {
  const { post_type, caption, medias, link, location_id } = post
  const accessToken = socialAccount.access_token?.trim()

  if (!accessToken) {
    throw new Error('Access token Facebook manquant pour ce compte social')
  }

  let url: string
  let body: Record<string, any> = {}

  // Facebook utilise "place" au lieu de "location_id"
  const place = location_id || null

  switch (post_type) {
    case 'text':
      url = WEBHOOK_URLS.facebook.text
      body = {
        message: caption || '',
      }
      if (place) body.place = place
      break

    case 'image':
      url = WEBHOOK_URLS.facebook.image
      body = {
        caption: caption || '',
        url: medias?.[0]?.url || '',
      }
      if (place) body.place = place
      break

    case 'video':
      url = WEBHOOK_URLS.facebook.video
      body = {
        description: caption || '',
        url: medias?.[0]?.url || '',
      }
      if (place) body.place = place
      break

    case 'carrousel':
      url = WEBHOOK_URLS.facebook.carrousel
      body = {
        message: caption || '',
        medias: (medias || []).map((media: MediaItem) => ({
          url: media.url,
        })),
      }
      if (place) body.place = place
      break

    case 'link':
      url = WEBHOOK_URLS.facebook.link
      body = {
        message: caption || '',
        link: link || '',
      }
      if (place) body.place = place
      break

    default:
      throw new Error(`Type de post Facebook non supporté: ${post_type}`)
  }

  body.access_token = accessToken

  return { url, body }
}

/**
 * Retourne l'URL et le body du webhook selon la plateforme et le type de post
 */
export function getWebhookConfig(
  post: Post,
  socialAccount: SocialAccount
): { url: string; body: Record<string, any> } {
  if (post.platform === 'instagram') {
    return buildInstagramBody(post, socialAccount)
  } else if (post.platform === 'facebook') {
    return buildFacebookBody(post, socialAccount)
  } else {
    throw new Error(`Plateforme non supportée: ${post.platform}`)
  }
}
