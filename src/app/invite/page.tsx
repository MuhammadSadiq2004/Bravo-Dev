"use client";

import { useState } from "react";
import Link from "next/link";

export default function InvitePage() {
  const [emails, setEmails] = useState<string[]>([""]);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const copyToClipboard = async () => {
    if (!joinLink) return;
    try {
      const fullUrl = window.location.origin + joinLink;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();

    // Filter out empty emails
    const validEmails = emails.filter((e) => e.trim() !== "");
    if (validEmails.length === 0) {
      setMessage("Please enter at least one email address.");
      return;
    }

    setLoading(true);
    setMessage("");
    setJoinLink("");

    const generatedRoomName = "room-" + Math.random().toString(36).substring(7);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: validEmails,
          roomName: generatedRoomName,
          captionLang: lang,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Invites sent successfully!`);
        setJoinLink(`/call/${generatedRoomName}`);
        setEmails([""]); // Reset form
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Invite to Call</h1>
          <p className="text-gray-400 text-sm">
            Enter emails to start a secure video session.
          </p>
        </div>

        <form onSubmit={sendInvite} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invitee Emails
            </label>
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    required={index === 0} // Only first one is strictly required by HTML validation
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="friend@example.com"
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/20"
                      title="Remove email"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEmailField}
              className="mt-3 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add another email
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              "Send Invites"
            )}
          </button>
        </form>

        {/* Success State & Join Link */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              joinLink
                ? "bg-green-500/20 border border-green-500/30"
                : "bg-red-500/20 border border-red-500/30"
            }`}
          >
            <p className="text-center text-sm font-medium mb-2">{message}</p>

            {joinLink && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                <p className="text-xs text-gray-400 text-center">
                  You can join the call now:
                </p>

                <div className="flex gap-2">
                  <Link
                    href={joinLink}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Join Call as Host
                  </Link>

                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/10 flex items-center justify-center"
                    title="Copy Link"
                  >
                    {copied ? (
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
