import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { userId } = await req.json();

    const { data, error } = await supabase
      .from("march_madness_leagues")
      .select("*")
      .eq("commissioner", userId);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        { message: "Error fetching leagues", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ leagues: data }, { status: 200 });
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error fetching leagues", error: error.message },
      { status: 500 }
    );
  }
}
