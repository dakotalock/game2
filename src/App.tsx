import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

interface Target {
  x: number;
  y: number;
  dx: number;
  dy: number;
  id: number;
  color: string;
  rotation: number;
  spawnTime: number;
  type: 'normal' | 'slime' | 'mini';
  size: number;
  isPopping?: boolean;
}

type PowerUpType = 'extra-life' | 'time-freeze' | 'double-points' | 'skull' | 'lightning' | 'lava-shield';

interface PowerUp {
  x: number;
  y: number;
  dx: number;
  dy: number;
  id: number;
  type: PowerUpType;
  spawnTime: number;
}

const Game: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'gabriel' | 'easy' | 'normal' | 'hard'>('normal');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const audioPlayerRef = useRef<any>(null);
  const soundCloudRef = useRef<HTMLIFrameElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const targetSize: number = 30;
  const [gameWidth, setGameWidth] = useState<number>(600);
  const [gameHeight, setGameHeight] = useState<number>(400);
  const targetSpeed: number = 2;
  const targetSpawnInterval: number = 1500 / 2;
  const powerUpSpawnInterval: number = 5000 / 2;
  const powerUpDuration: number = 5000;
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationSpeed: number = 2;

  const [laser, setLaser] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    timestamp: number;
  } | null>(null);

  const songs = [
    { id: 1, name: 'Lo-Fi Chill Beats', src: 'https://soundcloud.com/oxinym/sets/lofi-beats-royalty-free' },
    { id: 2, name: 'Song 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 3, name: 'Song 2', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3' },
    { id: 4, name: 'Song 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 5, name: 'Song 4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 6, name: 'Song 5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  ];

  const [selectedSong, setSelectedSong] = useState(songs[0]);

  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = 600;
      const maxHeight = 400;
      const aspectRatio = maxWidth / maxHeight;

      const newWidth = Math.min(window.innerWidth * 0.9, maxWidth);
      const newHeight = newWidth / aspectRatio;

      setGameWidth(newWidth);
      setGameHeight(newHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (gameStarted) {
      stopMusic();
      startMusic();
    }
  }, [selectedSong]);

  const handleSongChange = (id: number) => {
    const song = songs.find((song) => song.id === id);
    if (song) {
      setSelectedSong(song);
    }
  };

  const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const spawnTarget = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const dx = (Math.random() - 0.5) * targetSpeed;
    const dy = (Math.random() - 0.5) * targetSpeed;
    const color = getRandomColor();
    let type: 'normal' | 'slime' | 'mini' = 'normal';
    const random = Math.random();
    if (random < 0.1) {
      type = 'slime';
    } else if (random < 0.2) {
      type = 'mini';
    }
    let size: number;
    switch (type) {
      case 'slime':
        size = targetSize * 1.2;
        break;
      case 'mini':
        size = targetSize / 2;
        break;
      case 'normal':
        size = targetSize;
        break;
      default:
        size = targetSize;
        break;
    }
    const newTarget: Target = {
      x,
      y,
      dx,
      dy,
      id: Date.now() + Math.random(),
      color,
      rotation: 0,
      spawnTime: Date.now(),
      type,
      size,
    };
    setTargets((prevTargets) => [...prevTargets, newTarget]);
  };

  const spawnPowerUp = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const dx = (Math.random() - 0.5) * targetSpeed;
    const dy = (Math.random() - 0.5) * targetSpeed;
    const powerUpTypes: PowerUpType[] = ['extra-life', 'time-freeze', 'double-points', 'skull', 'lightning', 'lava-shield'];
    const type: PowerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const newPowerUp: PowerUp = {
      x,
      y,
      dx,
      dy,
      id: Date.now() + Math.random(),
      type,
      spawnTime: Date.now(),
    };
    setPowerUps((prevPowerUps) => [...prevPowerUps, newPowerUp]);

    setTimeout(() => {
      setPowerUps((prevPowerUps) => prevPowerUps.filter((powerUp) => powerUp.id !== newPowerUp.id));
    }, powerUpDuration);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseClick = (e: MouseEvent<HTMLDivElement>) => {
    if (gameOver || !gameStarted) return;

    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const hitTarget = targets.some((target) => {
      const targetCenterX = target.x + target.size / 2;
      const targetCenterY = target.y + target.size / 2;
      const distance = Math.sqrt(
        Math.pow(clickX - targetCenterX, 2) + Math.pow(clickY - targetCenterY, 2)
      );
      return distance <= target.size / 2;
    });

    const hitPowerUp = powerUps.some((powerUp) => {
      const powerUpCenterX = powerUp.x + targetSize / 2;
      const powerUpCenterY = powerUp.y + targetSize / 2;
      const distance = Math.sqrt(
        Math.pow(clickX - powerUpCenterX, 2) + Math.pow(clickY - powerUpCenterY, 2)
      );
      return distance <= targetSize / 2;
    });

    if (!hitTarget && !hitPowerUp) {
      setLives((prevLives) => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          setGameStarted(false);
          stopMusic();
        }
        return newLives;
      });
    }

    setLaser({
      startX: mousePosition.x,
      startY: mousePosition.y,
      endX: clickX,
      endY: clickY,
      timestamp: Date.now(),
    });
  };

  const handleTargetClick = (id: number, e: MouseEvent<HTMLDivElement>) => {
    if (gameOver) return;

    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    setLaser({
      startX: mousePosition.x,
      startY: mousePosition.y,
      endX: clickX,
      endY: clickY,
      timestamp: Date.now(),
    });

    setTargets((prevTargets) =>
      prevTargets.map((target) =>
        target.id === id ? { ...target, isPopping: true } : target
      )
    );

    setTimeout(() => {
      setTargets((prevTargets) => {
        const updatedTargets = prevTargets.filter((target) => target.id !== id);
        const clickedTarget = prevTargets.find((target) => target.id === id);
        if (clickedTarget) {
          switch (clickedTarget.type) {
            case 'slime':
              const newMiniTarget1: Target = {
                x: clickedTarget.x,
                y: clickedTarget.y,
                dx: (Math.random() - 0.5) * targetSpeed,
                dy: (Math.random() - 0.5) * targetSpeed,
                id: Date.now() + Math.random(),
                color: getRandomColor(),
                rotation: 0,
                spawnTime: Date.now(),
                type: 'mini',
                size: targetSize / 2,
              };
              const newMiniTarget2: Target = {
                x: clickedTarget.x,
                y: clickedTarget.y,
                dx: (Math.random() - 0.5) * targetSpeed,
                dy: (Math.random() - 0.5) * targetSpeed,
                id: Date.now() + Math.random(),
                color: getRandomColor(),
                rotation: 0,
                spawnTime: Date.now(),
                type: 'mini',
                size: targetSize / 2,
              };
              return [...updatedTargets, newMiniTarget1, newMiniTarget2];
            default:
              return updatedTargets;
          }
        }
        return updatedTargets;
      });
      setScore((prevScore) => prevScore + (combo > 5 ? 2 : 1));
      setCombo((prevCombo) => prevCombo + 1);
    }, 300);
  };

  const handlePowerUpClick = (id: number, e: MouseEvent<HTMLDivElement>) => {
    if (gameOver) return;

    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    setLaser({
      startX: mousePosition.x,
      startY: mousePosition.y,
      endX: clickX,
      endY: clickY,
      timestamp: Date.now(),
    });

    const clickedPowerUp = powerUps.find((pu) => pu.id === id);
    if (!clickedPowerUp) return;
    setPowerUps((prevPowerUps) => prevPowerUps.filter((powerUp) => powerUp.id !== id));

    switch (clickedPowerUp.type) {
      case 'extra-life':
        setLives((prevLives) => prevLives + 1);
        break;
      case 'time-freeze':
        setCombo(0);
        setTargets((prevTargets) =>
          prevTargets.map((target) => ({
            ...target,
            dx: 0,
            dy: 0,
          }))
        );
        setTimeout(() => {
          setTargets((prevTargets) =>
            prevTargets.map((target) => ({
              ...target,
              dx: (Math.random() - 0.5) * targetSpeed,
              dy: (Math.random() - 0.5) * targetSpeed,
            }))
          );
        }, 5000);
        break;
      case 'double-points':
        setScore((prevScore) => prevScore + 10);
        break;
      case 'skull':
        setLives((prevLives) => Math.max(prevLives - 1, 0));
        if (lives <= 1) {
          setGameOver(true);
          setGameStarted(false);
          stopMusic();
        }
        break;
      case 'lightning':
        setTargets((currentTargets) =>
          currentTargets.map((target) => ({ ...target, isPopping: true }))
        );
        setTimeout(() => {
          setTargets((currentTargets) => {
            setScore((prevScore) => prevScore + currentTargets.length);
            return [];
          });
        }, 300);
        break;
      case 'lava-shield':
        const halfLength = Math.ceil(targets.length / 2);
        setTargets((prevTargets) =>
          prevTargets.map((target, index) =>
            index < halfLength ? { ...target, isPopping: true } : target
          )
        );
        setTimeout(() => {
          setTargets((prevTargets) => prevTargets.filter((_, index) => index >= halfLength));
          setScore((prevScore) => prevScore + halfLength);
          setLives((prevLives) => prevLives + 2);
        }, 300);
        break;
      default:
        break;
    }
  };

  const renderLaser = () => {
    if (!laser) return null;

    const age = Date.now() - laser.timestamp;
    if (age > 600) {
      setLaser(null);
      return null;
    }

    const dx = laser.endX - laser.startX;
    const dy = laser.endY - laser.startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    const opacity = Math.max(0, 1 - age / 600);

    return (
      <>
        <div
          className="laser"
          style={{
            position: 'absolute',
            left: laser.startX,
            top: laser.startY,
            transform: `rotate(${angle}rad)`,
            transformOrigin: '0% 50%',
            width: `${length}px`,
            height: '6px',
            background: 'linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,107,107,0.8) 100%)',
            boxShadow: '0 0 20px #ff0000, 0 0 40px #ff6b6b',
            opacity,
            transition: 'opacity 0.1s ease-out',
            zIndex: 1000,
          }}
        />
        <div
          className="impact"
          style={{
            position: 'absolute',
            left: laser.endX - 30,
            top: laser.endY - 30,
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(255,107,107,0.8) 0%, transparent 70%)',
            opacity,
            animation: 'impact 0.6s ease-out',
          }}
        />
        <div
          className="muzzle-flash"
          style={{
            position: 'absolute',
            left: laser.startX - 16,
            top: laser.startY - 16,
            width: '32px',
            height: '32px',
            background: 'radial-gradient(circle, #ffffff 0%, #ff0000 50%, transparent 70%)',
            opacity,
            animation: 'muzzleFlash 0.4s ease-out',
          }}
        />
      </>
    );
  };

  const startMusic = () => {
    if (selectedSong.id === 1 && soundCloudRef.current) {
      const widget = (window as any).SC.Widget(soundCloudRef.current);
      widget.play();
    } else if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.play();
    }
  };

  const stopMusic = () => {
    if (selectedSong.id === 1 && soundCloudRef.current) {
      const widget = (window as any).SC.Widget(soundCloudRef.current);
      widget.pause();
    } else if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.pause();
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(
      difficulty === 'gabriel' ? 50 :
      difficulty === 'easy' ? 10 :
      difficulty === 'normal' ? 3 :
      1
    );
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);
    setGameStarted(true);
    startMusic();
  };

  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setLives(
      difficulty === 'gabriel' ? 50 :
      difficulty === 'easy' ? 10 :
      difficulty === 'normal' ? 3 :
      1
    );
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);
    stopMusic();
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const movementInterval = setInterval(() => {
        setTargets((prevTargets) => {
          const updatedTargets = prevTargets.map((target) => {
            let { x, y, dx, dy } = target;

            x += dx;
            y += dy;

            if (x < 0 || x > gameWidth - target.size) {
              dx = -dx;
              x = x < 0 ? 0 : gameWidth - target.size;
            }
            if (y < 0 || y > gameHeight - target.size) {
              dy = -dy;
              y = y < 0 ? 0 : gameHeight - target.size;
            }

            return {
              ...target,
              x,
              y,
              dx,
              dy,
              rotation: (target.rotation + targetRotationSpeed) % 360,
            };
          });

          const expiredTargets = updatedTargets.filter(
            (target) => Date.now() - target.spawnTime > 45000
          );

          if (expiredTargets.length > 0) {
            updatedTargets.forEach((target) => {
              if (expiredTargets.find((et) => et.id === target.id)) {
                target.isPopping = true;
              }
            });

            setTimeout(() => {
              setTargets((current) =>
                current.filter((t) => !expiredTargets.find((et) => et.id === t.id))
              );

              setLives((prevLives) => {
                const newLives = prevLives - expiredTargets.length;
                if (newLives <= 0) {
                  setGameOver(true);
                  setGameStarted(false);
                  stopMusic();
                }
                return Math.max(newLives, 0);
              });
            }, 300);
          }

          return updatedTargets;
        });

        setPowerUps((prevPowerUps) => {
          const updatedPowerUps = prevPowerUps.map((powerUp) => {
            let { x, y, dx, dy } = powerUp;

            x += dx;
            y += dy;

            if (x < 0 || x > gameWidth - targetSize) {
              dx = -dx;
              x = x < 0 ? 0 : gameWidth - targetSize;
            }
            if (y < 0 || y > gameHeight - targetSize) {
              dy = -dy;
              y = y < 0 ? 0 : gameHeight - targetSize;
            }

            return { ...powerUp, x, y };
          });

          const filteredPowerUps = updatedPowerUps.filter(
            (powerUp) => Date.now() - powerUp.spawnTime <= powerUpDuration
          );

          return filteredPowerUps;
        });
      }, 20);

      const spawnIntervalId = setInterval(() => {
        if (!gameOver) spawnTarget();
      }, targetSpawnInterval);

      const powerUpIntervalId = setInterval(() => {
        if (!gameOver) spawnPowerUp();
      }, powerUpSpawnInterval);

      return () => {
        clearInterval(movementInterval);
        clearInterval(spawnIntervalId);
        clearInterval(powerUpIntervalId);
      };
    }
  }, [gameStarted, gameOver]);

  return (
    <div className="flex-container" style={{ padding: '20px', maxHeight: '100vh', overflow: 'hidden' }}>
      <h1 className="text-5xl font-extrabold mb-4 text-white">Gabriel's Game</h1>
      <h2 className="text-xl text-gray-400 mb-6">Created by Dakota Lock for Gabriel</h2>

      <button
        className="instructions-button mb-4"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        Instructions
      </button>

      {showInstructions && (
        <div className="instructions-modal">
          <h3>How to Play</h3>
          <ul>
            <li>Click on the moving targets to score points.</li>
            <li>If a target despawns without being clicked, you lose a life.</li>
            <li>Use power-ups to gain advantages or face penalties.</li>
          </ul>
          <h3>Power-Ups</h3>
          <ul>
            <li><strong>+</strong>: Extra life</li>
            <li><strong>❄️</strong>: Freeze targets for 5 seconds</li>
            <li><strong>+10</strong>: Gain 10 points</li>
            <li><strong>⚡️</strong>: Destroy all targets and gain points</li>
            <li><strong>🛡️</strong>: Destroy half the targets, gain points, and gain 2 lives</li>
            <li><strong>🧙‍♀️</strong>: Lose a life</li>
          </ul>
          <button
            className="close-instructions-button"
            onClick={() => setShowInstructions(false)}
          >
            Close
          </button>
        </div>
      )}

      <div className="hidden">
        {selectedSong.id === 1 ? (
          <iframe
            ref={soundCloudRef}
            width="0"
            height="0"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(selectedSong.src)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          ></iframe>
        ) : (
          <AudioPlayer
            ref={audioPlayerRef}
            src={selectedSong.src}
            autoPlay={false}
            loop={true}
            volume={0.5}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      <div
        ref={gameAreaRef}
        className="game-area"
        style={{
          width: gameWidth,
          height: gameHeight,
          position: 'relative',
          margin: '0 auto',
          touchAction: 'none', // Prevent default touch behaviors
        }}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
      >
        {targets.map((target) => (
          <div
            key={target.id}
            className={`target ${target.isPopping ? 'popping' : ''}`}
            style={{
              position: 'absolute',
              left: `${target.x}px`,
              top: `${target.y}px`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              backgroundColor: target.type === 'slime' ? '#66CCFF' : target.type === 'mini' ? '#FF66CC' : target.color,
              borderRadius: target.type === 'slime' || target.type === 'mini' ? '50%' : '10%',
              transform: `rotate(${target.rotation}deg)`,
              boxShadow: `0 0 10px ${target.color}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleTargetClick(target.id, e);
            }}
          />
        ))}

        {powerUps.map((powerUp) => (
          <div
            key={powerUp.id}
            className={`power-up power-up-${powerUp.type}`}
            style={{
              position: 'absolute',
              left: `${powerUp.x}px`,
              top: `${powerUp.y}px`,
              backgroundColor: powerUp.type === 'time-freeze' ? 'black' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePowerUpClick(powerUp.id, e);
            }}
          >
            {powerUp.type === 'extra-life' ? '+' :
             powerUp.type === 'time-freeze' ? '❄️' :
             powerUp.type === 'double-points' ? '+10' :
             powerUp.type === 'skull' ? '🧙‍♀️' :
             powerUp.type === 'lightning' ? '⚡️' : '🛡️'}
          </div>
        ))}

        <div
          className="crosshair"
          style={{
            position: 'absolute',
            left: `${mousePosition.x - 6}px`,
            top: `${mousePosition.y - 6}px`,
          }}
        />
        {renderLaser()}
      </div>

      <div className="score-display mt-4">
        <div className="text-xl text-white">Score: {score}</div>
        <div className="text-xl text-white">Lives: {lives}</div>
        <div className="text-xl text-white">Combo: x{combo}</div>
      </div>

      <div className="mt-4">
        {!gameStarted && !gameOver && (
          <div className="flex flex-col items-center space-y-4">
            <button
              className="game-button"
              onClick={startGame}
            >
              Start Game
            </button>
            <div className="flex space-x-4">
              <button
                className={`difficulty-button ${difficulty === 'gabriel' ? 'active' : ''}`}
                onClick={() => setDifficulty('gabriel')}
              >
                Gabriel Mode
              </button>
              <button
                className={`difficulty-button ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </button>
              <button
                className={`difficulty-button ${difficulty === 'normal' ? 'active' : ''}`}
                onClick={() => setDifficulty('normal')}
              >
                Normal
              </button>
              <button
                className={`difficulty-button ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </button>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="game-over">
            <p className="text-3xl font-bold text-red-500">Game Over!</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                className="game-button"
                onClick={startGame}
              >
                Play Again
              </button>
              <button
                className="game-button reset"
                onClick={resetGame}
              >
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <select
          value={selectedSong.id.toString()}
          onChange={(e) => {
            const selectedId = parseInt(e.target.value);
            setSelectedSong(songs.find((song) => song.id === selectedId) || songs[0]);
          }}
          className="song-selector"
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id.toString()}>{song.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Game;
