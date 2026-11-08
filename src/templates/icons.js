// Vlastní SVG ikony (24×24, tah). Vykreslují se inline, barvu berou z currentColor.
const paths = {
  // služby
  socket: '<circle cx="12" cy="12" r="8.5"/><circle cx="8.6" cy="13" r="1.3"/><circle cx="15.4" cy="13" r="1.3"/><path d="M12 6.2v3"/>',
  home: '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.6V20h12.4V9.6"/><path d="M9.2 14.2a4 4 0 0 1 5.6 0"/><path d="M10.8 16.4a1.7 1.7 0 0 1 2.4 0"/>',
  charger: '<rect x="4.5" y="3" width="10" height="13.5" rx="2"/><path d="M10.3 6.3 8.2 10h3.1l-2.1 3.6"/><path d="M9.5 16.5v1.8a2.7 2.7 0 0 0 5.4 0v-3.6a2.3 2.3 0 0 1 4.6 0V21"/>',
  appliance: '<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="M4.5 7.5h15"/><circle cx="12" cy="14.2" r="4"/><path d="M7.4 5.25h1.2M10.4 5.25h1.2"/><path d="M10 15.2a2.4 2.4 0 0 0 3.2-1.6"/>',
  // výhody
  medal: '<circle cx="12" cy="14.6" r="5.6"/><path d="M8.4 3.5l2.1 5.7M15.6 3.5l-2.1 5.7"/><path d="m12 11.9 1 1.9 2.1.3-1.5 1.5.35 2.1L12 16.7l-1.95 1 .35-2.1-1.5-1.5 2.1-.3z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2.1"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10.2L5.6 20v-4h.9A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.4 9.3h7.2M8.4 12.2h4.4"/>',
  bolt: '<path d="M13.2 3 5.6 13.4h6.1L10.8 21l7.6-10.4h-6.1z"/>',
  // hero – důvody proč si mě vybrat
  toolbox: '<path d="M3 9.2h18v9.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M8.6 9.2V6.6A1.6 1.6 0 0 1 10.2 5h3.6a1.6 1.6 0 0 1 1.6 1.6v2.6"/><path d="M3 13.6h7.6M13.4 13.6H21"/><path class="glow" d="M10.6 12h2.8v3.2h-2.8z"/>',
  stopwatch: '<circle cx="12" cy="13.5" r="7.8"/><path d="M9.8 2.8h4.4M12 2.8v2.9M18.6 6.6l1.3-1.3"/><path class="glow" d="m12.9 9.1-2.6 4.6h3.3l-2.4 4.4"/>',
  pricetag: '<path d="M3.2 12.4V4.6a1.4 1.4 0 0 1 1.4-1.4h7.8l8.9 8.9a1.4 1.4 0 0 1 0 2l-7.3 7.3a1.4 1.4 0 0 1-2 0z"/><circle cx="7.9" cy="7.9" r="1.5"/><path class="glow" d="m9.4 14.2 2.3 2.3 4.6-4.6"/>',
  // UI
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.8 6.5 8.2 6.3 8.2-6.3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 5 8 12l7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 9.5v4.5M12 16.8v.2"/>',
};

const filled = {
  star: '<path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z"/>',
  facebook: '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/>',
  instagram: '<path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM16.4 3H7.6A4.6 4.6 0 0 0 3 7.6v8.8A4.6 4.6 0 0 0 7.6 21h8.8a4.6 4.6 0 0 0 4.6-4.6V7.6A4.6 4.6 0 0 0 16.4 3zm2.9 13.4a2.9 2.9 0 0 1-2.9 2.9H7.6a2.9 2.9 0 0 1-2.9-2.9V7.6a2.9 2.9 0 0 1 2.9-2.9h8.8a2.9 2.9 0 0 1 2.9 2.9z"/>',
  whatsapp: '<path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A7.8 7.8 0 1 1 12 19.8zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5s1.7 2.6 4.1 3.6c1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1s.2-1 .1-1.1-.2-.2-.4-.3z"/>',
  google: '<path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/>',
};

function icon(name, cls = 'icon', extra = '') {
  if (paths[name]) {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${paths[name]}</svg>`;
  }
  if (filled[name]) {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"${extra}>${filled[name]}</svg>`;
  }
  throw new Error(`Neznámá ikona: ${name}`);
}

module.exports = { icon };
