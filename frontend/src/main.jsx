import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router'
import { AppProvider } from './context/AppContext.jsx'

import Layout         from './Layout.jsx'
import LoginPage      from './pages/LoginPage.jsx'
import SignupPage     from './pages/SignupPage.jsx'
import DashboardPage  from './pages/DashboardPage.jsx'
import WorkspacePage  from './pages/WorkspacePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import WorkspaceGuard from './components/WorkspaceGuard.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index        element={<LoginPage />} />
      <Route path="login"  element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />

      <Route path="dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="workspace" element={
        <WorkspaceGuard>
          <WorkspacePage />
        </WorkspaceGuard>
      } />
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
)
