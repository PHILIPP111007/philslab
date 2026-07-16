import './MainPage.css'
import LinkButton from '../components/LinkButton/LinkButton'
import Header from '../components/Header/Header'

export default function MainPage() {
    const navigationItems = [
        {
            id: 'search',
            title: '🔍 Поиск',
            description: 'Поиск по всем разделам системы',
            to: '/search/',
            variant: 'secondary',
        },
        {
            id: 'department',
            title: '🏢 Отдел',
            description: 'Задачи отдела',
            to: '/department/',
            variant: 'secondary',
        },
        {
            id: 'statistics',
            title: '📊 Статистика',
            description: 'Аналитика и отчеты по деятельности',
            to: '/statistics/',
            variant: 'secondary',
        },
        {
            id: 'protocols',
            title: '📋 Протоколы / СОПы',
            description: 'Стандартные операционные процедуры',
            to: '/protocols/',
            variant: 'secondary',
        },
        {
            id: 'warehouse',
            title: '📦 Склад отдела',
            description: 'Управление складскими запасами',
            to: '/warehouse/',
            variant: 'secondary',
        },
    ]

    return (
        <>
            <Header />

            <div className="main-page">
                <div className="main-page__container">
                    {/* Заголовок */}
                    <header className="main-page__header">
                        <h1 className="main-page__title">Главная панель</h1>
                    </header>

                    {/* Сетка карточек */}
                    <div className="main-page__grid">
                        {navigationItems.map((item) => (
                            <LinkButton
                                key={item.id}
                                to={item.to}
                                variant={item.variant}
                                className="main-page__card"
                            >
                                <div className="main-page__card-icon">{item.title.split(' ')[0]}</div>
                                <div className="main-page__card-content">
                                    <h3 className="main-page__card-title">{item.title}</h3>
                                    <p className="main-page__card-description">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="main-page__card-arrow">→</div>
                            </LinkButton>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}