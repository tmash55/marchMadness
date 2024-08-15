"use client";
import React, { useEffect, useState } from "react";

const Matchups = () => {
  const [matchups, setMatchups] = useState([]);

  useEffect(() => {
    const fetchMatchups = async () => {
      try {
        const response = await fetch("/api/leagues/matchups");
        const data = await response.json();
        setMatchups(data);
      } catch (error) {
        console.error("Failed to fetch matchups:", error);
      }
    };

    fetchMatchups();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matchups.map((matchup) => (
        <div
          key={matchup.id}
          className="card shadow-lg bg-base-100"
          style={{
            border: matchup.winner === matchup.team1 ? "" : "",
          }}
        >
          <div className="card-body">
            <h2 className="card-title">Round {matchup.round}</h2>
            <p
              className={`text-lg ${
                matchup.winner === matchup.team1
                  ? "text-green-500 font-bold"
                  : ""
              }`}
            >
              {matchup.team1}{" "}
              {matchup.team1_score !== null ? `(${matchup.team1_score})` : ""}
            </p>
            <p
              className={`text-lg ${
                matchup.winner === matchup.team2
                  ? "text-green-500 font-bold"
                  : ""
              }`}
            >
              {matchup.team2}{" "}
              {matchup.team2_score !== null ? `(${matchup.team2_score})` : ""}
            </p>
            <p>Date: {matchup.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Matchups;
