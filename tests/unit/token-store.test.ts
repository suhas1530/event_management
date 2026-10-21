import { beforeEach, describe, expect, it } from 'vitest'
import { tokenStore } from '@/lib/api'

/**
 * The rebrand renamed every localStorage key. These tests pin the migration:
 * a session created before the rename must survive, and no legacy key may be
 * left behind afterwards (a stale duplicate would let a logged-out user keep
 * sending an old token).
 */
beforeEach(() => {
  localStorage.clear()
})

describe('tokenStore migration', () => {
  it('reads a pre-rebrand session and rewrites it under the Heptome key', () => {
    localStorage.setItem('avan_access_token', 'legacy-access')
    localStorage.setItem('avan_refresh_token', 'legacy-refresh')

    expect(tokenStore.get()).toBe('legacy-access')
    expect(tokenStore.getRefresh()).toBe('legacy-refresh')
    expect(localStorage.getItem('heptome_access_token')).toBe('legacy-access')
    expect(localStorage.getItem('heptome_refresh_token')).toBe('legacy-refresh')
    expect(localStorage.getItem('avan_access_token')).toBeNull()
    expect(localStorage.getItem('avan_refresh_token')).toBeNull()
  })

  it('migrates the admin session separately from the customer session', () => {
    localStorage.setItem('avan_admin_token', 'legacy-admin')

    expect(tokenStore.getAdmin()).toBe('legacy-admin')
    expect(localStorage.getItem('heptome_admin_token')).toBe('legacy-admin')
    expect(localStorage.getItem('avan_admin_token')).toBeNull()
  })

  it('prefers the current key when both exist', () => {
    localStorage.setItem('avan_access_token', 'legacy-access')
    localStorage.setItem('heptome_access_token', 'current-access')

    expect(tokenStore.get()).toBe('current-access')
  })

  it('writes the new key and drops the legacy one on sign-in', () => {
    localStorage.setItem('avan_access_token', 'legacy-access')

    tokenStore.set('fresh-access')
    tokenStore.setRefresh('fresh-refresh')

    expect(localStorage.getItem('heptome_access_token')).toBe('fresh-access')
    expect(localStorage.getItem('heptome_refresh_token')).toBe('fresh-refresh')
    expect(localStorage.getItem('avan_access_token')).toBeNull()
    expect(localStorage.getItem('avan_refresh_token')).toBeNull()
  })

  it('clears both old and new keys on sign-out', () => {
    localStorage.setItem('heptome_access_token', 'a')
    localStorage.setItem('heptome_refresh_token', 'b')
    localStorage.setItem('avan_access_token', 'c')
    localStorage.setItem('avan_refresh_token', 'd')

    tokenStore.clear()

    for (const key of ['heptome_access_token', 'heptome_refresh_token', 'avan_access_token', 'avan_refresh_token']) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
  })

  it('clears both admin key generations on admin sign-out', () => {
    localStorage.setItem('heptome_admin_token', 'a')
    localStorage.setItem('heptome_admin_refresh_token', 'b')
    localStorage.setItem('avan_admin_token', 'c')
    localStorage.setItem('avan_admin_refresh_token', 'd')

    tokenStore.clearAdmin()

    for (const key of ['heptome_admin_token', 'heptome_admin_refresh_token', 'avan_admin_token', 'avan_admin_refresh_token']) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
  })

  it('migrates every key generation in one pass, which is what auth bootstrap calls', () => {
    localStorage.setItem('avan_access_token', 'legacy-access')
    localStorage.setItem('avan_refresh_token', 'legacy-refresh')
    localStorage.setItem('avan_admin_token', 'legacy-admin')
    localStorage.setItem('avan_admin_refresh_token', 'legacy-admin-refresh')

    tokenStore.migrate()

    expect(localStorage.getItem('heptome_access_token')).toBe('legacy-access')
    expect(localStorage.getItem('heptome_refresh_token')).toBe('legacy-refresh')
    expect(localStorage.getItem('heptome_admin_token')).toBe('legacy-admin')
    expect(localStorage.getItem('heptome_admin_refresh_token')).toBe('legacy-admin-refresh')

    for (const key of [
      'avan_access_token',
      'avan_refresh_token',
      'avan_admin_token',
      'avan_admin_refresh_token',
    ]) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
  })

  it('returns null when there is no session at all', () => {
    expect(tokenStore.get()).toBeNull()
    expect(tokenStore.getRefresh()).toBeNull()
    expect(tokenStore.getAdmin()).toBeNull()
    expect(tokenStore.getAdminRefresh()).toBeNull()
  })
})
