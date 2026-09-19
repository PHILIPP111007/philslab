import { CacheKeys } from "../data/enums.js"

export function getTableVisibleColumns({ name }) {
    var key = `${CacheKeys.TABLE}_${name}`
    return localStorage.getItem(key)
}

export function setTableVisibleColumns({ name, visibleColumns }) {
    var key = `${CacheKeys.TABLE}_${name}`
    localStorage.setItem(key, visibleColumns)
}

export function deleteTableVisibleColumns({ name }) {
    var key = `${CacheKeys.TABLE}_${name}`
    localStorage.removeItem(key)
}