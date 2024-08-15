import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");

  if (!leagueId) {
    return new Response(JSON.stringify({ error: "leagueId is required" }), {
      status: 400,
    });
  }

  try {
    const { data: leagueData, error: leagueError } = await supabase
      .from("march_madness_leagues")
      .select(
        `
        id,
        commissioner,
        league_scoring_settings (round, points, upset_multiplier)
      `
      )
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      return new Response(JSON.stringify({ error: leagueError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(leagueData), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
