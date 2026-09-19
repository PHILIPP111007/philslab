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
        path: "/users/:username/user_page/",
        name: "User",
        element: <User />
    },
    {
        path: "/users/:username/hello/",
        name: "Hello",
        element: <Hello />
    },
    {
        path: "/users/:username/samples/",
        name: "Samples",
        element: <Samples />
    },
    {
        path: "/users/:username/protocols/",
        name: "Protocols",
        element: <Protocols />
    },
    {
        path: "/users/:username/department/",
        name: "Department",
        element: <Department />
    },
    {
        path: "/users/:username/batches/",
        name: "AllBatches",
        element: <AllBatches />
    },
    {
        path: "/users/:username/batch/:id/",
        name: "Batch",
        element: <Batch />
    },
    {
        path: "/users/:username/main_page/",
        name: "MainPage",
        element: <MainPage />
    },
    {
        path: "/users/:username/admin_page/",
        name: "AdminPage",
        element: <AdminPage />
    },
    {
        path: "/users/:username/task/:id/",
        name: "Task",
        element: <Task />
    },
    {
        path: "/users/:username/sample/:id/",
        name: "Sample",
        element: <Sample />
    },
    {
        path: "/users/:username/statistics/",
        name: "Statistics",
        element: <Statistics />
    },
]
