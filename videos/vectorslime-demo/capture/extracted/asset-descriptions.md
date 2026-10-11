# Asset Descriptions

⚠️  No vision credentials — descriptions below are catalog-derived (alt text, headings, section context, filename) instead of Vision-generated. To get richer Vision descriptions on the next capture, set GEMINI_API_KEY (or GOOGLE_API_KEY), or HYPERFRAMES_VERTEX_PROJECT_ID plus HYPERFRAMES_VERTEX_SERVICE_ACCOUNT for Vertex service-account auth, and re-run.

The `logo-<hash>.svg` filename prefix is a structural hint (DOM said this SVG was inside a `<header>`, home-link `<a>`, or had an aria-label matching the page brand). To pick the actual brand logo without Vision, open the `logo-*` candidates in a previewer or rasterize them with `sharp` before referencing — composing a fake logo ships off-brand in the final video.

- svgs/logo-0d7345e0.svg — logo 0d7345e0
- svgs/logo-455ebdfe.svg — logo 455ebdfe
- svgs/svg-1130db0e.svg — svg 1130db0e
- svgs/svg-156d939e.svg — svg 156d939e
- svgs/svg-18dec35c.svg — svg 18dec35c
- svgs/svg-2e7f34bd-2.svg — svg 2e7f34bd 2
- svgs/svg-2e7f34bd-3.svg — svg 2e7f34bd 3
- svgs/svg-2e7f34bd.svg — svg 2e7f34bd
- svgs/svg-6ba36586.svg — svg 6ba36586
- svgs/svg-6e443b32.svg — svg 6e443b32
- svgs/svg-9b9a1abb.svg — svg 9b9a1abb
- svgs/svg-9e5c5b00.svg — svg 9e5c5b00
- svgs/svg-9ec09a24.svg — svg 9ec09a24
- svgs/svg-aaa56a5e.svg — svg aaa56a5e
- svgs/svg-bc867d0a.svg — svg bc867d0a
- svgs/svg-c58184e7.svg — svg c58184e7
- svgs/svg-c77cf647.svg — svg c77cf647
- svgs/svg-d1bc752b.svg — svg d1bc752b
- svgs/svg-e7f98f8f.svg — svg e7f98f8f
- svgs/svg-fb0902fc.svg — svg fb0902fc

## Live session capture (recorded by driving the real app in Chrome, 1920x1080, no audio)

- [video] video/session-dashboard.mp4 — 6s: dark VectorSlime dashboard with new slime logo, "What are we learning today?" hero, slime tutor in mortarboard, Courses / Homework help / Open session cards; ends as "Go live" is clicked (~3.5s) and the board opens.
- [video] video/session-golive.mp4 — 27s: live whiteboard opens, tutor stream cam bottom-right (LIVE badge, slime "Professor Pi"); tutor greets "What are you working on today?" in a caption bubble; at ~21s the student types "I don't really get eigenvectors. Can you show me?" into the cam input.
- [video] video/session-widget-build.mp4 — 36s: student message sent, slime thinks; tutor speaks in caption bubbles; at ~17s a KaTeX matrix A=(2 1;1 2) and a live widget "Which vectors keep their direction?" (angle slider, blue input + red output arrows) appear on the board with a green "drag the slider" pointer.
- [video] video/session-same-line.mp4 — 22s: tutor confirms the student's guess; at ~7s the widget is replaced by "Do the arrows stay on their line?" at 45° with the arrows overlapping and a green "Same line!" label.
- screenshot-dashboard.png — still of the dashboard (1920x1080).
- screenshot-eigen-widget.png — still: matrix + "Which vectors keep their direction?" widget + stream cam.
- screenshot-same-line.png — still: "Do the arrows stay on their line?" widget showing "Same line!" + stream cam.
- vectorslime-icon.svg — NEW brand icon: green slime in a dark mortarboard with gold tassel on an ink rounded tile. The real logo.
- [video] video/f04-window.mp4 — 7.0s, 1408x792, BAKED for Frame 4: dashboard (0–2.6s, Go live clicked) → cut to live board; punch-in to the stream cam + "What are you working on today?" caption eases in 3.4–4.4s and holds. Ink fade in/out 0.35s baked.
- [video] video/f05-window.mp4 — 10.0s, 1408x792, BAKED for Frame 5: punch to cam input as "I don't really get eigenvectors. Can you show me?" types (0–2.4s) → jump cut, tutor speaking in caption (2.4–4.6s) → matrix + widget "Which vectors keep their direction?" land (~5.0s) → push onto the widget 7.4–8.4s and hold. Ink fades baked.
- [video] video/f06-window.mp4 — 2.8s, 1408x792, BAKED for Frame 6: zoomed on the widget as it swaps to "Do the arrows stay on their line?" 45° and "Same line!" appears. Fade-in baked, no fade-out (continues as the still below).
- f06-window-last.png — 1408x792 still = exact last frame of f06-window.mp4 ("Same line!" widget), for the slide-aside.
