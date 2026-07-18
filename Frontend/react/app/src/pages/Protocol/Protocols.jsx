import "./Protocols.css"
import { useState, useEffect, useContext, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Fetch from '../../API/Fetch'
import { HttpMethod, APIVersion } from '../../data/enums'
import { UserContext } from '../../data/context'
import rememberPage from "../../modules/rememberPage"
import Header from '../components/Header/Header'
import Spinner from '../components/Spinner/Spinner'
import Accordion from '../components/Accordion/Accordion'
import Badge from '../components/Badge/Badge'

export default function Protocols() {
    const { user } = useContext(UserContext)
    const [protocols, setProtocols] = useState([])
    const [loading, setLoading] = useState(true)
    var params = useParams()

    const loadProtocols = useCallback(async () => {
        setLoading(true)
        try {
            const data = await Fetch({
                api_version: APIVersion.V2,
                action: 'protocols/',
                method: HttpMethod.GET,
            })
            if (data?.ok) {
                setProtocols(data.data || [])
            } else {
                setProtocols([])
            }
        } catch (error) {
            console.error('Ошибка загрузки протоколов:', error)
            setProtocols([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadProtocols()
    }, [loadProtocols])

    useEffect(() => {
        rememberPage(`protocols/${params.username}`)
    }, [params.username])

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const buildProtocolAccordionItems = () => {
        return protocols.map(protocol => {
            const stages = protocol.stages || []
            return {
                id: protocol.id,
                title: (
                    <div className="protocol-accordion-title">
                        <span className="protocol-code">{protocol.code}</span>
                        <span className="protocol-name">{protocol.name}</span>
                        <Badge variant="info">{stages.length} шаг.</Badge>
                    </div>
                ),
                icon: '📄',
                badge: protocol.version ? `v${protocol.version}` : '',
                badgeVariant: 'secondary',
                content: (
                    <div className="protocol-accordion-content">
                        {protocol.description && (
                            <div className="protocol-description">
                                <p>{protocol.description}</p>
                            </div>
                        )}
                        <h4>📋 Этапы протокола</h4>
                        {stages.length > 0 ? (
                            <ul className="protocol-stages-list">
                                {stages.map(stage => (
                                    <li key={stage.id} className="protocol-stage-item">
                                        <div className="stage-header">
                                            <span className="stage-order">Шаг {stage.order}</span>
                                            <span className="stage-name">{stage.name}</span>
                                        </div>
                                        {stage.description && (
                                            <p className="stage-description">{stage.description}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="protocol-empty-stages">Нет этапов</p>
                        )}
                        <div className="protocol-meta">
                            {protocol.created_by && (
                                <div className="protocol-meta-item">
                                    <span className="label">Создал:</span>
                                    <span>
                                        {protocol.created_by.first_name} {protocol.created_by.last_name}
                                        {protocol.created_by.username ? ` (@${protocol.created_by.username})` : ''}
                                    </span>
                                </div>
                            )}
                            <div className="protocol-meta-item">
                                <span className="label">Создан:</span>
                                <span>{formatDate(protocol.created_at)}</span>
                            </div>
                            {protocol.updated_at && (
                                <div className="protocol-meta-item">
                                    <span className="label">Обновлён:</span>
                                    <span>{formatDate(protocol.updated_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ),
            }
        })
    }

    return (
        <>
            <Header />
            <div className="app theme-transition">
                <section className="section">
                    <h2 className="section__title">📄 Протоколы и СОПы</h2>
                    {loading ? (
                        <Spinner />
                    ) : protocols.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>Нет доступных протоколов</p>
                        </div>
                    ) : (
                        <Accordion
                            items={buildProtocolAccordionItems()}
                            multiple
                            defaultOpen={[]}
                            variant="compact"
                        />
                    )}
                </section>
            </div>
        </>
    )
}