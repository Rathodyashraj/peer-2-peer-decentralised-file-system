import { useApp } from './context/AppContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import WorkspacePage from './pages/WorkspacePage'
import ToastContainer from './components/Toast'

export default function App() {
  const { page, PAGES, toasts } = useApp()

  function renderPage() {
    switch (page) {
      case PAGES.LOGIN:    return <LoginPage />
      case PAGES.SIGNUP:   return <SignupPage />
      case PAGES.DASHBOARD: return <DashboardPage />
      case PAGES.WORKSPACE: return <WorkspacePage />
      default:             return <LoginPage />
    }
  }

  return (
    <>
      <div key={page} className="animate-fade-in">
        {renderPage()}
      </div>
      <ToastContainer toasts={toasts} />
    </>
  )
}
