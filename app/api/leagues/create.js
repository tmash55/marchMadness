import { createLeague } from "@/libs/leagues";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const supabase = createClientComponentClient();
      const { data: user } = await supabase.auth.getUser();
      const leagueData = { ...req.body, commissioner: user.id };
      const newLeague = await createLeague(leagueData);
      res.status(201).json(newLeague);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create league: " + error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
