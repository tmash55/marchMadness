import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { league_id, memberId, draftPick } = await req.json();

    const { data, error } = await supabase
      .from("league_members")
      .update({ draft_slot: draftPick })
      .eq("league_id", league_id)
      .eq("user_id", memberId);

    if (error) {
      console.error("Error updating draft pick:", error);
      return NextResponse.json(
        { message: "Error updating draft pick", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Draft pick updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Error updating draft pick", error: error.message },
      { status: 500 }
    );
  }
}
