/* Add these styles to your existing App.css */

.flex-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  max-height: 100vh;
  overflow: hidden;
}

.game-area {
  width: 100%;
  max-width: 600px;
  height: 400px;
  position: relative;
  margin: 0 auto;
}

.score-display {
  text-align: center;
  margin-top: 10px;
}

.game-button, .difficulty-button, .instructions-button, .close-instructions-button {
  padding: 10px 20px;
  margin: 5px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
}

.difficulty-button.active {
  background-color: #0056b3;
}

.instructions-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.instructions-modal h3 {
  margin-top: 0;
}

.instructions-modal ul {
  padding-left: 20px;
}

.instructions-modal button {
  margin-top: 10px;
}

.song-selector {
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

@media (max-width: 600px) {
  .flex-container {
    padding: 5px;
  }

  .game-area {
    height: 300px;
  }

  .game-button, .difficulty-button, .instructions-button, .close-instructions-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .score-display {
    font-size: 0.9rem;
  }

  .instructions-modal {
    width: 90%;
    max-width: 300px;
  }

  .song-selector {
    width: 100%;
    max-width: 200px;
  }
}
