import './LinkButton.css'
import { Link } from 'react-router-dom'

export default function LinkButton({ to, variant = 'secondary', children, className = '', style = {}, ...props }) {
    const variants = {
        primary: 'link-btn-primary',
        secondary: 'link-btn-secondary',
        success: 'link-btn-success',
        danger: 'link-btn-danger',
        warning: 'link-btn-warning',
        ghost: 'link-btn-ghost',
    }

    return (
        <Link
            to={to}
            className={`link-btn ${variants[variant]} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </Link>
    )
}