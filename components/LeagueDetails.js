"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import apiClient from "@/libs/api";
import MemberTeams from "./MemberTeams";

const LeagueDetails = () => {
  const [members, setMembers] = useState([]);
  const [numTeams, setNumTeams] = useState(8); // Default to 8 teams
  const [isLoading, setIsLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false); // To check if the user is the commissioner
  const [commissionerEmail, setCommissionerEmail] = useState(""); // To store the commissioner's email
  const [draftOrder, setDraftOrder] = useState([]);
  const [showAlert, setShowAlert] = useState(false); // State for showing the alert
  const [errorMessage, setErrorMessage] = useState(""); // State for showing error messages
  const [draftState, setDraftState] = useState("paused"); // State for tracking the draft status
  const [leagueName, setleagueName] = useState("");
  const router = useRouter();
  const { league_id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        console.log("userID:", userId);

        // Fetch the league details, including the commissioner's ID, number of teams, and draft state
        const { data: leagueData, error: leagueError } = await supabase
          .from("march_madness_leagues")
          .select("commissioner, num_teams, draft_state, league_name")
          .eq("id", league_id)
          .single();

        if (leagueError) throw leagueError;

        setIsCommissioner(leagueData.commissioner === userId);
        setNumTeams(leagueData.num_teams || 8);
        setDraftState(leagueData.draft_state || "paused");
        setleagueName(leagueData.league_name);

        // Fetch the commissioner's email
        const { data: commissionerData, error: commissionerError } =
          await supabase
            .from("users")
            .select("email")
            .eq("id", leagueData.commissioner)
            .single();

        if (commissionerError) throw commissionerError;

        setCommissionerEmail(commissionerData.email);

        // Fetch league members
        const { data: memberData, error: memberError } = await supabase
          .from("league_members")
          .select("user_id, draft_slot, users(email)")
          .eq("league_id", league_id)
          .order("draft_slot", { ascending: true });

        if (memberError) throw memberError;

        setMembers(memberData);
        setDraftOrder(memberData.map((member) => member.draft_slot));
      } catch (error) {
        console.error("Error fetching league details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueDetails();
  }, [league_id, supabase]);

  const handleManualPickChange = (index, value) => {
    if (value > numTeams) {
      setErrorMessage(
        `Draft pick cannot be greater than the number of teams (${numTeams}).`
      );
      return;
    }

    const newDraftOrder = [...draftOrder];
    newDraftOrder[index] = value;
    setDraftOrder(newDraftOrder);

    // Check for duplicates
    const duplicates = newDraftOrder.filter(
      (item, idx) => newDraftOrder.indexOf(item) !== idx
    );

    if (duplicates.length > 0) {
      setErrorMessage("Draft pick numbers must be unique.");
    } else {
      setErrorMessage("");
    }
  };

  const handleSaveDraftOrder = async () => {
    if (errorMessage) {
      return; // Prevent saving if there are errors
    }

    try {
      for (let i = 0; i < members.length; i++) {
        const memberId = members[i].user_id;
        const draftPick = draftOrder[i];

        await apiClient.post("/api/leagues/updateDraftPick", {
          league_id,
          memberId,
          draftPick,
        });
      }

      // Show success alert
      setShowAlert(true);

      // Hide alert after 3 seconds
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error("Error saving draft order:", error);
    }
  };

  const handleRandomizeDraftOrder = () => {
    const shuffledOrder = [...Array(members.length).keys()]
      .map((i) => i + 1)
      .sort(() => Math.random() - 0.5);
    setDraftOrder(shuffledOrder);
    setErrorMessage(""); // Clear any previous errors
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-around mt-8 space-x-4 mb-10">
        <button
          className="flex flex-col items-center p-4 bg-white shadow-xl rounded-lg hover:bg-base-200 w-40 h-32 btn "
          onClick={() => router.push(`/leagues/${league_id}/draft-room`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
            <path d="M4 12l16 0" />
            <path d="M12 4l0 16" />
          </svg>
          <span className="mt-2 font-semibold text-center">Draft Room</span>
        </button>

        <button
          className="flex flex-col items-center p-4 bg-white shadow-xl rounded-lg hover:bg-base-200 w-40 h-32 btn"
          onClick={() => router.push(`/leagues/${league_id}/leaderboard`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11 6h9" />
            <path d="M11 12h9" />
            <path d="M12 18h8" />
            <path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" />
            <path d="M6 10v-6l-2 2" />
          </svg>
          <span className="mt-2 font-semibold text-center">Leaderboard</span>
        </button>

        <button
          className="flex flex-col items-center p-4 bg-white shadow-xl rounded-lg hover:bg-base-200 w-40 h-32 btn"
          onClick={() => router.push(`/leagues/${league_id}/schedule`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <path d="M7 14h.013" />
            <path d="M10.01 14h.005" />
            <path d="M13.01 14h.005" />
            <path d="M16.015 14h.005" />
            <path d="M13.015 17h.005" />
            <path d="M7.01 17h.005" />
            <path d="M10.01 17h.005" />
          </svg>
          <span className="mt-2 font-semibold text-center">Scores</span>
        </button>

        <button
          className="flex flex-col items-center p-4 bg-white shadow-xl rounded-lg hover:bg-base-200 w-40 h-32 btn"
          onClick={() => router.push(`/leagues/${league_id}/leagueSettings`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
            <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          </svg>
          <span className="mt-2 font-semibold text-center">Settings</span>
        </button>
      </div>

      {showAlert && (
        <div className="alert alert-success mb-4">
          <div>
            <span>Draft order saved successfully!</span>
          </div>
        </div>
      )}
      <h1 className="text-5xl font-semibold m-12 text-center">{leagueName}</h1>
      <p className="text-lg font-semibold mb-6">
        Commissioner: {commissionerEmail}
      </p>
      {errorMessage && (
        <div className="alert alert-error mb-4">
          <div>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
      {members.length === 0 ? (
        <div>No members found</div>
      ) : (
        <ul className="">
          {members.map((member, index) => (
            <li key={member.user_id} className="p-1 border rounded-md">
              <p className="text-lg font-semibold">{member.users.email}</p>
              {isCommissioner && draftState !== "completed" && (
                <input
                  type="number"
                  min="1"
                  max={numTeams}
                  value={draftOrder[index] || ""}
                  onChange={(e) =>
                    handleManualPickChange(index, Number(e.target.value))
                  }
                  className="mt-2 border rounded px-2 py-1"
                />
              )}
              {!isCommissioner && <p>Draft Pick: {member.draft_slot}</p>}
            </li>
          ))}
        </ul>
      )}
      {isCommissioner && draftState !== "completed" && (
        <div className="flex mt-6 gap-2">
          <button
            className="btn btn-success"
            onClick={handleSaveDraftOrder}
            disabled={!!errorMessage} // Disable button if there's an error
          >
            Save Draft Order
          </button>
          <button
            className="btn btn-warning"
            onClick={handleRandomizeDraftOrder}
          >
            Randomize Draft Order
          </button>
        </div>
      )}
      <div className="mt-6">
        <MemberTeams />
      </div>
    </div>
  );
};

export default LeagueDetails;
