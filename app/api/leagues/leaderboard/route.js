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

  // Fetch all league members
  const { data: membersData, error: membersError } = await supabase
    .from("league_members")
    .select("id, user_id, draft_slot")
    .eq("league_id", leagueId);

  if (membersError) {
    return new Response(JSON.stringify({ error: membersError.message }), {
      status: 500,
    });
  }

  const memberIds = membersData.map((member) => member.id);

  if (memberIds.length > 0) {
    // Fetch each user's teams and their scores from league_teams
    const { data: teamsData, error: teamsError } = await supabase
      .from("league_teams")
      .select(
        "member_id, round_1_score, round_2_score, round_3_score, round_4_score, round_5_score, round_6_score"
      )
      .eq("league_id", leagueId)
      .in("member_id", memberIds);

    if (teamsError) {
      return new Response(JSON.stringify({ error: teamsError.message }), {
        status: 500,
      });
    }

    // Aggregating scores by user_id
    const aggregatedScores = membersData.map((member) => {
      const userTeams = teamsData.filter(
        (team) => team.member_id === member.id
      );
      const roundScores = {
        round_1_score: 0,
        round_2_score: 0,
        round_3_score: 0,
        round_4_score: 0,
        round_5_score: 0,
        round_6_score: 0,
      };

      userTeams.forEach((team) => {
        roundScores.round_1_score += team.round_1_score;
        roundScores.round_2_score += team.round_2_score;
        roundScores.round_3_score += team.round_3_score;
        roundScores.round_4_score += team.round_4_score;
        roundScores.round_5_score += team.round_5_score;
        roundScores.round_6_score += team.round_6_score;
      });

      const totalScore = Object.values(roundScores).reduce(
        (acc, score) => acc + score,
        0
      );

      return {
        user_id: member.user_id,
        ...roundScores,
        total_score: totalScore,
      };
    });

    // Fetch user emails
    const userIds = aggregatedScores.map((score) => score.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);

    if (usersError) {
      return new Response(JSON.stringify({ error: usersError.message }), {
        status: 500,
      });
    }

    const leaderboardData = aggregatedScores.map((score) => {
      const user = usersData.find((u) => u.id === score.user_id);
      return {
        ...score,
        email: user ? user.email : "Unassigned",
      };
    });

    // Sort leaderboard by total_score in descending order
    const sortedLeaderboard = leaderboardData.sort(
      (a, b) => b.total_score - a.total_score
    );

    return new Response(JSON.stringify(sortedLeaderboard), { status: 200 });
  }

  return new Response(JSON.stringify([]), { status: 200 });
}
