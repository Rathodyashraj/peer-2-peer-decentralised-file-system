import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Mail, Lock, Eye, EyeOff, Share2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import axios from 'axios'
import { ensureIdentity } from '../utils/ensureIdentity'

export default function LoginPage() {
  const { login , addToast} = useApp()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ login: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  

  const AUTH_MODE = {
    LOGIN: "login",
    EMAIL: "email",
    OTP: "otp",
    RESET: "reset",
  };

  const [mode, setMode] = useState(AUTH_MODE.LOGIN);

  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);


  function validate() {
    const e = {}
    if (!form.login.trim()) e.login = 'Username or email is required'
    if (!form.password)        e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    return e
  }

  function validateEmail() {
    const e = {};
    if (!resetForm.email.trim()) {
      e.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(resetForm.email)
    ) {
      e.email = "Enter a valid email address";
    }
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:8000/login', form, {withCredentials: true});

      if( res.status === 201){
        await ensureIdentity(res.data.data.user);
        login(res.data.data.user,navigate);
      }

    } catch (error) {


      const backendErorr = error.response?.data;
      

      if(backendErorr?.errors?.length > 0){
        const field = backendErorr.errors[0].field;

        setErrors({
          [field]: backendErorr.message
        })

      }
      else{
        setErrors({ general: backendErorr?.message || 'Login failed' })
      }      
    }
    finally{
      setLoading(false);
    }

  }

  function handleGoogle() {
    setLoading(true)
    setTimeout(() => login({ username: 'google_user' }, navigate), 1000)
  }

  async function handleSendOTP() {

  const e = validateEmail();

  if (Object.keys(e).length) {
    setErrors(e);
    return;
  }

  setErrors({});
  setSendOtpLoading(true);

  try {

    const res = await axios.post(
      "http://localhost:8000/sendOtp",
      {
        email: resetForm.email,
      }
    );

    if (res.status === 200) {
      setMode(AUTH_MODE.OTP);
    }

  } catch (error) {

    const backendError = error.response?.data;

    if (backendError?.errors?.length > 0) {

      const field = backendError.errors[0].field;

      setErrors({
        [field]: backendError.message,
      });

    } else {

      setErrors({
        email: backendError?.message || "Failed to send OTP",
      });

    }

  } finally {

    setSendOtpLoading(false);

  }

}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-app">
      <div className="glow-blob w-96 h-96 top-1/4 left-1/4"
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, #14B8A6 8%, transparent) 0%, transparent 70%)' }} />
      <div className="glow-blob w-80 h-80 bottom-1/4 right-1/4"
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, #0EA5E9 6%, transparent) 0%, transparent 70%)' }} />

      <div className="flex items-center gap-2.5 mb-8 animate-slide-up">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-brand">
          <Share2 size={20} className="text-white" />
        </div>
        <span className="text-2xl font-extrabold font-display text-app">PeerShare</span>
      </div>

      <div className="card-lg w-full max-w-md p-8 shadow-2xl animate-slide-up" style={{ animationDelay: '60ms' }}>

        <div className="mb-7">

          {mode === AUTH_MODE.LOGIN && (
            <>
              <h1 className="text-2xl font-extrabold font-display mb-1.5 text-app">
                Welcome back
              </h1>

              <p className="text-sm text-muted font-body-var">
                Sign in to continue sharing securely
              </p>
            </>
          )}

      

          {mode === AUTH_MODE.OTP && (
            <>
              <h1 className="text-2xl font-extrabold font-display mb-1.5 text-app">
                Verify OTP
              </h1>

              <p className="text-sm text-muted font-body-var">
                Enter the OTP sent to your email.
              </p>
            </>
          )}

          {mode === AUTH_MODE.EMAIL && (
            <>
              <h1 className="text-2xl font-extrabold font-display mb-1.5 text-app">
                Forgot Password
              </h1>

              <p className="text-sm text-muted font-body-var">
                Enter your registered email address to receive an OTP.
              </p>
            </>
          )}

          {mode === AUTH_MODE.RESET && (
            <>
              <h1 className="text-2xl font-extrabold font-display mb-1.5 text-app">
                Reset Password
              </h1>

              <p className="text-sm text-muted font-body-var">
                Create a new password for your account.
              </p>
            </>
          )}

        </div>


        {mode === AUTH_MODE.LOGIN && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-medium mb-1.5 text-app font-body-var">
                Username or Email
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                />

                <input
                  type="text"
                  value={form.login}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      login: e.target.value
                    }))
                  }
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${
                    errors.login ? "input-field--error" : ""
                  }`}
                />
              </div>

              {errors.login && (
                <p
                  className="text-xs mt-1 font-body-var"
                  style={{ color: "#F87171" }}
                >
                  {errors.login}
                </p>
              )}
            </div>

            <div>

              <div className="flex items-center justify-between mb-1.5">

                <label className="text-sm font-medium text-app font-body-var">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setMode(AUTH_MODE.EMAIL);
                  }}
                  className="text-xs font-medium text-accent hover:opacity-70 transition-opacity"
                >
                  Forgot?
                </button>

              </div>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                />

                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      password: e.target.value
                    }))
                  }
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-11 ${
                    errors.password ? "input-field--error" : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:opacity-70 transition-opacity"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

              </div>

              {errors.password && (
                <p
                  className="text-xs mt-1 font-body-var"
                  style={{ color: "#F87171" }}
                >
                  {errors.password}
                </p>
              )}

            </div>

            {errors.general && (
              <p
                className="text-sm mt-2 font-body-var text-center"
                style={{ color: "#F87171" }}
              >
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-1"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>

          </form>
        )}


        {mode === AUTH_MODE.EMAIL && (
          <div className="flex flex-col gap-5">


            <div>

              <label className="block text-sm font-medium mb-1.5 text-app">
                Email
              </label>

              <div className="relative">

                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="email"
                  value={resetForm.email}
                  onChange={e =>
                    setResetForm({
                      ...resetForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                  className="input-field pl-10"
                />

              </div>

            </div>


            {errors.email && (
              <p
                className="text-xs mt-1"
                style={{ color: "#F87171" }}
              >
                {errors.email}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              className="btn-primary"
              onClick={handleSendOTP}
            >
              {sendOtpLoading ? "Sending..." : "Send OTP"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setMode(AUTH_MODE.LOGIN);
              }}
            >
              Back to Login
            </button>

          </div>
        )}

        {mode === AUTH_MODE.OTP && (
          <div className="flex flex-col gap-5">

            <div>

              <label className="block text-sm font-medium mb-1.5 text-app">
                OTP
              </label>

              <input
                type="text"
                maxLength={6}
                value={resetForm.otp}
                onChange={(e) => {
                  setResetForm({
                    ...resetForm,
                    otp: e.target.value,
                  });

                  if (errors.otp) {
                      setErrors((prev) => ({
                          ...prev,
                          otp: undefined,
                      }));
                  }

                }}
                placeholder="Enter 6-digit OTP"
                className="input-field"
              />

              {errors.otp && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#F87171" }}
                >
                  {errors.otp}
                </p>
              )}

            </div>

            <button
              type="button"
              disabled={loading}
              className="btn-primary"
              onClick={async () => {

                if (!resetForm.otp.trim()) {

                  setErrors({
                    otp: "OTP is required",
                  });

                  return;
                }

                setErrors({});
                setLoading(true);

                try {

                  const res = await axios.post("http://localhost:8000/verifyOTP",{email: resetForm.email,otp: resetForm.otp});

                  if (res.status === 200) {
                    setMode(AUTH_MODE.RESET);
                  }

                } catch (error) {

                  const backendError = error.response?.data;

                  setErrors({
                    otp: backendError?.message || "Invalid OTP",
                  });

                } finally {

                  setLoading(false);

                }

              }}
            >
              {verifyOtpLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              className="btn-secondary"
            >
              {sendOtpLoading ? "Sending" : "Resend OTP"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode(AUTH_MODE.EMAIL)}
            >
              Back
            </button>

          </div>
        )}



        {mode === AUTH_MODE.RESET && (
          <div className="flex flex-col gap-5">

            <div>

              <label className="block text-sm font-medium mb-1.5 text-app">
                New Password
              </label>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type={showNewPw ? "text" : "password"}
                  value={resetForm.newPassword}
                  onChange={(e) => {
                    setResetForm({
                      ...resetForm,
                      newPassword: e.target.value,
                    });

                    if (errors.newPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        newPassword: undefined,
                      }));
                    }
                  }}
                  className="input-field pl-10 pr-10"
                />

                {errors.newPassword && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#F87171" }}
                  >
                    {errors.newPassword}
                  </p>
                )}

                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>

              </div>

            </div>

            <div>

              <label className="block text-sm font-medium mb-1.5 text-app">
                Confirm Password
              </label>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={resetForm.confirmPassword}
                  onChange={(e) => {
                    setResetForm({
                      ...resetForm,
                      confirmPassword: e.target.value,
                    });

                    if (errors.confirmPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                  className="input-field pl-10 pr-10"
                />

                {errors.confirmPassword && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#F87171" }}
                  >
                    {errors.confirmPassword}
                  </p>
                )}

                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                >
                  {showConfirmPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>

              </div>

            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={async () => {

                if (!resetForm.newPassword.trim()) {
                  setErrors({
                    newPassword: "New password is required",
                  });
                  return;
                }

                if (resetForm.newPassword.length < 8) {
                  setErrors({
                    newPassword: "Password must be at least 8 characters long",
                  });
                  return;
                }

                if (!resetForm.confirmPassword.trim()) {
                  setErrors({
                    confirmPassword: "Confirm password is required",
                  });
                  return;
                }

                if (resetForm.confirmPassword.length < 8) {
                  setErrors({
                    confirmPassword: "Password must be at least 8 characters long",
                  });
                  return;
                }

                if (resetForm.newPassword !== resetForm.confirmPassword) {
                  setErrors({
                    confirmPassword: "Passwords do not match",
                  });
                  return;
                }

                setErrors({});

                try {

                  const res = await axios.post(
                    "http://localhost:8000/resetpass",
                    {
                      email: resetForm.email,
                      newPassword: resetForm.newPassword,
                    }
                  );

                  if (res.status === 200) {

                    setMode(AUTH_MODE.LOGIN);

                    setResetForm({
                      email: "",
                      otp: "",
                      newPassword: "",
                      confirmPassword: "",
                    });

                    addToast("Password Changed Successfully");

                  }

                } catch (error) {

                  const backendError = error.response?.data;

                  setErrors({
                    general: backendError?.message || "Failed to reset password",
                  });

                }

              }}
            >
              Reset Password
            </button>

            {errors.general && (
              <p
                className="text-xs mt-2 text-center"
                style={{ color: "#F87171" }}
              >
                {errors.general}
              </p>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode(AUTH_MODE.OTP)}
            >
              Back
            </button>

          </div>
        )}


        {mode === AUTH_MODE.LOGIN && (
          <>
            <div className="divider-or my-5">OR</div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="btn-secondary"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center text-sm font-body-var mt-6 text-muted">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-accent hover:opacity-70 transition-opacity"
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
