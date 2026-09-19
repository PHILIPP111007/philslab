import { CacheKeys } from "../data/enums.js"

export function normalizePagePath(path) {
    if (!path) return null

    const value = String(path).trim()
    if (!value) return null

    const match = value.match(/^([^?#]*)([?#].*)?$/)
    const pathname = match?.[1] || value
    const suffix = match?.[2] || ''
    const pathWithoutSlashes = pathname.replace(/^\/+|\/+$/g, '')

    return `${pathWithoutSlashes ? `/${pathWithoutSlashes}/` : '/'}${suffix}`
}

export function getRememberedPage(username) {
    const rememberedPath = normalizePagePath(
        localStorage.getItem(CacheKeys.REMEMBER_PAGE)
    )
    if (!rememberedPath) return null

    const pathname = rememberedPath.split(/[?#]/, 1)[0]
    const pathParts = pathname.split('/').filter(Boolean)
    // Current private routes use the common format:
    // /users/:username/<page>/[<id>/]
    // The username is therefore the second segment, not the last one.
    if (
        !username
        || pathParts.length < 3
        || pathParts[0] !== 'users'
        || pathParts[1] !== username
    ) {
        return null
    }

    return rememberedPath
}

export default function rememberPage(path) {
    const normalizedPath = normalizePagePath(path)
    if (normalizedPath) {
        localStorage.setItem(CacheKeys.REMEMBER_PAGE, normalizedPath)
    }
}
