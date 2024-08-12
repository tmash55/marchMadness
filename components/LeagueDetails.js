"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import apiClient from "@/libs/api";

const LeagueDetails = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false); // To check if the user is the commissioner
  const [draftOrder, setDraftOrder] = useState([]);
  const [showAlert, setShowAlert] = useState(false); // State for showing the alert
  const [errorMessage, setErrorMessage] = useState(""); // State for showing error messages
  const router = useRouter();
  const { league_id } = useParams();
  const supabase = createClient();

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        // Check if user is commissioner
        const { data: leagueData, error: leagueError } = await supabase
          .from("march_madness_leagues")
          .select("commissioner")
          .eq("id", league_id)
          .single();

        if (leagueError) throw leagueError;

        setIsCommissioner(leagueData.commissioner === userId);

        // Fetch league members
        const { data: memberData, error: memberError } = await supabase
          .from("league_members")
          .select("user_id, draft_slot, users(email)")
          .eq("league_id", league_id)
          .order("draft_slot", { ascending: true });

        if (memberError) throw memberError;

        setMembers(memberData);
        setDraftOrder(memberData.map((member) => member.draft_pick_number));
      } catch (error) {
        console.error("Error fetching league details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueDetails();
  }, [league_id, supabase]);

  const handleManualPickChange = (index, value) => {
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
      <h1 className="text-2xl font-bold mb-6">League Details</h1>
      {showAlert && (
        <div className="alert alert-success mb-4">
          <div>
            <span>Draft order saved successfully!</span>
          </div>
        </div>
      )}
      <p className="text-lg font-semibold">League ID: {league_id}</p>
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
        <ul className="space-y-4">
          {members.map((member, index) => (
            <li key={member.user_id} className="p-4 border rounded-md">
              <p className="text-lg font-semibold">{member.users.email}</p>
              {isCommissioner && (
                <input
                  type="number"
                  min="1"
                  max={members.length}
                  value={draftOrder[index] || ""}
                  onChange={(e) =>
                    handleManualPickChange(index, Number(e.target.value))
                  }
                  className="mt-2 border rounded px-2 py-1"
                />
              )}
              {!isCommissioner && <p>Draft Pick: {member.draft_pick_number}</p>}
            </li>
          ))}
        </ul>
      )}
      {isCommissioner && (
        <div className=" flex mt-6 gap-2">
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
        <button
          className="btn btn-info"
          onClick={() => router.push(`/leagues/${league_id}/draft-room`)}
        >
          View Draft Room
        </button>
      </div>
    </div>
  );
};

export default LeagueDetails;
