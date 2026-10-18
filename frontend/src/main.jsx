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
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID } from './utils/useGoogleAuth.js'
import { AppProvider } from './context/AppContext.jsx'

import Layout         from './Layout.jsx'
import LoginPage      from './pages/LoginPage.jsx'
import SignupPage     from './pages/SignupPage.jsx'
import DashboardPage  from './pages/DashboardPage.jsx'
import WorkspacePage  from './pages/WorkspacePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicRoute   from './components/PublicRoute.jsx'
import WorkspaceGuard from './components/WorkspaceGuard.jsx'
import ConnectedPeerRedirect from './components/ConnectedPeerRedirect.jsx'
import ProfilePage from "./pages/ProfilePage.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index        
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />


      <Route path="login"  
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      <Route path="signup" 
      element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />

      <Route path="dashboard" element={
        <ProtectedRoute>
          <ConnectedPeerRedirect >
            <DashboardPage />
          </ConnectedPeerRedirect>
        </ProtectedRoute>
      } />

      <Route path='profile' element={
        <ProtectedRoute>
          <ProfilePage />
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

// only load Google's script when a client id is configured
const app = (
  <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {app}
      </GoogleOAuthProvider>
    ) : app}
  </StrictMode>,
)
