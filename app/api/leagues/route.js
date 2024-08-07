import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { league_name, num_teams, start_date, format, commissioner } =
      await req.json();

    // Map format string to integer
    const formatMapping = {
      "Regular Snake": 0,
      "3rd Round Reversal Snake": 1,
    };
    const formatInt = formatMapping[format];

    const { data: leagueData, error: leagueError } = await supabase
      .from("march_madness_leagues")
      .insert([
        { league_name, num_teams, start_date, format: formatInt, commissioner },
      ])
      .select("id")
      .single();

    if (leagueError) {
      console.error("Supabase insert error:", leagueError);
      return NextResponse.json(
        { message: "Error creating league", error: leagueError.message },
        { status: 500 }
      );
    }

    const leagueId = leagueData.id;

    const { data: memberData, error: memberError } = await supabase
      .from("league_members")
      .insert([{ league_id: leagueId, user_id: commissioner }]);

    if (memberError) {
      console.error("Supabase insert error:", memberError);
      return NextResponse.json(
        {
          message: "Error adding commissioner to league members",
          error: memberError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "League created successfully", data: leagueData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating league:", error);
    return NextResponse.json(
      { message: "Error creating league", error: error.message },
      { status: 500 }
    );
  }
}
