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
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            dogName: "Aoife",
            statusText: "Great to go",
            airTempF: 74,
            roadTempF: 82,
            surfaceType: "Asphalt",
            npiScore: 88
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = loadEntryFromAppGroup()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let entry = loadEntryFromAppGroup()
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntryFromAppGroup() -> SimpleEntry {
        let defaults = UserDefaults(suiteName: "group.com.northpaw.app")
        let dogName = defaults?.string(forKey: "dogName") ?? "Your Dog"
        let statusText = defaults?.string(forKey: "statusText") ?? "Safe to Walk"
        let airTempF = defaults?.integer(forKey: "airTempF") ?? 74
        let roadTempF = defaults?.integer(forKey: "roadTempF") ?? 82
        let surfaceType = defaults?.string(forKey: "surfaceType") ?? "Asphalt"
        let npiScore = defaults?.integer(forKey: "npiScore") ?? 88

        return SimpleEntry(
            date: Date(),
            dogName: dogName,
            statusText: statusText,
            airTempF: airTempF > 0 ? airTempF : 74,
            roadTempF: roadTempF > 0 ? roadTempF : 82,
            surfaceType: surfaceType,
            npiScore: npiScore > 0 ? npiScore : 88
        )
    }
}

extension Provider.Entry {
    var statusColor: Color {
        if roadTempF >= 105 || npiScore < 50 {
            return Color(red: 0.90, green: 0.22, blue: 0.21) // Red (Danger)
        } else if roadTempF >= 85 || npiScore < 75 {
            return Color(red: 0.95, green: 0.55, blue: 0.08) // Amber (Caution)
        } else {
            return Color(red: 0.16, green: 0.65, blue: 0.38) // Emerald Green (Safe / Great to go)
        }
    }
}

struct NorthPawWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            // Lock Screen Circular Widget with Hero Status Ring
            ZStack {
                AccessoryWidgetBackground()
                Circle()
                    .stroke(entry.statusColor.opacity(0.35), lineWidth: 3)
                Circle()
                    .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                    .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: -1) {
                    Image(systemName: "pawprint.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(entry.statusColor)
                    Text("\(entry.roadTempF)°")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .minimumScaleFactor(0.75)
                }
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryInline:
            // Lock Screen Text Line above Clock
            ViewThatFits {
                Label("🐾 \(entry.dogName): \(entry.statusText) (\(entry.roadTempF)° Pavement)", systemImage: "pawprint.fill")
                Label("🐾 NorthPaw: \(entry.statusText) (\(entry.roadTempF)°)", systemImage: "pawprint.fill")
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryRectangular:
            // Lock Screen Rectangular Widget (Medium Lock Screen Box)
            ZStack(alignment: .leading) {
                AccessoryWidgetBackground()
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "pawprint.fill")
                            .font(.system(size: 10, weight: .bold))
                            .widgetAccentable()
                        Text("\(entry.dogName.uppercased()) • \(entry.statusText.uppercased())")
                            .font(.system(size: 10, weight: .bold))
                            .lineLimit(1)
                    }
                    
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("Road \(entry.roadTempF)°")
                            .font(.system(size: 16, weight: .heavy, design: .rounded))
                            .widgetAccentable()
                        Text("Air \(entry.airTempF)°")
                            .font(.system(size: 12, weight: .semibold))
                            .opacity(0.85)
                    }
                    
                    Text("\(entry.surfaceType) • NPI \(entry.npiScore)/100")
                        .font(.system(size: 10, weight: .medium))
                        .opacity(0.75)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .systemSmall:
            // Home Screen Small Card
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "pawprint.fill")
                        .foregroundColor(Color(red: 0.10, green: 0.26, blue: 0.19))
                    Spacer()
                    Text("\(entry.npiScore)")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(red: 0.10, green: 0.26, blue: 0.19).opacity(0.12))
                        .cornerRadius(6)
                }

                Spacer()

                Text(entry.dogName)
                    .font(.system(size: 15, weight: .bold))

                Text(entry.statusText)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)

                HStack {
                    VStack(alignment: .leading) {
                        Text("PAVEMENT")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.secondary)
                        Text("\(entry.roadTempF)°F")
                            .font(.system(size: 16, weight: .heavy, design: .rounded))
                    }
                    Spacer()
                    VStack(alignment: .trailing) {
                        Text("AIR")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.secondary)
                        Text("\(entry.airTempF)°F")
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                    }
                }
            }
            .padding()
            .containerBackground(for: .widget) {
                Color(uiColor: .systemBackground)
            }
            .widgetURL(URL(string: "northpaw://")!)

        default:
            // Home Screen Medium Card
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "pawprint.fill")
                            .foregroundColor(Color(red: 0.10, green: 0.26, blue: 0.19))
                        Text(entry.dogName)
                            .font(.headline)
                    }

                    Text(entry.statusText)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(red: 0.10, green: 0.26, blue: 0.19))

                    Spacer()

                    Text("Updated \(entry.date.formatted(date: .omitted, time: .shortened))")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Pavement \(entry.roadTempF)°F")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                    Text("Air \(entry.airTempF)°F • \(entry.surfaceType)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 4) {
                        Text("NorthPaw Index")
                            .font(.caption2)
                        Text("\(entry.npiScore)")
                            .font(.system(size: 12, weight: .bold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(red: 0.10, green: 0.26, blue: 0.19).opacity(0.12))
                            .cornerRadius(4)
                    }
                    .padding(.top, 4)
                }
            }
            .padding()
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
        .description("Keep an eye on pavement heat and dog safety scores right from your Lock Screen.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
            .systemSmall,
            .systemMedium
        ])
    }
}
