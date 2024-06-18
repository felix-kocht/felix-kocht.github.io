let players = []; // Dynamic array to hold player names
let scores = []; // Dynamic array to hold player scores
let yellowCards = []; // Array to hold indices of players with yellow cards

function promptAndInitializePlayers() {
    const playerInput = document.getElementById('playerNamesInput').value;
    if (playerInput) {
        // Split input into an array and remove extra spaces
        players = playerInput.split(",").map(name => name.trim()).filter(name => name !== "");
        if (players.length > 7) {
            alert("Please enter no more than 7 names.");
            return;
        }
        // Initialize scores to zero for each player
        scores = players.map(() => 0);
        yellowCards = [];
        initializeUI();
    } else {
        alert("Please enter at least one player name.");
    }
}

document.getElementById('newRound').addEventListener('click', function() {
    const playerInput = prompt("Please enter player names (up to 7), separated by commas:");
    if (playerInput) {
        players = playerInput.split(",").map(name => name.trim()).filter(name => name !== "");
        if (players.length > 7) {
            alert("Please enter no more than 7 names.");
            return;
        }
        scores = players.map(() => 0);
        yellowCards = [];
        initializeUI();
        document.getElementById('scoreHistory').tBodies[0].innerHTML = '';
        scores.fill(0);
        updateCumulativeScores();
    } else {
        alert("Please enter at least one player name.");
    }
});

function initializeUI() {
    const playerInputs = document.getElementById('playerInputs');
    const scoreHistoryHead = document.getElementById('scoreHistory').tHead.rows[0];

    // Clear previous inputs and headers
    playerInputs.innerHTML = '';
    while (scoreHistoryHead.firstChild) {
        scoreHistoryHead.removeChild(scoreHistoryHead.lastChild);
    }

    // Create inputs and headers dynamically based on players array
    players.forEach((player, index) => {
        // Create input field for player score
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `player${index}`;
        input.value = '0';
        input.placeholder = `${player}'s profit/loss`;

        // Create a checkbox to mark a player as sitting out
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `sitOut${index}`;
        checkbox.title = `Check if ${player} will sit out this round`;

        // Display player name and checkbox alongside input field
        const playerNameSpan = document.createElement('span');
        playerNameSpan.textContent = ` ${player}`;
        playerNameSpan.id = `playerName${index}`;

        // Add yellow card indicator
        const yellowCardSpan = document.createElement('span');
        yellowCardSpan.className = 'yellowCardSpan';
        yellowCardSpan.id = `yellowCard${index}`;
        yellowCardSpan.textContent = yellowCards.includes(index) ? '⚠️' : '';

        const playerEntryDiv = document.createElement('div');
        playerEntryDiv.className = 'player-entry';
        playerEntryDiv.appendChild(checkbox);
        playerEntryDiv.appendChild(playerNameSpan);
        playerEntryDiv.appendChild(input);
        playerEntryDiv.appendChild(yellowCardSpan);

        playerInputs.appendChild(playerEntryDiv);

        // Add header for each player in score history table
        const th = document.createElement('th');
        th.textContent = player;
        scoreHistoryHead.appendChild(th);
    });

    updateCumulativeScores(); // Update scores in UI
}

function handleYellowCard() {
    const playerIndex = prompt("Enter the player number (1 to " + players.length + ") to give a yellow card:");
    const index = parseInt(playerIndex) - 1;

    if (isNaN(index) || index < 0 || index >= players.length) {
        alert("Invalid player number.");
        return;
    }

    const yellowCardSpan = document.getElementById(`yellowCard${index}`);

    if (yellowCards.includes(index)) {
        // Red card logic: remove yellow card and adjust scores
        alert("That's a red card! Please adjust the scores manually.");

        yellowCards = yellowCards.filter(cardIndex => cardIndex !== index);
        yellowCardSpan.textContent = '';
    } else {
        // Add the yellow card
        yellowCards.push(index);
        yellowCardSpan.textContent = '⚠️';
    }

    localStorage.setItem('yellowCards', JSON.stringify(yellowCards));
    updateCumulativeScores(); // Update scores in UI
}

function updateCumulativeScores() {
    scores.fill(0);
    const rows = document.getElementById('scoreHistory').tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            scores[j] += Number(rows[i].cells[j].textContent);
        }
    }

    const cumulativeScoresDiv = document.getElementById('cumulativeScores');
    cumulativeScoresDiv.innerHTML = players.map((player, index) =>
        `${player}: ${scores[index]}`
    ).join('<br>');
}

document.addEventListener('DOMContentLoaded', function() {
    // Load player names, score history, and yellow cards from local storage if available
    const storedPlayerNames = JSON.parse(localStorage.getItem('playerNames'));
    if (storedPlayerNames && storedPlayerNames.length) {
        players = storedPlayerNames;
    }

    const storedScoreHistory = localStorage.getItem('scoreHistory');
    const storedCumulativeScores = localStorage.getItem('cumulativeScores');
    if (storedScoreHistory) {
        document.getElementById('scoreHistory').innerHTML = storedScoreHistory;
    }
    if (storedCumulativeScores) {
        scores.splice(0, scores.length, ...JSON.parse(storedCumulativeScores));
    }

    const storedYellowCards = JSON.parse(localStorage.getItem('yellowCards'));
    if (storedYellowCards) {
        yellowCards = storedYellowCards;
    }

    initializeUI();
});

