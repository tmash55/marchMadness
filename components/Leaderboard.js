"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const { league_id } = useParams();

  console.log("League ID in frontend:", league_id); // Log league_id

  useEffect(() => {
    if (!league_id) {
      console.error("No leagueId found");
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `/api/leagues/leaderboard?leagueId=${league_id}`
        );
        const data = await response.json();

        console.log("API response data:", data); // Log API response data

        if (response.ok && data.length > 0) {
          setLeaderboard(data);
        } else {
          console.error("Error or empty data:", data.error || "No data found");
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboard();
  }, [league_id]);

  console.log("Final leaderboard state:", leaderboard); // Log final leaderboard state

  return (
    <div className="leaderboard">
      <h1 className="card-title">Leaderboard</h1>
      {leaderboard.length === 0 ? (
        <div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Email</th>
                <th>Total Score</th>
                <th>Round 1</th>
                <th>Round 2</th>
                <th>Round 3</th>
                <th>Round 4</th>
                <th>Round 5</th>
                <th>Round 6</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((member, index) => (
                <tr key={member.user_id}>
                  <td>{index + 1}</td>
                  <td>{member.email}</td>
                  <td>{member.total_score}</td>
                  <td>{member.round_1_score}</td>
                  <td>{member.round_2_score}</td>
                  <td>{member.round_3_score}</td>
                  <td>{member.round_4_score}</td>
                  <td>{member.round_5_score}</td>
                  <td>{member.round_6_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
