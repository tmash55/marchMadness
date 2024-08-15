"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";

const MarchMadness = () => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [leagueFormat, setLeagueFormat] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [draftState, setDraftState] = useState("paused");
  const [currentPick, setCurrentPick] = useState(1);
  const [numTeams, setNumTeams] = useState(8); // Default to 8 teams
  const [userSlot, setUserSlot] = useState(null);
  const [draftCompleted, setDraftCompleted] = useState(false);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const { league_id } = useParams();
  const supabase = createClient();

  const fetchDraftData = async () => {
    try {
      const { data: leagueData, error: leagueError } = await supabase
        .from("march_madness_leagues")
        .select("num_teams, draft_state, current_pick, commissioner, format")
        .eq("id", league_id)
        .single();

      if (leagueError) {
        console.error("Error fetching league settings:", leagueError);
        return;
      }

      setNumTeams(leagueData.num_teams || 8);
      setDraftState(leagueData.draft_state || "paused");
      setCurrentPick(leagueData.current_pick || 1);
      setLeagueFormat(leagueData.format || 0); // Set league format (0 for normal, 1 for third-round reversal)

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      setIsCommissioner(leagueData.commissioner === userId);

      const { data: teamsData, error: teamsError } = await supabase
        .from("league_teams")
        .select(
          "id, team_name, seed, member_id, draft_round, pick_number, is_eliminated"
        ) // Include is_eliminated
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

      const totalSlots = numTeams;
      let currentRound = Math.ceil(leagueData.current_pick / totalSlots);

      if (currentRound < 1) currentRound = 1;

      const roundPositionField = `round_${currentRound}_position`;

      const { data: memberData, error: memberError } = await supabase
        .from("league_members")
        .select(roundPositionField)
        .eq("league_id", league_id)
        .eq("user_id", userId)
        .single();

      if (memberError) {
        console.error("Error fetching user slot:", memberError);
        return;
      }

      setUserSlot(memberData[roundPositionField]);

      // Log current round, pick, and user slot
      console.log(
        `Current round: ${currentRound}, Current pick: ${leagueData.current_pick}`
      );
      console.log(`User slot: ${memberData[roundPositionField]}`);

      // If draft is completed, set the draftCompleted state to true
      if (leagueData.draft_state === "completed") {
        setDraftCompleted(true);
      }
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
      console.log("Draft started. Current pick set to 1.");
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
      console.log("Draft paused.");
      fetchDraftData();
    } catch (error) {
      console.error("Error pausing draft:", error);
    }
  };

  const handleResumeDraft = async () => {
    try {
      const { error } = await supabase
        .from("march_madness_leagues")
        .update({ draft_state: "started" })
        .eq("id", league_id);

      if (error) {
        console.error("Error resuming draft:", error);
        return;
      }

      setDraftState("started");
      console.log("Draft resumed. Current pick:", currentPick);
      fetchDraftData();
    } catch (error) {
      console.error("Error resuming draft:", error);
    }
  };

  const handleDraftTeam = async (teamId) => {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const userId = userData.user.id;

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

      const totalSlots = numTeams;
      const pickInRound =
        currentPick % totalSlots === 0 ? totalSlots : currentPick % totalSlots;

      console.log(`User ID: ${userId}`);
      console.log(`Drafting team ID: ${teamId} for member ID: ${memberId}`);
      console.log(
        `Current pick: ${currentPick}, Pick in round: ${pickInRound}`
      );

      const { error: updateError } = await supabase
        .from("league_teams")
        .update({
          member_id: memberId,
          draft_round: Math.ceil(currentPick / totalSlots),
          pick_number: pickInRound,
        })
        .eq("id", teamId);

      if (updateError) {
        console.error("Error updating league_teams:", updateError);
        return;
      }

      // Check if the current pick exceeds the total number of picks (64)
      if (currentPick > 64) {
        // All teams are assigned
        const { error: completeDraftError } = await supabase
          .from("march_madness_leagues")
          .update({ draft_state: "completed" })
          .eq("id", league_id);

        if (completeDraftError) {
          console.error("Error completing draft:", completeDraftError);
          return;
        }
        setDraftCompleted(true);
        console.log("The draft is over, good luck!");
      } else {
        const nextPick = currentPick + 1;

        console.log("Next pick:", nextPick);

        const { error: pickError } = await supabase
          .from("march_madness_leagues")
          .update({ current_pick: nextPick })
          .eq("id", league_id);

        if (pickError) {
          console.error("Error updating current pick:", pickError);
          return;
        }

        setCurrentPick(nextPick);
      }

      fetchDraftData();
    } catch (error) {
      console.error("Error handling draft team:", error);
    }
  };

  const getNextPick = (currentPick) => {
    const totalSlots = numTeams; // Use numTeams for flexibility
    const currentRound = Math.ceil(currentPick / totalSlots);

    let nextPick = currentPick + 1;

    // If nextPick goes beyond the last pick of the current round, reset to the first pick of the next round
    if (nextPick > currentRound * totalSlots) {
      nextPick = currentRound * totalSlots + 1;
    }

    console.log(`Next pick calculated: ${nextPick}`);
    return nextPick;
  };

  const getCurrentUserSlot = (currentPick) => {
    const totalSlots = numTeams;
    const currentRound = Math.ceil(currentPick / totalSlots);
    const pickInRound = ((currentPick - 1) % totalSlots) + 1;

    console.log(
      `Current round: ${currentRound}, Pick in round: ${pickInRound}`
    );

    // Logic for determining the slot for the current user
    if (currentRound === 3 && leagueFormat === 1) {
      // Reverse order for the third round if the league format is third-round reversal
      return totalSlots - pickInRound + 1;
    } else if (currentRound % 2 === 1) {
      // Odd rounds: normal order
      return pickInRound;
    } else {
      // Even rounds: reverse order
      return pickInRound;
    }
  };

  const renderDraftBoard = () => {
    const totalRounds = Math.ceil(teams.length / numTeams);
    const draftBoard = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundRow = [];

      if (round % 2 === 1 || (round === 3 && leagueFormat === 1)) {
        // Odd rounds or third-round reversal: left to right
        for (let slot = 1; slot <= numTeams; slot++) {
          const team = teams.find(
            (t) => t.draft_round === round && t.pick_number === slot
          );

          roundRow.push(
            <td
              key={slot}
              className={`border p-2 relative h-12 ${
                team && team.is_eliminated ? "bg-error text-white" : ""
              }`}
            >
              <div className="absolute top-0 left-0 p-1 text-xs font-bold">
                {round}.{slot}
              </div>
              <div className="text-center pt-2">
                {team ? `(${team.seed}) ${team.team_name}` : ""}
              </div>
            </td>
          );
        }
      } else {
        // Even rounds or third-round reversal: right to left
        for (let slot = 1; slot <= numTeams; slot++) {
          const team = teams.find(
            (t) => t.draft_round === round && t.pick_number === slot
          );

          roundRow.unshift(
            <td
              key={slot}
              className={`border p-2 relative h-12 ${
                team && team.is_eliminated ? "bg-error text-white" : ""
              }`}
            >
              <div className="absolute top-0 left-0 p-1 text-xs font-bold">
                {round}.{slot}
              </div>
              <div className="text-center pt-2">
                {team ? `(${team.seed}) ${team.team_name}` : ""}
              </div>
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
    <div className="container mx-auto px-4 py-8">
      {isCommissioner && draftState !== "completed" && (
        <div className="mb-6 flex flex-row justify-end">
          {draftState === "paused" && (
            <>
              <button
                onClick={handleStartDraft}
                disabled={draftState === "started" || draftState === "resumed"}
                className="btn btn-success mr-2"
              >
                Start Draft
              </button>
              <button onClick={handleResumeDraft} className="btn-primary btn">
                Resume Draft
              </button>
            </>
          )}
          {draftState !== "paused" && (
            <button onClick={handlePauseDraft} className="btn btn-error">
              Pause Draft
            </button>
          )}
        </div>
      )}

      {draftState !== "completed" && (
        <div className="overflow-x-auto mb-8 h-96">
          <table className="table table-xs w-full">
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
                  <td>
                    {team.member_id ? ` ${team.member_id}` : "Unassigned"}
                  </td>
                  {draftState === "started" && (
                    <td>
                      {(() => {
                        const totalSlots = numTeams;
                        const currentRound = Math.ceil(
                          currentPick / totalSlots
                        );
                        const pickInRound =
                          ((currentPick - 1) % totalSlots) + 1;

                        const calculatedSlot = getCurrentUserSlot(currentPick);
                        const canDraft = userSlot === calculatedSlot;

                        return !team.member_id && canDraft ? (
                          <button
                            onClick={() => handleDraftTeam(team.id)}
                            className="btn btn-primary"
                          >
                            Draft
                          </button>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Draft
                          </button>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Board */}
      <div className="overflow-x-auto mb-8">
        <table className="table bg-base-200">
          <thead>
            <tr className="h-12">
              {Array.from({ length: numTeams }, (_, i) => (
                <th key={i} className="text-center">
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

      {/* Modal for Draft Completion */}
      {draftCompleted && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="font-bold text-lg">Draft Completed</h2>
            <p>The draft is over, good luck!</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDraftCompleted(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarchMadness;
