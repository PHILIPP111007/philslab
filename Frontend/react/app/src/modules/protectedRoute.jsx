import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../data/context.js"

export default function ProtectedRoute({ children }) {
    const { isAuth } = useContext(AuthContext)
    return isAuth ? children : <Navigate to="/login" />
}