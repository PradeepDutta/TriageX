'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CyberHeart3D() {
  const canvasRef = useRef(null);
  const [showBackground, setShowBackground] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderStatic = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      ctx.clearRect(0, 0, width, height);

      const heartCenterX = width * 0.55;
      const heartCenterY = height * 0.42;

      // 1. Draw glowing HUD target pedestal rings beneath heart (Static)
      ctx.save();
      ctx.translate(heartCenterX, heartCenterY + 180);
      ctx.scale(1.8, 0.45); // Elliptical perspective

      // Outer cyan ring
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Middle red tick ring
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(232, 32, 58, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.32)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // 2. Ambient cyan central glow (Static)
      const radialGlow = ctx.createRadialGradient(
        heartCenterX,
        heartCenterY,
        20,
        heartCenterX,
        heartCenterY,
        300
      );
      radialGlow.addColorStop(0, 'rgba(96, 165, 250, 0.06)');
      radialGlow.addColorStop(0.6, 'rgba(96, 165, 250, 0.015)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(heartCenterX, heartCenterY, 300, 0, Math.PI * 2);
      ctx.fill();

      // 3. Static ambient stars (Static)
      const particlesCount = 45;
      for (let i = 0; i < particlesCount; i++) {
        const px = (i * 137.5) % width;
        const py = (i * 219.3) % height;
        const size = (i % 3) * 0.5 + 1.0;
        const color = i % 2 === 0 ? '#e8203a' : '#60a5fa';
        const opacity = ((i % 5) + 3) / 10;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // 4. Anatomical HUD Callout Pointers for Aorta and Vena Cava (Static)
      ctx.save();
      const isMobile = width < 640;

      // Aorta Callout
      const aortaX = heartCenterX + (isMobile ? 20 : 35);
      const aortaY = heartCenterY - (isMobile ? 90 : 140);
      const aortaArmX = Math.min(aortaX + (isMobile ? 80 : 160), width - 15);

      ctx.strokeStyle = 'rgba(232, 32, 58, 0.75)';
      ctx.fillStyle = 'rgba(232, 32, 58, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(aortaX, aortaY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(aortaX, aortaY);
      ctx.lineTo(aortaX + (isMobile ? 20 : 40), aortaY - (isMobile ? 25 : 40));
      ctx.lineTo(aortaArmX, aortaY - (isMobile ? 25 : 40));
      ctx.stroke();

      ctx.fillStyle = '#f04457';
      ctx.font = isMobile ? 'bold 10px monospace' : 'bold 12px monospace';
      ctx.fillText('AORTA (O₂ RICH)', aortaX + (isMobile ? 22 : 45), aortaY - (isMobile ? 30 : 46));
      ctx.fillStyle = '#94a3b8';
      ctx.font = isMobile ? '9px sans-serif' : '10px sans-serif';
      ctx.fillText(
        isMobile ? 'Oxygenated Arch' : 'Oxygenated High-Pressure Arch',
        aortaX + (isMobile ? 22 : 45),
        aortaY - (isMobile ? 14 : 26)
      );

      // Vena Cava Callout
      const venaX = heartCenterX - (isMobile ? 60 : 90);
      const venaY = heartCenterY - (isMobile ? 25 : 40);
      const venaArmX = Math.max(venaX - (isMobile ? 70 : 160), 15);

      ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
      ctx.fillStyle = 'rgba(96, 165, 250, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(venaX, venaY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(venaX, venaY);
      ctx.lineTo(venaX - (isMobile ? 20 : 40), venaY - (isMobile ? 20 : 30));
      ctx.lineTo(venaArmX, venaY - (isMobile ? 20 : 30));
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = isMobile ? 'bold 10px monospace' : 'bold 12px monospace';
      ctx.fillText('VENA CAVA (DE-O₂)', venaArmX, venaY - (isMobile ? 25 : 36));
      ctx.fillStyle = '#94a3b8';
      ctx.font = isMobile ? '9px sans-serif' : '10px sans-serif';
      ctx.fillText(
        isMobile ? 'Venous Return' : 'Venous System Return',
        venaArmX,
        venaY - (isMobile ? 10 : 16)
      );

      ctx.restore();

      // 5. Static ECG Signal Wave (Static)
      ctx.save();
      const ecgY = height - 90;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.42)';
      ctx.lineWidth = 1.5;

      const segments = Math.floor(width / 180);
      ctx.moveTo(0, ecgY);
      for (let s = 0; s <= segments + 1; s++) {
        const startX = s * 180;
        ctx.lineTo(startX + 70, ecgY);
        ctx.lineTo(startX + 80, ecgY - 10);
        ctx.lineTo(startX + 90, ecgY + 6);
        ctx.lineTo(startX + 95, ecgY - 45);
        ctx.lineTo(startX + 102, ecgY + 18);
        ctx.lineTo(startX + 110, ecgY);
        ctx.lineTo(startX + 130, ecgY - 14);
        ctx.lineTo(startX + 145, ecgY);
        ctx.lineTo(startX + 180, ecgY);
      }
      ctx.stroke();
      ctx.restore();
    };

    renderStatic();
    window.addEventListener('resize', renderStatic);

    return () => {
      window.removeEventListener('resize', renderStatic);
    };
  }, []);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const updateBackground = () => {
      const reducedData = window.matchMedia?.('(prefers-reduced-data: reduce)').matches === true;
      const slowConnection = ['slow-2g', '2g'].includes(connection?.effectiveType);
      setShowBackground(!connection?.saveData && !slowConnection && !reducedData);
    };

    updateBackground();
    connection?.addEventListener?.('change', updateBackground);
    return () => connection?.removeEventListener?.('change', updateBackground);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1,
        background: '#02070b',
      }}
    >
      {/* High-Resolution 3D Cybernetic Heart Background Image - Fixed & Stable */}
      <div
        className="hero-heart-bg-image"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: showBackground ? 'url(/cyber_heart_bg.jpg)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'none',
          opacity: 0.88,
          filter: 'contrast(1.08) brightness(1.05)',
        }}
      />

      {/* Static Medical HUD Overlay Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

