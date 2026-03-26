# How to Generate a Daily Build Log

Paste this prompt into Claude at the end of each coding session (or the morning after). One file per day.

---

## The Prompt to Give Claude

```
Generate a daily build log entry for today: [DATE e.g. 2026-03-26].

Save it as build_log/[DATE].md.

Match the tone and format of the existing entries in the build_log/ folder:
- First person, natural, like explaining it to another developer
- No beginner framing — don't mention learning curves unless it's a genuinely interesting technical problem
- Concrete and specific: function names, endpoints, file names, line counts
- Struggles should be about technical decisions or non-obvious problems, not "I didn't know how X worked"

Here's what I did today:
- [task number, steps done, features/files built]

Here's what I struggled with:
- [technical decisions, non-obvious problems, bugs]

Here's what went well:
- [things that worked, architecture paying off, patterns compounding]

For the STAR story, use today's most interesting design decision or technical challenge.

Also generate social media posts: X, LinkedIn, dev.to (article opener), and Substack (newsletter entry).
Match the tone and style of the existing posts in the log files.
```

---

## Format Reference

```
# Build Log: [DATE]
Project / Stack / Task header

## What I Did
Narrative + bullets. Specific. Function names, endpoints, file counts.
Sound like you're explaining it to a developer — not writing a report.

## Struggles
Technical problems and non-obvious decisions. Not "I didn't know how X worked."
Specific > vague. "The Redis write wasn't awaited before the next request fired" > "async was confusing."

## Wins
What worked. What architecture decision paid off. What's faster now than before.

## Next Up
Immediate next step.

## STAR Story (Apple Behavioral)
Situation → Task → Action → Result
Use the most interesting design decision or challenge from today.
Concrete details. Real trade-offs. Numbers where possible.

## Social Posts
One post per platform.
```

---

## Social Media Style Guide

### X (Twitter)
- Short. Can use → for list items.
- Open with context (day/task/project), not a hook.
- End with a one-liner observation or insight.
- No hashtags. Conversational.

### LinkedIn
- 150–250 words. Professional but not corporate.
- Open with what you built and why it matters.
- Bullet the technical items.
- Include one design decision or insight.
- End with what's next.
- 4–6 hashtags at the bottom.

### dev.to
- Title + tags frontmatter + article opener only (first 3–4 paragraphs).
- Lead with the interesting technical problem or decision from the day.
- Frame it as part of a build-in-public series.
- Leave a `[continue with...]` note for expansion.
- Tags: `nestjs`, `typescript`, `architecture`, `learninpublic` (adjust per topic).

### Substack
- Newsletter tone. Like writing to someone you know.
- Under 300 words.
- One interesting thing — not a full recap.
- Sign off: "Talk soon, Rhico"
- Subject line: specific and human, not clickbait.

---

## Tone Notes

Write like a developer talking to another developer. That means:
- No "I leveraged", "I implemented a solution", "I ensured scalability"
- No framing around being new to something unless it's directly relevant to a technical point
- Contractions are fine. Short sentences are fine.
- Struggles are about interesting problems, not knowledge gaps.

---

## File Naming

| Scenario | Filename |
|---|---|
| Single day | `2026-03-26.md` |
| Multi-day summary | `2026-03-18_to_2026-03-23.md` |
| This file | `_HOW_TO_GENERATE.md` |
