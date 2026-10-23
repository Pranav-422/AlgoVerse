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

Run once per topic with one class. About 30 minutes.

1. Every student signs in and takes the **before** check on the topic page. Do not open anything else yet.
2. Split the class at random (roll number odd / even) into three groups:
   - **A, conventional**: read only the AlgoVerse text brief, or the same section of the course textbook.
   - **B, existing tool**: study the topic on VisuAlgo (visualgo.net) for the same time. Do not open other AlgoVerse formats.
   - **C, AlgoVerse**: use the comic, video and visualizer.
3. Same time limit for all groups (15 minutes).
4. Every student takes the **after** check on the topic page.
5. Read `/insights`. Group C appears in the format rows. Groups A and B both land in the *text brief only* row, so note their emails per group and compare their before/after scores from the `checks` table:

   ```sql
   SELECT u.email, a.score AS before, b.score AS after
   FROM checks a JOIN checks b ON b.user_id = a.user_id AND b.topic_id = a.topic_id AND b.phase = 'post'
   JOIN users u ON u.id = a.user_id
   WHERE a.phase = 'pre' AND a.topic_id = 'sorting';
   ```

6. Report the mean gain (after − before) per group and the number of students. With fewer than about 20 per group, report the numbers without claiming a significant difference.

Optional: a week later, give the practice quiz (`/topics/<id>/quiz?n=10`) to all groups to compare retention.
