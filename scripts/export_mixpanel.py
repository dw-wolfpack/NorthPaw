#!/usr/bin/env python3
"""
Mixpanel Data Exporter & Analytics Query Tool for NorthPaw
Fetches event stats, event names, property breakdowns, and raw event logs from Mixpanel API.
"""

import os
import sys
import json
import base64
import argparse
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

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
        print(f"[Mixpanel API] Error fetching event names: {e}")
        return []

def fetch_event_counts(auth_header, event_names, from_date, to_date, unit="day"):
    """Fetches aggregate event counts for specific event names."""
    url = f"https://mixpanel.com/api/2.0/events?event={json.dumps(event_names)}&type=general&unit={unit}&from_date={from_date}&to_date={to_date}"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", auth_header)
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[Mixpanel API] Error fetching event counts: {e}")
        return {}

def export_raw_events(auth_header, from_date, to_date, limit=1000):
    """Exports raw event stream from Mixpanel Raw Data Export API."""
    url = f"https://data.mixpanel.com/api/2.0/export?from_date={from_date}&to_date={to_date}"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", auth_header)
    
    events = []
    try:
        with urllib.request.urlopen(req) as resp:
            for line in resp:
                if line.strip():
                    events.append(json.loads(line.decode("utf-8")))
                    if len(events) >= limit:
                        break
        return events
    except Exception as e:
        print(f"[Mixpanel API] Error exporting raw events: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Fetch and export Mixpanel metrics for NorthPaw.")
    parser.add_argument("--secret", help="Mixpanel API Secret or Service Account Username")
    parser.add_argument("--password", default="", help="Service Account Secret / Password (if using Service Account)")
    parser.add_argument("--from-date", default=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
    parser.add_argument("--to-date", default=datetime.now().strftime("%Y-%m-%d"))
    parser.add_argument("--out", default="documentation/notebooklm/metrics/mixpanel_export.json")
    
    args = parser.parse_args()
    
    secret = args.secret or os.getenv("MIXPANEL_API_SECRET") or os.getenv("MIXPANEL_SERVICE_ACCOUNT")
    if not secret:
        print("Error: Mixpanel API Secret or Service Account credentials required.")
        print("Usage: python3 scripts/export_mixpanel.py --secret <YOUR_API_SECRET_OR_SERVICE_ACCOUNT_USERNAME> [--password <SECRET>]")
        sys.exit(1)
        
    auth_header = get_auth_header(secret, args.password)
    
    print(f"Connecting to Mixpanel Query API ({args.from_date} to {args.to_date})...")
    
    events_names = fetch_event_names(auth_header)
    print(f"Found {len(events_names)} tracked event types.")
    
    raw_events = export_raw_events(auth_header, args.from_date, args.to_date)
    print(f"Exported {len(raw_events)} raw event records.")
    
    output_data = {
        "export_date": datetime.now().isoformat(),
        "from_date": args.from_date,
        "to_date": args.to_date,
        "event_types": events_names,
        "total_raw_events": len(raw_events),
        "raw_events_sample": raw_events[:200]
    }
    
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Successfully saved Mixpanel analytics report to {args.out}")

if __name__ == "__main__":
    main()
