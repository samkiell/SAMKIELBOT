import { useRouter } from "next/router";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const isAdmin = router.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {!isAdmin && <Navbar />}
      <div className={isAdmin ? "" : isHome ? "" : "pt-[54px] md:pt-24"}>
        {children}
      </div>
    </div>
  );
}
