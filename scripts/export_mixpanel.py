#!/usr/bin/env python3
"""
Mixpanel Data Exporter & Analytics Query Tool for NorthPaw
Fetches event stats, event names, property breakdowns, raw event logs,
and analyzes user base segmentation by platform (iOS vs. Android).
"""

import os
import sys
import json
import base64
import argparse
import urllib.request
import urllib.parse
from collections import Counter, defaultdict
from datetime import datetime, timedelta

def load_dotenv():
    """Loads environment variables from .env file if available."""
    # Find .env in project root
    current = os.path.abspath(__file__)
    for _ in range(3):
        current = os.path.dirname(current)
        env_file = os.path.join(current, ".env")
        if os.path.exists(env_file):
            with open(env_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip("'").strip('"'))
            break

def get_auth_header(api_secret_or_username, password=""):
    """
    Creates Basic Auth header for Mixpanel Query API.
    Mixpanel accepts Service Account Username:Password or API_Secret
    """
    credentials = f"{api_secret_or_username}:{password}"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    return f"Basic {encoded}"

def fetch_event_names(auth_header, project_id=None):
    """Fetches list of all event names tracked in the project."""
    url = "https://mixpanel.com/api/2.0/events/names"
    if project_id:
        url += f"?project_id={project_id}"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", auth_header)
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        # Non-fatal: Free accounts may receive 402 for /events/names
        return []

def export_raw_events(auth_header, from_date, to_date, limit=1000000):
    """Exports raw event stream from Mixpanel Raw Data Export API."""
    url = f"https://data.mixpanel.com/api/2.0/export?from_date={from_date}&to_date={to_date}"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", auth_header)
    
    events = []
    try:
        with urllib.request.urlopen(req) as resp:
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if line_str:
                    try:
                        events.append(json.loads(line_str))
                    except Exception:
                        continue
                    if len(events) >= limit:
                        break
        return events
    except Exception as e:
        print(f"[Mixpanel API] Error exporting raw events ({from_date} to {to_date}): {e}")
        return []

def get_event_id(e):
    """Generate a unique ID for deduplication."""
    props = e.get("properties", {})
    insert_id = props.get("$insert_id")
    if insert_id:
        return str(insert_id)
    uid = props.get("distinct_id", "")
    t = props.get("time", "")
    ev = e.get("event", "")
    return f"{uid}_{t}_{ev}"

