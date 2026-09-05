import './History.css'
import { useCallback, useEffect, useState } from 'react'
import Fetch from '../../../API/Fetch'
import { APIVersion, HttpMethod } from '../../../data/enums'
import { formatDate } from '../../../modules/dateTime'
import Spinner from '../Spinner/Spinner'

const ACTION_LABELS = {
    created: 'Создание',
    deleted: 'Удаление',
    updated: 'Обновление',
    status_changed: 'Изменение статуса',
    priority_changed: 'Изменение приоритета',
    assignee_changed: 'Изменение исполнителя',
    comment_added: 'Комментарий',
    stage_completed: 'Изменение этапа',
    sample_added: 'Добавление образца',
    sample_removed: 'Удаление образца',
    protocol_changed: 'Изменение протокола',
    department_changed: 'Изменение отдела',
}

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const userName = (user) => {
    if (!user) return 'Неизвестный пользователь'
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    return fullName ? `${fullName} (@${user.username})` : `@${user.username}`
}

export default function History({
    entityType,
    entityId,
    refreshKey,
    enabled = true,
    title = '📜 История изменений',
}) {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadHistory = useCallback(async () => {
        if (!enabled || !entityType || !entityId) return

        setLoading(true)
        setError('')
        const response = await Fetch({
            api_version: APIVersion.V2,
            action: `history/${entityType}/${entityId}/`,
            method: HttpMethod.GET,
        })

        if (response?.ok) {
            setEntries(Array.isArray(response.data) ? response.data : [])
        } else {
            setEntries([])
            setError(response?.error || 'Не удалось загрузить историю')
        }
        setLoading(false)
    }, [enabled, entityType, entityId])

    useEffect(() => {
        const timer = setTimeout(() => loadHistory(), 0)
        return () => clearTimeout(timer)
    }, [loadHistory, refreshKey])

    if (!enabled) return null

    return (
        <section className="section section-filled">
            <div className="entity-history__header">
                <h3 className="entity-history__title">{title}</h3>
                <button
                    type="button"
                    className="entity-history__refresh"
                    onClick={loadHistory}
                    disabled={loading}
                    title="Обновить историю"
                >
                    {loading ? <Spinner /> : '↻'}
                </button>
            </div>

            {loading && entries.length === 0 && (
                <p className="entity-history__status">Загрузка истории…</p>
            )}
            {error && <p className="entity-history__status entity-history__status--error">{error}</p>}
            {!loading && !error && entries.length === 0 && (
                <p className="entity-history__status">История пока пуста</p>
            )}

            {entries.length > 0 && (
                <div className="entity-history__list">
                    {entries.map((entry) => (
                        <article key={entry.id} className="entity-history__item">
                            <div className="entity-history__item-header">
                                <span className="entity-history__action">
                                    {ACTION_LABELS[entry.action_type] || entry.action_type}
                                </span>
                                <span className="entity-history__date">{formatDate(entry.created_at)}</span>
                            </div>
                            <div className="entity-history__user">{userName(entry.user)}</div>
                            {entry.field_name && (
                                <div className="entity-history__field">Поле: {entry.field_name}</div>
                            )}
                            {(entry.old_value !== null && entry.old_value !== undefined) && (
                                <div className="entity-history__value entity-history__value--old">
                                    Было: {formatValue(entry.old_value)}
                                </div>
                            )}
                            {(entry.new_value !== null && entry.new_value !== undefined) && (
                                <div className="entity-history__value entity-history__value--new">
                                    Стало: {formatValue(entry.new_value)}
                                </div>
                            )}
                            {entry.comment && <div className="entity-history__comment">{entry.comment}</div>}
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
