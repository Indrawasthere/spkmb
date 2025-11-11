import { Link } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";


export default function NotFound() {
  return (
    <>
      <PageMeta
        title="SIPAKAT-BPJ - 404 Not Found"
        description="Page not found"
      />

      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">

        {/* Soft blue gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#dceaff] via-[#e9f2ff] to-[#f3f8ff] dark:from-[#0e1116] dark:via-[#0c1014] dark:to-[#0a0d11] -z-10"></div>

        {/* Hexagon pattern */}
        <div
          className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07] pointer-events-none -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        ></div>

        {/* Floating blue blobs */}
        <div className="absolute top-20 left-10 w-[260px] h-[260px] bg-blue-300/40 dark:bg-blue-600/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-16 right-16 w-[320px] h-[320px] bg-blue-200/40 dark:bg-blue-500/20 rounded-full blur-3xl -z-10"></div>

        {/* Content */}
        <div className="mx-auto w-full max-w-[700px] text-center flex flex-col items-center relative">

          <h1 className="mb-4 text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Ouch!
          </h1>

          <h2 className="mb-6 text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Halaman tidak ditemukan
          </h2>

          {/* Image */}
          <img
            src="/images/error/404.png"
            alt="404 Illustration"
            className="w-full max-w-[450px] drop-shadow-lg animate-fadeIn"
          />

          <p className="mt-8 mb-8 text-base text-gray-700 dark:text-gray-400 max-w-[480px]">
            Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-6 py-3 text-sm font-medium text-blue-700 shadow-md hover:bg-blue-50 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-all duration-200"
          >
            Silahkan kembali ke Beranda
          </Link>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - Dacode
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 1s ease-out forwards;
          }
        `}
      </style>
    </>
  );
}
