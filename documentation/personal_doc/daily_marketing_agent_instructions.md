# Daily Marketing Agent: Task Configuration & Instructions (`task-1220`)

This document outlines the exact instruction set, execution parameters, and target algorithms registered for the daily background marketing task. 

---

## 📅 Execution Schedule
*   **Task ID:** `018bb466-f010-47b6-bd9f-f937acbd0452/task-2173` (Updated)
*   **Trigger Time:** Daily at 1:00 AM local time (triggers immediately on morning wake-up)
*   **Cron Expression:** `0 1 * * *`
*   **Engine:** Antigravity Background Scheduler

---

## 📝 Registered Agent Execution Prompt

Every time the task is triggered, the background agent is booted with this exact prompt:

```text
This is the automated daily NorthPaw marketing background task. 

Perform the following steps:
1. Move the previous marketing queue at /Users/fiegellansknowledge/experiment/NorthPaw/documentation/personal_doc/daily_marketing_queue.md to the archive directory at /Users/fiegellansknowledge/experiment/NorthPaw/documentation/personal_doc/archive/daily_marketing_queue_[DATE].md (using yesterday's date or today's date if yesterday is not available).
2. Scan the last 3-5 archived queues in /Users/fiegellansknowledge/experiment/NorthPaw/documentation/personal_doc/archive/ to find any URLs the user has marked as completed or commented on (e.g., lines starting with [x]). Use search_web to check if there are any new replies or comments on those threads. If there are, compile them under a "🚨 Active Follow-Ups Needed" section.

3. DUAL-STRATEGY SCRAPING (50% Reactive, 50% Proactive):
   - SEARCH CONVERSATIONS: Search Reddit (r/dogs, r/puppy101, r/Frenchbulldogs, r/reactivedogs, r/Huskies, r/Whippets), X (Twitter), and general interest blogs.
     * Search Problems: "hot pavement", "paws burning", "dog heatstroke", "walking dog summer", "asphalt hot".
     * Search Celebrations: "first hike with puppy", "dog beach", "trail running dog", "camping dog", "mountain dog", "morning walk", "hiking with dogs".
     * Search Weather Events: "Heat Advisory", "Excessive Heat Warning", "Triple digit temperatures", "Heat dome", "Record temperatures".
   - SEASONAL CHECK: Compare today's date and weather forecast against: National Dog Day, Adopt a Shelter Dog Month, Fourth of July, Wildfire smoke, Labor Day, Memorial Day, Heat waves, First day of Summer, First 90° day.
   - REDDIT COMPLIANCE RULES:
     * Focus 80% of Reddit efforts on commenting inside existing active threads (reactive comments) rather than posting new text threads, as new threads face strict new-account and spam blocks.
     * Never use diagnostic medical language (e.g. diagnosing heatstroke, treatment instructions, breathing deficits) in general subreddits like r/dogs to avoid medical filter flags. Focus purely on pavement thermodynamics, safe windows, and mechanical warnings (paws/turf heat).

4. TARGETS & SCORING:
   - Identify the top 3-5 opportunities from the scrape.
   - For each opportunity, assign:
     * Priority: High | Medium | Low
     * Estimated Installs: 1-5 | 5-20 | 20-100 | 100+
     * Action Type: Reactive Response or Proactive Engagement.
   - **Direct URL Link Requirement:** Always extract and include the exact, direct URL to the specific Reddit thread (e.g. `https://reddit.com/r/puppy101/comments/abc123/thread_title/`) or X post. **This must be formatted as a clickable Markdown link in the first column of the table (e.g., `[Reddit - r/puppy101](https://reddit.com/r/puppy101/comments/abc123/thread_title/)`).** Do not use plain text or generic subreddit homepage links.
   - **CRITICAL URL RESOLUTION RULE:** Do not simply copy post ID character strings (like `1dl38a6`) from the raw search engine summary texts, as search engines often match correct text snippets to incorrect post IDs/subreddits. You MUST follow/resolve the actual search redirect links (e.g. by using curl, running a script, or loading the link) to get the final redirected URL so that the links are 100% correct, active, and lead to the intended thread.
   - Draft a customized, science-backed comment or outreach copy (mentioning snout profiles, coat types, or thermodynamic pavement differences) referencing NorthPaw.


5. WEATHER ENGINE:
   - Fetch temperatures for pet-friendly US cities: Austin, Phoenix, LA, Atlanta, Miami, Dallas, Houston, Denver, Seattle, Chicago, San Diego, Charlotte, Tampa, Orlando, Portland, Las Vegas, Sacramento, San Antonio, Jacksonville, Nashville.
   - For cities with forecast temp >= 82°F, compute simulated asphalt temperature and draft localized alert social posts.

6. CONTENT PIPELINE GENERATION:
   Generate fresh daily marketing copy drafts regardless of news volume:
   - 1 LinkedIn post (focusing on indie development, app engineering, or canine heat physics)
   - 2 Instagram captions (engaging, visually descriptive)
   - 1 Reel idea (visual concept + overlay text)
   - 1 TikTok script (30s storyboard + script hook)
   - 2 Reddit discussion starter ideas
   - 1 Tweet (punchy, high-impact)

7. MEDIA OPPORTUNITIES SCAN:
   - Search recent publications writing about: dogs, weather, outdoors, pets, hiking.
   - **RECENCY FILTER:** Restrict search results to articles published or updated within the last 7 days.
   - **ARCHIVE EXCLUSION FILTER:** Check the last 5 archived queues in the `archive/` directory. Exclude any articles that have already been suggested or pitched (such as the Outside Magazine summer hiking guide or the Seattle Times early-summer heat advisory), unless a new, distinct article is published by that outlet.
   - List the 2 most relevant new articles, providing their resolved direct URLs, contact names/emails, and customized pitch templates.

8. DAILY EXPERIMENT & STRATEGY:
   - ⭐ HIGHEST ROI OPPORTUNITY TODAY: Highlight the single best action.
   - What experiment should Chris run today? Include:
     * Experiment Name
     * Estimated Effort (e.g. 15 minutes, 30 minutes)
     * Estimated Impact (Low | Medium | High)
     * Why? (Strategic rationale)
   - Proactive Prompts:
     * What’s one original piece of content NorthPaw could publish today?
     * What’s one person or organization worth reaching out to?
     * What’s one experiment to run this week?

9. Write the final structured output back to /Users/fiegellansknowledge/experiment/NorthPaw/documentation/personal_doc/daily_marketing_queue.md.
10. Send a message to the user notifying them that the daily queue is ready and summarize the findings.
```

---

## 🗄️ Run History & Log
*   **Iteration 1 (June 24, 2026):** Ran successfully.
*   **Iteration 2 (June 25, 2026):** Ran successfully.
*   **Iteration 3 (June 27, 2026):** Ran successfully (re-run).
*   **Iteration 4 (June 28, 2026):** Ran successfully.
*   **Iteration 5 (July 3, 2026):** Ran successfully (Friday, July 3 at 9:30 AM local time).
*   **Next Scheduled Run:** Saturday, July 4, 2026 at 1:00 AM local time (Task ID: `task-2173`).

---

## 🛠️ Modifying the Behavior
Because this task runs on the agent-side framework, you can change these instructions at any time by asking me in the chat.


