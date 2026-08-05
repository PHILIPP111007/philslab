import { CacheKeys } from "../data/enums.js"

export function getToken() {
    return localStorage.getItem(CacheKeys.TOKEN)
}

export function setToken(token) {
    localStorage.setItem(CacheKeys.TOKEN, token)
}

export function deleteToken() {
    localStorage.removeItem(CacheKeys.TOKEN)
}