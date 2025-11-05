import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-cover bg-center bg-no-repeat lg:flex lg:items-center lg:justify-center" style={{ backgroundImage: "url('/images/auth/audit.jpg')" }}>
            <div className="relative flex flex-col items-center justify-center w-full h-full p-6 bg-white/20 dark:bg-black/20">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  
                </p>
              </div>
            </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}