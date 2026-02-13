'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, getPlatformIcon } from '@/lib/utils'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import type { SocialAccount } from '@/types'

interface SocialAccountsListProps {
  accounts: SocialAccount[]
}

export function SocialAccountsList({ accounts: initialAccounts }: SocialAccountsListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [accounts] = useState(initialAccounts)
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<SocialAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state for edit
  const [editName, setEditName] = useState('')
  const [editAccountId, setEditAccountId] = useState('')
  const [editToken, setEditToken] = useState('')
  const [editTokenExpires, setEditTokenExpires] = useState('')

  function openEdit(account: SocialAccount) {
    setEditingAccount(account)
    setEditName(account.account_name)
    setEditAccountId(account.account_id)
    setEditToken('')
    setEditTokenExpires(account.token_expires_at ? account.token_expires_at.slice(0, 16) : '')
    setMessage(null)
  }

  function openDelete(account: SocialAccount) {
    setDeletingAccount(account)
    setMessage(null)
  }

  async function handleSaveEdit() {
    if (!editingAccount) return
    setSaving(true)
    setMessage(null)
    try {
      const updates: {
        account_name: string
        account_id: string
        updated_at: string
        access_token?: string
        token_expires_at?: string | null
      } = {
        account_name: editName.trim(),
        account_id: editAccountId.trim(),
        updated_at: new Date().toISOString(),
      }
      if (editToken.trim()) {
        updates.access_token = editToken.trim()
        updates.token_expires_at = editTokenExpires.trim() ? new Date(editTokenExpires).toISOString() : null
      } else if (editTokenExpires.trim()) {
        updates.token_expires_at = new Date(editTokenExpires).toISOString()
      }
      const { error } = await supabase
        .from('social_accounts')
        .update(updates)
        .eq('id', editingAccount.id)
      if (error) throw error
      setMessage({ type: 'success', text: 'Compte mis à jour.' })
      setEditingAccount(null)
      router.refresh()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingAccount) return
    setDeleting(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', deletingAccount.id)
      if (error) throw error
      setDeletingAccount(null)
      router.refresh()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {accounts && accounts.length > 0 ? (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                <div>
                  <p className="font-medium">{account.account_name}</p>
                  <p className="text-sm text-muted-foreground">ID: {account.account_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm text-muted-foreground">
                  <p>Ajouté le {formatDate(account.created_at)}</p>
                  {account.token_expires_at && (
                    <p className="text-xs">Token expire: {formatDate(account.token_expires_at)}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(account)} className="shrink-0">
                  <Pencil className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDelete(account)} className="shrink-0">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-muted-foreground">Aucun compte social connecté</p>
      )}

      {/* Modal Modifier */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le compte</DialogTitle>
            <DialogDescription>
              {editingAccount && (
                <>
                  {getPlatformIcon(editingAccount.platform)} {editingAccount.account_name} — {editingAccount.platform}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name">Nom du compte</Label>
              <Input
                id="edit_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Carmen Immobilier"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_account_id">ID du compte</Label>
              <Input
                id="edit_account_id"
                value={editAccountId}
                onChange={(e) => setEditAccountId(e.target.value)}
                placeholder="Ex: 178414..."
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_token">Nouveau token (laisser vide pour ne pas changer)</Label>
              <Input
                id="edit_token"
                type="password"
                value={editToken}
                onChange={(e) => setEditToken(e.target.value)}
                placeholder="EAAxxxx…"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_expires">Expiration du token (optionnel)</Label>
              <Input
                id="edit_expires"
                type="datetime-local"
                value={editTokenExpires}
                onChange={(e) => setEditTokenExpires(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editName.trim() || !editAccountId.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Supprimer */}
      <Dialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce compte ?</DialogTitle>
            <DialogDescription>
              {deletingAccount && (
                <>
                  Le compte <strong>{deletingAccount.account_name}</strong> ({deletingAccount.platform}) sera supprimé
                  de la base. Les posts déjà publiés ne sont pas supprimés, mais le lien avec ce compte sera perdu si
                  des brouillons y étaient associés.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAccount(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
