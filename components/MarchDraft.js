"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";

const MarchMadness = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftState, setDraftState] = useState("paused"); // "paused" or "started"
  const [currentPick, setCurrentPick] = useState(1);
  const [userSlot, setUserSlot] = useState(null);
  const { league_id } = useParams();
  const supabase = createClient();

  // Function to fetch draft data
  const fetchDraftData = async () => {
    try {
      console.log("Fetching draft data for league_id:", league_id);

      // Fetch the league settings (e.g., number of teams, current pick)
      const { data: leagueData, error: leagueError } = await supabase
        .from("march_madness_leagues")
        .select("num_teams, draft_state, current_pick")
        .eq("id", league_id)
        .single();

      if (leagueError) {
        console.error("Error fetching league settings:", leagueError);
        return;
      }

      setDraftState(leagueData.draft_state || "paused");
      setCurrentPick(leagueData.current_pick || 1);

      // Fetch all teams along with their associated member_id
      const { data: teamsData, error: teamsError } = await supabase
        .from("league_teams")
        .select("id, team_name, seed, member_id")
        .eq("league_id", league_id);

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        return;
      }

      setTeams(teamsData);

      // Fetch current user's draft slot
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const userId = userData.user.id;
      const { data: memberData, error: memberError } = await supabase
        .from("league_members")
        .select("draft_slot")
        .eq("league_id", league_id)
        .eq("user_id", userId)
        .single();

      if (memberError) {
        console.error("Error fetching user slot:", memberError);
        return;
      }

      setUserSlot(memberData.draft_slot);
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
        .update({ draft_state: "started", current_pick: 1 })
        .eq("id", league_id);

      if (error) {
        console.error("Error starting draft:", error);
        return;
      }

      setDraftState("started");
      setCurrentPick(1);
    } catch (error) {
      console.error("Error starting draft:", error);
    }
  };

  const handleDraftTeam = async (teamId) => {
    try {
      // Fetch current user data
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const userId = userData.user.id;

      // Fetch the member's id (league_members.id) for the current user in this league
      const { data: memberData, error: memberError } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", userId)
        .single();

      if (memberError) {
        console.error("Error fetching member ID:", memberError);
        return;
      }

      const memberId = memberData.id;

      // Update the league_teams table with the member's id
      const { error: updateError } = await supabase
        .from("league_teams")
        .update({
          member_id: memberId,
          draft_round: Math.ceil(currentPick / 8), // Calculate the round
          pick_number: currentPick,
        })
        .eq("id", teamId);

      if (updateError) {
        console.error("Error updating league_teams:", updateError);
        return;
      }

      // Increment current pick
      const nextPick = currentPick + 1;
      const { error: pickError } = await supabase
        .from("march_madness_leagues")
        .update({ current_pick: nextPick })
        .eq("id", league_id);

      if (pickError) {
        console.error("Error updating current pick:", pickError);
        return;
      }

      setCurrentPick(nextPick);

      // Re-fetch draft data to refresh the UI
      fetchDraftData();
    } catch (error) {
      console.error("Error handling draft team:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={handleStartDraft}
          disabled={draftState === "started"}
          className="mr-2 px-4 py-2 bg-green-500 text-white rounded"
        >
          Start Draft
        </button>
      </div>

      <div className="overflow-x-auto mb-8 h-96">
        <table className="table table-xs w-full ">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Seed</th>
              <th>Assigned to</th>
              {draftState === "started" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-base-300">
                <td>{team.team_name}</td>
                <td>{team.seed}</td>
                <td>{team.member_id ? ` ${team.member_id}` : "Unassigned"}</td>
                {draftState === "started" && (
                  <td>
                    {!team.member_id && userSlot === currentPick ? (
                      <button
                        onClick={() => handleDraftTeam(team.id)}
                        className="btn btn-secondary"
                      >
                        Draft
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDraftTeam(team.id)}
                        className="btn btn-disabled"
                      >
                        Draft
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarchMadness;
