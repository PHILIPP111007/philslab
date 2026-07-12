import { lazy } from "react"
var Login = lazy(() => import("../pages/Login/Login.jsx"))
var User = lazy(() => import("../pages/User/User.jsx"))
var Hello = lazy(() => import("../pages/Hello/Hello.jsx"))

export var PublicRoutes = [
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/login/",
        element: <Login />
    },
]

export var PrivateRoutes = [
    {
        path: "/users/:username/",
        name: "User",
        element: <User />
    },
    {
        path: "/hello/",
        name: "Hello",
        element: <Hello />
    },
]