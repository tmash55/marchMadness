import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { userId } = await req.json();

    // Fetch leagues where the user is a member
    const { data: leagues, error } = await supabase
      .from("march_madness_leagues")
      .select(
        `
        *,
        league_members!inner(
          user_id
        )
      `
      )
      .eq("league_members.user_id", userId);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        { message: "Error fetching leagues", error: error.message },
        { status: 500 }
      );
    }

    // Fetch the member count for each league
    const leaguesWithMemberCount = await Promise.all(
      leagues.map(async (league) => {
        const { count, error: countError } = await supabase
          .from("league_members")
          .select("id", { count: "exact", head: true })
          .eq("league_id", league.id);

        if (countError) {
          console.error("Supabase count error:", countError);
          return { ...league, members_count: 0 };
        }

        return { ...league, members_count: count };
      })
    );

    return NextResponse.json(
      { leagues: leaguesWithMemberCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error fetching leagues", error: error.message },
      { status: 500 }
    );
  }
}
