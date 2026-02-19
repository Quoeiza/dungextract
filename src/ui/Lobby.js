export function setupLobby(uiLayer, playerData, onHost, onJoin) {
    const lobby = document.createElement('div');
    lobby.id = 'lobby-screen';
    
    // Set background image for main menu
    lobby.style.backgroundImage = "url('./assets/images/ui/bg.jpg')";
    lobby.style.backgroundSize = "cover";
    lobby.style.backgroundPosition = "center";
    lobby.style.backgroundRepeat = "no-repeat";

    lobby.innerHTML = `
        <h1>Cold Coin</h1>
        <div id="player-stats">Gold: ${playerData.gold} | Extractions: ${playerData.extractions || 0}</div>
        <input type="text" id="player-name" placeholder="Enter Name" value="${playerData.name}" />
        <select id="class-select">
            <option value="Fighter">Fighter (Heal)</option>
            <option value="Rogue">Rogue (Stealth)</option>
            <option value="Barbarian">Barbarian (Rage)</option>
        </select>
        <button id="btn-host">Host Game</button>
        <div style="display:flex; gap:10px;">
            <input type="text" id="room-code-input" placeholder="Room Code" />
            <button id="btn-join">Join Game</button>
        </div>
    `;
    uiLayer.appendChild(lobby);

    document.getElementById('btn-host').onclick = () => {
        const name = document.getElementById('player-name').value;
        const playerClass = document.getElementById('class-select').value;
        onHost(name, playerClass);
    };

    document.getElementById('btn-join').onclick = () => {
        const code = document.getElementById('room-code-input').value;
        const name = document.getElementById('player-name').value;
        const playerClass = document.getElementById('class-select').value;
        if (!code) return alert("Enter a room code");
        onJoin(code, name, playerClass);
    };
}
