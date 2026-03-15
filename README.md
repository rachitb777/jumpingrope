# Jump Rope!

A browser-based jump rope game. Time your jumps to clear the spinning rope and rack up a high score.

## Play

**[Live demo](https://rachitb777.github.io/jumpingrope/)**

Press **Space** / **↑** or **tap** the screen to jump.

## Environments

| Environment | Gravity | Rope Speed | Vibe |
|-------------|---------|------------|------|
| Park | Normal | Normal | Sunny day outdoors |
| Playground | Normal | Normal | School asphalt |
| Moon | Low | Slow | Floaty jumps, Earth in the sky |

## How it works

- The rope spins continuously and speeds up as your score climbs
- Jump over the rope without getting caught
- High score is tracked per session

## Development

Plain HTML/CSS/JS — no build step needed.

```bash
# Serve locally (any static server works)
npx serve src
```

Open `http://localhost:3000` in your browser.

## Deployment

Deploys automatically to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.
