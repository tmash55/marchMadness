import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { league_name, num_teams, start_date, commissioner } = req.body;

    try {
      const { data, error } = await supabase
        .from("march_madness_leagues")
        .insert([
          {
            league_name,
            num_teams,
            start_date,
            commissioner,
            created_at: new Date(),
          },
        ]);

      if (error) {
        throw error;
      }

      res.status(200).json({ message: "League created successfully", data });
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating league", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
