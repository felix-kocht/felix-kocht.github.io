let players = ['Player 1', 'Player 2', 'Player 3', 'Player 4']; // Adjust for your actual players
const scores = players.map(() => 0); // Initialize scores


function submitScores() {
    let totalInputSum = 0;
    let zeroCount = 0;
    let inputs = [];

    players.forEach((_, index) => {
        const input = document.getElementById(`player${index}`);
        const value = Number(input.value);
        totalInputSum += value;
        inputs.push({index, value});
        if (value === 0) zeroCount++;
    });

    if (totalInputSum !== 0) {
        if (zeroCount > 0 && totalInputSum % zeroCount === 0) {
            const individualValue = -(totalInputSum / zeroCount);
            inputs.forEach(input => {
                if (input.value === 0) {
                    document.getElementById(`player${input.index}`).value = individualValue;
                    scores[input.index] += individualValue; // Update score with the new value
                }
            });
            updateTableAndScores();
        } else {
            alert('Error: The values entered do not sum to zero, and no adjustment can equalize them.');
            return; // Exit the function without updating scores
        }
    } else {
        updateTableAndScores();
    }

    // Convert score history and cumulative scores to a string and save to local storage
    const scoreHistoryTable = document.getElementById('scoreHistory').innerHTML;
    localStorage.setItem('scoreHistory', scoreHistoryTable);
    localStorage.setItem('cumulativeScores', JSON.stringify(scores));
}

function updateTableAndScores() {
    const row = document.createElement('tr');
    const scoreHistoryBody = document.getElementById('scoreHistory').tBodies[0];

    players.forEach((_, index) => {
        const input = document.getElementById(`player${index}`);
        const cell = document.createElement('td');
        cell.textContent = input.value;
        row.appendChild(cell);
        scores[index] += Number(input.value); // Update cumulative score
        input.value = '0'; // Reset input field to default
    });

    scoreHistoryBody.appendChild(row);
    updateCumulativeScores();
}

function updateCumulativeScores() {
    // Reset scores to 0
    scores.fill(0);

    // Get all rows from the score history table
    const rows = document.getElementById('scoreHistory').tBodies[0].rows;

    // Iterate through each row
    for (let i = 0; i < rows.length; i++) {
        // For each row, iterate through each cell (skip the first cell if it's a header or index)
        for (let j = 0; j < rows[i].cells.length; j++) {
            // Add the cell's number value to the corresponding score
            scores[j] += Number(rows[i].cells[j].textContent);
        }
    }

    // Update the DOM with the new cumulative scores
    const cumulativeScoresDiv = document.getElementById('cumulativeScores');
    cumulativeScoresDiv.innerHTML = players.map((player, index) => 
        `${player}: ${scores[index]}`
    ).join('<br>');
}

function determinePlayersToPlay(roundCounter, playerNames) {
    const numPlayers = playerNames.length;

    if (numPlayers === 4) {
        // All 4 players play all the time
        return playerNames;
    } else if (numPlayers === 5) {
        // One player sits out each round in order
        const sitOutPlayerIndex = roundCounter % numPlayers;
        return playerNames.filter((_, i) => i !== sitOutPlayerIndex);
    } else if (numPlayers === 6) {
        // Two players sit out each round in order
        const sitOutPlayerIndices = new Set([roundCounter % numPlayers, (roundCounter + 3) % numPlayers]);
        return playerNames.filter((_, i) => !sitOutPlayerIndices.has(i));
    } else if (numPlayers === 7) {
        // Three players sit out each round in order
        const sitOutPlayerIndices = new Set([roundCounter % numPlayers, (roundCounter + 3) % numPlayers, (roundCounter + 4) % numPlayers]);
        return playerNames.filter((_, i) => !sitOutPlayerIndices.has(i));
    } else {
        return [];
    }
}

