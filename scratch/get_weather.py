import urllib.request
import json
from datetime import datetime
import math

cities = {
    "Austin": {"lat": 30.2672, "lon": -97.7431},
    "Phoenix": {"lat": 33.4484, "lon": -112.0740},
    "Los Angeles": {"lat": 34.0522, "lon": -118.2437},
    "Atlanta": {"lat": 33.7490, "lon": -84.3880},
    "Miami": {"lat": 25.7617, "lon": -80.1918},
    "Dallas": {"lat": 32.7767, "lon": -96.7970},
    "Houston": {"lat": 29.7604, "lon": -95.3698},
    "Denver": {"lat": 39.7392, "lon": -104.9903},
    "Seattle": {"lat": 47.6062, "lon": -122.3321},
    "Chicago": {"lat": 41.8781, "lon": -87.6298},
    "San Diego": {"lat": 32.7157, "lon": -117.1611},
    "Charlotte": {"lat": 35.2271, "lon": -80.8431},
    "Tampa": {"lat": 27.9506, "lon": -82.4572},
    "Orlando": {"lat": 28.5383, "lon": -81.3792},
    "Portland": {"lat": 45.5152, "lon": -122.6784},
    "Las Vegas": {"lat": 36.1716, "lon": -115.1398},
    "Sacramento": {"lat": 38.5816, "lon": -121.4944},
    "San Antonio": {"lat": 29.4241, "lon": -98.4936},
    "Jacksonville": {"lat": 30.3322, "lon": -81.6557},
    "Nashville": {"lat": 36.1627, "lon": -86.7816}
}

def to_radians(deg):
    return (deg * math.pi) / 180

def day_of_year(dt):
    return dt.timetuple().tm_yday

def solar_intensity_from(local_date, latitude_deg, hour, sky_cover):
    doy = day_of_year(local_date)
    declination = 23.45 * math.sin(((2 * math.pi) / 365) * (doy - 81))
    hour_angle = 15 * (hour - 12)
    sin_elevation = (
        math.sin(to_radians(latitude_deg)) * math.sin(to_radians(declination)) +
        math.cos(to_radians(latitude_deg)) *
        math.cos(to_radians(declination)) *
        math.cos(to_radians(hour_angle))
    )
    clamped_sin = max(-1.0, min(1.0, sin_elevation))
    elevation_deg = max(0.0, (math.asin(clamped_sin) * 180.0) / math.pi)
    clear_sky_uv = 10.0 * math.sin(to_radians(elevation_deg))
    normalized_sky_cover = 30.0 if sky_cover is None else max(0.0, min(100.0, float(sky_cover)))
    cloud_factor = 1.0 - (normalized_sky_cover / 100.0) * 0.85
    return max(0.0, min(10.0, clear_sky_uv * cloud_factor))

def estimate_road_temp_f(air_temp_f, wind_speed_mph, latitude, hour, local_date, sky_cover, surface_type='asphalt'):
    solar_intensity = solar_intensity_from(local_date, latitude, hour, sky_cover)
    surface_multiplier = 1.0
    if surface_type == 'concrete':
        surface_multiplier = 0.72
    elif surface_type == 'cobblestone':
        surface_multiplier = 0.85
    elif surface_type == 'sand':
        surface_multiplier = 1.15
    elif surface_type == 'turf':
        surface_multiplier = 1.38
        
    ambient_scale = max(0.4, min(1.0, ((air_temp_f - 40.0) / 45.0) * 0.6 + 0.4))
    solar_heating = solar_intensity * 5.1 * ambient_scale * surface_multiplier
    wind_cooling = wind_speed_mph * 0.75
    return air_temp_f + solar_heating - wind_cooling

today = datetime.now()
results = []

print(f"Fetching weather for today: {today.strftime('%Y-%m-%d')}")

for city_name, coords in cities.items():
    lat = coords["lat"]
    lon = coords["lon"]
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,wind_speed_10m,cloud_cover,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            temps = hourly.get("temperature_2m", [])
            winds = hourly.get("wind_speed_10m", [])
            clouds = hourly.get("cloud_cover", [])
            humidities = hourly.get("relative_humidity_2m", [])
            
            # Find peak temp hour (typically around 14:00 local time)
            peak_temp = -999
            peak_idx = -1
            for idx, temp in enumerate(temps):
                # Only check for today
                t_str = times[idx]
                dt = datetime.strptime(t_str, "%Y-%m-%dT%H:%M")
                if dt.date() == today.date():
                    if temp > peak_temp:
                        peak_temp = temp
                        peak_idx = idx
            
            if peak_idx != -1:
                t_str = times[peak_idx]
                dt = datetime.strptime(t_str, "%Y-%m-%dT%H:%M")
                hour = dt.hour
                wind = winds[peak_idx]
                cloud = clouds[peak_idx]
                humidity = humidities[peak_idx]
                
                # Compute road temp
                road_temp = estimate_road_temp_f(peak_temp, wind, lat, hour, today, cloud)
                results.append({
                    "city": city_name,
                    "air_temp": peak_temp,
                    "road_temp": road_temp,
                    "wind": wind,
                    "cloud": cloud,
                    "humidity": humidity,
                    "hour": hour
                })
            else:
                print(f"Could not find today's data for {city_name}")
    except Exception as e:
        print(f"Error fetching {city_name}: {e}")

# Sort by temp descending
results.sort(key=lambda x: x["air_temp"], reverse=True)
print(json.dumps(results, indent=2))
