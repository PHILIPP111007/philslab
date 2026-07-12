import "./StatCard.css"

export default function StatCard({ icon, label, value, color }) {
    return (
        <div className="stat-card" style={{ '--stat-color': color }}>
            <div className="stat-card__icon">{icon}</div>
            <div className="stat-card__content">
                <div className="stat-card__label">{label}</div>
                <div className="stat-card__value">{value}</div>
            </div>
        </div>
    )
}