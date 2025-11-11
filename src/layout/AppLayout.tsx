import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import { motion } from "framer-motion";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <motion.div
      className="min-h-screen xl:flex relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >

      {/* HEXAGON BACKGROUND – BELAKANG KONTEN */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.12] hex-pattern" />
      </div>

      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />

        <div className="relative flex-1 p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </div>

        {/* FOOTER */}
        <div className="w-full py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} - Dacode
        </div>
      </div>
    </motion.div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />

      {/* HEXAGON CSS */}
      <style>
        {`
          .hex-pattern {
            background-color: transparent;
            background-image:
              linear-gradient(120deg, rgba(59,130,246,0.18) 1px, transparent 1px),
              linear-gradient(60deg, rgba(59,130,246,0.18) 1px, transparent 1px),
              linear-gradient(0deg, rgba(59,130,246,0.18) 1px, transparent 1px);
            background-size: 22px 38px;
            background-position:
              0 0,
              11px 19px,
              0 19px;
          }
        `}
      </style>
    </SidebarProvider>
  );
};

export default AppLayout;
