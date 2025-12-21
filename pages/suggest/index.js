import { useState } from "react";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";

export default function SuggestFeature() {
  const { user, token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, message }),
        }
      );

      if (res.ok) {
        toast.success("Suggestion submitted!");
        setTitle("");
        setMessage("");
      } else {
        toast.error("Failed to submit");
      }
    } catch (err) {
      toast.error("Error submitting suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Head>
        <title>Suggest Feature - SAMKIEL BOT</title>
      </Head>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Suggest a Feature</h1>
        <p className="text-gray-500 mb-8">
          Help us improve SAMKIEL BOT. We read every suggestion!
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
              placeholder="e.g. Add dark mode to dashboard"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="5"
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
              placeholder="Explain your idea..."
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </button>
        </form>
      </main>
    </div>
  );
}
