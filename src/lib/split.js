// Rozdělí HTML nadpisu na slova už při buildu (místo SplitText v prohlížeči):
// každé slovo = <span class="w"><span class="w__i" style="--i:n">slovo</span></span>.
// Značky (např. <span class="volt">) zůstávají, mezery zůstávají mimo spany kvůli čtečkám.
function splitWords(html) {
  let i = 0;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) return part;
    return part.split(/(\s+)/).map((w) => (w.trim() ? `<span class="w"><span class="w__i" style="--i:${i++}">${w}</span></span>` : w)).join('');
  }).join('');
}

module.exports = { splitWords };
