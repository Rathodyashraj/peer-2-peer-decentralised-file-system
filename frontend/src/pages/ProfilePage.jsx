import { useState } from "react";
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function ProfilePage() {
  const { user, addToast } = useApp();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);    
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};

    if (!form.currentPassword)
      err.currentPassword = "Current password is required.";

    if (!form.newPassword)
      err.newPassword = "New password is required.";
    else if (form.newPassword.length < 8)
      err.newPassword = "Password must be at least 8 characters.";

    if (!form.confirmPassword)
      err.confirmPassword = "Please confirm your password.";
    else if (form.confirmPassword !== form.newPassword)
      err.confirmPassword = "Passwords do not match.";

    if (
      form.currentPassword &&
      form.newPassword &&
      form.currentPassword === form.newPassword
    ) {
      err.newPassword = "New password must be different.";
    }

    return err;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const err = validate();

    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    setErrors({});

    
    try {
        const res = await axios.post('http://localhost:8000/changePassword', {currentPassword: form.currentPassword , newPassword: form.newPassword}, {withCredentials: true});

        if(res.status === 200){
            addToast("Password changed successfully");

            setShowPasswordForm(false);

            setForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setErrors({});
        }
        
    } catch (error) {
        const backendError = error.response?.data;

        if(backendError?.errors?.length > 0){

            const field = backendError.errors[0].field;

            setErrors({
                [field]: backendError.message
            });

        }
        else{

            addToast(
                backendError?.message || "Failed to change password",
                "error"
            );

        }
    }

  };

  return (
    <div className="min-h-screen bg-app">
      <Navbar showSearch={false} />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-10">

        <div className="card rounded-3xl p-8">

          <div className="flex flex-col md:flex-row items-center gap-8">

            <div className="relative">

              <div className="w-32 h-32 rounded-full bg-brand text-white text-4xl font-bold flex items-center justify-center">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>

              <button
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-surface2 border border-theme flex items-center justify-center"
                onClick={() => addToast("Profile image coming soon.", "info")}
              >
                <ImageIcon size={18} />
              </button>

            </div>

            <div>
              <h1 className="text-3xl font-bold font-display text-app">
                {user?.username}
              </h1>

              <p className="text-muted mt-2">
                {user?.email}
              </p>
            </div>

          </div>

        </div>

        <div className="card rounded-3xl mt-8 p-8">

          <h2 className="text-2xl font-bold mb-6 text-app">
            Account Information
          </h2>

          <ReadOnlyField
            icon={<User size={16} />}
            label="Username"
            value={user?.username || ""}
          />

          <ReadOnlyField
            icon={<Mail size={16} />}
            label="Email"
            value={user?.email || ""}
          />

        </div>

        <div className="card rounded-3xl mt-8 p-8">

            {!showPasswordForm ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                    <div>

                        <h3 className="text-lg font-semibold text-app">
                            Change Password
                        </h3>

                        <p className="text-muted mt-2">
                            Keep your account secure by updating your password regularly.
                        </p>

                    </div>

                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className="btn-primary whitespace-nowrap"
                    >
                        Change Password
                    </button>

                </div>
            ) : (

                <form onSubmit={handleSubmit}>

                    <PasswordField
                        label="Current Password"
                        value={form.currentPassword}
                        onChange={(v) =>
                            setForm({ ...form, currentPassword: v })
                        }
                        show={showCurrent}
                        toggle={() => setShowCurrent(!showCurrent)}
                        error={errors.currentPassword}
                    />

                    <PasswordField
                        label="New Password"
                        value={form.newPassword}
                        onChange={(v) =>
                            setForm({ ...form, newPassword: v })
                        }
                        show={showNew}
                        toggle={() => setShowNew(!showNew)}
                        error={errors.newPassword}
                    />

                    <PasswordField
                        label="Confirm Password"
                        value={form.confirmPassword}
                        onChange={(v) =>
                            setForm({ ...form, confirmPassword: v })
                        }
                        show={showConfirm}
                        toggle={() => setShowConfirm(!showConfirm)}
                        error={errors.confirmPassword}
                    />

                    <div className="flex gap-3 mt-6">

                        <button
                            type="submit"
                            className="btn-primary flex-1"
                        >
                            Save Password
                        </button>

                        <button
                            type="button"
                            className="btn-secondary flex-1"
                            onClick={() => {
                                setShowPasswordForm(false);

                                setForm({
                                    currentPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                });

                                setErrors({});
                            }}
                        >
                            Cancel
                        </button>

                    </div>

                    <button
                        type="button"
                        className="mt-5 text-sm text-accent hover:underline"
                        onClick={() =>
                            addToast(
                                "OTP reset flow will be implemented after backend integration.",
                                "info"
                            )
                        }
                    >
                        Forgot your password? Reset using OTP
                    </button>

                </form>

            )}

        </div>

      </main>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }) {
  return (
    <div className="mb-5">
      <label className="block mb-2 text-sm font-medium text-app">
        {label}
      </label>

      <div className="relative">

        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </div>

        <input
          value={value}
          disabled
          className="input-field pl-10 opacity-70"
        />

      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  error,
}) {
  return (
    <div className="mb-5">

      <label className="block mb-2 text-sm font-medium text-app">
        {label}
      </label>

      <div className="relative">

        <Lock
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pl-10 pr-10"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

      </div>

      {error && (
        <p className="text-sm mt-1 text-red-400">
          {error}
        </p>
      )}

    </div>
  );
}