const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("Server Running at http://localhost:6000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//get players API1
app.get("/players/", async (request, response) => {
  const playersDetailsQuery = `
    SELECT
    *
    FROM 
    player_details;`;

  const players = await db.all(playersDetailsQuery);

  response.send(
    players.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//get single player API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerDetailsQuery = `
    SELECT
    *
    FROM 
    player_details
    WHERE 
    player_id = ${playerId};`;

  const playerDetails = await db.get(getPlayerDetailsQuery);

  response.send(convertPlayerDbObjectToResponseObject(playerDetails));
});

//update player name API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const updatePlayerNameQuery = `
    UPDATE 
    player_details
    SET
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};`;

  await db.run(updatePlayerNameQuery);

  response.send("Player Details Updated");
});

//get match details API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetailsQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;

  const matchDetails = await db.get(getMatchDetailsQuery);

  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails));
});

//get match details with playerId API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const matchDetailsOfPlayerQuery = `
    SELECT
    match_details.match_id,
    match_details.match,
    match_details.year
    FROM
    match_details
    INNER JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE 
    player_match_score.player_id = ${playerId};`;

  const matchDetails = await db.all(matchDetailsOfPlayerQuery);

  response.send(
    matchDetails.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

//get player details on matchId API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getPlayerDetailsQuery = `
    SELECT
    player_details.player_id,
    player_details.player_name
    FROM
    player_details
    INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE 
    player_match_score.match_id = ${matchId};`;

  const playerDetails = await db.all(getPlayerDetailsQuery);

  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//get player total score API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerTotalScoreQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM
    player_details
    INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};`;

  const playerScore = await db.get(getPlayerTotalScoreQuery);

  response.send(playerScore);
});

module.exports = app;
