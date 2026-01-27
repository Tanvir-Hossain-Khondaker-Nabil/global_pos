import { usePage } from "@inertiajs/react";
import React, { useEffect } from "react";
import { Bounce, toast, ToastContainer } from "react-toastify";

export default function GuestLayout({ children }) {
  const { flash } = usePage().props;

  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-no-repeat bg-center bg-[url('/media/static/loginbg.svg')]">
      <div className="w-full max-w-md">
        {children}
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
    </div>
  );
}
