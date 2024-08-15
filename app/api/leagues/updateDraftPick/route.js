import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { league_id, memberId, draftPick } = await req.json();

    // Fetch the league settings including the format and number of teams
    const { data: leagueData, error: leagueError } = await supabase
      .from("march_madness_leagues")
      .select("format, num_teams")
      .eq("id", league_id)
      .single();

    if (leagueError) {
      console.error("Error fetching league settings:", leagueError);
      return NextResponse.json(
        {
          message: "Error fetching league settings",
          error: leagueError.message,
        },
        { status: 500 }
      );
    }

    const format = leagueData.format || 0; // Default to 0 if not defined
    const numTeams = leagueData.num_teams || 8; // Default to 8 teams if not defined

    // Update the draft slot for each round
    const updates = {
      draft_slot: draftPick,
      round_1_position: draftPick,
      round_2_position: numTeams - draftPick + 1,
    };

    // If format is 1 (third-round reversal), set round_3_position same as round_2_position
    if (format === 1) {
      updates.round_3_position = numTeams - draftPick + 1;
      updates.round_4_position = draftPick;
      updates.round_5_position = numTeams - draftPick + 1;
      updates.round_6_position = draftPick;
      updates.round_7_position = numTeams - draftPick + 1; // Reverse order for even rounds
      updates.round_8_position = numTeams;
    } else {
      updates.round_3_position = draftPick;
      updates.round_4_position = numTeams - draftPick + 1;
      updates.round_5_position = draftPick;
      updates.round_6_position = numTeams - draftPick + 1; // Reverse order for even rounds
      updates.round_7_position = draftPick;
      updates.round_8_position = numTeams - draftPick + 1; // Regular snake draft, reverse order
    }

    // Continue to update the draft slot for subsequent rounds as per the usual logic

    const { data, error } = await supabase
      .from("league_members")
      .update(updates)
      .eq("league_id", league_id)
      .eq("user_id", memberId);

    if (error) {
      console.error("Error updating draft pick:", error);
      return NextResponse.json(
        { message: "Error updating draft pick", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Draft pick updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error updating draft pick", error: error.message },
      { status: 500 }
    );
  }
}
