/**
 * SELVE Chat Console Branding
 * 
 * Displays ASCII art and branding in the browser console.
 * Only runs once per page load.
 */

const SELVE_CHAT_ASCII = `
███████╗███████╗██╗░░░░░██╗░░░██╗███████╗░░░░░░░█████╗░██╗░░██╗░█████╗░████████╗
██╔════╝██╔════╝██║░░░░░██║░░░██║██╔════╝░░░░░░██╔══██╗██║░░██║██╔══██╗╚══██╔══╝
███████╗█████╗░░██║░░░░░╚██╗░██╔╝█████╗░░█████╗██║░░╚═╝███████║███████║░░░██║░░░
╚════██║██╔══╝░░██║░░░░░░╚████╔╝░██╔══╝░░╚════╝██║░░██╗██╔══██║██╔══██║░░░██║░░░
███████║███████╗███████╗░░╚██╔╝░░███████╗░░░░░░╚█████╔╝██║░░██║██║░░██║░░░██║░░░
╚══════╝╚══════╝╚══════╝░░░╚═╝░░░╚══════╝░░░░░░░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░
`;

const SUBTITLE = "              ✨ Discover Your True Self ✨";
const TAGLINE = "\n        Self-Exploration • Learning • Validation • Evolution";
const URL = "\n                              https://selve.me";

// Track if we've already shown the branding
let hasShown = false;

export function printConsoleBrand(): void {
  // Only show once per session
  if (hasShown) return;
  if (typeof window === "undefined") return;
  
  hasShown = true;

  // Main ASCII art with brown styling
  console.log(
    `%c${SELVE_CHAT_ASCII}`,
    "color: #92400e; font-family: monospace; font-size: 10px; font-weight: bold;"
  );

  // Subtitle with lighter brown styling  
  console.log(
    `%c${SUBTITLE}`,
    "color: #b45309; font-family: monospace; font-size: 12px; font-weight: bold;"
  );

  // Tagline
  console.log(
    `%c${TAGLINE}`,
    "color: #9ca3af; font-family: monospace; font-size: 11px;"
  );

  // URL
  console.log(
    `%c${URL}`,
    "color: #6b7280; font-family: monospace; font-size: 10px;"
  );

  // Spacer
  console.log("");
}

/**
 * Clear console brand flag (for testing).
 */
export function resetConsoleBrand(): void {
  if (typeof window !== "undefined") {
    hasShown = false;
  }
}
