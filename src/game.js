'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Layout constants ─────────────────────────────────────────────────────────
const W = 800, H = 450;
const GROUND = 370;          // y of ground surface
const CX = W / 2;            // 400 – centre x

// Rope-holder positions (the two girls)
const LEFT_X  = CX - 215;   // 185
const RIGHT_X = CX + 215;   // 615

// Rope endpoints (fixed in space – girls swing wrists around these)
const ROPE_ATTACH_Y = GROUND - 125;   // 245  (hands raised high)
const ROPE_RADIUS   = GROUND - ROPE_ATTACH_Y;   // 125  (rope sweeps to floor)

// Stick-figure anatomy (relative to each figure's ground Y)
const HEAD_R    = 11;
const BODY_H    = 30;   // shoulder → hip
const LEG_UPPER = 22;   // hip → knee
const LEG_LOWER = 22;   // knee → foot   (total leg = 44)
const ARM_L     = 26;

// Derived Y offsets from groundY
function figurePoints(gY) {
  const foot   = gY;
  const knee   = gY - LEG_LOWER;
  const hip    = knee - LEG_UPPER;
  const shoulder = hip - BODY_H;
  const neck   = shoulder + 4;
  const head   = neck - HEAD_R - 2;
  return { foot, knee, hip, shoulder, neck, head };
}

