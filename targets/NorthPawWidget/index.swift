import WidgetKit
import SwiftUI

struct SimpleEntry: TimelineEntry {
    let date: Date
    let dogName: String
    let statusText: String
    let airTempF: Int
    let roadTempF: Int
    let surfaceType: String
    let npiScore: Int
    let actionableTime: String
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
            actionableTime: "Best window until 2:15 PM"
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
        let airTempF = defaults?.integer(forKey: "airTempF") ?? 74
        let roadTempF = defaults?.integer(forKey: "roadTempF") ?? 82
        let surfaceType = defaults?.string(forKey: "surfaceType") ?? "Asphalt"
        let npiScore = defaults?.integer(forKey: "npiScore") ?? 88
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
            actionableTime: resolvedTime
        )
    }
}

extension SimpleEntry {
    var statusColor: Color {
        if roadTempF >= 105 || npiScore < 50 {
            return Color(red: 0.90, green: 0.22, blue: 0.21) // Red (Danger)
        } else if roadTempF >= 85 || npiScore < 75 {
            return Color(red: 0.95, green: 0.55, blue: 0.08) // Amber (Caution)
        } else {
            return Color(red: 0.16, green: 0.65, blue: 0.38) // Emerald Green (Safe)
        }
    }

    var statusDotIcon: String {
        if roadTempF >= 105 || npiScore < 50 {
            return "exclamationmark.circle.fill"
        } else if roadTempF >= 85 || npiScore < 75 {
            return "exclamationmark.triangle.fill"
        } else {
            return "checkmark.circle.fill"
        }
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
                    Image(systemName: "pawprint.fill")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(entry.statusColor)
                    Text("\(entry.roadTempF)°")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .minimumScaleFactor(0.7)
                }
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryInline:
            // Lock Screen Text Line
            ViewThatFits {
                Label("🐾 \(entry.statusText) • Road \(entry.roadTempF)° (\(entry.dogName))", systemImage: "pawprint.fill")
                Label("🐾 \(entry.statusText) • \(entry.roadTempF)°", systemImage: "pawprint.fill")
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryRectangular:
            // Lock Screen Rectangular Box
            ZStack(alignment: .leading) {
                AccessoryWidgetBackground()
                VStack(alignment: .leading, spacing: 2) {
                    // 1. Dominant Decision Header
                    HStack(spacing: 4) {
                        Image(systemName: entry.statusDotIcon)
                            .font(.system(size: 10, weight: .bold))
                            .widgetAccentable()
                        Text(entry.statusText)
                            .font(.system(size: 11, weight: .bold))
                            .lineLimit(1)
                    }
                    
                    // 2. Hero Road Temperature
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("Road \(entry.roadTempF)°F")
                            .font(.system(size: 16, weight: .heavy, design: .rounded))
                            .widgetAccentable()
                        Text("Air \(entry.airTempF)°")
                            .font(.system(size: 11, weight: .semibold))
                            .opacity(0.8)
                    }
                    
                    // 3. Actionable Time / Dog Name
                    Text("\(entry.actionableTime) • \(entry.dogName)")
                        .font(.system(size: 9, weight: .medium))
                        .opacity(0.75)
                        .lineLimit(1)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .systemSmall:
            // Home Screen Small Card (Centered Visual Status Ring & Road Temp)
            VStack(spacing: 8) {
                ZStack {
                    // Custom circular safety progress ring
                    Circle()
                        .stroke(entry.statusColor.opacity(0.15), lineWidth: 6)
                        .frame(width: 76, height: 76)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                        .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 76, height: 76)

                    VStack(spacing: -1) {
                        Image(systemName: "pawprint.fill")
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
                    Text(entry.statusText)
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
            HStack(spacing: 20) {
                // Left Column: Large Visual Status Ring
                ZStack {
                    Circle()
                        .stroke(entry.statusColor.opacity(0.15), lineWidth: 10)
                        .frame(width: 108, height: 108)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                        .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 108, height: 108)

                    VStack(spacing: 0) {
                        Image(systemName: entry.statusDotIcon)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(entry.statusColor)
                        Text(String(format: "%.1f", Double(entry.npiScore) / 10.0))
                            .font(.system(size: 26, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text("NPI SCORE")
                            .font(.system(size: 7, weight: .heavy))
                            .foregroundColor(.secondary)
                            .tracking(0.5)
                    }
                }
                .padding(.leading, 8)

                // Right Column: Details list
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(entry.statusText)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundColor(entry.statusColor)
                        Text("•")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.secondary)
                        Text(entry.dogName)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)
                    }

                    Spacer()

                    // Primary Telemetry
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(entry.roadTempF)°F")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text(" Pavement (\(entry.surfaceType))")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Text("Air Temp: \(entry.airTempF)°F")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)

                    Spacer()

                    // Actionable window
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 10))
                            .foregroundColor(entry.statusColor)
                        Text(entry.actionableTime)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(entry.statusColor.opacity(0.08))
                    .cornerRadius(6)
                }
                .padding(.vertical, 4)
                
                Spacer()
            }
            .padding(16)
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
