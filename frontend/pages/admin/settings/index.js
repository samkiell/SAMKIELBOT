import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import { ToggleLeft, ToggleRight, Save } from "lucide-react";

export default function SettingsPage() {
  const { token } = useAuth();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default flags to ensure they exist
  const defaultFlags = [
    {
      key: "maintenance_mode",
      description: "Disable new deployments globally",
    },
    { key: "beta_features", description: "Enable beta features for all users" },
    { key: "registrations_open", description: "Allow new user registrations" },
  ];

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/flags`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      // Merge defaults with fetched
      const fetchedFlags = data.data || [];
      const merged = defaultFlags.map((def) => {
        const existing = fetchedFlags.find((f) => f.key === def.key);
        return existing
          ? { ...existing, description: def.description }
          : { ...def, isEnabled: false };
      });

      setFlags(merged);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key, currentValue) => {
    try {
      const newValue = !currentValue;
      setFlags(
        flags.map((f) => (f.key === key ? { ...f, isEnabled: newValue } : f))
      );

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/settings/flags/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isEnabled: newValue,
            description: flags.find((f) => f.key === key).description,
          }),
        }
      );
      toast.success("Setting updated");
    } catch (err) {
      toast.error("Failed to save setting");
      // Revert on error
      fetchFlags();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4">Feature Flags & Policies</h2>
        <div className="space-y-6">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div>
                <h3 className="font-bold text-lg capitalize">
                  {flag.key.replace(/_/g, " ")}
                </h3>
                <p className="text-gray-500 text-sm">{flag.description}</p>
              </div>
              <button
                onClick={() => toggleFlag(flag.key, flag.isEnabled)}
                className={`transition-colors ${
                  flag.isEnabled ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {flag.isEnabled ? (
                  <ToggleRight size={40} className="fill-current" />
                ) : (
                  <ToggleLeft size={40} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
