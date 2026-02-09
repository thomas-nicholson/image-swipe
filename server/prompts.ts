const subjects = [
  "a majestic dragon perched on a crystal mountain",
  "a cyberpunk samurai walking through neon-lit rain",
  "an enchanted forest with bioluminescent mushrooms",
  "a steampunk airship floating above Victorian London",
  "a cosmic whale swimming through a nebula",
  "a robot artist painting in a sunlit studio",
  "a mystical phoenix rising from emerald flames",
  "an underwater city with coral architecture",
  "a warrior princess standing atop ancient ruins",
  "a floating island garden above the clouds",
  "a sentient tree in an alien desert landscape",
  "a wise owl perched on a glowing crystal",
  "a mermaid sitting on rocks during a sunset",
  "a time-traveler in a futuristic marketplace",
  "a knight riding a mechanical horse through fog",
  "a witch's cottage surrounded by magical herbs",
  "a space station orbiting a ringed gas giant",
  "a wolf made of starlight howling at twin moons",
  "a fairy village nestled in autumn leaves",
  "a giant tortoise carrying a small civilization",
  "a mysterious lighthouse on a cliff during a storm",
  "an android meditating in a zen garden",
  "a flying carpet soaring over Moroccan bazaars",
  "a crystal cave with rainbow reflections",
  "a samurai standing in a field of cherry blossoms",
  "a polar bear on an iceberg under northern lights",
  "a vintage car driving through a desert at sunset",
  "a magical library with floating glowing books",
  "a surreal clock melting over a dreamscape",
  "a phoenix-winged cat sitting on a rooftop",
];

const styles = [
  "hyperrealistic digital art, 8k resolution, ultra-detailed",
  "Studio Ghibli anime style, warm and whimsical",
  "oil painting with dramatic chiaroscuro lighting",
  "watercolor illustration with soft pastel tones",
  "dark fantasy concept art, moody atmosphere",
  "retro synthwave aesthetic with neon colors",
  "minimalist vector art with bold colors",
  "photorealistic render, cinematic lighting",
  "impressionist painting with vibrant brushstrokes",
  "Art Nouveau style with ornate golden details",
  "cyberpunk digital illustration, high contrast",
  "ethereal dreamy atmosphere, soft focus",
  "comic book style with bold outlines and halftone",
  "ukiyo-e Japanese woodblock print style",
  "surrealist composition inspired by Salvador Dali",
];

const moods = [
  "serene and peaceful",
  "dramatic and intense",
  "mysterious and enigmatic",
  "joyful and vibrant",
  "melancholic and wistful",
  "epic and awe-inspiring",
  "cozy and warm",
  "eerie and otherworldly",
  "romantic and nostalgic",
  "futuristic and sleek",
];

const extras = [
  "volumetric lighting, ray tracing",
  "golden hour lighting, lens flare",
  "atmospheric fog, depth of field",
  "intricate details, ornamental patterns",
  "dynamic composition, rule of thirds",
  "dramatic shadows, high contrast",
  "soft ambient light, pastel palette",
  "vivid saturated colors, sharp focus",
  "motion blur, dynamic energy",
  "macro detail, tilt-shift effect",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePrompt(): string {
  const subject = pickRandom(subjects);
  const style = pickRandom(styles);
  const mood = pickRandom(moods);
  const extra = pickRandom(extras);

  return `${subject}, ${style}, ${mood} mood, ${extra}`;
}

export function generatePrompts(count: number): string[] {
  const prompts: string[] = [];
  const usedSubjects = new Set<number>();

  for (let i = 0; i < count; i++) {
    let subjectIndex: number;
    do {
      subjectIndex = Math.floor(Math.random() * subjects.length);
    } while (usedSubjects.has(subjectIndex) && usedSubjects.size < subjects.length);
    usedSubjects.add(subjectIndex);

    const subject = subjects[subjectIndex];
    const style = pickRandom(styles);
    const mood = pickRandom(moods);
    const extra = pickRandom(extras);

    prompts.push(`${subject}, ${style}, ${mood} mood, ${extra}`);
  }

  return prompts;
}
