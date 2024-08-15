"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useParams } from "next/navigation";

const MemberTeams = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { league_id } = useParams();
  const supabase = createClient();

  const fetchMemberTeams = async () => {
    try {
      // Fetch all members and their teams, including score and elimination status
      const { data: memberTeamsData, error: memberTeamsError } = await supabase
        .from("league_members")
        .select(
          "user_id, users(email), league_teams(team_name, seed, round_1_score, round_2_score, round_3_score, round_4_score, round_5_score, round_6_score, is_eliminated)"
        )
        .eq("league_id", league_id);

      if (memberTeamsError) {
        console.error("Error fetching member teams:", memberTeamsError);
        return;
      }

      // Format the data and order teams by seed number
      const formattedMembers = memberTeamsData.map((member) => ({
        userId: member.user_id,
        email: member.users.email,
        teams: member.league_teams.sort((a, b) => a.seed - b.seed), // Sort by seed
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching member teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberTeams();
  }, [league_id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Assigned Teams</h1>
      {members.length === 0 ? (
        <div>No teams assigned yet</div>
      ) : (
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.userId} className="p-4 border rounded-md">
              <p className="text-lg font-semibold">{member.email}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.teams.map((team, index) => (
                  <div
                    key={index}
                    className={`p-2 border rounded ${
                      team.is_eliminated ? "text-red-500 line-through" : ""
                    }`}
                  >
                    <p className="text-lg font-bold">
                      {team.seed ? `(${team.seed}) ` : ""}
                      {team.team_name}
                    </p>
                    <p>
                      Points:{" "}
                      {[
                        team.round_1_score,
                        team.round_2_score,
                        team.round_3_score,
                        team.round_4_score,
                        team.round_5_score,
                        team.round_6_score,
                      ]
                        .filter(Boolean)
                        .reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberTeams;
