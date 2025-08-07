/**
 * 🕹️ Retro Terminal Loader - Ultra-lightweight 80s terminal animations
 * Zero dependencies, pure Node.js implementation
 * Inspired by WarGames, Tron, and early BBS systems
 */

// ANSI color codes for authentic retro terminals
const COLORS = {
  GREEN: '\x1b[32m', // Classic phosphor green
  AMBER: '\x1b[33m', // Old CRT amber
  CYAN: '\x1b[36m', // Matrix/cyberpunk blue
  RED: '\x1b[31m', // Danger/error
  DIM: '\x1b[2m', // CRT fade effect
  BRIGHT: '\x1b[1m', // Bright phosphor
  RESET: '\x1b[0m', // Reset all attributes
  BLINK: '\x1b[5m', // Blinking text (if supported)
  REVERSE: '\x1b[7m', // Reverse video
  CLEAR_LINE: '\x1b[2K', // Clear current line
  CURSOR_HIDE: '\x1b[?25l',
  CURSOR_SHOW: '\x1b[?25h',
  CURSOR_UP: '\x1b[1A',
  CURSOR_START: '\r',
};

// Retro ASCII characters for animations
const RETRO_CHARS = {
  BLOCKS: ['░', '▒', '▓', '█'],
  PIPES: ['│', '┤', '├', '─', '┼', '┴', '┬', '└', '┘', '┐', '┌'],
  DOTS: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  ARROWS: ['←', '↑', '→', '↓', '↖', '↗', '↘', '↙'],
  GLITCH: ['▀', '▄', '▌', '▐', '▖', '▗', '▘', '▝', '▚', '▞'],
  SCAN: ['━', '╾', '╼', '╺', '╸', '╴', '╶', '╌', '╍'],
  MODEM: ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
  BBS: ['[', '*', ']', '[', '+', ']', '[', '>', ']', '[', '=', ']', '[', '!', ']'],
};

// Animation frames for different loader styles
const ANIMATIONS = {
  PHOSPHOR_BAR: [
    '█░░░░░░░░░',
    '██░░░░░░░░',
    '███░░░░░░░',
    '████░░░░░░',
    '█████░░░░░',
    '██████░░░░',
    '███████░░░',
    '████████░░',
    '█████████░',
    '██████████',
  ],
  SCAN_LINE: [
    '━━━━━━━━━━',
    '╾━━━━━━━━╼',
    '╺╾━━━━━━╼╸',
    '╌╺╾━━━━╼╸╌',
    '╍╌╺╾━━╼╸╌╍',
    '━╍╌╺╾╼╸╌╍━',
    '━━╍╌╺╸╌╍━━',
    '━━━╍╌╌╍━━━',
    '━━━━╍╍━━━━',
    '━━━━━━━━━━',
  ],
  MATRIX_RAIN: ['▓▒░ ', '░▓▒░', '░░▓▒', '▒░░▓', '▓▒░░', '▒▓▒░', '░▒▓▒', '▒░▒▓', '▓▒░▒', '▒▓▒░'],
  BBS_PROGRESS: [
    '[*         ]',
    '[**        ]',
    '[***       ]',
    '[****      ]',
    '[*****     ]',
    '[******    ]',
    '[*******   ]',
    '[********  ]',
    '[********* ]',
    '[**********]',
  ],
  MODEM_CONNECT: [
    'ATDT...',
    'DIALING...',
    'CONNECT 2400',
    'CONNECT 9600',
    'CONNECT 14400',
    'CONNECT 28800',
    'CONNECT 33600',
    'CONNECT 56000',
    'CONNECTED',
  ],
};

export type LoaderTheme = 'green' | 'amber' | 'cyan' | 'matrix';
export type AnimationStyle = 'phosphor' | 'scanline' | 'matrix' | 'bbs' | 'modem' | 'glitch';