function initializeUI() {
    // Assuming you have a div for player inputs and a table for score history
    const playerInputs = document.getElementById('playerInputs');
    const scoreHistoryHead = document.getElementById('scoreHistory').tHead.rows[0];

    // Clear existing inputs and score history headers to prepare for new ones
    playerInputs.innerHTML = '';
    while (scoreHistoryHead.firstChild) {
        scoreHistoryHead.removeChild(scoreHistoryHead.lastChild);
    }

    // Create and append new input fields and table headers for each player
    players.forEach((player, index) => {
        // Create input field for player
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `player${index}`;
        input.value = '0'; // Default score set to zero
        input.placeholder = `${player}'s profit/loss`;

        // Create a span for player's name and append it next to the input
        const playerNameSpan = document.createElement('span');
        playerNameSpan.textContent = ` ${player}`;

        // Append the input, player's name span, and a line break to the inputs container
        playerInputs.appendChild(input);
        playerInputs.appendChild(playerNameSpan);
        playerInputs.appendChild(document.createElement('br'));

        // Create a header cell for the player in the score history table
        const th = document.createElement('th');
        th.textContent = player;
        scoreHistoryHead.appendChild(th);

        // After updating the players array
        localStorage.setItem('playerNames', JSON.stringify(players));
        // Optionally, save the scores if they need to be persistent across reloads
        //localStorage.setItem('playerScores', JSON.stringify(scores));

    });

    // Reset scores array to zero for all players
    scores = players.map(() => 0); // Assuming `scores` is declared with `let` and can be reassigned

    // Optionally, update other parts of your UI as needed
    // For example, if you have a section for displaying cumulative scores, update it as well
    updateCumulativeScores(); // Make sure this function reflects changes in the UI based on the new `scores` array
}

// Add these functionalities inside the DOMContentLoaded listener or at the end of your script

document.getElementById('newRound').addEventListener('click', function() {
    if (confirm('Are you ready to start a new round? This will reset the current data.')) {
        // Prompt for new player names
        const newNames = prompt("Please enter the 4 player names, separated by commas:", players.join(","));
        if (newNames) {
            const namesArray = newNames.split(",").map(name => name.trim());
            if (namesArray.length === 4) {
                players = namesArray; // Assuming `players` is declared with `let`
                // Clear local storage and UI components related to the previous game's data
                localStorage.clear();
                document.getElementById('scoreHistory').tBodies[0].innerHTML = '';
                scores.fill(0); // Assuming `scores` is also mutable
                updateCumulativeScores();
                // Re-initialize UI with new player names
                initializeUI(); // This function needs to be defined or adjusted accordingly
            } else {
                alert("Please enter exactly 4 names.");
            }
        }
    }
});


document.getElementById('removeLine').addEventListener('click', function() {
    const tbody = document.getElementById('scoreHistory').tBodies[0];
    if (tbody.rows.length > 0) {
        tbody.deleteRow(-1); // Removes the last row
        updateCumulativeScores(); // Recalculate scores based on remaining rows
    }
});

document.getElementById('downloadResults').addEventListener('click', function() {
    const rows = document.querySelectorAll("#scoreHistory tr");
    let csvContent = "data:text/csv;charset=utf-8,";

    rows.forEach(function(row) {
        let rowData = [];
        row.querySelectorAll("td, th").forEach(function(cell) {
            rowData.push(cell.textContent);
        });
        csvContent += rowData.join(",") + "\r\n"; // Add row data and new line
    });

    // Adding cumulative scores to the CSV
    csvContent += "\r\nCumulative Scores\r\n";
    players.forEach((player, index) => {
        csvContent += `${player},${scores[index]}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "game_results.csv");
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the file
    document.body.removeChild(link); // Clean up
});


document.addEventListener('DOMContentLoaded', function() {
    // Load player names from localStorage if available
    const savedPlayerNames = JSON.parse(localStorage.getItem('playerNames'));
    if (savedPlayerNames && savedPlayerNames.length) {
        players = savedPlayerNames; // Update players with the loaded names
    }
    
    // Load score history and cumulative scores from local storage
    const storedScoreHistory = localStorage.getItem('scoreHistory');
    const storedCumulativeScores = localStorage.getItem('cumulativeScores');
    if (storedScoreHistory) {
        document.getElementById('scoreHistory').innerHTML = storedScoreHistory;
    }
    if (storedCumulativeScores) {
        scores.splice(0, scores.length, ...JSON.parse(storedCumulativeScores));
    }

    // Initialize UI with the loaded or default data
    initializeUI(); // This should now correctly set up input fields based on updated `players`
});


