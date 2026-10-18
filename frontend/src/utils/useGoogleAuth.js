import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { useApp } from '../context/AppContext'
import { ensureIdentity } from './ensureIdentity'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// shared by LoginPage and SignupPage; returns start() to open the Google popup
function useConfiguredGoogleAuth({ navigate, setLoading, onError }) {
  const { login, signup, addToast } = useApp()

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',

    onSuccess: async ({ code }) => {
      try {
        const res = await axios.post('http://localhost:8000/googleAuth', { code }, { withCredentials: true })

        const { user, isNewUser, linked } = res.data.data

        // register this device before login so the socket has a deviceId
        await ensureIdentity(user)

        if (isNewUser) signup(user, navigate)
        else login(user, navigate)

        if (linked) {
          setTimeout(() => addToast('Linked to Google. Password sign-in was disabled for security — use Forgot password to set a new one.', 'info'), 600)
        }
      } catch (error) {
        onError(error.response?.data?.message || 'Google sign-in failed')
      } finally {
        setLoading(false)
      }
    },

    onError: () => {
      setLoading(false)
      onError('Google sign-in failed')
    },

    // popup closed by the user, or blocked by the browser
    onNonOAuthError: (err) => {
      setLoading(false)
      if (err?.type === 'popup_failed_to_open') onError('Popup was blocked. Allow popups and try again.')
    },
  })

  return () => googleLogin()
}

// without a client id the Google script throws on init and crashes the page, so never load it
function useUnconfiguredGoogleAuth({ setLoading, onError }) {
  return () => {
    setLoading(false)
    onError('Google sign-in is not configured')
  }
}

// picked once at module load, so hook order never changes between renders
export const useGoogleAuth = GOOGLE_CLIENT_ID ? useConfiguredGoogleAuth : useUnconfiguredGoogleAuth
