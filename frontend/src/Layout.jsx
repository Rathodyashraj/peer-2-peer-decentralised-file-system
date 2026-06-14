import { Outlet } from 'react-router'
import ToastContainer from './components/Toast'
import { useApp } from './context/AppContext'
import GlobalConnectionRequestModal from './components/GlobalConnectionRequestModal'

export default function Layout() {
  const { toasts } = useApp()

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Outlet />
      <ToastContainer toasts={toasts} />
      <GlobalConnectionRequestModal />
    </div>
  )
}
