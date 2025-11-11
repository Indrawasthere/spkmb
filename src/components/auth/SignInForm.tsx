import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <Link to="/" className="block mb-7">
              <img
                width={300}
                height={45}
                src="/images/logo/mpmi-logo.png"
                alt="MPMI Logo"
              />
            </Link>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Selamat datang di Website Sipakat-PBJ
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan masukkan email dan password Anda untuk masuk
            </p>
          </div>
          <div>
            
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setEmailError('');
              setPasswordError('');
              setGeneralError('');

              // Validation
              let hasError = false;
              if (!email.trim()) {
                setEmailError("Email dibutuhkan");
                hasError = true;
              } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  setEmailError("Invalid email format");
                  hasError = true;
                }
              }
              if (!password.trim()) {
                setPasswordError("Kata sandi dibutuhkan");
                hasError = true;
              }
              if (hasError) return;

              const success = await login(email, password, rememberMe);
              if (success) {
                navigate("/");
              } else {
                setGeneralError("Invalid email atau kata sandi");
              }
            }}>
              <div className="space-y-4">
                {generalError && <p className="text-red-500 text-sm mb-4">{generalError}</p>}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${emailError ? 'border-red-500' : ''}`}
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                  />
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-10 ${passwordError ? 'border-red-500' : ''}`}
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi Anda"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                </div>
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Ingat saya
                  </label>
                </div>
                <div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg" size="sm">
                    Masuk
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Belum punya akun? {""}
                <Link
                  to="/signup"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
        <p className="flex justify-center text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - Dacode
        </p>
      </div>
  );
}
