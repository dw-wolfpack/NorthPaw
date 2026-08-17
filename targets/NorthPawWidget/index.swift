import WidgetKit
import SwiftUI
import AppIntents

@available(iOS 17.0, *)
struct ToggleOutingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Outing"
    static var description = IntentDescription("Starts or cancels an active outing from the lock/home screen widget.")

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.com.northpaw.app")
        let current = (defaults?.string(forKey: "isOutingActive") ?? "false") == "true"
        defaults?.setValue(!current ? "true" : "false", forKey: "isOutingActive")
        
        // If we are stopping an active walk, schedule a review notification in 5 minutes (300 seconds)
        // and set needsPostWalkReview flag so the app prompts the user when next opened.
        if current {
            defaults?.setValue("true", forKey: "needsPostWalkReview")
            let dogName = defaults?.string(forKey: "dogName") ?? "your dog"
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
                guard granted else { return }
                
                let content = UNMutableNotificationContent()
                content.title = "How did \(dogName) handle the walk?"
                content.body = "Tap to record a 1-tap private check-in."
                content.sound = .default
                content.userInfo = ["type": "post_walk_checkin"]
                
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 300, repeats: false)
                let request = UNNotificationRequest(identifier: "widget_post_walk_review", content: content, trigger: trigger)
                
                center.add(request)
            }
        }
        
        // Notify WidgetKit to refresh timelines immediately
        WidgetCenter.shared.reloadAllTimelines()
        
        return .result()
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let dogName: String
    let statusText: String
    let airTempF: Int
    let roadTempF: Int
    let surfaceType: String
    let npiScore: Int
    let actionableTime: String
    let isOutingActive: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            dogName: "Aoife",
            statusText: "SAFE TO WALK",
            airTempF: 74,
            roadTempF: 82,
            surfaceType: "Asphalt",
            npiScore: 88,
            actionableTime: "Best window until 2:15 PM",
            isOutingActive: false
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = loadEntryFromAppGroup()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let entry = loadEntryFromAppGroup()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntryFromAppGroup() -> SimpleEntry {
        let defaults = UserDefaults(suiteName: "group.com.northpaw.app")
        let dogName = defaults?.string(forKey: "dogName") ?? "Your pup"
        let rawStatusText = defaults?.string(forKey: "statusText") ?? "Safe to Walk"
        
        // React Native SharedGroupPreferences writes all values as Strings.
        let airTempStr = defaults?.string(forKey: "airTempF") ?? ""
        let roadTempStr = defaults?.string(forKey: "roadTempF") ?? ""
        let npiScoreStr = defaults?.string(forKey: "npiScore") ?? ""
        let isOutingActive = (defaults?.string(forKey: "isOutingActive") ?? "false") == "true"
        
        let airTempF = Int(airTempStr) ?? defaults?.integer(forKey: "airTempF") ?? 74
        let roadTempF = Int(roadTempStr) ?? defaults?.integer(forKey: "roadTempF") ?? 82
        let npiScore = Int(npiScoreStr) ?? defaults?.integer(forKey: "npiScore") ?? 88
        
        let surfaceType = defaults?.string(forKey: "surfaceType") ?? "Asphalt"
        let actionableTime = defaults?.string(forKey: "actionableTime") ?? "Next update ~15m"
        
        var resolvedTime = actionableTime
        let currentHour = Calendar.current.component(.hour, from: Date())
        if currentHour >= 11 && currentHour <= 16 {
            if rawStatusText.uppercased().contains("DANGER") || rawStatusText.uppercased().contains("CAUTION") {
                resolvedTime = "☀️ Peak solar window"
            }
        }

        return SimpleEntry(
            date: Date(),
            dogName: dogName,
            statusText: rawStatusText.uppercased(),
            airTempF: airTempF > 0 ? airTempF : 74,
            roadTempF: roadTempF > 0 ? roadTempF : 82,
            surfaceType: surfaceType,
            npiScore: npiScore > 0 ? npiScore : 88,
            actionableTime: resolvedTime,
            isOutingActive: isOutingActive
        )
    }
}

