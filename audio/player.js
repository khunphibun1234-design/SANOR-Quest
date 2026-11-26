const QuestVoice = (() => {
// Recordings are listed in content/*.json ("audio" fields); content/content.js gathers them by sentence.
const clips = (window.SQContent && window.SQContent.audio) || {};
const base = new URL('.', document.currentScript.src);
const audio = new Audio();
let generation = 0;
function stop() {
  generation++;
  audio.pause();
  audio.onerror = null;
}
function play(line, reportError, rate = 1) {
  stop();
  const current = generation;
  function failed() {
    if (current !== generation) return;
    stop();
    reportError('Audio could not play. Check media volume and tap Listen again.');
  }
  if (!clips[line]) { failed(); return; }
  audio.onerror = failed;
  audio.src = new URL(clips[line], base).href;
  audio.playbackRate = rate;
  audio.play().catch(failed);
}
window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
return {play, stop};
})();
