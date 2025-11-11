import { Toaster } from "react-hot-toast";

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1f2937", // dark gray
          color: "#fff",
          borderRadius: "0.5rem",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#10B981",
            secondary: "#fff",
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
};