document.getElementById('yellowCard').addEventListener('click', handleYellowCard);

function submitScores() {
    let totalInputSum = 0;
    let zeroCount = 0;
    let inputs = [];
    let sittingOutIndices = [];
    let checkedIndices = [];

    // Collect scores and track indices of all checked players
    players.forEach((_, index) => {
        const input = document.getElementById(`player${index}`);
        const checkbox = document.getElementById(`sitOut${index}`);
        const value = Number(input.value);

        if (checkbox.checked) {
            sittingOutIndices.push(index);
            checkedIndices.push(index); // Track all checked indices
        } else {
            totalInputSum += value;
            inputs.push({ index, value });
            if (value === 0) zeroCount++;
        }
    });

    // Balance scores if applicable
    if (totalInputSum !== 0) {
        if (zeroCount > 0 && totalInputSum % zeroCount === 0) {
            const individualValue = -(totalInputSum / zeroCount);
            inputs.forEach(input => {
                if (input.value === 0) {
                    document.getElementById(`player${input.index}`).value = individualValue;
                    scores[input.index] += individualValue;
                }
            });
            updateTableAndScores(sittingOutIndices);
        } else {
            alert('Error: The values entered do not sum to zero, and no adjustment can equalize them.');
            return;
        }
    } else {
        updateTableAndScores(sittingOutIndices);
    }

    // Save history
    const scoreHistoryTable = document.getElementById('scoreHistory').innerHTML;
    localStorage.setItem('scoreHistory', scoreHistoryTable);
    localStorage.setItem('cumulativeScores', JSON.stringify(scores));
    localStorage.setItem('playerNames', JSON.stringify(players));

    // Uncheck all initially
    players.forEach((_, index) => {
        document.getElementById(`sitOut${index}`).checked = false;
    });

    // Move all checked indices down by one position
    checkedIndices = checkedIndices.map(index => (index + 1) % players.length);
    checkedIndices.forEach(index => {
        document.getElementById(`sitOut${index}`).checked = true;
    });
}
function removeLine() {
    const tbody = document.getElementById('scoreHistory').tBodies[0];
    let checkedIndices = [];

    // Identify all checked indices
    players.forEach((_, index) => {
        const checkbox = document.getElementById(`sitOut${index}`);
        if (checkbox.checked) {
            checkedIndices.push(index);
        }
    });

    // Remove the last row if it exists
    if (tbody.rows.length > 0) {
        tbody.deleteRow(-1);
        updateCumulativeScores();
    }

    // Move all checked boxes up by one index
    players.forEach((_, index) => {
        document.getElementById(`sitOut${index}`).checked = false;
    });
    checkedIndices = checkedIndices.map(index => (index - 1 + players.length) % players.length);
    checkedIndices.forEach(index => {
        document.getElementById(`sitOut${index}`).checked = true;
    });
}

function updateTableAndScores(sittingOutIndices) {
    const row = document.createElement('tr');
    const scoreHistoryBody = document.getElementById('scoreHistory').tBodies[0];

    players.forEach((_, index) => {
        const input = document.getElementById(`player${index}`);
        const cell = document.createElement('td');
        cell.textContent = input.value;
        row.appendChild(cell);

        // Update cumulative scores only for players who are not sitting out
        if (!sittingOutIndices.includes(index)) {
            scores[index] += Number(input.value);
        }

        // Reset input field to default only for non-sitting-out players
        input.value = '0';
    });

    scoreHistoryBody.appendChild(row);
    updateCumulativeScores();
}

function updateCumulativeScores() {
    scores.fill(0);
    const rows = document.getElementById('scoreHistory').tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            scores[j] += Number(rows[i].cells[j].textContent);
        }
    }

    const cumulativeScoresDiv = document.getElementById('cumulativeScores');
    cumulativeScoresDiv.innerHTML = players.map((player, index) =>
        `${player}: ${scores[index]}`
    ).join('<br>');
}

document.getElementById('removeLine').addEventListener('click', removeLine);

document.getElementById('downloadResults').addEventListener('click', function() {
    const rows = document.querySelectorAll("#scoreHistory tr");
    let csvContent = "data:text/csv;charset=utf-8,";

    rows.forEach(function(row) {
        let rowData = [];
        row.querySelectorAll("td, th").forEach(function(cell) {
            rowData.push(cell.textContent);
        });
        csvContent += rowData.join(",") + "\r\n";
    });

    csvContent += "\r\nCumulative Scores\r\n";
    players.forEach((player, index) => {
        csvContent += `${player},${scores[index]}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "game_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});