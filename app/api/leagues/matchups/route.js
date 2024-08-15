import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { data: matchups, error } = await supabase
      .from("matchups_2023")
      .select("*");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(matchups), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch matchups" }), {
      status: 500,
    });
  }
}
