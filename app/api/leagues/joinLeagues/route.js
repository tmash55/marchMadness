import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { league_id, user_id } = await req.json();

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from("league_members")
      .select("*")
      .eq("league_id", league_id)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { message: "You are already a member of this league" },
        { status: 400 }
      );
    }

    // Insert new member
    const { data, error } = await supabase
      .from("league_members")
      .insert([{ league_id, user_id }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { message: "Error joining league", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Joined league successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error joining league", error: error.message },
      { status: 500 }
    );
  }
}
