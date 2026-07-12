import './pages/components/Theme/Theme.css'
import './App.css'
import { Suspense, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthContext, UserContext } from "./data/context.js"
import { PrivateRoutes, PublicRoutes } from "./data/routes.jsx"
import { ThemeProvider } from './pages/components/Theme/ThemeContext'
import ErrorPage from "./pages/ErrorPage/ErrorPage.jsx"
import SuspenseLoading from "./pages/components/SuspenseLoading/SuspenseLoading.jsx"



// ============================================
// ОБЕРТКА С ПРОВАЙДЕРОМ ТЕМЫ
// ============================================
export default function App() {

    var [isAuth, setIsAuth] = useState(false)
    var [user, setUser] = useState({
        id: 0,
        username: "admin",
        email: "weflepfw",
        first_name: "Phil",
        last_name: "Ro",
        password: "welofefw",
    })



    return (
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
            <UserContext.Provider value={{ user, setUser }}>
                <BrowserRouter>
                    <ThemeProvider>
                        <div className="App">
                            <Toaster />
                            <Suspense fallback={<SuspenseLoading />}>
                                {/* <Suspense fallback={<ViewTransition><SuspenseLoading /></ViewTransition>}> */}
                                <Routes>
                                    {PrivateRoutes.map((route) =>
                                        <Route
                                            key={route.path}
                                            path={route.path}
                                            errorElement={<ErrorPage />}
                                            // TODO
                                            // element={isAuth ? route.element : <Navigate replace to="/login/" />}
                                            element={route.element}
                                            exact
                                        />
                                    )}

                                    {PublicRoutes.map((route) =>
                                        <Route
                                            key={route.path}
                                            path={route.path}
                                            errorElement={<ErrorPage />}
                                            element={route.element}
                                            exact
                                        />
                                    )}
                                    <Route path="*" element={<ErrorPage />} />
                                </Routes>
                            </Suspense>
                        </div>
                    </ThemeProvider>
                </BrowserRouter>
            </UserContext.Provider>
        </AuthContext.Provider>
    )
}