def analyze_user_base(raw_events):
    """
    Aggregates user-level metrics and segments by operating system (iOS vs Android).
    """
    now_ts = datetime.now().timestamp()
    cutoff_7d = now_ts - (7 * 86400)
    cutoff_14d = now_ts - (14 * 86400)
    cutoff_30d = now_ts - (30 * 86400)
    cutoff_60d = now_ts - (60 * 86400)
    cutoff_90d = now_ts - (90 * 86400)

    users = defaultdict(lambda: {
        "os_counter": Counter(),
        "os_versions": Counter(),
        "app_versions": Counter(),
        "events": Counter(),
        "first_seen": None,
        "last_seen": None,
        "total_events": 0,
    })

    for e in raw_events:
        props = e.get("properties", {})
        uid = props.get("distinct_id")
        if not uid:
            continue

        ev_name = e.get("event", "unknown")
        t = props.get("time")

        os_name = props.get("$os") or props.get("platform") or props.get("Operating System") or "Unknown"
        os_ver = props.get("$os_version") or "Unknown"
        app_ver = props.get("$app_version_string") or "Unknown"

        u = users[uid]
        u["os_counter"][os_name] += 1
        u["os_versions"][os_ver] += 1
        u["app_versions"][app_ver] += 1
        u["events"][ev_name] += 1
        u["total_events"] += 1

        if t is not None:
            if u["first_seen"] is None or t < u["first_seen"]:
                u["first_seen"] = t
            if u["last_seen"] is None or t > u["last_seen"]:
                u["last_seen"] = t

    # Group users by primary OS
    platform_users = defaultdict(list)
    for uid, u in users.items():
        primary_os = u["os_counter"].most_common(1)[0][0]
        u["distinct_id"] = uid
        u["primary_os"] = primary_os
        platform_users[primary_os].append(u)

    total_unique_users = len(users)

    # Build platform summary statistics
    platform_summaries = {}
    for platform, u_list in sorted(platform_users.items(), key=lambda x: len(x[1]), reverse=True):
        count = len(u_list)
        pct = (count / total_unique_users * 100) if total_unique_users > 0 else 0
        total_evs = sum(u["total_events"] for u in u_list)
        avg_evs = total_evs / count if count > 0 else 0

        # Activity recency
        active_7d = sum(1 for u in u_list if u["last_seen"] and u["last_seen"] >= cutoff_7d)
        active_14d = sum(1 for u in u_list if u["last_seen"] and u["last_seen"] >= cutoff_14d)
        active_30d = sum(1 for u in u_list if u["last_seen"] and u["last_seen"] >= cutoff_30d)
        active_60d = sum(1 for u in u_list if u["last_seen"] and u["last_seen"] >= cutoff_60d)
        active_90d = sum(1 for u in u_list if u["last_seen"] and u["last_seen"] >= cutoff_90d)

        # Key Conversion & Value Actions
        onboarding_starts = sum(1 for u in u_list if u["events"].get("onboarding_started", 0) > 0)
        onboarding_completes = sum(1 for u in u_list if u["events"].get("onboarding_completed", 0) > 0)
        dogs_created = sum(1 for u in u_list if u["events"].get("dog_created", 0) > 0)
        readiness_viewed = sum(1 for u in u_list if u["events"].get("readiness_viewed", 0) > 0)
        weather_loaded = sum(1 for u in u_list if u["events"].get("weather_loaded", 0) > 0)
        surface_changed = sum(1 for u in u_list if u["events"].get("surface_changed", 0) > 0)
        hand_test_opened = sum(1 for u in u_list if u["events"].get("hand_test_opened", 0) > 0)
        scan_interest = sum(1 for u in u_list if u["events"].get("scan_interest_registered", 0) > 0)

        # Versions
        os_vers = Counter()
        app_vers = Counter()
        for u in u_list:
            top_os_v = u["os_versions"].most_common(1)[0][0]
            top_app_v = u["app_versions"].most_common(1)[0][0]
            os_vers[top_os_v] += 1
            app_vers[top_app_v] += 1

        platform_summaries[platform] = {
            "platform": platform,
            "user_count": count,
            "user_percentage": round(pct, 2),
            "total_events": total_evs,
            "avg_events_per_user": round(avg_evs, 1),
            "active_7d": active_7d,
            "active_7d_pct": round((active_7d / count * 100), 1) if count else 0,
            "active_14d": active_14d,
            "active_14d_pct": round((active_14d / count * 100), 1) if count else 0,
            "active_30d": active_30d,
            "active_30d_pct": round((active_30d / count * 100), 1) if count else 0,
            "active_60d": active_60d,
            "active_60d_pct": round((active_60d / count * 100), 1) if count else 0,
            "active_90d": active_90d,
            "active_90d_pct": round((active_90d / count * 100), 1) if count else 0,
            "onboarding_started_users": onboarding_starts,
            "onboarding_completed_users": onboarding_completes,
            "onboarding_completion_rate_pct": round((onboarding_completes / onboarding_starts * 100), 1) if onboarding_starts else 0,
            "dogs_created_users": dogs_created,
            "readiness_viewed_users": readiness_viewed,
            "weather_loaded_users": weather_loaded,
            "surface_changed_users": surface_changed,
            "hand_test_opened_users": hand_test_opened,
            "scan_interest_users": scan_interest,
            "top_os_versions": os_vers.most_common(5),
            "top_app_versions": app_vers.most_common(5),
        }

    return {
        "analysis_timestamp": datetime.now().isoformat(),
        "total_unique_users": total_unique_users,
        "total_events": len(raw_events),
        "platforms": platform_summaries,
    }

def print_user_base_report(analysis):
    """Prints a formatted report to the console."""
    print("\n" + "=" * 70)
    print("🐾 NORTHPAW USER BASE BREAKDOWN (SORTED BY PLATFORM)")
    print(f"Total Tracked Users: {analysis['total_unique_users']} | Total Events: {analysis['total_events']}")
    print("=" * 70)

    for platform, data in analysis["platforms"].items():
        print(f"\n📱 {platform.upper()}: {data['user_count']} users ({data['user_percentage']}%)")
        print("-" * 50)
        print(f"  • Total Events Tracked:    {data['total_events']:,} ({data['avg_events_per_user']} events/user)")
        print(f"  • Active Users (7 Days):   {data['active_7d']} ({data['active_7d_pct']}%)")
        print(f"  • Active Users (30 Days):  {data['active_30d']} ({data['active_30d_pct']}%)")
        print(f"  • Active Users (90 Days):  {data['active_90d']} ({data['active_90d_pct']}%)")
        print(f"  • Onboarding Funnel:       {data['onboarding_started_users']} started → {data['onboarding_completed_users']} completed ({data['onboarding_completion_rate_pct']}%)")
        print(f"  • Dogs Created:            {data['dogs_created_users']} users ({round(data['dogs_created_users']/data['user_count']*100, 1)}%)")
        print(f"  • Paw Readiness Checks:    {data['readiness_viewed_users']} users ({round(data['readiness_viewed_users']/data['user_count']*100, 1)}%)")
        print(f"  • Weather Loads:           {data['weather_loaded_users']} users ({round(data['weather_loaded_users']/data['user_count']*100, 1)}%)")
        print(f"  • Surface Selector Uses:   {data['surface_changed_users']} users ({round(data['surface_changed_users']/data['user_count']*100, 1)}%)")
        print(f"  • Hand Test Screen:        {data['hand_test_opened_users']} users ({round(data['hand_test_opened_users']/data['user_count']*100, 1)}%)")
        print(f"  • Top OS Versions:         {', '.join(f'{v} ({c})' for v, c in data['top_os_versions'][:4])}")
        print(f"  • Top App Versions:        {', '.join(f'{v} ({c})' for v, c in data['top_app_versions'][:3])}")

    print("\n" + "=" * 70)