extension SimpleEntry {
    var statusColor: Color {
        if isOutingActive {
            return Color(red: 0.16, green: 0.50, blue: 0.72) // Active Outing Blue
        }
        if roadTempF >= 105 || npiScore > 66 {
            return Color(red: 0.90, green: 0.22, blue: 0.21) // Red (Danger)
        } else if roadTempF >= 85 || npiScore > 33 {
            return Color(red: 0.95, green: 0.55, blue: 0.08) // Amber (Caution)
        } else {
            return Color(red: 0.16, green: 0.65, blue: 0.38) // Emerald Green (Safe)
        }
    }

    var statusDotIcon: String {
        if isOutingActive {
            return "figure.walk"
        }
        if roadTempF >= 105 || npiScore > 66 {
            return "exclamationmark.circle.fill"
        } else if roadTempF >= 85 || npiScore > 33 {
            return "exclamationmark.triangle.fill"
        } else {
            return "checkmark.circle.fill"
        }
    }

    // Dynamic countdown window string based on safety calculations
    var countdownLabel: String {
        if isOutingActive {
            return "🐾 Outing Active"
        }
        if roadTempF >= 105 || npiScore > 66 {
            return "⚠️ Next safe: 6:30 PM"
        } else if roadTempF >= 85 || npiScore > 33 {
            return "☀️ Safe until 11:30 AM"
        } else {
            return "✅ Safe to walk now"
        }
    }
}

struct PavementTempGauge: View {
    var tempF: Int
    
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Multi-colored track background representation
                LinearGradient(
                    colors: [.green, .yellow, .orange, .red],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(height: 5)
                .cornerRadius(2.5)
                .opacity(0.85)
                
                // Sliding indicator marker
                let minTemp = 60.0
                let maxTemp = 130.0
                let percent = min(max(Double(tempF) - minTemp, 0) / (maxTemp - minTemp), 1.0)
                
                Circle()
                    .fill(Color.white)
                    .frame(width: 8, height: 8)
                    .shadow(radius: 0.5)
                    .offset(x: CGFloat(percent) * (geo.size.width - 8))
            }
        }
        .frame(height: 8)
    }
}

