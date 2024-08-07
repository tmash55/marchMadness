// /app/api/leagues/index.js
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  console.log("Received request:", req.method, req.body);

  if (req.method === "POST") {
    const { league_name, num_teams, start_date, format, commissioner } =
      req.body;

    // Convert format to integer
    const formatValue = format === "Regular Snake" ? 0 : 1;

    console.log("Creating league with data:", {
      league_name,
      num_teams,
      start_date,
      format: formatValue,
      commissioner,
    });

    try {
      const { data, error } = await supabase
        .from("march_madness_leagues")
        .insert([
          {
            league_name,
            num_teams,
            start_date,
            format: formatValue,
            commissioner,
            created_at: new Date(),
          },
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("League created successfully:", data);
      res.status(200).json({ message: "League created successfully", data });
    } catch (error) {
      console.error("Error creating league:", error);
      res
        .status(500)
        .json({ message: "Error creating league", error: error.message });
    }
  } else {
    console.log("Method not allowed:", req.method);
    res.status(405).json({ message: "Method not allowed" });
  }
}
