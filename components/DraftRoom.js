"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import MarchDraft from "./MarchDraft";
import DraftBoard from "./DraftBoard";

const DraftRoom = () => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [draftState, setDraftState] = useState("paused");
  const [currentPick, setCurrentPick] = useState(1);
  const [numTeams, setNumTeams] = useState(8);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const { league_id } = useParams();
  const supabase = createClient();

  const fetchDraftData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data: leagueData, error: leagueError } = await supabase
        .from("march_madness_leagues")
        .select("num_teams, draft_state, current_pick, commissioner")
        .eq("id", league_id)
        .single();

      if (leagueError) {
        console.error("Error fetching league settings:", leagueError);
        return;
      }

      setNumTeams(leagueData.num_teams || 8);
      setDraftState(leagueData.draft_state || "paused");
      setCurrentPick(leagueData.current_pick || 1);

      // Check if the current user is the commissioner
      setIsCommissioner(leagueData.commissioner === userId);

      const { data: teamsData, error: teamsError } = await supabase
        .from("league_teams")
        .select("id, team_name, seed, member_id, draft_round, pick_number")
        .eq("league_id", league_id);

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        return;
      }

      setTeams(teamsData);

      const { data: membersData, error: membersError } = await supabase
        .from("league_members")
        .select("user_id, draft_slot")
        .eq("league_id", league_id);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        return;
      }

      const userIds = membersData.map((member) => member.user_id);

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching users:", usersError);
          return;
        }

        const membersWithEmails = membersData.map((member) => {
          const user = usersData.find((u) => u.id === member.user_id);
          return {
            ...member,
            email: user ? user.email : "Unassigned",
          };
        });

        setMembers(membersWithEmails);
      }
    } catch (error) {
      console.error("Error fetching draft data:", error);
    }
  };

  useEffect(() => {
    fetchDraftData();
  }, [league_id]);

  const handleStartDraft = async () => {
    try {
      // Update the draft state to "started" and set current_pick to 1
      const { error } = await supabase
        .from("march_madness_leagues")
        .update({ draft_state: "started", current_pick: 1 })
        .eq("id", league_id);

      if (error) {
        console.error("Error starting draft:", error);
        return;
      }

      // Set the state locally to reflect the changes
      setDraftState("started");
      setCurrentPick(1);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <MarchDraft />
    </div>
  );
};

export default DraftRoom;
