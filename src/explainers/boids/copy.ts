// Owner-edited lists. Prose on the page lives in explainers/boids/index.html.
// The speech-bubble font has A–Z, 0–9 and ! ? . , ' - : & [ ] /  (no quotes or parentheses).
// Keep tour facts under ~100 characters so the bubble stays readable.

import type { Species } from './world';

/**
 * Tour-guide facts. When the tour stops, the guide talks about whichever bird is active
 * (two species facts, then one general fact, cycling). Sources are noted per line.
 */
export const TOUR_FACTS: Record<Species | 'general', string[]> = {
  starling: [
    // Release dates: JSTOR Daily, Birds Outside My Window
    'On March 6, 1890, about 60 starlings were set free right here in Central Park.',
    '40 more followed in 1891. Their descendants now number in the tens of millions.',
    // West Side Rag, Mental Floss
    'One of the first pairs nested under the eaves of the Museum of Natural History.',
    // Fugate & Miller 2021: the Shakespeare motive first appears in print ~1948 (Edwin Way Teale)
    'Legend says he wanted every bird in Shakespeare here. That story showed up 60 years later.',
    // Folger Shakespeare Library
    'Shakespeare mentions a starling just once, in Henry IV, Part 1.',
    // Mozart's starling (1784)
    'Mozart kept a pet starling for 3 years. It could sing a tune from one of his concertos.',
    'Starlings are great mimics. City birds copy car alarms, phones and other birds.',
    // All About Birds / Audubon: spots are feather tips that wear off; no spring molt
    'Those white winter spots are feather tips. They wear off by spring, leaving shiny purple-green.',
    "In spring a starling's bill turns from dark to yellow.",
    // Ballerini et al. 2008
    'In a murmuration each starling tracks about 7 neighbors. Nobody is in charge.',
  ],
  pigeon: [
    "City pigeons are rock doves. Their ancestors nested on sea cliffs, so ledges feel like home.",
    'Pigeons came to North America with European settlers in the early 1600s.',
    // Bovet et al., Paris 2011
    'Pigeons can tell people apart. In a Paris study they dodged the person who had chased them.',
    'Both pigeon parents, mom and dad, feed their chicks crop milk.',
    'Pigeons usually pair up for life.',
    'Nikola Tesla loved pigeons. He fed them in Bryant Park and nursed sick ones in his hotel room.',
    // Britannica: the link is disputed by historians
    "Legend says a pigeon named Cher Ami saved New York's Lost Battalion in World War 1.",
    "The head bob keeps a pigeon's view steady while its body moves.",
    "That shimmer on a pigeon's neck isn't pigment. It's light bouncing off the feathers.",
  ],
  general: [
    // Wikipedia: "boid" also plays on the New York pronunciation of "bird"
    'Craig Reynolds invented boids in 1986. Fun fact: boid is also how a New Yorker says bird.',
    "Boids follow 3 rules: don't crowd, match your neighbors, stick together. No leader.",
    'The bat swarms and penguin army in Batman Returns were made with boids.',
    'Peregrine falcons nest on NYC bridges and towers. Their dives top 200 MPH.',
    'Falcons go for the loner. In a tight flock they struggle to pick a target.',
    // Wikipedia: 927 Fifth Avenue, December 2004
    'Pale Male, a red-tailed hawk, nested on Fifth Ave. In 2004 his nest was torn out. Protests got it back.',
    'Bow Bridge opened in 1862. Cast iron, and still here.',
  ],
};

/** Order the guide works through: two facts about the active bird, then a general one. */
export function tourSequence(species: Species): string[] {
  const s = TOUR_FACTS[species], g = TOUR_FACTS.general, out: string[] = [];
  for (let i = 0, j = 0; i < s.length || j < g.length; ) {
    if (i < s.length) out.push(s[i++]);
    if (i < s.length) out.push(s[i++]);
    if (j < g.length) out.push(g[j++]);
  }
  return out;
}

/** What birds occasionally say in speech bubbles. Shuffled, no immediate repeats. */
export const BIRD_CHATTER = [
  "It's all about da Mets!",
  "Ay, I'm flockin' here!",
  'Lemme get a chopped cheese, the flocky way.',
  'Lemmegetabaconeggand- wait, EGGS?',
  'Fuggedaboutit.',
  'Who moved my bagel?',
  'Separation! I need my space.',
  'Cohesion is just peer pressure.',
  'I go where the flock goes.',
  'Is that a hawk?!',
  'The rent in this tree is insane.',
  "It's B-O-I-D. Boid.",
  'Stand clear of the closing wings.',
  'Showtime! Showtime!',
  'I know a guy.',
  "Where's the dollar slice?",
  'This flock has no boss.',
  'Pigeons. No offense.',
  'Next stop: anywhere.',
  "Don't feed the tourists.",
];
