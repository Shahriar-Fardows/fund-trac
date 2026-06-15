"use client";

import React, { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      "#10b981", // emerald
      "#3b82f6", // blue
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#14b8a6", // teal
    ];

    // Create a burst from the center area
    const particles = Array.from({ length: 140 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      return {
        x: width / 2,
        y: height / 2 - 80, // burst from near the success icon
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6, // push upward
        r: Math.random() * 6 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4,
      };
    });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let anyActive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.97; // drag
        p.vy *= 0.97;
        p.rotation += p.rotationSpeed;

        if (p.vy > 0) {
          p.opacity -= 0.006;
        }

        if (p.opacity > 0 && p.y < height && p.x > 0 && p.x < width) {
          anyActive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
          ctx.restore();
        }
      });

      if (anyActive) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
