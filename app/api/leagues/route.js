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

    // Step 1: Insert the league into `march_madness_leagues`
    const { data: leagueData, error: leagueError } = await supabase
      .from("march_madness_leagues")
      .insert([
        { league_name, num_teams, start_date, format: formatInt, commissioner },
      ])
      .select();

    if (leagueError) {
      console.error("Supabase insert error:", leagueError);
      return NextResponse.json(
        { message: "Error creating league", error: leagueError.message },
        { status: 500 }
      );
    }

    const leagueId = leagueData[0].id;

    // Step 2: Add the commissioner as a member of the league
    const { error: memberError } = await supabase
      .from("league_members")
      .insert([{ league_id: leagueId, user_id: commissioner }]);

    if (memberError) {
      console.error("Supabase insert error:", memberError);
      return NextResponse.json(
        {
          message: "Error adding commissioner as a member",
          error: memberError.message,
        },
        { status: 500 }
      );
    }

    // Step 3: Copy teams from `teams_2023` into `league_teams`
    const { data: teams, error: teamsError } = await supabase
      .from("teams_2023")
      .select();

    if (teamsError) {
      console.error("Supabase select error:", teamsError);
      return NextResponse.json(
        { message: "Error fetching teams", error: teamsError.message },
        { status: 500 }
      );
    }

    const leagueTeams = teams.map((team) => ({
      league_id: leagueId,
      team_name: team.team_name,
      seed: team.seed,
      member_id: null, // Teams initially have no members assigned
    }));

    const { error: insertTeamsError } = await supabase
      .from("league_teams")
      .insert(leagueTeams);

    if (insertTeamsError) {
      console.error("Supabase insert error:", insertTeamsError);
      return NextResponse.json(
        {
          message: "Error inserting league teams",
          error: insertTeamsError.message,
        },
        { status: 500 }
      );
    }

    // Step 4: Copy default scoring settings into `league_scoring_settings`
    const defaultScoring = [
      { round: 1, points: 1 },
      { round: 2, points: 2 },
      { round: 3, points: 4 },
      { round: 4, points: 8 },
      { round: 5, points: 16 },
      { round: 6, points: 32 },
    ];

    const leagueScoringSettings = defaultScoring.map((setting) => ({
      league_id: leagueId,
      round: setting.round,
      points: setting.points,
    }));

    const { error: insertScoringError } = await supabase
      .from("league_scoring_settings")
      .insert(leagueScoringSettings);

    if (insertScoringError) {
      console.error("Supabase insert error:", insertScoringError);
      return NextResponse.json(
        {
          message: "Error inserting scoring settings",
          error: insertScoringError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "League, teams, and scoring settings created successfully",
        leagueId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error creating league", error: error.message },
      { status: 500 }
    );
  }
}
