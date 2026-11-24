const QuestVoice = (() => {
const clips = {
  "Show me the garden.": "line-00.mp3",
  "garden. Show me the garden.": "line-01.mp3",
  "Where is the bedroom?": "line-02.mp3",
  "bedroom. Where is the bedroom?": "line-03.mp3",
  "Take me to the kitchen, please.": "line-04.mp3",
  "kitchen. Take me to the kitchen, please.": "line-05.mp3",
  "We need a table for lunch.": "line-06.mp3",
  "table. We need a table for lunch.": "line-07.mp3",
  "Put a plate on the table.": "line-08.mp3",
  "plate. Put a plate on the table.": "line-09.mp3",
  "Put a fork on the plate.": "line-10.mp3",
  "fork. Put a fork on the plate.": "line-11.mp3",
  "Place a bowl beside my plate.": "line-12.mp3",
  "bowl. Place a bowl beside my plate.": "line-13.mp3",
  "Put a spoon next to the bowl.": "line-14.mp3",
  "spoon. Put a spoon next to the bowl.": "line-15.mp3",
  "Bring me an empty glass.": "line-16.mp3",
  "glass. Bring me an empty glass.": "line-17.mp3",
  "Pour some water into my glass.": "line-18.mp3",
  "water. Pour some water into my glass.": "line-19.mp3",
  "Meet me at the school entrance. Where should I wait?": "line-20.mp3",
  "Where do we have our English lesson?": "line-21.mp3",
  "What shows the time of each lesson?": "line-22.mp3",
  "I want to borrow a book. Where can we go?": "line-23.mp3",
  "Who can help me borrow this book?": "line-24.mp3",
  "I am hungry. Where can we buy lunch at school?": "line-25.mp3",
  "Where can we play basketball indoors?": "line-26.mp3",
  "What do I like? I love singing and playing the guitar.": "line-27.mp3",
  "I want to join a group that sings after school. Is there a music ___?": "line-28.mp3",
  "Our club has a concert! Where should I stand so everyone can see me sing?": "line-29.mp3",
  "Hi! Thank you for inviting me.": "line-30.mp3",
  "Hi! Welcome to my home!": "line-31.mp3",
  "I'm Alex. What's your name?": "line-32.mp3",
  "I'm {name}. Nice to meet you.": "line-33.mp3",
  "Hello! Is this your friend?": "line-34.mp3",
  "Yes. This is my friend, Alex.": "line-35.mp3",
  "Nice to meet you, Alex.": "line-36.mp3",
  "Nice to meet you, too.": "line-37.mp3",
  "Where do you cook?": "line-38.mp3",
  "We cook in the kitchen.": "line-39.mp3",
  "What room is this?": "line-40.mp3",
  "This is my bedroom.": "line-41.mp3",
  "What do you do in the garden?": "line-42.mp3",
  "We water the plants.": "line-43.mp3",
  "I'd like some water, please.": "line-44.mp3",
  "Water": "line-45.mp3",
  "Please offer Alex some water.": "line-46.mp3",
  "Would you like some water?": "line-47.mp3",
  "Yes, please!": "line-48.mp3",
  "Here you are.": "line-49.mp3",
  "Welcome to my home.": "line-50.mp3",
  "This is my friend, Alex.": "line-51.mp3",
  "This is the living room.": "line-52.mp3",
  "We watch TV in the living room.": "line-53.mp3",
  "I sleep in my bedroom.": "line-54.mp3",
  "We water the plants in the garden.": "line-55.mp3",
  "tree": "line-56.mp3",
  "flower": "line-57.mp3",
  "house": "line-58.mp3",
  "bridge": "line-59.mp3",
  "boat": "line-60.mp3",
  "rock": "line-61.mp3"
};
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
