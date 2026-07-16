import { lazy } from "react"
var Login = lazy(() => import("../pages/Login/Login.jsx"))
var User = lazy(() => import("../pages/User/User.jsx"))
var Hello = lazy(() => import("../pages/Hello/Hello.jsx"))
var Samples = lazy(() => import("../pages/Sample/Samples.jsx"))
var MainPage = lazy(() => import("../pages/MainPage/MainPage.jsx"))

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
    {
        path: "/samples/:username/",
        name: "Samples",
        element: <Samples />
    },
    {
        path: "/main_page/:username/",
        name: "MainPage",
        element: <MainPage />
    },
]
