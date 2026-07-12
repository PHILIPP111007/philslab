import "./Badge.css"


export default function Badge({ variant = 'secondary', children }) {
    const variants = {
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        success: 'badge-success',
        danger: 'badge-danger',
        warning: 'badge-warning',
        info: 'badge-info',
        outline: 'badge-outline',
    }
    return <span className={`badge ${variants[variant]}`}>{children}</span>
}