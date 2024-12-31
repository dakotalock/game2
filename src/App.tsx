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

// GameContainer component to handle responsive sizing
const GameContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const baseWidth = 600;
      const baseHeight = 400;
      const aspectRatio = baseWidth / baseHeight;

      const containerWidth = Math.min(window.innerWidth * 0.95, baseWidth);
      const containerHeight = containerWidth / aspectRatio;

      setDimensions({ width: containerWidth, height: containerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="game-container" ref={containerRef}>
      <div
        className="game-area"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
          border: '1px solid #ccc',
          backgroundColor: '#f0f0f0'
        }}
      >
        {children}
      </div>
    </div>
  );
};

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
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - targetSize);
    const y = Math.random() * (rect.height - targetSize);
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
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - targetSize);
    const y = Math.random() * (rect.height - targetSize);
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
        }, 300);
        break;
      default:
        break;
    }
  };

  const startGame = () => {
    console.log('Game started');
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

  const stopMusic = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.pause();
    }
  };

  const startMusic = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.play();
    }
  };

  return (
    <GameContainer>
      <div
        ref={gameAreaRef}
        className="game-area"
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
      >
        {targets.map((target) => (
          <div
            key={target.id}
            className={`target ${target.type}`}
            style={{
              left: target.x,
              top: target.y,
              width: target.size,
              height: target.size,
              backgroundColor: target.color,
              transform: `rotate(${target.rotation}deg)`,
              opacity: target.isPopping ? 0 : 1,
              transition: target.isPopping ? 'opacity 0.3s' : 'none',
            }}
            onClick={(e) => handleTargetClick(target.id, e)}
          />
        ))}
        {powerUps.map((powerUp) => (
          <div
            key={powerUp.id}
            className={`power-up ${powerUp.type}`}
            style={{
              left: powerUp.x,
              top: powerUp.y,
              width: targetSize,
              height: targetSize,
            }}
            onClick={(e) => handlePowerUpClick(powerUp.id, e)}
          />
        ))}
        {laser && (
          <div
            className="laser"
            style={{
              position: 'absolute',
              left: laser.startX,
              top: laser.startY,
              width: Math.sqrt(Math.pow(laser.endX - laser.startX, 2) + Math.pow(laser.endY - laser.startY, 2)),
              height: 2,
              transform: `rotate(${Math.atan2(laser.endY - laser.startY, laser.endX - laser.startX)}rad)`,
              transformOrigin: '0 0',
              backgroundColor: 'red',
              transition: 'opacity 0.3s',
              opacity: Date.now() - laser.timestamp < 300 ? 1 : 0,
            }}
          />
        )}
      </div>
      <div className="game-controls">
        <button onClick={startGame} disabled={gameStarted}>
          Start Game
        </button>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'gabriel' | 'easy' | 'normal' | 'hard')}
        >
          <option value="gabriel">Gabriel</option>
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>
        <button onClick={() => setShowInstructions(!showInstructions)}>
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
        {showInstructions && (
          <div className="instructions">
            <p>Click on the targets to score points. Avoid missing targets to keep your lives.</p>
            <p>Collect power-ups for special abilities.</p>
          </div>
        )}
      </div>
      <div className="audio-player">
        <AudioPlayer
          ref={audioPlayerRef}
          autoPlay={false}
          src={selectedSong.src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <select
          value={selectedSong.id}
          onChange={(e) => handleSongChange(Number(e.target.value))}
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.name}
            </option>
          ))}
        </select>
      </div>
    </GameContainer>
  );
};

export default Game;
