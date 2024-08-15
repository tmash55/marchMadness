// DraftBoard.js
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";

const DraftBoard = () => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftState, setDraftState] = useState("paused"); // "paused" or "started"
  const [currentPick, setCurrentPick] = useState(1);
  const [numTeams, setNumTeams] = useState(8); // Default to 8 teams
  const { league_id } = useParams();
  const supabase = createClient();

  const fetchDraftData = async () => {
    try {
      console.log("Fetching draft data for league_id:", league_id);

      // Fetch the league settings (e.g., number of teams)
      const { data: leagueData, error: leagueError } = await supabase
        .from("march_madness_leagues")
        .select("num_teams, draft_state, current_pick")
        .eq("id", league_id)
        .single();

      if (leagueError) {
        console.error("Error fetching league settings:", leagueError);
        return;
      }

      setNumTeams(leagueData.num_teams || 8);
      setDraftState(leagueData.draft_state || "paused");

      // Fetch all teams along with their associated member_id, draft_round, and pick_number
      const { data: teamsData, error: teamsError } = await supabase
        .from("league_teams")
        .select("team_name, seed, member_id, draft_round, pick_number")
        .eq("league_id", league_id);

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        return;
      }

      setTeams(teamsData);

      // Fetch all members with their draft_slot
      const { data: membersData, error: membersError } = await supabase
        .from("league_members")
        .select("user_id, draft_slot")
        .eq("league_id", league_id);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        return;
      }

      // Fetch user emails for each member
      const userIds = membersData.map((member) => member.user_id);

      let membersWithEmails = Array(numTeams)
        .fill()
        .map((_, i) => ({
          draft_slot: i + 1,
          email: "Unassigned",
        }));

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching users:", usersError);
          return;
        }

        membersWithEmails = membersWithEmails.map((slot) => {
          const member = membersData.find(
            (m) => m.draft_slot === slot.draft_slot
          );
          const user = member && usersData.find((u) => u.id === member.user_id);
          return {
            ...slot,
            email: user ? user.email : "Unassigned",
          };
        });
      }

      setMembers(membersWithEmails);
    } catch (error) {
      console.error("Error fetching draft data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftData();
  }, [league_id, supabase]);

  const handleStartDraft = async () => {
    try {
      const { error } = await supabase
        .from("march_madness_leagues")
        .update({ draft_state: "started" })
        .eq("id", league_id);

      if (error) {
        console.error("Error starting draft:", error);
        return;
      }

      setDraftState("started");
    } catch (error) {
      console.error("Error starting draft:", error);
    }
  };

  const handlePauseDraft = async () => {
    try {
      const { error } = await supabase
        .from("march_madness_leagues")
        .update({ draft_state: "paused" })
        .eq("id", league_id);

      if (error) {
        console.error("Error pausing draft:", error);
        return;
      }

      setDraftState("paused");
    } catch (error) {
      console.error("Error pausing draft:", error);
    }
  };

  const renderDraftBoard = () => {
    const totalRounds = Math.ceil(teams.length / numTeams);
    const draftBoard = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundRow = [];

      if (round % 2 === 1) {
        // Odd rounds: left to right
        for (let slot = 1; slot <= numTeams; slot++) {
          const team = teams.find(
            (t) => t.draft_round === round && t.pick_number === slot
          );

          roundRow.push(
            <td key={slot} className="border p-2">
              {team ? `(${team.seed}) ${team.team_name} ` : ""}
            </td>
          );
        }
      } else {
        // Even rounds: right to left
        for (let slot = numTeams; slot >= 1; slot--) {
          const team = teams.find(
            (t) => t.draft_round === round && t.pick_number === slot
          );

          roundRow.push(
            <td key={slot} className="border p-2">
              {team ? `(${team.seed}) ${team.team_name} ` : ""}
            </td>
          );
        }
      }

      draftBoard.push(<tr key={round}>{roundRow}</tr>);
    }

    return draftBoard;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <div className="mb-4"></div>
      <div className="overflow-x-auto mb-8">
        <table className="table bg-blue-200">
          <thead>
            <tr>
              {Array.from({ length: numTeams }, (_, i) => (
                <th key={i}>
                  {i + 1}
                  <br />
                  {members[i] ? members[i].email : "Unassigned"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderDraftBoard()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default DraftBoard;