export class RetroLoader {
  private interval?: NodeJS.Timeout;
  private frameIndex = 0;
  private message = '';
  private theme: LoaderTheme;
  private style: AnimationStyle;
  private color: string;
  private startTime: number;
  private glitchEnabled = true;
  private typewriterSpeed = 30; // ms per character

  constructor(theme: LoaderTheme = 'green', style: AnimationStyle = 'phosphor') {
    this.theme = theme;
    this.style = style;
    this.startTime = Date.now();

    // Set color based on theme
    switch (theme) {
      case 'amber':
        this.color = COLORS.AMBER;
        break;
      case 'cyan':
      case 'matrix':
        this.color = COLORS.CYAN;
        break;
      default:
        this.color = COLORS.GREEN;
    }
  }

  /**
   * Start the loader animation
   */
  start(message: string): void {
    this.message = message;
    process.stdout.write(COLORS.CURSOR_HIDE);

    // Initial display with typewriter effect
    this.typewriterEffect(`${this.color}> ${message}${COLORS.RESET}`);

    // Start animation after typewriter completes
    setTimeout(() => {
      this.interval = setInterval(() => {
        this.render();
      }, 100);
    }, message.length * this.typewriterSpeed);
  }

  /**
   * Update the loader with progress
   */
  update(progress: number, detail?: string): void {
    const progressBar = this.generateProgressBar(progress);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    process.stdout.write(COLORS.CLEAR_LINE);
    process.stdout.write(COLORS.CURSOR_START);

    // Add random glitch effect occasionally
    const glitch = this.glitchEnabled && Math.random() < 0.05 ? this.getGlitch() : '';

    const output = detail
      ? `${this.color}${progressBar} ${progress}% ${detail} ${glitch}[${elapsed}s]${COLORS.RESET}`
      : `${this.color}${progressBar} ${progress}% ${this.message} ${glitch}[${elapsed}s]${COLORS.RESET}`;

    process.stdout.write(output);
  }

  /**
   * Mark operation as successful
   */
  succeed(message: string): void {
    this.stop();
    process.stdout.write(COLORS.CLEAR_LINE);
    process.stdout.write(COLORS.CURSOR_START);

    // BBS-style success message
    const successMsg = `${COLORS.GREEN}${COLORS.BRIGHT}[!] ${message}${COLORS.RESET}\n`;
    this.typewriterEffect(successMsg, () => {
      // Add a retro "beep" sound effect (if terminal supports it)
      process.stdout.write('\x07');
    });
  }

  /**
   * Mark operation as failed
   */
  fail(message: string): void {
    this.stop();
    process.stdout.write(COLORS.CLEAR_LINE);
    process.stdout.write(COLORS.CURSOR_START);

    // Flashing error message
    const errorMsg = `${COLORS.RED}${COLORS.BLINK}[X] ERROR: ${message}${COLORS.RESET}\n`;
    process.stdout.write(errorMsg);

    // Glitch effect for errors
    this.glitchEffect();
  }

  /**
   * Stop the loader
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    process.stdout.write(COLORS.CURSOR_SHOW);
  }

  /**
   * Render current animation frame
   */
  private render(): void {
    process.stdout.write(COLORS.CLEAR_LINE);
    process.stdout.write(COLORS.CURSOR_START);

    const animation = this.getAnimation();
    const frame = animation[this.frameIndex % animation.length];
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    // Add CRT flicker effect
    const brightness = Math.random() > 0.95 ? COLORS.DIM : this.color;

    const output = `${brightness}${frame} ${this.message} [${elapsed}s]${COLORS.RESET}`;
    process.stdout.write(output);

    this.frameIndex++;
  }

  /**
   * Get animation frames based on style
   */
  private getAnimation(): string[] {
    switch (this.style) {
      case 'scanline':
        return ANIMATIONS.SCAN_LINE;
      case 'matrix':
        return ANIMATIONS.MATRIX_RAIN;
      case 'bbs':
        return ANIMATIONS.BBS_PROGRESS;
      case 'modem':
        return ANIMATIONS.MODEM_CONNECT;
      case 'glitch':
        return this.generateGlitchAnimation();
      default:
        return ANIMATIONS.PHOSPHOR_BAR;
    }
  }

