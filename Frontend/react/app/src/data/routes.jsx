import { lazy } from "react"
var Login = lazy(() => import("../pages/Login/Login.jsx"))
var User = lazy(() => import("../pages/User/User.jsx"))
var Hello = lazy(() => import("../pages/Hello/Hello.jsx"))
var Samples = lazy(() => import("../pages/Sample/Samples.jsx"))
var Subsamples = lazy(() => import("../pages/Subsample/Subsamples.jsx"))
var Batches = lazy(() => import("../pages/Batch/Batches.jsx"))
var Batch = lazy(() => import("../pages/Batch/Batch.jsx"))
var Department = lazy(() => import("../pages/Department/Department.jsx"))
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
        path: "/department/:username/",
        name: "Department",
        element: <Department />
    },
    {
        path: "/subsamples/:username/",
        name: "Subsamples",
        element: <Subsamples />
    },
    {
        path: "/batches/:username/",
        name: "Batches",
        element: <Batches />
    },
    {
        path: "/batch/:id/",
        name: "Batch",
        element: <Batch />
    },
    {
        path: "/main_page/:username/",
        name: "MainPage",
        element: <MainPage />
    },
]
