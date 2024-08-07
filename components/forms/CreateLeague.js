"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/libs/api";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const CreateLeague = () => {
  const [leagueName, setLeagueName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [format, setFormat] = useState("Regular Snake");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const commissionerId = userData?.user?.id || "user_id_placeholder";

      await apiClient.post("/api/leagues", {
        league_name: leagueName,
        num_teams: 8,
        start_date: startDate,
        format,
        commissioner: commissionerId,
      });

      // Show success message
      console.log("League created successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating league:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create a New League</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="leagueName"
            className="block text-sm font-medium text-gray-700"
          >
            League Name
          </label>
          <input
            type="text"
            id="leagueName"
            name="leagueName"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="format"
            className="block text-sm font-medium text-gray-700"
          >
            Format
          </label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="Regular Snake">Regular Snake</option>
            <option value="3rd Round Reversal Snake">
              3rd Round Reversal Snake
            </option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          There is a fee associated with this pool. No upfront payment is
          required, so feel free to take a test drive, but once the season/event
          for your pool starts a one-time service fee will be due. Please review
          our pricing page here to learn more.
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? "Creating..." : "Create League"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLeague;
