import { lazy } from "react"
var Login = lazy(() => import("../pages/Login/Login.jsx"))
var User = lazy(() => import("../pages/User/User.jsx"))
var Hello = lazy(() => import("../pages/Hello/Hello.jsx"))
var Samples = lazy(() => import("../pages/Sample/Samples.jsx"))
var AllBatches = lazy(() => import("../pages/Batch/AllBatches.jsx"))
var Batch = lazy(() => import("../pages/Batch/Batch.jsx"))
var Department = lazy(() => import("../pages/Department/Department.jsx"))
var Protocols = lazy(() => import("../pages/Protocol/Protocols.jsx"))
var MainPage = lazy(() => import("../pages/MainPage/MainPage.jsx"))
var AdminPage = lazy(() => import("../pages/AdminPage/AdminPage.jsx"))
var Task = lazy(() => import("../pages/Task/Task.jsx"))
var Sample = lazy(() => import("../pages/Sample/Sample.jsx"))
var Statistics = lazy(() => import("../pages/Statistics/Statistics.jsx"))

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
        path: "/samples/",
        name: "Samples",
        element: <Samples />
    },
    {
        path: "/protocols/:username/",
        name: "Protocols",
        element: <Protocols />
    },
    {
        path: "/department/:username/",
        name: "Department",
        element: <Department />
    },
    {
        path: "/batches/",
        name: "AllBatches",
        element: <AllBatches />
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
    {
        path: "/admin_page/:username/",
        name: "AdminPage",
        element: <AdminPage />
    },
    {
        path: "/task/:id/",
        name: "Task",
        element: <Task />
    },
    {
        path: "/sample/:id/",
        name: "Sample",
        element: <Sample />
    },
    {
        path: "/statistics/:username/",
        name: "Statistics",
        element: <Statistics />
    },
]
