// Owner-edited lists. Prose on the page lives in explainers/boids/index.html.
// The speech-bubble font has A–Z, 0–9 and ! ? . , ' - : & [ ] /  (no quotes or parentheses).
// Keep tour facts under ~100 characters so the bubble stays readable.

import type { Species } from './world';

/**
 * Tour-guide facts. When the tour stops, the guide talks about whichever bird is active
 * (two species facts, then one general fact, cycling). Sources are noted per line.
 */
export const TOUR_FACTS: Record<Species | 'general' | 'falcon', string[]> = {
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
  // Peregrines: amNY / NYC DEP (1983 bridges, ~25 pairs by 2019), NYC Audubon
  falcon: [
    'Peregrine falcons are the fastest animals on Earth. Their dives top 200 MPH.',
    'Peregrines first nested in NYC in 1983, on the Verrazzano and Throgs Neck bridges.',
    'By 2019 about 25 peregrine pairs nested around the city, on bridges and buildings.',
    'DDT wiped peregrines out of the eastern US by the 1960s. Banning it brought them back.',
    'Falcons go for the loner. In a tight flock they struggle to pick a target.',
    "A city peregrine's favorite food? Pigeons. Lots of pigeons.",
    'Peregrine means wanderer. Some fly thousands of miles between summer and winter homes.',
    'Male peregrines are about a third smaller than females. Falconers call them tiercels.',
    'Peregrines strike prey in midair, feet first.',
  ],
  general: [
    // Wikipedia: "boid" also plays on the New York pronunciation of "bird"
    'Craig Reynolds invented boids in 1986. Fun fact: boid is also how a New Yorker says bird.',
    "Boids follow 3 rules: don't crowd, match your neighbors, stick together. No leader.",
    'The bat swarms and penguin army in Batman Returns were made with boids.',
    // Wikipedia: 927 Fifth Avenue, December 2004
    'Pale Male, a red-tailed hawk, nested on Fifth Ave. In 2004 his nest was torn out. Protests got it back.',
    'Bow Bridge opened in 1862. Cast iron, and still here.',
  ],
};

/**
 * Order the guide works through: mostly the active bird, with a general boids fact and, every so
 * often, a falcon fact mixed in (pattern: bird, bird, general, bird, bird, falcon).
 */
export function tourSequence(species: Species): string[] {
  const lists = { s: TOUR_FACTS[species], g: TOUR_FACTS.general, f: TOUR_FACTS.falcon };
  const idx = { s: 0, g: 0, f: 0 };
  // Each list cycles on its own, so falcon and general facts stay spread out (1 in 6 each)
  // instead of bunching up at the end. Ten rounds of the pattern covers every list at least once.
  const out: string[] = [];
  for (let round = 0; round < 10; round++) {
    for (const kind of ['s', 's', 'g', 's', 's', 'f'] as const) {
      const list = lists[kind];
      out.push(list[idx[kind]++ % list.length]);
    }
  }
  return out;
}

/** What birds occasionally say in speech bubbles. Shuffled, no immediate repeats. */
export const BIRD_CHATTER = [
  "It's all about da Mets!",
  "Ay, we're flockin' here!",
  'Lemme get a chopped cheese, the flocky way.',
  'Lemmegetabaconeggand- wait, EGGS?',
  'Fuggedaboutit.',
  'Cohesion is just peer pressure.',
  'I go where the flock goes.',
  'The rent in this tree is insane.',
  "It's B-O-I-D. Boid.",
  'Stand clear of the closing wings.',
  'Break a wing!',
  'I know a guy.',
  'Two dollars for a slice?! Back in my day...',
  'Pigeons. No offense.',
  "Don't feed the tourists.",
];
