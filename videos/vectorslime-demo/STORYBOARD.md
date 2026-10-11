---
format: 1920x1080
duration: 60s
message: "Don't ask AI for answers. Think with it."
arc: BAB with demo loop — before (chatbot wall of text) → after tease (the slime) → bridge (talk · board · live tools) → how it teaches → local → beyond → CTA question
audience: hackathon judges
mode: collaborative
music: curious playful lo-fi underscore, light and warm, low under voice
voice: am_michael
---

<!-- Every spoken/on-screen claim cites the README.md sentence it comes from (README §…). -->

## Video direction

- **palette system** — `frame.md` dark register throughout: ground `ink-black` #12151C, text `cream`, ONE accent `fire-orange` key (= slime green #4FD27E) per frame; `cream-muted` for secondary copy; tassel gold #F4C74F only on the slime art. Frame 8 alone uses the light whiteboard register (#F7F8F7 ground, ink text) because it is the app's own board — the one deliberate register flip before the dark close.
- **type** — display = Bricolage Grotesque 700, lowercase, tight tracking (frame.md `display`/`h1`/`h2`); body/labels = Geist (`body`, `label` caps 0.14em). Fonts are local: `assets/fonts/BricolageGrotesque-Variable.woff2`, `assets/fonts/Geist-Variable.woff2`.
- **the slime** — always the brand art from `assets/vectorslime-icon.svg` (body + mortarboard + gold tassel, no tile). It is a character: squash-and-stretch on landings, hat lags the body (follow-through), tassel swings, blinks. Its motion is springy; everything else is `power3` long-tail.
- **footage** — real 1920×1080 app captures, played full-bleed inside a 12px-radius rounded window with a 1px `border-dark` hairline on the ink ground (≈92% of frame width). Camera moves on footage are `coordinate-target-zoom` punch-ins onto the cam / widget. Never fake UI over footage; overlays are only brand chips/labels.
- **chips** — section chips "01 · talk", "02 · shared board", "03 · live tools" = slime-green pill, ink text, Geist caps, bottom-left INSIDE the top 83%.
- **motion grammar + reveal model** — `power3.out` default; every piece reveals on its spoken cue (word timings in `audio_meta.json`); nothing front-loads. Holds are still (no breathing, no back-half drift).
- **rhythm** — Act I fast and typographic (F1–F3); Act II real footage with breathing room (F4–F6); held breather = F7 headline hold before the light F8 burst; F9 ends on a long still hold (≥2.5s) of the lockup.
- **captions** — the narration's captions use the project caption skin; keep the bottom ~17% clear in every frame.
- **negative list** — no purple/blue "AI" gradients, no bokeh, no drop shadows on type, no second accent color, no stock imagery, no fake cursors over the real footage; neither failure mode: slideshow (front-load then freeze) or screensaver (everything floating).


## Frame 1 — The question