def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Fetch, export, and segment Mixpanel metrics for NorthPaw.")
    parser.add_argument("--secret", help="Mixpanel API Secret or Service Account Username")
    parser.add_argument("--password", default="", help="Service Account Secret / Password (if using Service Account)")
    parser.add_argument("--from-date", default=None, help="Start date (YYYY-MM-DD). If omitted, pulls incrementally.")
    parser.add_argument("--to-date", default=datetime.now().strftime("%Y-%m-%d"), help="End date (YYYY-MM-DD)")
    parser.add_argument("--out", default="documentation/notebooklm/metrics/mixpanel_export.json", help="Export JSON path")
    parser.add_argument("--no-pull", action="store_true", help="Analyze existing export without pulling live API")
    parser.add_argument("--full-history", action="store_true", help="Force re-pulling all historical events from 2026-05-01")

    args = parser.parse_args()

    # Load existing cached events
    existing_events = []
    seen_ids = set()
    if os.path.exists(args.out):
        try:
            with open(args.out, "r") as f:
                cached_data = json.load(f)
                for e in cached_data.get("raw_events", []):
                    eid = get_event_id(e)
                    if eid not in seen_ids:
                        seen_ids.add(eid)
                        existing_events.append(e)
            print(f"Loaded {len(existing_events)} cached events from {args.out}.")
        except Exception as e:
            print(f"Warning: Could not read existing export: {e}")

    all_events = existing_events

    if not args.no_pull:
        secret = args.secret or os.getenv("MIXPANEL_API_SECRET") or os.getenv("MIXPANEL_SERVICE_ACCOUNT")
        if not secret:
            print("Error: Mixpanel API Secret or Service Account credentials required to pull live data.")
            print("Set MIXPANEL_API_SECRET in .env or pass --secret <SECRET>")
            if not existing_events:
                sys.exit(1)
            print("Proceeding with cached data analysis only...")
        else:
            auth_header = get_auth_header(secret, args.password)

            # Determine date range
            if args.full_history or not existing_events:
                from_date = args.from_date or "2026-05-01"
            elif args.from_date:
                from_date = args.from_date
            else:
                max_t = max((e.get("properties", {}).get("time", 0) for e in existing_events), default=0)
                if max_t > 0:
                    from_date = (datetime.fromtimestamp(max_t) - timedelta(days=2)).strftime("%Y-%m-%d")
                else:
                    from_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

            to_date = args.to_date
            print(f"Pulling live event data from Mixpanel ({from_date} to {to_date})...")

            live_events = export_raw_events(auth_header, from_date, to_date)
            print(f"Fetched {len(live_events)} live events from Mixpanel.")

            added_count = 0
            for e in live_events:
                eid = get_event_id(e)
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    all_events.append(e)
                    added_count += 1

            print(f"Merged {added_count} new unique events. Total event repository size: {len(all_events):,} records.")

            # Save updated dataset
            distinct_users = len(set(e.get("properties", {}).get("distinct_id") for e in all_events if e.get("properties", {}).get("distinct_id")))
            event_counts = dict(Counter(e.get("event") for e in all_events))

            output_data = {
                "export_timestamp": datetime.now().isoformat(),
                "total_events": len(all_events),
                "distinct_users_count": distinct_users,
                "event_counts": event_counts,
                "raw_events": all_events
            }

            os.makedirs(os.path.dirname(args.out), exist_ok=True)
            with open(args.out, "w") as f:
                json.dump(output_data, f, indent=2)
            print(f"Saved complete raw dataset to {args.out}")

    # Analyze user base by operating system
    analysis = analyze_user_base(all_events)
    print_user_base_report(analysis)

    # Save user breakdown report
    breakdown_json_path = os.path.join(os.path.dirname(args.out), "mixpanel_user_base_platform_breakdown.json")
    with open(breakdown_json_path, "w") as f:
        json.dump(analysis, f, indent=2)
    print(f"Saved platform breakdown to {breakdown_json_path}")

if __name__ == "__main__":
    main()
