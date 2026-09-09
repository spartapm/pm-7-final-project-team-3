"use client";

import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream | null;
  active: boolean;
};

export function VoiceWave({ stream, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BAR_COUNT = 29;
    const BAR_WIDTH = 6;
    const GAP = 6;
    const MIN_HEIGHT = 8;
    const MAX_HEIGHT = 88;
    const NOISE_GATE = 0.025;
    const displayed = new Array(BAR_COUNT).fill(MIN_HEIGHT);
    const phaseOffsets = Array.from({ length: BAR_COUNT }, (_, i) => i * 0.73);

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let raf = 0;
    let running = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const getVolume = (timeData: Uint8Array) => {
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const n = (timeData[i] - 128) / 128;
        sum += n * n;
      }
      return Math.sqrt(sum / timeData.length);
    };

    const drawRoundedBar = (x: number, y: number, w: number, h: number) => {
      const r = Math.min(w / 2, h / 2);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
      }
      ctx.fillStyle = "#3182ED";
      ctx.fill();
    };

    const drawWave = (volume: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
      const centerY = height / 2;
      const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * GAP;
      const startX = (width - totalWidth) / 2;
      const time = performance.now() * 0.004;
      for (let i = 0; i < BAR_COUNT; i++) {
        const distance = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
        const envelope = 1 - distance * 0.65;
        const variation1 = Math.sin(time + phaseOffsets[i]);
        const variation2 = Math.sin(time * 1.73 - phaseOffsets[i] * 0.64);
        const variation = 0.55 + Math.abs(variation1 * 0.65 + variation2 * 0.35) * 0.45;
        let target = volume === 0
          ? MIN_HEIGHT + envelope * 4
          : MIN_HEIGHT + volume * MAX_HEIGHT * envelope * variation;
        target = Math.min(target, MAX_HEIGHT);
        const current = displayed[i];
        displayed[i] += (target - current) * (target > current ? 0.3 : 0.15);
        const barHeight = Math.max(MIN_HEIGHT, displayed[i]);
        drawRoundedBar(startX + i * (BAR_WIDTH + GAP), centerY - barHeight / 2, BAR_WIDTH, barHeight);
      }
    };

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      if (!analyser) {
        drawWave(0);
        return;
      }
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
      let volume = getVolume(timeData);
      if (volume < NOISE_GATE) volume = 0;
      drawWave(Math.min(volume * 7, 1));
    };

    if (active && stream) {
      const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audioContext = new AC();
        void audioContext.resume();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.82;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      }
    }
    running = true;
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      source?.disconnect();
      void audioContext?.close();
    };
  }, [stream, active]);

  return (
    <div className="voice-wave-wrap">
      <canvas ref={canvasRef} className="voice-wave" width={720} height={180} aria-label="음성 입력 파형" />
    </div>
  );
}
