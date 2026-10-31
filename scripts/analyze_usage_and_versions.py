#!/usr/bin/env python3
"""
Deep-dive weekly usage comparison and app version distribution analysis
from NorthPaw's Mixpanel event export.
"""

import os
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter

def main():
    export_path = "documentation/notebooklm/metrics/mixpanel_export.json"
    if not os.path.exists(export_path):
        print(f"Error: {export_path} not found.")
        return

    with open(export_path, "r") as f:
        data = json.load(f)

    events = data.get("raw_events", [])
    print(f"Loaded {len(events):,} raw events.")

    # Target reference time: current time
    now = datetime.now()
    now_ts = now.timestamp()

    # 1. User tracking
    user_first_seen = {}
    user_latest_time = {}
    user_latest_version = {}
    user_latest_platform = {}
    user_event_count_per_ver = defaultdict(lambda: Counter())
    user_total_events = Counter()

    for e in events:
        props = e.get("properties", {})
        uid = props.get("distinct_id")
        t = props.get("time")
        ver = props.get("$app_version_string") or "Unknown"
        os_name = props.get("$os") or props.get("platform") or "Unknown"

        if not uid or not t:
            continue

        if uid not in user_first_seen or t < user_first_seen[uid]:
            user_first_seen[uid] = t

        if uid not in user_latest_time or t > user_latest_time[uid]:
            user_latest_time[uid] = t
            user_latest_version[uid] = ver
            user_latest_platform[uid] = os_name

        user_event_count_per_ver[uid][ver] += 1
        user_total_events[uid] += 1

    total_unique_users = len(user_latest_time)
    print(f"Unique users identified: {total_unique_users}")

    # 2. Build 6 consecutive 7-day calendar weeks ending today
    weeks = []
    for i in range(6):
        w_end = now - timedelta(days=i * 7)
        w_start = w_end - timedelta(days=7)
        weeks.append((w_start, w_end))
    weeks.reverse()

    print("\n" + "=" * 90)
    print("📅 WEEK-OVER-WEEK USAGE COMPARISON (LAST 6 WEEKS)")
    print("=" * 90)
    print(f"{'Week Range':<22} | {'Active Users':<12} | {'New Users':<10} | {'Total Events':<12} | {'Avg Ev/User':<11} | {'App Opens':<10} | {'Readiness Views'}")
    print("-" * 90)

    weekly_data = []
    for w_start, w_end in weeks:
        start_ts = w_start.timestamp()
        end_ts = w_end.timestamp()
        w_label = f"{w_start.strftime('%b %d')} – {w_end.strftime('%b %d')}"

        w_events = [e for e in events if start_ts <= e.get("properties", {}).get("time", 0) < end_ts]
        w_users = set(e.get("properties", {}).get("distinct_id") for e in w_events if e.get("properties", {}).get("distinct_id"))
        new_users = sum(1 for u in w_users if start_ts <= user_first_seen.get(u, 0) < end_ts)

        ev_counts = Counter(e.get("event") for e in w_events)
        app_opens = ev_counts.get("app_opened", 0)
        readiness = ev_counts.get("readiness_viewed", 0)
        weather_loads = ev_counts.get("weather_loaded", 0)
        surface_changes = ev_counts.get("surface_changed", 0)
        hand_tests = ev_counts.get("hand_test_opened", 0)

        total_ev = len(w_events)
        avg_ev = total_ev / len(w_users) if w_users else 0.0

        weekly_data.append({
            "week_label": w_label,
            "start_iso": w_start.strftime('%Y-%m-%d'),
            "end_iso": w_end.strftime('%Y-%m-%d'),
            "active_users": len(w_users),
            "new_users": new_users,
            "total_events": total_ev,
            "avg_events_per_user": round(avg_ev, 1),
            "app_opens": app_opens,
            "readiness_views": readiness,
            "weather_loads": weather_loads,
            "surface_changes": surface_changes,
            "hand_tests": hand_tests,
        })

        print(f"{w_label:<22} | {len(w_users):<12} | {new_users:<10} | {total_ev:<12,} | {avg_ev:<11.1f} | {app_opens:<10} | {readiness}")

    # 3. User distribution by LATEST app version
    print("\n" + "=" * 105)
    print("📱 USER BASE DISTRIBUTION BY LATEST APP VERSION")
    print("=" * 105)
    print(f"{'App Version':<13} | {'Users':<7} | {'Share':<7} | {'Active 7d':<10} | {'Active 30d':<11} | {'iOS':<6} | {'Android':<8} | {'Total Events':<12} | {'Last Seen'}")
    print("-" * 105)

    ver_counter = Counter(user_latest_version.values())
    ver_users = defaultdict(list)
    for uid, ver in user_latest_version.items():
        ver_users[ver].append(uid)

    cutoff_7d = now_ts - 7 * 86400
    cutoff_14d = now_ts - 14 * 86400
    cutoff_30d = now_ts - 30 * 86400

    version_breakdown = []
    for ver, count in ver_counter.most_common():
        u_list = ver_users[ver]
        pct = (count / total_unique_users) * 100
        active_7d = sum(1 for u in u_list if user_latest_time[u] >= cutoff_7d)
        active_14d = sum(1 for u in u_list if user_latest_time[u] >= cutoff_14d)
        active_30d = sum(1 for u in u_list if user_latest_time[u] >= cutoff_30d)
        ios_count = sum(1 for u in u_list if user_latest_platform[u] == "iOS")
        android_count = sum(1 for u in u_list if user_latest_platform[u] == "Android")
        other_count = count - ios_count - android_count
        
        # Events generated while on this version or by these users
        ver_events_total = sum(user_event_count_per_ver[u][ver] for u in u_list)

        last_seen_max = max(user_latest_time[u] for u in u_list)
        last_seen_str = datetime.fromtimestamp(last_seen_max).strftime("%Y-%m-%d")

        version_breakdown.append({
            "version": ver,
            "user_count": count,
            "share_pct": round(pct, 1),
            "active_7d": active_7d,
            "active_14d": active_14d,
            "active_30d": active_30d,
            "ios_users": ios_count,
            "android_users": android_count,
            "other_users": other_count,
            "total_events_on_version": ver_events_total,
            "last_active_date": last_seen_str,
        })

        print(f"{ver:<13} | {count:<7} | {pct:<6.1f}% | {active_7d:<10} | {active_30d:<11} | {ios_count:<6} | {android_count:<8} | {ver_events_total:<12,} | {last_seen_str}")

    # Output detailed JSON artifact
    out_analysis = {
        "analysis_timestamp": datetime.now().isoformat(),
        "total_unique_users": total_unique_users,
        "total_events": len(events),
        "weekly_trends": weekly_data,
        "app_versions": version_breakdown,
    }

    out_file = "documentation/notebooklm/metrics/mixpanel_weekly_and_version_analysis.json"
    with open(out_file, "w") as f:
        json.dump(out_analysis, f, indent=2)

    print("\nSaved detailed analysis JSON to:", out_file)

if __name__ == "__main__":
    main()
