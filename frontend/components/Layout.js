import { useRouter } from "next/router";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <Navbar />
      <div className="pt-21">{children}</div>
    </div>
  );
}