struct NorthPawWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            // Lock Screen Circular Complication (82° Hero Number + Ring)
            ZStack {
                AccessoryWidgetBackground()
                Circle()
                    .stroke(entry.statusColor.opacity(0.35), lineWidth: 3.5)
                Circle()
                    .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                    .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: -2) {
                    Image(systemName: entry.statusDotIcon)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(entry.statusColor)
                    Text("\(entry.roadTempF)°")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .minimumScaleFactor(0.7)
                }
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryInline:
            // Lock Screen Text Line
            ViewThatFits {
                Label("🐾 \(entry.isOutingActive ? "Exploring Now" : entry.statusText) • Road \(entry.roadTempF)° (\(entry.dogName))", systemImage: "pawprint.fill")
                Label("🐾 \(entry.statusText) • \(entry.roadTempF)°", systemImage: "pawprint.fill")
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryRectangular:
            // Lock Screen Rectangular Box
            ZStack(alignment: .leading) {
                AccessoryWidgetBackground()
                HStack(spacing: 4) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: entry.statusDotIcon)
                                .font(.system(size: 10, weight: .bold))
                                .widgetAccentable()
                            Text(entry.isOutingActive ? "EXPLORING" : entry.statusText)
                                .font(.system(size: 11, weight: .bold))
                                .lineLimit(1)
                        }
                        
                        Text("Road \(entry.roadTempF)°F")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .widgetAccentable()
                        
                        Text(entry.countdownLabel)
                            .font(.system(size: 8, weight: .medium))
                            .opacity(0.8)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    if #available(iOS 17.0, *) {
                        if entry.isOutingActive {
                            Button(intent: ToggleOutingIntent()) {
                                Image(systemName: "stop.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(entry.statusColor)
                            }
                            .buttonStyle(.plain)
                        } else {
                            Button(intent: ToggleOutingIntent()) {
                                Image(systemName: "play.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(entry.statusColor)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 4)
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .systemSmall:
            // Home Screen Small Card (Centered Visual Status Ring & Road Temp)
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .stroke(entry.statusColor.opacity(0.15), lineWidth: 6)
                        .frame(width: 76, height: 76)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                        .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 76, height: 76)

                    VStack(spacing: -1) {
                        Image(systemName: entry.statusDotIcon)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(entry.statusColor)
                        Text("\(entry.roadTempF)°")
                            .font(.system(size: 18, weight: .heavy, design: .rounded))
                            .foregroundColor(.primary)
                        Text(entry.surfaceType.uppercased())
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.secondary)
                            .tracking(0.5)
                    }
                }
                
                VStack(spacing: 1) {
                    Text(entry.isOutingActive ? "EXPLORING" : entry.statusText)
                        .font(.system(size: 11, weight: .black))
                        .foregroundColor(entry.statusColor)
                        .lineLimit(1)
                    Text(entry.dogName)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            .padding(12)
            .containerBackground(for: .widget) {
                Color(uiColor: .systemBackground)
            }
            .widgetURL(URL(string: "northpaw://")!)

        default:
            // Home Screen Medium Card (Split 2-Column: Ring + Details)
            HStack(spacing: 16) {
                // Left Column: Large Visual Status Ring
                ZStack {
                    Circle()
                        .stroke(entry.statusColor.opacity(0.15), lineWidth: 10)
                        .frame(width: 100, height: 100)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                        .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 100, height: 100)

                    VStack(spacing: 0) {
                        Image(systemName: entry.statusDotIcon)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(entry.statusColor)
                        Text(String(format: "%.1f", Double(entry.npiScore) / 10.0))
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text("NPI SCORE")
                            .font(.system(size: 7, weight: .heavy))
                            .foregroundColor(.secondary)
                            .tracking(0.5)
                    }
                }
                .padding(.leading, 4)

                // Right Column: Details list
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(entry.isOutingActive ? "EXPLORING" : entry.statusText)
                            .font(.system(size: 13, weight: .black))
                            .foregroundColor(entry.statusColor)
                        Text("•")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.secondary)
                        Text(entry.dogName)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        // Interactive Toggle/Start Button
                        if #available(iOS 17.0, *) {
                            if entry.isOutingActive {
                                Button(intent: ToggleOutingIntent()) {
                                    HStack(spacing: 3) {
                                        Image(systemName: "stop.fill")
                                            .font(.system(size: 8, weight: .bold))
                                        Text("End Walk")
                                            .font(.system(size: 8, weight: .black))
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red.opacity(0.15))
                                    .foregroundColor(Color.red)
                                    .cornerRadius(6)
                                }
                                .buttonStyle(.plain)
                            } else {
                                Button(intent: ToggleOutingIntent()) {
                                    HStack(spacing: 3) {
                                        Image(systemName: "play.fill")
                                            .font(.system(size: 8, weight: .bold))
                                        Text("Explore")
                                            .font(.system(size: 8, weight: .black))
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(entry.statusColor.opacity(0.15))
                                    .foregroundColor(entry.statusColor)
                                    .cornerRadius(6)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    // Pavement Temp Gauge (Option 1)
                    PavementTempGauge(tempF: entry.roadTempF)
                        .padding(.vertical, 2)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(entry.roadTempF)°F")
                            .font(.system(size: 20, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text(" Pavement (\(entry.surfaceType))")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                    
                    Text("Air Temp: \(entry.airTempF)°F")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.secondary)

                    // Actionable countdown window (Option 2)
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 8))
                            .foregroundColor(entry.statusColor)
                        Text(entry.countdownLabel)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(entry.statusColor.opacity(0.08))
                    .cornerRadius(4)
                }
                .padding(.vertical, 4)
            }
            .padding(14)
            .containerBackground(for: .widget) {
                Color(uiColor: .systemBackground)
            }
            .widgetURL(URL(string: "northpaw://")!)
        }
    }
}

@main
struct NorthPawWidget: Widget {
    let kind: String = "NorthPawWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            NorthPawWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("NorthPaw Paw-Safety")
        .description("Instant walk decisions and pavement temperature alerts right from your Home or Lock Screen.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
            .systemSmall,
            .systemMedium
        ])
    }
}
