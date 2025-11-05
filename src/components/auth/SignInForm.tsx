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
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Selamat datang di Website SIP-KPBJ!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan masukkan email dan password Anda untuk masuk
            </p>
          </div>
          <div>
            
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const success = await login(email, password);
              if (success) {
                navigate("/");
              } else {
                setError("Invalid email or password");
              }
            }}>
              <div className="space-y-4">
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div>
                  <Input 
                    className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <div className="relative">
                    <Input
                      className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-10"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
      </div>
  );
}