// ─── Environment configurations ───────────────────────────────────────────────
const ENVS = {
  park: {
    label: 'Park',
    gravity: 0.62,
    jumpForce: -14.5,
    ropeSpeed: 0.047,
    ropeColor: '#8D4E18',
    drawBg() {
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#5DADE2');
      sky.addColorStop(1, '#A8D8EA');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);

      // Sun
      ctx.fillStyle = '#FFE135';
      ctx.beginPath(); ctx.arc(90, 65, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFE135'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(90 + Math.cos(a) * 37, 65 + Math.sin(a) * 37);
        ctx.lineTo(90 + Math.cos(a) * 52, 65 + Math.sin(a) * 52);
        ctx.stroke();
      }

      // Clouds
      drawCloud(250, 55, 1.1);
      drawCloud(520, 80, 0.85);
      drawCloud(680, 45, 0.7);

      // Ground (grass)
      const grass = ctx.createLinearGradient(0, GROUND, 0, H);
      grass.addColorStop(0, '#52BE80');
      grass.addColorStop(1, '#27AE60');
      ctx.fillStyle = grass;
      ctx.fillRect(0, GROUND, W, H - GROUND);

      // Grass blades hint
      ctx.strokeStyle = '#239B56'; ctx.lineWidth = 1.5;
      for (let x = 5; x < W; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND);
        ctx.lineTo(x - 3, GROUND - 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 5, GROUND);
        ctx.lineTo(x + 8, GROUND - 6);
        ctx.stroke();
      }

      // Trees
      drawTree(55, GROUND, 0.9);
      drawTree(140, GROUND, 0.7);
      drawTree(710, GROUND, 0.95);
      drawTree(760, GROUND, 0.6);
    }
  },

  playground: {
    label: 'Playground',
    gravity: 0.62,
    jumpForce: -14.5,
    ropeSpeed: 0.047,
    ropeColor: '#C0392B',
    drawBg() {
      // Overcast sky
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#90A4AE');
      sky.addColorStop(1, '#CFD8DC');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND);

      // School building (back-left)
      ctx.fillStyle = '#E8DACD';
      ctx.fillRect(0, GROUND - 200, 200, 200);
      ctx.fillStyle = '#D7CCC8';
      ctx.fillRect(0, GROUND - 220, 200, 22); // roof overhang
      ctx.fillStyle = '#B0BEC5';
      ctx.fillRect(0, GROUND - 222, 200, 6);  // roof stripe

      // School windows (2 rows × 3 cols)
      ctx.fillStyle = '#B3E5FC';
      ctx.strokeStyle = '#78909C'; ctx.lineWidth = 2;
      [[20,GROUND-185],[75,GROUND-185],[130,GROUND-185],
       [20,GROUND-130],[75,GROUND-130],[130,GROUND-130]].forEach(([wx,wy]) => {
        ctx.fillRect(wx, wy, 36, 28);
        ctx.strokeRect(wx, wy, 36, 28);
        ctx.beginPath(); ctx.moveTo(wx+18,wy); ctx.lineTo(wx+18,wy+28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx,wy+14); ctx.lineTo(wx+36,wy+14); ctx.stroke();
      });

      // Door
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(80, GROUND - 65, 40, 65);
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath(); ctx.arc(116, GROUND - 33, 4, 0, Math.PI * 2); ctx.fill();

      // Sign above door
      ctx.fillStyle = '#546E7A';
      ctx.fillRect(55, GROUND - 85, 90, 18);
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText('SCHOOL', 100, GROUND - 72);

      // Asphalt ground
      ctx.fillStyle = '#607D8B';
      ctx.fillRect(0, GROUND, W, H - GROUND);

      // Asphalt texture (random cracks pattern)
      ctx.strokeStyle = '#546E7A'; ctx.lineWidth = 1;
      [[200,GROUND+10,260,GROUND+25],[300,GROUND+8,290,GROUND+30],
       [450,GROUND+5,440,GROUND+35],[550,GROUND+12,590,GROUND+20],
       [650,GROUND+8,640,GROUND+30]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      // Court line
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.setLineDash([20,10]);
      ctx.beginPath(); ctx.moveTo(0, GROUND + 30); ctx.lineTo(W, GROUND + 30); ctx.stroke();
      ctx.setLineDash([]);

      // Chain-link fence (right side, partial)
      ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 1.5;
      for (let fy = GROUND - 80; fy < GROUND; fy += 12) {
        ctx.beginPath(); ctx.moveTo(680, fy); ctx.lineTo(800, fy); ctx.stroke();
      }
      for (let fx = 680; fx <= 800; fx += 12) {
        ctx.beginPath(); ctx.moveTo(fx, GROUND - 80); ctx.lineTo(fx, GROUND); ctx.stroke();
      }
      // Fence posts
      ctx.strokeStyle = '#78909C'; ctx.lineWidth = 4;
      [680, 740, 800].forEach(fx => {
        ctx.beginPath(); ctx.moveTo(fx, GROUND - 90); ctx.lineTo(fx, GROUND); ctx.stroke();
      });

      // Basketball hoop (right)
      ctx.strokeStyle = '#FF6F00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(740, GROUND - 15); ctx.lineTo(740, GROUND - 130); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(740, GROUND - 130); ctx.lineTo(780, GROUND - 130); ctx.stroke();
      ctx.beginPath(); ctx.arc(780, GROUND - 120, 12, 0, Math.PI); ctx.stroke();
    }
  },

  moon: {
    label: 'Moon',
    gravity: 0.22,
    jumpForce: -11,
    ropeSpeed: 0.038,
    ropeColor: '#B0BEC5',
    drawBg() {
      // Deep space
      ctx.fillStyle = '#05050F';
      ctx.fillRect(0, 0, W, H);

      // Stars (deterministic)
      ctx.fillStyle = '#FFFFFF';
      const starData = [
        [40,25,1.8],[110,70,1.2],[195,18,1.5],[290,48,1],[400,22,1.4],[490,68,1],
        [610,35,1.6],[720,15,1],[770,60,1.2],[60,115,1],[170,95,1.4],[330,125,1.2],
        [460,100,1],[570,88,1.3],[690,110,1],[750,80,1.5],[25,195,1],[145,175,1.2],
        [280,205,1],[400,190,1.1],[530,178,1],[670,170,1.3],[800,195,0.9],
        [350,140,1.8],[490,155,1],[730,145,1.2],[100,145,1],
      ];
      starData.forEach(([sx, sy, r]) => {
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      });

      // Milky way band
      const mw = ctx.createLinearGradient(0, 0, W, H * 0.6);
      mw.addColorStop(0, 'rgba(200,200,255,0)');
      mw.addColorStop(0.4, 'rgba(200,200,255,0.04)');
      mw.addColorStop(0.6, 'rgba(200,200,255,0.07)');
      mw.addColorStop(1, 'rgba(200,200,255,0)');
      ctx.fillStyle = mw;
      ctx.fillRect(0, 0, W, H);

      // Earth
      ctx.save();
      ctx.beginPath(); ctx.arc(680, 85, 55, 0, Math.PI * 2); ctx.clip();
      const earthBase = ctx.createRadialGradient(665, 70, 5, 680, 85, 55);
      earthBase.addColorStop(0, '#5DADE2');
      earthBase.addColorStop(0.5, '#2E86C1');
      earthBase.addColorStop(1, '#1A5276');
      ctx.fillStyle = earthBase; ctx.fillRect(625, 30, 110, 110);
      // Continents
      ctx.fillStyle = '#52BE80';
      ctx.beginPath(); ctx.ellipse(660, 70, 18, 12, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(700, 95, 12, 8, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(675, 110, 10, 6, 0.8, 0, Math.PI*2); ctx.fill();
      // Atmosphere glow
      const atm = ctx.createRadialGradient(680, 85, 52, 680, 85, 60);
      atm.addColorStop(0, 'rgba(100,180,255,0)');
      atm.addColorStop(1, 'rgba(100,180,255,0.3)');
      ctx.fillStyle = atm; ctx.fillRect(620, 25, 120, 120);
      ctx.restore();

      // Moon surface
      const surface = ctx.createLinearGradient(0, GROUND, 0, H);
      surface.addColorStop(0, '#9E9E9E');
      surface.addColorStop(1, '#757575');
      ctx.fillStyle = surface;
      ctx.fillRect(0, GROUND, W, H - GROUND);

      // Surface horizon highlight
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(0, GROUND, W, 4);

      // Craters
      [[80, GROUND+18, 18],[200, GROUND+12, 10],[390, GROUND+22, 15],
       [560, GROUND+14, 12],[700, GROUND+20, 20],[750, GROUND+10, 8]].forEach(([cx,cy,r]) => {
        ctx.fillStyle = '#757575';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r*0.45, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#616161'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r*0.45, 0, 0, Math.PI*2); ctx.stroke();
      });

      // Distant mountains silhouette
      ctx.fillStyle = '#757575';
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(30, GROUND - 35); ctx.lineTo(70, GROUND - 18);
      ctx.lineTo(110, GROUND - 50); ctx.lineTo(160, GROUND - 28);
      ctx.lineTo(200, GROUND);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(600, GROUND);
      ctx.lineTo(630, GROUND - 30); ctx.lineTo(670, GROUND - 15);
      ctx.lineTo(720, GROUND - 55); ctx.lineTo(770, GROUND - 25);
      ctx.lineTo(800, GROUND);
      ctx.fill();

      // Low-gravity particle dust (just visual flair)
      ctx.fillStyle = 'rgba(200,200,200,0.15)';
      [120,300,500,650,780].forEach(px => {
        ctx.beginPath(); ctx.arc(px, GROUND + 3, 3, 0, Math.PI * 2); ctx.fill();
      });
    }
  }
};

// ─── Drawing helpers ───────────────────────────────────────────────────────────
function drawCloud(x, y, scale) {
  ctx.save(); ctx.scale(scale, scale);
  const px = x / scale, py = y / scale;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(px,       py,      22, 0, Math.PI * 2);
  ctx.arc(px + 28,  py - 12, 27, 0, Math.PI * 2);
  ctx.arc(px + 56,  py,      20, 0, Math.PI * 2);
  ctx.arc(px + 38,  py + 8,  20, 0, Math.PI * 2);
  ctx.arc(px + 16,  py + 8,  18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(x, groundY, scale) {
  ctx.save();
  // trunk
  ctx.strokeStyle = '#795548'; ctx.lineWidth = 6 * scale; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.lineTo(x, groundY - 55 * scale);
  ctx.stroke();
  // foliage layers
  [[0, -55, 36], [0, -78, 28], [0, -96, 18]].forEach(([dx, dy, r]) => {
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(x + dx * scale, groundY + dy * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(x + dx * scale - 5 * scale, groundY + (dy - 5) * scale, (r - 5) * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ─── Stick figure drawing ──────────────────────────────────────────────────────

/**
 * Draw a stick-figure girl (rope holder).
 *   x, groundY  – foot position
 *   facing      – 'left' | 'right'  (which way she faces / which hand holds rope)
 *   color       – stroke/fill color
 *   ropeAngle   – current rope swing angle (for arm animation)
 */
function drawHolder(x, groundY, facing, color, ropeAngle) {
  const p = figurePoints(groundY);
  const dir = facing === 'right' ? 1 : -1;  // +1 = right-facing (left girl), -1 = left-facing (right girl)

  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // ── Head ──
  ctx.beginPath(); ctx.arc(x, p.head, HEAD_R, 0, Math.PI * 2); ctx.fill();

  // ── Hair (ponytail bun) ──
  ctx.beginPath(); ctx.arc(x - dir * 4, p.head - HEAD_R + 2, 7, 0, Math.PI * 2); ctx.fill();
  // ponytail strand
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - dir * 4, p.head - HEAD_R + 2);
  ctx.quadraticCurveTo(x - dir * 18, p.head - HEAD_R - 8, x - dir * 22, p.head - 2);
  ctx.stroke();

  // ── Body ──
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, p.neck); ctx.lineTo(x, p.hip); ctx.stroke();

  // ── Legs ──
  ctx.beginPath(); ctx.moveTo(x, p.hip); ctx.lineTo(x - 11, p.knee); ctx.lineTo(x - 9, p.foot); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, p.hip); ctx.lineTo(x + 11, p.knee); ctx.lineTo(x + 9, p.foot); ctx.stroke();

  // ── Skirt hint (small trapezoid) ──
  ctx.fillStyle = color; ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(x - 8, p.hip);
  ctx.lineTo(x - 14, p.hip + 12);
  ctx.lineTo(x + 14, p.hip + 12);
  ctx.lineTo(x + 8, p.hip);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  // ── Rope-holding arm (animated wrist) ──
  // The elbow midpoint bobs with ropeAngle; hand goes to rope attachment
  const shoulderX = x;
  const shoulderY = p.shoulder;
  const handX = x + dir * 25;
  const handY = ROPE_ATTACH_Y;

  // Elbow arcs slightly to give illusion of rotation
  const elbowT = 0.45;
  const elbowMidX = shoulderX * (1 - elbowT) + handX * elbowT;
  const elbowMidY = shoulderY * (1 - elbowT) + handY * elbowT;
  const elbowOffX = Math.cos(ropeAngle) * 8 * dir;
  const elbowOffY = Math.sin(ropeAngle) * 6;
  const elbowX = elbowMidX + elbowOffX;
  const elbowY = elbowMidY + elbowOffY;

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  // ── Free arm (gentle swing) ──
  const swingOff = Math.sin(ropeAngle * 0.5) * 6;
  ctx.beginPath();
  ctx.moveTo(x, p.shoulder);
  ctx.lineTo(x - dir * (ARM_L - 4), p.shoulder + 14 + swingOff);
  ctx.stroke();
}

/**
 * Draw the player stick figure.
 *   x, groundY – foot position
 *   isJumping  – boolean (jump pose vs standing pose)
 *   vy         – vertical velocity (for arm tilt)
 */
function drawPlayer(x, groundY, isJumping, vy) {
  const p = figurePoints(groundY);

  ctx.strokeStyle = '#1565C0'; ctx.fillStyle = '#1565C0';
  ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Head
  ctx.beginPath(); ctx.arc(x, p.head, HEAD_R, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.beginPath(); ctx.moveTo(x, p.neck); ctx.lineTo(x, p.hip); ctx.stroke();

  if (isJumping) {
    // ── Jump pose: legs tuck up ──
    ctx.beginPath();
    ctx.moveTo(x, p.hip);
    ctx.lineTo(x - 14, p.hip + 14);
    ctx.lineTo(x - 8,  p.hip + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, p.hip);
    ctx.lineTo(x + 14, p.hip + 14);
    ctx.lineTo(x + 8,  p.hip + 28);
    ctx.stroke();

    // Arms raised (balance)
    const tilt = Math.min(Math.max(vy * 1.2, -20), 20);
    ctx.beginPath();
    ctx.moveTo(x, p.shoulder);
    ctx.lineTo(x - ARM_L, p.shoulder - 10 + tilt);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, p.shoulder);
    ctx.lineTo(x + ARM_L, p.shoulder - 10 - tilt);
    ctx.stroke();
  } else {
    // ── Standing pose ──
    ctx.beginPath();
    ctx.moveTo(x, p.hip); ctx.lineTo(x - 11, p.knee); ctx.lineTo(x - 9, p.foot); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, p.hip); ctx.lineTo(x + 11, p.knee); ctx.lineTo(x + 9, p.foot); ctx.stroke();

    // Arms relaxed
    ctx.beginPath();
    ctx.moveTo(x, p.shoulder); ctx.lineTo(x - ARM_L, p.shoulder + 14); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, p.shoulder); ctx.lineTo(x + ARM_L, p.shoulder + 14); ctx.stroke();
  }
}

// ─── Rope ─────────────────────────────────────────────────────────────────────
const rope = {
  angle: -Math.PI / 2,   // start at top (safe position)
  speed: 0.047,

  update() {
    this.angle += this.speed;
    if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
  },

  /** Y of rope mid-point in world space */
  get midY() {
    return ROPE_ATTACH_Y + ROPE_RADIUS * Math.sin(this.angle);
  },

  /** Depth: 1 = rope in front of player, -1 = behind */
  get depth() {
    return Math.cos(this.angle);
  },

  draw(envKey) {
    const envCfg = ENVS[envKey];
    const lx = LEFT_X  + 25;
    const rx = RIGHT_X - 25;
    const ly = ROPE_ATTACH_Y;
    const ry = ROPE_ATTACH_Y;
    const cy = this.midY;
    const d  = this.depth;

    // Rope appears brighter in front, dimmer behind
    const alpha = d >= 0 ? 1 : 0.5;
    ctx.globalAlpha = alpha;

    // When rope is behind, draw dashed to hint depth
    if (d < 0) {
      ctx.setLineDash([8, 6]);
    }

    ctx.strokeStyle = envCfg.ropeColor;
    ctx.lineWidth   = 5;
    ctx.lineCap     = 'round';

    // Control point – when in front (d>0) bulges toward viewer slightly
    const cpX = CX;
    const cpY = cy + d * 18;

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(cpX, cpY, rx, ry);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
};

// ─── Player ───────────────────────────────────────────────────────────────────
const player = {
  x: CX,
  y: GROUND,
  vy: 0,
  jumping: false,

  jump(env) {
    if (!this.jumping) {
      this.vy = env.jumpForce;
      this.jumping = true;
      spawnJumpDust(this.x, GROUND);
    }
  },

  update(env) {
    if (this.jumping || this.y < GROUND) {
      this.vy += env.gravity;
      this.y  += this.vy;
      if (this.y >= GROUND) {
        this.y      = GROUND;
        this.vy     = 0;
        this.jumping = false;
      }
    }
  }
};

// ─── Particles ────────────────────────────────────────────────────────────────
const particles = [];

function spawnJumpDust(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (1 + Math.random() * 2.5),
      vy: Math.sin(angle) * (1 + Math.random() * 1.5),
      life: 1, decay: 0.06 + Math.random() * 0.04,
      r: 3 + Math.random() * 3,
    });
  }
}

function spawnHitFlash(x, y) {
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (2 + Math.random() * 4),
      vy: Math.sin(angle) * (2 + Math.random() * 4) - 2,
      life: 1, decay: 0.04 + Math.random() * 0.04,
      r: 4 + Math.random() * 4,
      color: '#FF5252',
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1; // mild gravity on particles
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(envKey) {
  particles.forEach(p => {
    ctx.globalAlpha = p.life * 0.7;
    ctx.fillStyle = p.color || (envKey === 'moon' ? '#B0BEC5' : '#D4C5A9');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── Levels ───────────────────────────────────────────────────────────────────
const JUMPS_PER_LEVEL  = 5;
const SPEED_PER_LEVEL  = 0.012;
const MAX_ROPE_SPEED   = 0.13;

let levelUpTimer = 0;   // frames remaining for level-up flash

function levelForScore(score) {
  return Math.floor(score / JUMPS_PER_LEVEL) + 1;
}

function ropeSpeedForLevel(envKey, level) {
  return Math.min(ENVS[envKey].ropeSpeed + (level - 1) * SPEED_PER_LEVEL, MAX_ROPE_SPEED);
}

// ─── Screen shake ─────────────────────────────────────────────────────────────
let shakeFrames = 0, shakeMag = 0;
function triggerShake(mag, frames) { shakeMag = mag; shakeFrames = frames; }

// ─── Score / collision bookkeeping ────────────────────────────────────────────
let pendingScore = false;   // rope has entered danger zone; waiting to clear

function checkScoreAndCollision(env) {
  const sin = Math.sin(rope.angle);

  // Danger zone: sin close to 1 → rope near ground
  const inDanger = sin > 0.85;

  if (inDanger && !pendingScore) {
    pendingScore = true;
  }

  // Rope has fully passed through (sin dropping back below 0.5 after peak)
  if (pendingScore && sin < 0.5 && sin > -0.5 && rope.depth < 0) {
    pendingScore = false;
    return 'score';  // player survived this pass
  }

  // Collision: rope near ground AND player's feet are on (or near) the ground
  if (inDanger && rope.depth > -0.4) {
    // Rope Y at player position ≈ rope.midY (player is at CX which is midpoint)
    if (player.y > rope.midY - 20) {
      return 'hit';
    }
  }

  return null;
}

// ─── Game state ───────────────────────────────────────────────────────────────
const game = {
  mode: 'start',   // 'start' | 'playing' | 'gameover'
  score: 0,
  highScore: 0,
  level: 1,
  highLevel: 1,
  env: 'park',

  reset() {
    this.mode     = 'playing';
    this.score    = 0;
    this.level    = 1;
    player.y      = GROUND;
    player.vy     = 0;
    player.jumping = false;
    rope.angle    = -Math.PI / 2;
    rope.speed    = ENVS[this.env].ropeSpeed;
    pendingScore  = false;
    levelUpTimer  = 0;
    particles.length = 0;
  },

  start() {
    this.reset();
  },

  handleInput() {
    if (this.mode === 'start') {
      this.start();
    } else if (this.mode === 'gameover') {
      this.reset();
    } else if (this.mode === 'playing') {
      player.jump(ENVS[this.env]);
    }
  }
};

// ─── HUD drawing ──────────────────────────────────────────────────────────────
function drawHUD() {
  ctx.save();

  // Score pill (top-left)
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, 12, 12, 140, 52, 10);
  ctx.fill();

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 24px "Segoe UI", Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${game.score}`, 22, 40);
  ctx.font = '14px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(`Best: ${game.highScore}`, 22, 58);

  // Level badge (top-right)
  const levelColors = ['#81C784','#AED581','#FFD54F','#FFB74D','#FF8A65','#EF5350','#E040FB'];
  const col = levelColors[Math.min(game.level - 1, levelColors.length - 1)];
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, W - 118, 12, 106, 52, 10);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.font = 'bold 22px "Segoe UI", Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`LVL ${game.level}`, W - 16, 40);
  ctx.font = '13px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const progress = game.score % JUMPS_PER_LEVEL;
  ctx.fillText(`${progress}/${JUMPS_PER_LEVEL} jumps`, W - 16, 58);

  ctx.restore();
}

// ─── Level-up flash ───────────────────────────────────────────────────────────
function drawLevelUp() {
  if (levelUpTimer <= 0) return;
  const alpha = Math.min(levelUpTimer / 20, 1);   // fade in quickly, hold, fade out
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  // Glow ring
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.globalAlpha = alpha * 0.35;
  ctx.beginPath();
  ctx.arc(CX, H / 2 - 10, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 52px "Segoe UI", Arial';
  ctx.fillText(`LEVEL ${game.level}!`, CX, H / 2);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '20px "Segoe UI", Arial';
  ctx.fillText('Speed up!', CX, H / 2 + 36);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStartScreen() {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 56px "Segoe UI", Arial';
  ctx.fillText('Jump Rope!', CX, H / 2 - 55);

  // Subtitle
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '22px "Segoe UI", Arial';
  ctx.fillText('Press SPACE or tap to start', CX, H / 2 + 8);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px "Segoe UI", Arial';
  ctx.fillText('Jump over the rope — don\'t get caught!', CX, H / 2 + 42);

  // Tiny env label
  ctx.fillStyle = 'rgba(255,215,0,0.75)';
  ctx.font = '14px "Segoe UI", Arial';
  ctx.fillText(`Environment: ${ENVS[game.env].label}`, CX, H / 2 + 78);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, CX - 210, H / 2 - 120, 420, 230, 18);
  ctx.fill();

  ctx.textAlign = 'center';

  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 44px "Segoe UI", Arial';
  ctx.fillText('Caught!', CX, H / 2 - 55);

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 26px "Segoe UI", Arial';
  ctx.fillText(`Score: ${game.score}`, CX, H / 2);

  const levelColors = ['#81C784','#AED581','#FFD54F','#FFB74D','#FF8A65','#EF5350','#E040FB'];
  const col = levelColors[Math.min(game.level - 1, levelColors.length - 1)];
  ctx.fillStyle = col;
  ctx.font = 'bold 18px "Segoe UI", Arial';
  ctx.fillText(`Reached Level ${game.level}`, CX, H / 2 + 32);

  if (game.score === game.highScore && game.score > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '15px "Segoe UI", Arial';
    ctx.fillText('🏆 New high score!', CX, H / 2 + 58);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '17px "Segoe UI", Arial';
  ctx.fillText('Press SPACE or tap to try again', CX, H / 2 + 88);
}


// ─── Main loop ────────────────────────────────────────────────────────────────
function loop() {
  // Screen shake
  let sx = 0, sy = 0;
  if (shakeFrames > 0) {
    sx = (Math.random() - 0.5) * shakeMag * 2;
    sy = (Math.random() - 0.5) * shakeMag * 2;
    shakeMag *= 0.85;
    shakeFrames--;
  }
  ctx.save();
  ctx.translate(sx, sy);

  // Background
  ENVS[game.env].drawBg();

  // Ground separator line
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

  if (game.mode === 'start') {
    // Draw idle scene
    drawHolder(LEFT_X,  GROUND, 'right', '#C62828', rope.angle);
    drawHolder(RIGHT_X, GROUND, 'left',  '#7B1FA2', rope.angle);
    drawPlayer(CX, GROUND, false, 0);
    rope.draw(game.env);
    drawStartScreen();
    // Keep rope gently spinning on start screen
    rope.update();
  } else {
    // ── Update ──
    if (game.mode === 'playing') {
      rope.update();
      player.update(ENVS[game.env]);
      updateParticles();

      const result = checkScoreAndCollision(ENVS[game.env]);
      if (result === 'score') {
        game.score++;
        const newLevel = levelForScore(game.score);
        if (newLevel > game.level) {
          game.level   = newLevel;
          levelUpTimer = 90;
          triggerShake(3, 10);
        }
        rope.speed = ropeSpeedForLevel(game.env, game.level);
      } else if (result === 'hit') {
        game.mode = 'gameover';
        if (game.score > game.highScore) game.highScore = game.score;
        if (game.level > game.highLevel) game.highLevel = game.level;
        spawnHitFlash(player.x, player.y - 40);
        triggerShake(6, 18);
      }
      if (levelUpTimer > 0) levelUpTimer--;
    }

    // ── Draw ──
    // Rope behind player (depth < 0)
    if (rope.depth < 0) rope.draw(game.env);

    drawHolder(LEFT_X,  GROUND, 'right', '#C62828', rope.angle);
    drawHolder(RIGHT_X, GROUND, 'left',  '#7B1FA2', rope.angle);

    drawParticles(game.env);
    drawPlayer(player.x, player.y, player.jumping, player.vy);

    // Rope in front of player (depth >= 0)
    if (rope.depth >= 0) rope.draw(game.env);

    drawHUD();
    drawLevelUp();

    if (game.mode === 'gameover') drawGameOver();
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    game.handleInput();
  }
});

canvas.addEventListener('click',      () => game.handleInput());
canvas.addEventListener('touchstart', e => { e.preventDefault(); game.handleInput(); });

// Environment buttons
document.querySelectorAll('.env-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    game.env = btn.dataset.env;
    // Update rope speed for new env if playing
    if (game.mode === 'playing') {
      rope.speed = ropeSpeedForLevel(game.env, game.level);
    }
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
requestAnimationFrame(loop);
