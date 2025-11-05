import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";
import { Modal } from "../ui/modal";
import { useAuth } from "../../context/AuthContext";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <Link to="/" className="block mb-8">
              <img
                width={300}
                height={35}
                src="/images/logo/mpmi-logo.png"
                alt="MPMI Logo"
              />
            </Link>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Daftar Akun Baru
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan nama, email, dan password Anda untuk mendaftar
            </p>
          </div>
          <div>
            
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setFirstNameError("");
              setLastNameError("");
              setEmailError("");
              setPasswordError("");
              setGeneralError("");

              let hasError = false;
              if (!firstName.trim()) {
                setFirstNameError("Nama depan dibutuhkan");
                hasError = true;
              }
              if (!lastName.trim()) {
                setLastNameError("Nama belakang dibutuhkan");
                hasError = true;
              }
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
              if (!isChecked) {
                setGeneralError("Kami membutuhkan persetujuan Anda terhadap Syarat dan Ketentuan serta Kebijakan Privasi kami.");
                hasError = true;
              }
              if (hasError) return;

              const success = await signup(email, password, firstName, lastName);
              if (success) navigate("/");
              else setGeneralError("Signup failed. Please try again.");
            }}>
              <div className="space-y-4">
                {generalError && <p className="text-red-500 text-sm mb-4">{generalError}</p>}

                {/* NAME */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Depan
                    </label>
                    <Input
                      id="firstName"
                      className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${
                        firstNameError ? "border-red-500" : ""
                      }`}
                      type="text"
                      placeholder="Masukkan nama depan"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (firstNameError) setFirstNameError("");
                      }}
                    />
                    {firstNameError && (
                      <p className="text-red-500 text-sm mt-1">{firstNameError}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Belakang
                    </label>
                    <Input
                      id="lastName"
                      className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${
                        lastNameError ? "border-red-500" : ""
                      }`}
                      type="text"
                      placeholder="Masukkan nama belakang"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (lastNameError) setLastNameError("");
                      }}
                    />
                    {lastNameError && (
                      <p className="text-red-500 text-sm mt-1">{lastNameError}</p>
                    )}
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${
                      emailError ? "border-red-500" : ""
                    }`}
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pr-10 ${
                        passwordError ? "border-red-500" : ""
                      }`}
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
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
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>

                {/* AGREEMENT */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1 w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dengan membuat akun, anda menyetujui{" "}
                    <button
                      type="button"
                      onClick={() => setTermsModalOpen(true)}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline"
                    >
                      Terms and Conditions
                    </button>{" "}
                    dan{" "}
                    <button
                      type="button"
                      onClick={() => setPrivacyModalOpen(true)}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                </div>

                {/* BUTTON */}
                <div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg" size="sm">
                    Daftar
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Sudah punya akun?{" "}
                <Link
                  to="/signin"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                >
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </div>
      

      {/* === MODALS === */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms and Conditions"
        size="lg"
      >
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Welcome to SIP-KPBJ. By using our service, you agree to the following terms:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide accurate and complete information during registration.</li>
            <li>Keep your account credentials secure.</li>
            <li>Unauthorized access is prohibited.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="Privacy Policy"
        size="lg"
      >
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Your data will only be used to improve our services and user experience.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>We never sell or share personal data without consent.</li>
            <li>You may contact us to update or remove your data anytime.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}