- scene: Ink field. A chat input types "how do I find eigenvectors?" — then a dense wall of grey text floods upward and buries the frame.
- voiceover: "Quick question. When you ask an AI for help… what do you get back?"
- duration: 5s
- transition_in: cut
- status: animated
- src: compositions/frames/01-question.html
- type: hook
- persuasion: Rhetorical question (Socratic — the product's own teaching move, used on the viewer)
- beat: curiosity
- blueprint: typewriter-reveal (Adapt)
- focal: (typography) the chat input + the wall of text
- roles: none — typography only
- sfx: typing
- handoff_out: wall-of-text block — full-frame, x 0, y scrolling upward at ~600px/s, scale 1, opacity 1 (front layer) / 0.35 (back layer)
- asset_candidates:

narrativeRole: open by doing what the tutor does — ask, don't tell. The typed prompt is relatable; the flood is the punchline.
keyMessage: you already know the answer — a wall of text. (README: "you type a question and get back a wall of text.")

Adapt: keep the typed-line-as-human signature; instead of collapsing into a brand pop, the line is answered by a flood (the payoff is the pain).
Scene 1 (0.0–1.4s): ink ground; a wide rounded chat input (ink-black-alt, hairline) sits upper-third center, ~70% width; the prompt "how do I find eigenvectors?" types behind a slime-green caret → `discrete-text-sequence` + `context-sensitive-cursor`. VO "Quick question" lands during the typing.
Scene 2 (1.4–3.2s): on "when you ask an AI for help" the input presses (press-release-spring) and a reply bubble opens under it; dense grey answer text (`cream-hint`, small body size) begins streaming line by line → `dynamic-content-sequencing`.
Scene 3 (3.2–5.0s): on "what do you get back?" the stream accelerates into a WALL: the text block grows past the frame bottom and scrolls upward, burying the input (input pushed up and out); 3 depth layers = sharp wall front, blurred second wall behind (depth-of-field-blur), input fading. Ends at peak upward velocity → handoff.

## Frame 2 — Wall of text

- scene: The wall of text freezes and dims; two short lines punch through it one at a time: "answers, handed over." / "no reasoning built."
- voiceover: "A wall of text. The answer, handed over — and you never build the reasoning."
- duration: 5.5s
- transition_in: cut
- status: animated
- src: compositions/frames/02-wall.html
- type: pain_point
- persuasion: Pain validation
- beat: frustration
- blueprint: kinetic-type-beats (Adapt)
- focal: (typography) three punch lines
- roles: none — typography only
- sfx: none
- handoff_in: wall-of-text block — full-frame, y scrolling upward ~600px/s decelerating to 0 over 0.6s, scale 1, opacity 1 → dims to 0.18
- asset_candidates:

narrativeRole: name the pain plainly so the turn lands.
keyMessage: chatbots hand over answers. (README: "they hand over answers, and the student never builds the reasoning.")

Adapt: keep the statement-builds-across-beats signature; lines punch over a dimmed wall instead of a bare canvas.
Scene 1 (0.0–0.8s): the wall decelerates and freezes, dims to ~18% (it becomes the background layer). VO "A wall of text".
Scene 2 (0.8–2.6s): on "the answer, handed over" → "answers, handed over." slams in left-aligned upper third, `h1` cream → `kinetic-beat-slam`.
Scene 3 (2.6–5.5s): on "and you never build the reasoning" → "no reasoning built." slams below in slime green; the first line drops to `cream-muted`; then hold still (held read). Asymmetric 70/30 left-weighted.

## Frame 3 — Meet the slime

- scene: The text wall collapses to the floor; the slime (new icon art, large) drops in, squashes, hat wobbles, tassel swings. Wordmark VECTORSLIME locks up beside it; tagline types: "don't ask AI for answers. think with it."
- voiceover: "So I don't do that. I'm the tutor in VectorSlime — and we think together."
- duration: 6s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-meet.html
- type: product_intro
- persuasion: Negative contrast (not a chatbot)
- beat: relief + intrigue
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/vectorslime-icon.svg
- roles: vectorslime-icon = cutout (inline the slime art, without the tile, as separate SVG groups: body, hat, tassel, eyes)
- sfx: whoosh
- asset_candidates: assets/vectorslime-icon.svg — new slime tutor brand icon

narrativeRole: the after-tease — the character arrives and owns the frame.
keyMessage: a shared space where people and AI think together. (README tagline.)

Adapt: keep the mark-comes-to-exist signature — here the mark is a character that LANDS: the wall collapses, the stage clears, the slime drops in, then the wordmark completes the lockup.
Scene 1 (0.0–0.9s): (zoom-through seam from F2) clean ink stage; VO "So I don't do that." — the slime falls from above frame into the left-of-center position (~32% frame height), lands with squash (scaleY 0.8 / scaleX 1.15) then stretch-recover; hat lags and wobbles, tassel swings; a soft floor shadow grows under it → `spring-pop-entrance`.
Scene 2 (0.9–2.4s): on "I'm the tutor in VectorSlime" the wordmark "VectorSlime" (display, cream, Bricolage 700, sentence-case exception for the brand name) slides in from right of the slime with per-letter waterfall → `dynamic-content-sequencing`; slime blinks and turns its eyes toward the wordmark.
Scene 3 (2.4–6.0s): on "and we think together" the tagline types under the wordmark: "don't ask AI for answers." (`cream-muted`) then "think with it." (slime green) (type-on with caret); a faint green glow behind the slime blooms once; hold the lockup still. Asymmetric 40/60, slime ~35% of frame.

## Frame 4 — Talk

- scene: Real footage. Dashboard → "Go live" → the whiteboard opens and the stream cam pops in; camera punches into the cam: LIVE badge, slime greeting in a caption bubble. Label chip "01 · talk".
- voiceover: "You talk to me out loud. I answer out loud — live captions, on a stream cam."
- duration: 7s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/04-talk.html
- type: feature_showcase
- persuasion: Show-don't-tell proof (real app, real session)
- beat: curiosity → ease
- blueprint: device-surface-showcase (Adapt)
- focal: assets/video/f04-window.mp4
- roles: f04-window = focal (approved video, full window)
- sfx: none
- asset_candidates: assets/video/f04-window.mp4 — baked Talk window (dashboard → board, cam punch-in)

narrativeRole: first proof it's real; establish voice + cam.
keyMessage: voice-first, like a livestream. (README: "by voice", "It looks like a livestream: the tutor appears on a stream cam, with live captions.")

Adapt: keep the held-window-whose-screens-cycle signature (static tour); the window is the real app; one punch-in replaces the 3D push.
WINDOW GEOMETRY (all footage frames): approved video at data-frame-video-x=256 y=100 width=1408 height=792 (fit cover). The video is hoisted to the host root ABOVE the frame layer and cannot be transformed — all camera work is already baked into the file. The frame layer draws: the ink ground, a 1px border-dark hairline rounded rect 6px larger than the window behind it (reads as the window border), and chips/labels OUTSIDE the window rect (top band y 28–84, or left/right gutters x<240 / x>1680). Nothing may sit over the window rect.
Scene 1 (0.0–2.6s): window plays f04-window.mp4 from 0 (dashboard, Go live clicked). Top band: Geist caps label "live session · real app" in cream-muted at left above the window, fades up on "You talk to me out loud".
Scene 2 (2.6–3.4s): (cut is baked) board + cam appear in the window; chip "01 · talk" (slime pill) springs in at the top-band left → `spring-pop-entrance`; the label slides right to make room.
Scene 3 (3.4–7.0s): the baked punch-in to the cam + caption plays; frame layer stays still (held read).

## Frame 5 — Build live tools

- scene: Real footage. The student's message "I don't really get eigenvectors. Can you show me?" types into the cam input → the slime thinks → matrix and the live widget "Which vectors keep their direction?" land on the board with the pointer. Camera pushes onto the widget. Chips "02 · shared board" then "03 · live tools".
- voiceover: "We share one infinite whiteboard. Ask me about eigenvectors… and mid-sentence, I build you a live tool to play with."
- duration: 10s
- transition_in: crossfade
- status: animated
- src: compositions/frames/05-build.html
- type: feature_showcase
- persuasion: Show-don't-tell proof — the superpower happening in real time
- beat: awe
- blueprint: prompt-type-submit-generate (Reproduce)
- focal: assets/video/f05-window.mp4
- roles: f05-window = focal (approved video, full window)
- sfx: none
- asset_candidates: assets/video/f05-window.mp4 — baked Build window (prompt types → widget lands → push-in)

narrativeRole: the wow beat — an idea becomes an interactive tool on the board.
keyMessage: the AI turns an idea into a live, interactive tool right on the board. (README intro, "Each `<board>` tag runs at its position in the speech".)

Reproduce: the prompt types into the real product input, the machine answers with a generated artifact (the live widget). Signature: the prompt→generated-artifact round trip, here shown in the real app.
WINDOW GEOMETRY (all footage frames): approved video at data-frame-video-x=256 y=100 width=1408 height=792 (fit cover). The video is hoisted to the host root ABOVE the frame layer and cannot be transformed — all camera work is already baked into the file. The frame layer draws: the ink ground, a 1px border-dark hairline rounded rect 6px larger than the window behind it (reads as the window border), and chips/labels OUTSIDE the window rect (top band y 28–84, or left/right gutters x<240 / x>1680). Nothing may sit over the window rect.
Scene 1 (0.0–2.4s): window plays f05-window.mp4 (punch to the cam input as the student's question types). Top band: chip "02 · shared board" springs in left on "We share one infinite whiteboard" → `spring-pop-entrance`.
Scene 2 (2.4–4.6s): (baked jump cut) tutor speaking; top band right: Geist caps label "student asks → tutor builds" fades in.
Scene 3 (4.6–7.4s): widget lands in the footage (~5.0s); the chip hard-cut swaps to "03 · live tools" on "I build you" → `discrete-text-sequence`; a small slime-green dot pulses once beside it.
Scene 4 (7.4–10.0s): baked push onto the widget plays; frame layer holds still.

## Frame 6 — One question at a time

- scene: Real footage. Student guesses "the arrows that stay on their own line?" → the widget swaps to "Same line!". Then the footage shrinks left and kinetic type stacks right: "ask." "wait." "look." "nudge." with a small rule "max 4 sentences · ends on a question".
- voiceover: "Then I wait. One idea, one question — four sentences, max. You find it yourself."
- duration: 8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/06-socratic.html
- type: benefit_highlight
- persuasion: Feature-to-benefit translation (product guardrail → student builds the reasoning)
- beat: clarity + confidence
- blueprint: video-text-pivot (Adapt)
- focal: assets/video/f06-window.mp4
- roles: f06-window = focal (approved video, 0–2.8s) · f06-window-last = focal still (2.8s→end, animatable img)
- sfx: none
- asset_candidates: assets/video/f06-window.mp4 — baked Same-line window; assets/f06-window-last.png — exact last frame of it

narrativeRole: the pedagogy is built in, not a prompt promise.
keyMessage: short Socratic turns. (README: "ends with one question or one thing to try, and waits", "turns are capped at 4 sentences".)

Adapt: keep the video-slides-aside-to-hand-weight-to-text signature; the "hero stat" is the teaching rule (four words), no gradient pill.
WINDOW GEOMETRY (all footage frames): approved video at data-frame-video-x=256 y=100 width=1408 height=792 (fit cover). The video is hoisted to the host root ABOVE the frame layer and cannot be transformed — all camera work is already baked into the file. The frame layer draws: the ink ground, a 1px border-dark hairline rounded rect 6px larger than the window behind it (reads as the window border), and chips/labels OUTSIDE the window rect (top band y 28–84, or left/right gutters x<240 / x>1680). Nothing may sit over the window rect.
Scene 1 (0.0–2.8s): window plays f06-window.mp4 (approved video, data-start 0, data-duration 2.8) — "Same line!" lands. Top band chip "how it teaches" (slime pill) at left. VO "Then I wait. One idea, one question."
Scene 2 (2.8–3.6s): at 2.8s the video ends and the frame layer shows f06-window-last.png at the IDENTICAL window rect (x256 y100 1408x792, seamless swap), which then slides left and scales to ~0.56 (ends at x≈96, y≈282, width≈788) on power3.inOut, its hairline border moving with it → `card-morph-anchor`.
Scene 3 (3.6–8.0s): kinetic type stacks on the right column (x≈980–1800): "ask." (on "Four sentences" ~3.1s VO) "wait." "look." then "nudge." in slime green (on "You find it yourself" ~4.5s VO) → `dynamic-content-sequencing`; Geist caps label under it: "max 4 sentences · ends on a question"; hold still. Asymmetric 55/45.

## Frame 7 — Runs on your laptop

- scene: Kinetic type on ink: "runs on your laptop." then a fixed anchor "or any model" while chips cycle: oMLX · Ollama · LM Studio · Anthropic · OpenAI.
- voiceover: "And everything can run locally — right on your laptop. Or plug in any model you like."
- duration: 6.5s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/07-local.html
- type: benefit_highlight
- persuasion: Risk reversal (privacy, no lock-in)
- beat: trust
- blueprint: fixed-anchor-cycle (Reproduce)
- focal: (typography) headline + pinned model pill
- roles: none — typography only
- sfx: whoosh-short
- asset_candidates:

narrativeRole: trust beat for schools and judges.
keyMessage: local-first, any provider. (README: "Everything can run locally", parts table alternatives.)

Reproduce: anchor line holds, one slot cycles through options by hard cut, landing on the completed set.
Scene 1 (0.0–3.3s): (zoom-through seam) "runs on" / "your laptop." builds word-by-word on the VO ("everything can run locally, right on your laptop"), `display` size, cream, left upper-third → `dynamic-content-sequencing`. A small laptop line-icon self-draws beside it → `svg-path-draw`.
Scene 2 (3.3–5.4s): on "or plug in any model you like" the anchor "or any model:" + slime-green pill appear below; the pill's label hard-cuts oMLX → Ollama → LM Studio → Anthropic → OpenAI (~0.35s each) → `discrete-text-sequence`.
Scene 3 (5.4–6.5s): the pill settles on "any model" and the five names line up as a Geist caps row underneath; hold still. Left-aligned editorial 70/30.

## Frame 8 — Beyond math

- scene: A whiteboard grid of four sticky-style cards self-assembles around the slime: education · brainstorming · debates · group work. A label: "math is where we start."
- voiceover: "Math is where we start. Next: any subject, brainstorms, debates — whole groups on one board."
- duration: 7s
- transition_in: crossfade
- status: animated
- src: compositions/frames/08-beyond.html
- type: benefit_highlight
- persuasion: Future pacing
- beat: aspiration
- blueprint: grid-card-assemble (Adapt)
- focal: assets/vectorslime-icon.svg
- roles: vectorslime-icon = cutout (slime art, center)
- sfx: none
- asset_candidates: assets/vectorslime-icon.svg — slime mark at the center

narrativeRole: widen the vision from tutor to interface.
keyMessage: the same interface works beyond tutoring. (README "Where it goes next".)

Adapt: keep the staggered self-assembly signature; the items are tldraw-style sticky notes slapping onto a light dot-grid board around the slime.
Scene 1 (0.0–1.8s): light board register (#F7F8F7 + faint dot grid like the app); slime center (~22% height) hops once; Geist caps label top-left "math is where we start" types on the VO.
Scene 2 (1.8–6.0s): sticky notes slap on in a ring, each on its spoken word: "any subject" (yellow, ~2.1s), "brainstorms" (green, ~2.9s), "debates" (pink, ~3.8s), "group work" (blue, ~4.8s) — each lands with a slight rotation and a press squash → `spring-pop-entrance`; the slime's eyes follow each note.
Scene 3 (6.0–7.0s): all four held, slime blinks; hold still. Ring layout, notes in top 83%.

## Frame 9 — Your turn

- scene: The slime alone, centered, eyes on the viewer; the cam's "Your turn" pill pops under it. Then lockup: icon + VECTORSLIME + "a shared space to think." held to the end.
- voiceover: "So… what do you want to think about today?"
- duration: 6s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/09-your-turn.html
- type: cta
- persuasion: Direct address — end the way every tutor turn ends: on a question
- beat: belonging + motivation
- blueprint: typewriter-reveal (Adapt)
- focal: assets/vectorslime-icon.svg
- roles: vectorslime-icon = cutout (slime art, center)
- sfx: none
- asset_candidates: assets/vectorslime-icon.svg — final lockup mark

narrativeRole: close the loop — the video ends on the viewer's turn, like the product.
keyMessage: VectorSlime — a shared space where people and AI think together.

Adapt: keep the persistent-mark + typed-sub-line signature; the typed line is the tutor's "Your turn" pill, then the lockup.
Scene 1 (0.0–2.2s): ink ground; slime centered upper-middle (~30% height), eyes on camera, small idle squash on "So" ; VO "what do you want to think about today?"
Scene 2 (2.2–3.0s): as the question ends, a slime-green "Your turn" pill pops under it (the cam's real state) → `spring-pop-entrance`; slime blinks.
Scene 3 (3.0–6.0s): wordmark "VectorSlime" rises under the pill, then "a shared space to think." in `cream-muted` → `dynamic-content-sequencing`; hold the full lockup still to the last frame (final exit: none — hold).

