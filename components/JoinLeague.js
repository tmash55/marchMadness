"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "react-hot-toast";

const JoinLeague = () => {
  const [leagueIdentifier, setLeagueIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleJoin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please log in to join a league.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/leagues/joinLeagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          league_id: leagueIdentifier,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Successfully joined the league!");
        router.push("/dashboard");
      } else {
        toast.error(
          result.message || "An error occurred while joining the league."
        );
      }
    } catch (error) {
      console.error("Error joining league:", error);
      toast.error("An error occurred while joining the league.");
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Join a League</h1>
      <form onSubmit={handleJoin} className="space-y-6">
        <div>
          <label
            htmlFor="leagueIdentifier"
            className="block text-sm font-medium text-gray-700"
          >
            League ID or Name
          </label>
          <input
            type="text"
            id="leagueIdentifier"
            name="leagueIdentifier"
            value={leagueIdentifier}
            onChange={(e) => setLeagueIdentifier(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? "Joining..." : "Join League"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinLeague;
