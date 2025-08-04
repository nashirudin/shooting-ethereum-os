import React, { useEffect, useRef, useState } from "react";

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameRunning, setIsGameRunning] = useState(true);

  const startGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset state
    setScore(0);
    setTimeLeft(60);
    setIsGameRunning(true);

    // Game objects
    let meteors = [];
    let bullets = [];
    let explosions = [];
    let ship = { x: canvas.width / 2 - 60, y: canvas.height - 110, w: 120, h: 120 };
    let keys = {};
    let currentScore = 0;
    let currentTime = 60;
    let gameOver = false;

    // Load images
    const background = new Image();
    background.src = "/background.jpg";
    const shipImage = new Image();
    shipImage.src = "/myship.png";

    // Spawn meteor
    const spawnMeteor = () => {
      if (!gameOver) {
        const count = Math.floor(Math.random() * 3) + 2; // 2-4 meteors sekaligus
        for (let i = 0; i < count; i++) {
          meteors.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            w: 30,
            h: 30,
            speed: 2 + Math.random() * 3,
          });
        }
      }
    };

    // Shoot bullet
    const shoot = () => {
      if (!gameOver) {
        bullets.push({ x: ship.x + ship.w / 2 - 5, y: ship.y, w: 10, h: 20, speed: 7 });
      }
    };

    // Draw everything
    const draw = () => {
      // Background
      if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Ship
      if (shipImage.complete) {
        ctx.drawImage(shipImage, ship.x, ship.y, ship.w, ship.h);
      } else {
        ctx.fillStyle = "cyan";
        ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
      }

      // Bullets
      ctx.fillStyle = "yellow";
      bullets.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

      // Meteors
      ctx.fillStyle = "red";
      meteors.forEach((m) => {
        ctx.beginPath();
        ctx.arc(m.x + m.w / 2, m.y + m.h / 2, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // Explosions
      explosions.forEach((ex) => {
        const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.radius);
        grad.addColorStop(0, `rgba(255, 255, 0, ${ex.alpha})`);
        grad.addColorStop(0.5, `rgba(255, 100, 0, ${ex.alpha})`);
        grad.addColorStop(1, `rgba(255, 0, 0, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Score & Time
      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText(`Score: ${currentScore}`, 20, 40);
      ctx.fillText(`Time: ${currentTime}s`, 20, 70);

      if (gameOver) {
        ctx.font = "48px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText("🎉 Congratulations! 🎉", canvas.width / 2 - 220, canvas.height / 2 - 50);
        ctx.fillText(`Your Score: ${currentScore}`, canvas.width / 2 - 150, canvas.height / 2 + 10);
      }
    };

    // Update game state
    const update = () => {
      if (gameOver) return;

      // Move ship
      if (keys["ArrowLeft"]) ship.x -= 5;
      if (keys["ArrowRight"]) ship.x += 5;
      ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

      // Move bullets
      bullets.forEach((b) => (b.y -= b.speed));
      bullets = bullets.filter((b) => b.y + b.h > 0);

      // Update meteors & collision detection
      meteors = meteors.filter((m) => {
        m.y += m.speed;
        let hit = false;

        bullets.forEach((b, bi) => {
          if (
            b.x < m.x + m.w &&
            b.x + b.w > m.x &&
            b.y < m.y + m.h &&
            b.y + b.h > m.y
          ) {
            hit = true;
            bullets.splice(bi, 1);
            currentScore += 1;
            setScore(currentScore);

            // Tambah ledakan
            explosions.push({
              x: m.x + m.w / 2,
              y: m.y + m.h / 2,
              radius: 5,
              alpha: 1,
            });
          }
        });

        return !hit && m.y < canvas.height;
      });

      // Update explosions
      explosions.forEach((ex, i) => {
        ex.radius += 3;
        ex.alpha -= 0.05;
        if (ex.alpha <= 0) explosions.splice(i, 1);
      });
    };

    // Game loop
    const gameLoop = () => {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    // Controls
    const handleKeyDown = (e) => {
      keys[e.key] = true;
      if (e.key === " ") shoot();
    };
    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const meteorInterval = setInterval(spawnMeteor, 600);

    // Timer countdown
    const timerInterval = setInterval(() => {
      if (!gameOver) {
        currentTime -= 1;
        setTimeLeft(currentTime);
        if (currentTime <= 0) {
          clearInterval(timerInterval);
          clearInterval(meteorInterval);
          gameOver = true;
          setIsGameRunning(false);
        }
      }
    }, 1000);

    gameLoop();

    return () => {
      clearInterval(meteorInterval);
      clearInterval(timerInterval);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  };

  useEffect(() => {
    startGame();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="block" />
      {!isGameRunning && (
        <>
          <button
            onClick={startGame}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              padding: "10px 20px",
              background: "orange",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            🔄 Start Again
          </button>

          <a
            href={`https://twitter.com/intent/tweet?text=I%20scored%20${score}%20in%20Shooting%20Meteors!%20Play%20here:%20https://your-game-link.vercel.app`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "fixed",
              top: 20,
              left: 20,
              padding: "10px 20px",
              background: "#1DA1F2",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            🐦 Share on Twitter
          </a>
        </>
      )}
    </>
  );
}
