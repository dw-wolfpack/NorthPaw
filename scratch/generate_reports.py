import json
import os
from collections import defaultdict
from datetime import datetime, timedelta

def main():
    base_dir = '/Users/fiegellansknowledge/experiment/NorthPaw/documentation/notebooklm/metrics'
    json_path = os.path.join(base_dir, 'mixpanel_export.json')
    md_summary_path = os.path.join(base_dir, 'mixpanel_export_summary.md')
    md_30d_path = os.path.join(base_dir, 'thirty_day_metrics.md')
    md_funnel_path = os.path.join(base_dir, 'strict_onboarding_funnel.md')

    with open(json_path) as f:
        data = json.load(f)

    events = data['raw_events']
    total_events = len(events)
    distinct_users = data['distinct_users_count']

    user_first_seen = {}
    user_active_days = defaultdict(set)
    all_dates = []

    for e in events:
        dist_id = e.get('properties', {}).get('distinct_id')
        ts = e.get('properties', {}).get('time')
        if dist_id and ts:
            dt = datetime.fromtimestamp(ts)
            d_str = dt.strftime('%Y-%m-%d')
            all_dates.append(dt)
            user_active_days[dist_id].add(d_str)
            if dist_id not in user_first_seen or dt < user_first_seen[dist_id]:
                user_first_seen[dist_id] = dt

    min_dt = min(all_dates)
    max_dt = max(all_dates)
    start_sun = min_dt - timedelta(days=(min_dt.weekday() + 1) % 7)

    # 1. Weekly Rollup
    weeks = []
    curr = start_sun
    while curr <= max_dt:
        w_end = curr + timedelta(days=6)
        label = f"{curr.strftime('%b %d')} – {w_end.strftime('%b %d')}"
        weeks.append((curr.strftime('%Y-%m-%d'), w_end.strftime('%Y-%m-%d'), label))
        curr += timedelta(days=7)

    # Regenerate base summary first
    os.system('python3 /Users/fiegellansknowledge/experiment/NorthPaw/scratch/build_summary.py')

    table_weekly_md = f'''
---

## 📅 Full Lifetime Sunday–Saturday Weekly Cohort Rollup (Updated {datetime.now().strftime('%A %b %d')})

| Calendar Week | Total WAU | Brand New | Returning from Prior Wk | Standard W-o-W Retention *(vs Total Prior WAU)* | Core Base Retention *(vs Prior Returning Base)* | Milestone / Phase |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
'''
    prev_week_users = set()
    prev_returning_count = 0

    milestones = {
        'May 24 – May 30': 'Alpha builds & local testing',
        'May 31 – Jun 06': 'Internal beta testing',
        'Jun 07 – Jun 13': 'Pre-launch TestFlight',
        'Jun 14 – Jun 20': '🚀 Official App Store Launch',
        'Jun 21 – Jun 27': 'Early organic adoption',
        'Jun 28 – Jul 04': '4th of July summer heat surge',
        'Jul 05 – Jul 11': 'Version 5.0.0 release',
        'Jul 12 – Jul 18': 'Version 5.1.0 release',
        'Jul 19 – Jul 25': 'Version 5.2.0 submission',
        'Jul 26 – Aug 01': '🔥 Peak growth week (108 WAU)',
        'Aug 02 – Aug 08': 'Version 5.3.3 / 5.4.0 widget build',
        'Aug 09 – Aug 15': 'Current Week (Partial)'
    }

    for start_str, end_str, label in weeks:
        start_dt = datetime.strptime(start_str, '%Y-%m-%d')
        end_dt = datetime.strptime(end_str, '%Y-%m-%d') + timedelta(days=1)
        
        current_week_users = set()
        new_users = set()
        returning_users = set()
        
        for dist_id, active_days in user_active_days.items():
            for d in active_days:
                d_dt = datetime.strptime(d, '%Y-%m-%d')
                if start_dt <= d_dt < end_dt:
                    current_week_users.add(dist_id)
                    break
                    
        for u in current_week_users:
            first_dt = user_first_seen[u]
            if start_dt <= first_dt < end_dt:
                new_users.add(u)
            if u in prev_week_users:
                returning_users.add(u)
                
        std_ret_rate = (len(returning_users) / len(prev_week_users) * 100) if prev_week_users else 0.0
        core_ret_rate = (len(returning_users) / prev_returning_count * 100) if prev_returning_count else 0.0
        
        phase = milestones.get(label, 'Current Week')
        if label == 'Aug 09 – Aug 15':
            phase = f"Current Week (Partial: Sun–{max_dt.strftime('%a')})"

        table_weekly_md += f"| **{label}** | **{len(current_week_users)}** | {len(new_users)} | **{len(returning_users)}** | **{std_ret_rate:.1f}%** | {core_ret_rate:.1f}% | {phase} |\n"
        
        prev_week_users = current_week_users
        prev_returning_count = len(returning_users)

    with open(md_summary_path, 'a') as f:
        f.write(table_weekly_md)

    # 2. 30-Day Metrics (ends on max_dt)
    end_30d = datetime(max_dt.year, max_dt.month, max_dt.day, 23, 59, 59)
    start_30d = end_30d - timedelta(days=29)

    events_30d = []
    user_active_days_30d = defaultdict(set)

    for e in events:
        dist_id = e.get('properties', {}).get('distinct_id')
        ts = e.get('properties', {}).get('time')
        if dist_id and ts:
            dt = datetime.fromtimestamp(ts)
            if start_30d <= dt <= end_30d:
                events_30d.append(e)
                user_active_days_30d[dist_id].add(dt.strftime('%Y-%m-%d'))

    app_opened_30d = sum(1 for e in events_30d if e.get('event') == 'app_opened')
    onboarding_started_30d = sum(1 for e in events_30d if e.get('event') == 'onboarding_started')
    onboarding_completed_30d = sum(1 for e in events_30d if e.get('event') == 'onboarding_completed')
    first_readiness_30d = sum(1 for e in events_30d if e.get('event') == 'readiness_viewed' and e.get('properties', {}).get('is_first_readiness_view') == True)
    total_readiness_30d = sum(1 for e in events_30d if e.get('event') == 'readiness_viewed')

    new_users_30d_cohort = [u for u, f_dt in user_first_seen.items() if start_30d <= f_dt <= end_30d - timedelta(days=7)]
    w1_ret_count = 0
    for u in new_users_30d_cohort:
        f_dt = user_first_seen[u]
        w1_end = f_dt + timedelta(days=7)
        for d in user_active_days[u]:
            d_dt = datetime.strptime(d, '%Y-%m-%d')
            if f_dt.date() < d_dt.date() <= w1_end.date():
                w1_ret_count += 1
                break

    w1_ret_rate_30d = (w1_ret_count / len(new_users_30d_cohort) * 100) if new_users_30d_cohort else 0.0

    safety_check_events = ('readiness_viewed', 'weather_loaded', 'surface_changed', 'walk_window_viewed')
    total_safety_checks_30d = sum(1 for e in events_30d if e.get('event') in safety_check_events)
    weekly_safety_checks_per_user = (total_safety_checks_30d / len(user_active_days_30d)) / (30 / 7) if user_active_days_30d else 0.0

    md_30d_content = f'''# NorthPaw 30-Day Performance & Metric Audit

* **Audit Period:** {start_30d.strftime('%B %d, %Y')} – {end_30d.strftime('%B %d, %Y')} (Last 30 Days)
* **Total Tracked Events in 30 Days:** **{len(events_30d):,} events**
* **Unique Active Users in 30 Days:** **{len(user_active_days_30d)} distinct users**

---

## 📊 Core 30-Day Metrics Breakdown

| Metric Name | 30-Day Total | Context / Conversion Rate |
| :--- | :---: | :--- |
| **`app_opened`** | **{app_opened_30d:,} times** | Total app launches across {len(user_active_days_30d)} active users |
| **`onboarding_started`** | **{onboarding_started_30d} users** | New users starting dog profile setup |
| **`onboarding_completed`** | **{onboarding_completed_30d} users** | **{onboarding_completed_30d/onboarding_started_30d*100:.1f}% Onboarding Completion Rate** |
| **`First readiness viewed`** | **{first_readiness_30d} times** | **{total_readiness_30d:,} total readiness checks** ({total_readiness_30d/max(1, first_readiness_30d):.1f}x re-engagement) |
| **Week-One Return Rate** | **{w1_ret_rate_30d:.1f}%** | {w1_ret_count} of {len(new_users_30d_cohort)} new cohort users returned in W1 |
| **Weekly Safety Checks** | **{total_safety_checks_30d:,} checks** | **{weekly_safety_checks_per_user:.1f} safety checks per active user per week** |
'''

    with open(md_30d_path, 'w') as f:
        f.write(md_30d_content)

    # 3. Strict Sequential Onboarding Funnel (ends on max_dt)
    start_date = datetime(2026, 7, 17, 0, 0, 0)
    end_date = datetime(max_dt.year, max_dt.month, max_dt.day, 23, 59, 59)

    dev_users = set()
    for e in events:
        props = e.get('properties', {})
        dist_id = props.get('distinct_id')
        if dist_id:
            if props.get('is_dev') == True or props.get('is_mock') == True or 'test' in str(dist_id).lower() or 'dev' in str(dist_id).lower():
                dev_users.add(dist_id)

    user_events = {}
    for e in events:
        props = e.get('properties', {})
        dist_id = props.get('distinct_id')
        ts = props.get('time')
        
        if dist_id and ts and dist_id not in dev_users:
            dt = datetime.fromtimestamp(ts)
            if start_date <= dt <= end_date:
                if dist_id not in user_events:
                    user_events[dist_id] = []
                user_events[dist_id].append({
                    'event': e.get('event'),
                    'time': dt,
                    'scene': props.get('scene'),
                    'stepIndex': props.get('stepIndex'),
                    'is_first_readiness': props.get('is_first_readiness_view')
                })

    for u in user_events:
        user_events[u].sort(key=lambda x: x['time'])

    funnel_steps = [
        ('onboarding_started', lambda e: e['event'] == 'onboarding_started'),
        ('step: name', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'name' or e.get('stepIndex') == 1)),
        ('step: breed', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') in ('breed', 'breed-snout') or e.get('stepIndex') == 2)),
        ('step: snout', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') in ('snout', 'breed-snout') or e.get('stepIndex') in (2, 3))),
        ('step: age', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'age' or e.get('stepIndex') in (3, 4))),
        ('step: biology-activity', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'biology-activity' or e.get('stepIndex') in (4, 5))),
        ('step: location', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'location' or e.get('stepIndex') in (5, 6))),
        ('step: npi-activation', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'npi-activation' or e.get('stepIndex') in (6, 7))),
        ('step: photo', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'photo' or e.get('stepIndex') in (7, 8))),
        ('step: morning-brief', lambda e: e['event'] == 'onboarding_step_viewed' and (e.get('scene') == 'morning-brief' or e.get('stepIndex') in (8, 9))),
        ('onboarding_completed', lambda e: e['event'] == 'onboarding_completed' or (e['event'] == 'onboarding_step_viewed' and e.get('scene') == 'commitment')),
        ('First readiness_viewed', lambda e: e['event'] == 'readiness_viewed')
    ]

    step_unique_users = [set() for _ in funnel_steps]

    for dist_id, evts in user_events.items():
        current_step = 0
        first_step_time = None
        
        for e in evts:
            name, check_fn = funnel_steps[current_step]
            if check_fn(e):
                if current_step == 0:
                    first_step_time = e['time']
                    step_unique_users[0].add(dist_id)
                    current_step += 1
                else:
                    if (e['time'] - first_step_time).total_seconds() <= 3600:
                        step_unique_users[current_step].add(dist_id)
                        current_step += 1
                        
                if current_step >= len(funnel_steps):
                    break

    start_cnt = len(step_unique_users[0])
    prev_cnt = start_cnt

    table_funnel_md = f'''# Strict Sequential Onboarding & Activation Funnel Audit

* **Funnel Date Range:** July 17, 2026 – {end_date.strftime('%B %d, %Y')} *(Public availability window of the new onboarding sequence)*
* **Constraints Applied:**
  * Strict in-order event sequence required.
  * 1-Hour maximum completion window from `onboarding_started`.
  * Unique `distinct_id` counts only (no duplicate events per user).
  * Excluded developer & TestFlight traffic.

---

## 📊 Strict 12-Step Sequential Funnel Results

| Step # | Event / Screen Name | Unique Users | Step Conversion | Step Drop-off | Overall Funnel Conv |
| :---: | :--- | :---: | :---: | :---: | :---: |
'''

    for idx, (name, _) in enumerate(funnel_steps):
        u_cnt = len(step_unique_users[idx])
        overall_conv = (u_cnt / start_cnt * 100) if start_cnt else 0.0
        step_conv = (u_cnt / prev_cnt * 100) if prev_cnt else 0.0
        drop_pct = 100.0 - step_conv
        table_funnel_md += f"| **{idx}** | `{name}` | **{u_cnt}** | {step_conv:.1f}% | {drop_pct:.1f}% | **{overall_conv:.1f}%** |\n"
        prev_cnt = u_cnt if u_cnt > 0 else prev_cnt

    with open(md_funnel_path, 'w') as f:
        f.write(table_funnel_md)

    print("Successfully generated all reports!")

if __name__ == '__main__':
    main()
