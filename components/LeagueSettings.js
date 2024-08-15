"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LeagueSettings = () => {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { league_id } = useParams();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        // Fetch the league settings and commissioner information
        const { data: leagueData, error: leagueError } = await supabase
          .from("march_madness_leagues")
          .select(
            "commissioner, league_scoring_settings (round, points, upset_multiplier)"
          )
          .eq("id", league_id)
          .single();

        if (leagueError) throw leagueError;

        // Set the commissioner status
        setIsCommissioner(leagueData.commissioner === userId);

        // Set the scoring settings
        setSettings(leagueData.league_scoring_settings);
      } catch (error) {
        console.error("Error fetching league settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (league_id) {
      fetchSettings();
    }
  }, [league_id]);

  const handleUpdate = async () => {
    try {
      // Iterate over all settings and update them in the database
      for (const setting of settings) {
        const { error } = await supabase
          .from("league_scoring_settings")
          .update({
            points: setting.points,
            upset_multiplier: setting.upset_multiplier,
          })
          .eq("league_id", league_id)
          .eq("round", setting.round);

        if (error) {
          console.error(`Error updating round ${setting.round}:`, error);
          return;
        }
      }

      console.log("All settings updated successfully");
      setIsEditing(false); // Exit editing mode after saving
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (round, field, value) => {
    setSettings((prevSettings) =>
      prevSettings.map((s) =>
        s.round === round
          ? {
              ...s,
              [field]: isNaN(parseFloat(value)) ? 0 : parseFloat(value),
            }
          : s
      )
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row justify-between items-center">
        {" "}
        <h1 className="text-2xl font-bold mb-4">League Scoring Settings</h1>
        {isCommissioner && (
          <button onClick={handleEditToggle} className="btn btn-error mb-4 ">
            {isEditing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>

      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Round</th>
            <th className="px-4 py-2">Points</th>
            <th className="px-4 py-2">Upset Multiplier</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((setting) => (
            <tr key={setting.round}>
              <td className="border px-4 py-2">{setting.round}</td>
              <td className="border px-4 py-2">
                {isCommissioner && isEditing ? (
                  <input
                    type="number"
                    value={isNaN(setting.points) ? "" : setting.points}
                    onChange={(e) =>
                      handleChange(setting.round, "points", e.target.value)
                    }
                    className="input input-bordered"
                  />
                ) : (
                  setting.points
                )}
              </td>
              <td className="border px-4 py-2">
                {isCommissioner && isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    value={
                      isNaN(setting.upset_multiplier)
                        ? ""
                        : setting.upset_multiplier
                    }
                    onChange={(e) =>
                      handleChange(
                        setting.round,
                        "upset_multiplier",
                        e.target.value
                      )
                    }
                    className="input input-bordered"
                  />
                ) : (
                  setting.upset_multiplier
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isCommissioner && isEditing && (
        <button onClick={handleUpdate} className="btn btn-success mt-4">
          Save All Changes
        </button>
      )}
    </div>
  );
};

export default LeagueSettings;
