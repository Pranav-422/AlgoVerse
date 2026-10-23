# Evaluating AlgoVerse

What the app measures by itself, and how to run the comparison it cannot run alone.

## 1. Algorithm correctness

`npm run check` must pass before every release.

- `check:engines`: every visualizer engine (arrays, linked lists, stacks/queues, trees, graphs, recursion) produces frames whose code lines exist, whose predictions are well formed, and whose results match the operation.
- `check:quiz` and `check:comics`: every quiz question and comic cites a verbatim core fact from `content/knowledge/`.
- `/consistency`: for each fact, which formats use it, computed live from the knowledge files.

## 2. Understanding, not presentation

- **Before / after check** (topic page): the same three questions before any other format is opened and after. The "before" score is refused once another format is open, so it is a real starting point.
- **`/insights` → Before vs after**: mean gain per topic.
- **`/insights` → Which format helped?**: the same gains grouped by what the learner opened before the after check. The first row, *text brief only*, is the conventional baseline: a learner who only read a textbook-style page. Each format row shows its gain and the difference from that baseline.
- **Predict mode** (visualizer): the learner commits to a guess before each key step, so the visualizer tests understanding instead of only playing an animation.

Limit: learners pick their own formats, so the format table shows association, not cause. Section 4 removes that limit.

## 3. Adaptation from performance

- A missed quiz question returns in `/review` after 1, 3 and 7 days (`lib/learning.ts`, `nextReview`).
- The dashboard's **Next step** goes to the topic with the weakest quiz score (under 60% right, at least 2 answers), in a format not yet tried, or the visualizer's predict mode (`weakestTopic`). Without a weak topic it follows the suggested order.

## 4. Classroom comparison (conventional teaching and existing tools)

Built into the app at `/study`. Run once per topic with one class, about 30 minutes.

1. Every student signs in, opens `/study` and presses **Join the study**. The server puts each student in the smallest of three groups (random among ties), so the groups stay balanced:
   - **Text only (conventional)**: reads the topic brief, like a textbook page.
   - **VisuAlgo (existing tool)**: reads the brief, then studies the topic on VisuAlgo (the brief shows a button to the matching module).
   - **AlgoVerse**: reads the brief, then uses the comic, video and visualizer.
2. Every student opens the topic and takes the **before** check.
3. Give all groups the same time (15 minutes). In the study the comic, video and visualizer redirect to the brief until the before check is saved; for the text and VisuAlgo groups, until the after check is saved.
4. Every student takes the **after** check. In the study it cannot be retaken, so later format use does not change the score.
5. Read `/insights` → *Classroom study*: learner-topics, mean before, after and change per group. Only checks started after joining count.
6. With fewer than about 20 students per group, report the numbers without claiming a significant difference.

Students can leave the study on `/study`. Optional: a week later, give the practice quiz (`/topics/<id>/quiz?n=10`) to all groups to compare retention.