  /**
   * Generate a progress bar
   */
  private generateProgressBar(progress: number): string {
    const width = 20;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;

    // Use different characters based on theme
    if (this.theme === 'matrix') {
      return `[${RETRO_CHARS.BLOCKS[3].repeat(filled)}${RETRO_CHARS.BLOCKS[0].repeat(empty)}]`;
    }

    return `[${RETRO_CHARS.BLOCKS[3].repeat(filled)}${RETRO_CHARS.BLOCKS[1].repeat(empty)}]`;
  }

  /**
   * Generate random glitch characters
   */
  private getGlitch(): string {
    const glitchChars = RETRO_CHARS.GLITCH;
    const char = glitchChars[Math.floor(Math.random() * glitchChars.length)];
    return `${COLORS.DIM}${char}${COLORS.RESET}`;
  }

  /**
   * Generate glitch animation frames
   */
  private generateGlitchAnimation(): string[] {
    return Array(10)
      .fill(0)
      .map(() => {
        const chars = RETRO_CHARS.GLITCH;
        return Array(10)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join('');
      });
  }

  /**
   * Typewriter effect for messages
   */
  private typewriterEffect(text: string, callback?: () => void): void {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        process.stdout.write(text[index]);
        index++;
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, this.typewriterSpeed);
  }

  /**
   * Glitch effect for errors
   */
  private glitchEffect(): void {
    const glitchFrames = 5;
    let frame = 0;

    const glitchInterval = setInterval(() => {
      if (frame < glitchFrames) {
        const glitch = RETRO_CHARS.GLITCH.sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .join('');

        process.stdout.write(`${COLORS.CURSOR_START}${COLORS.RED}${glitch}${COLORS.RESET}`);
        frame++;
      } else {
        clearInterval(glitchInterval);
        process.stdout.write(COLORS.CLEAR_LINE);
      }
    }, 50);
  }

  /**
   * Special effects
   */
  scanline(): void {
    const scanChars = RETRO_CHARS.SCAN;
    const line = scanChars[Math.floor(Math.random() * scanChars.length)].repeat(30);
    process.stdout.write(`${COLORS.DIM}${line}${COLORS.RESET}\n`);
  }

  phosphorFade(): void {
    const fadeSteps = [COLORS.BRIGHT, this.color, COLORS.DIM];
    fadeSteps.forEach((color, i) => {
      setTimeout(() => {
        process.stdout.write(`${COLORS.CURSOR_START}${color}${this.message}${COLORS.RESET}`);
      }, i * 100);
    });
  }

  matrixRain(): void {
    const width = 40;
    const height = 5;

    for (let i = 0; i < height; i++) {
      const line = Array(width)
        .fill(0)
        .map(() => {
          const chars = '01';
          return Math.random() > 0.7 ? chars[Math.floor(Math.random() * 2)] : ' ';
        })
        .join('');

      process.stdout.write(`${COLORS.GREEN}${COLORS.DIM}${line}${COLORS.RESET}\n`);
    }
  }
}

// Convenience functions for quick usage
export function createLoader(message: string, theme: LoaderTheme = 'green'): RetroLoader {
  const loader = new RetroLoader(theme, 'phosphor');
  loader.start(message);
  return loader;
}

export function createBBSLoader(message: string): RetroLoader {
  const loader = new RetroLoader('amber', 'bbs');
  loader.start(message);
  return loader;
}

export function createMatrixLoader(message: string): RetroLoader {
  const loader = new RetroLoader('matrix', 'matrix');
  loader.start(message);
  return loader;
}

export function createModemLoader(message: string): RetroLoader {
  const loader = new RetroLoader('green', 'modem');
  loader.start(message);
  return loader;
}
