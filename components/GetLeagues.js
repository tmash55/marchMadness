"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import apiClient from "@/libs/api";
import Link from "next/link";

const GetLeagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user.id;

        const response = await apiClient.post("/api/leagues/getLeagues", {
          userId,
        });

        setLeagues(response.leagues);
      } catch (error) {
        console.error("Error fetching leagues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [supabase]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Leagues</h1>
      {leagues.length === 0 ? (
        <div>No leagues found</div>
      ) : (
        <ul className="space-y-4">
          {leagues.map((league) => (
            <li key={league.id} className="p-4 border rounded-md">
              <h2 className="text-lg font-semibold">{league.league_name}</h2>
              <p>
                Start Date: {new Date(league.start_date).toLocaleDateString()}
              </p>
              <p>Number of Teams: {league.num_teams}</p>
              <p>
                Format:{" "}
                {league.format === 0
                  ? "Regular Snake"
                  : "3rd Round Reversal Snake"}
              </p>
              <Link href={`/leagues/${league.id}`}>
                <button className="text-blue-500">View League</button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GetLeagues;
