const fetchMarchMadnessGames2023 = async () => {
  const API_KEY = "3"; // Replace with your actual API key
  const LEAGUE_ID = "4607-NCAA-Division-I-Basketball-Mens"; // Replace with the actual NCAA league ID for March Madness
  const YEAR = "2023";

  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventspastleague.php?id=${LEAGUE_ID}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.events) {
      // Filter the events to only include those from 2023
      const games2023 = data.events.filter(
        (event) => event.dateEvent && event.dateEvent.includes(YEAR)
      );
      return games2023;
    } else {
      console.log("No events found for this league.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching March Madness games:", error);
    return [];
  }
};

// Example usage
fetchMarchMadnessGames2023().then((games) => console.log(games));
