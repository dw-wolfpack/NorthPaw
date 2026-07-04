import urllib.request
import json
import time

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

subreddits = ['puppy101', 'dogs', 'Frenchbulldogs']
keywords = ['heat', 'pavement', 'hot', 'walk', 'summer', 'pads']

results = []
for sub in subreddits:
    url = f"https://www.reddit.com/r/{sub}/new.json?limit=50"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            posts = data.get('data', {}).get('children', [])
            for post in posts:
                post_data = post.get('data', {})
                title = post_data.get('title', '')
                permalink = post_data.get('permalink', '')
                created_utc = post_data.get('created_utc', 0)
                
                # Check if any keyword is in the title (case-insensitive)
                title_lower = title.lower()
                if any(kw in title_lower for kw in keywords):
                    age_hours = (time.time() - created_utc) / 3600
                    if age_hours < 72: # within last 3 days
                        results.append({
                            'subreddit': sub,
                            'title': title,
                            'url': f"https://www.reddit.com{permalink}",
                            'age_hours': age_hours
                        })
    except Exception as e:
        print(f"Error fetching r/{sub}: {e}")

print(json.dumps(results, indent=2))
