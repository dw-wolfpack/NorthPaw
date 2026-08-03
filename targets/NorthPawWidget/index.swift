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
            statusText: "USE CAUTION",
            airTempF: 74,
            roadTempF: 89,
            surfaceType: "Asphalt",
            npiScore: 72,
            actionableTime: "Cooler by 8:00 PM"
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
        let rawStatusText = defaults?.string(forKey: "statusText") ?? "Use Caution"

        let airTempRaw = defaults?.object(forKey: "airTempF")
        let airTempF = (airTempRaw as? Int) ?? (airTempRaw as? NSNumber)?.intValue ?? Int(defaults?.string(forKey: "airTempF") ?? "") ?? 74

        let roadTempRaw = defaults?.object(forKey: "roadTempF")
        let roadTempF = (roadTempRaw as? Int) ?? (roadTempRaw as? NSNumber)?.intValue ?? Int(defaults?.string(forKey: "roadTempF") ?? "") ?? 89

        let surfaceType = defaults?.string(forKey: "surfaceType") ?? "Asphalt"

        let npiRaw = defaults?.object(forKey: "npiScore")
        let npiScore = (npiRaw as? Int) ?? (npiRaw as? NSNumber)?.intValue ?? Int(defaults?.string(forKey: "npiScore") ?? "") ?? 72

        let actionableTime = defaults?.string(forKey: "actionableTime") ?? "Next update ~15m"

        return SimpleEntry(
            date: Date(),
            dogName: dogName,
            statusText: rawStatusText,
            airTempF: airTempF,
            roadTempF: roadTempF,
            surfaceType: surfaceType,
            npiScore: npiScore,
            actionableTime: actionableTime
        )
    }
}

extension SimpleEntry {
    var statusColor: Color {
        if roadTempF >= 105 || npiScore < 50 {
            return Color(red: 0.90, green: 0.22, blue: 0.21) // Red (Danger / Wait)
        } else if roadTempF >= 85 || npiScore < 75 {
            return Color(red: 0.95, green: 0.55, blue: 0.08) // Amber (Caution)
        } else {
            return Color(red: 0.16, green: 0.65, blue: 0.38) // Emerald Green (Safe)
        }
    }

    var statusDotIcon: String {
        if roadTempF >= 105 || npiScore < 50 {
            return "xmark.circle.fill"
        } else if roadTempF >= 85 || npiScore < 75 {
            return "exclamationmark.triangle.fill"
        } else {
            return "checkmark.circle.fill"
        }
    }

    var conciseDecisionHeader: String {
        let upper = statusText.uppercased()
        if upper.contains("DANGER") || upper.contains("WAIT") || roadTempF >= 105 || npiScore < 50 {
            return "WAIT · HOT ROAD"
        } else if upper.contains("CAUTION") || upper.contains("HEAT") || roadTempF >= 85 || npiScore < 75 {
            return "USE CAUTION"
        } else {
            return "SAFE TO WALK"
        }
    }
}

struct NorthPawWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            // Circular Complication: Instant Personalized Status (Symbol + NPI Hero + Risk Ring)
            ZStack {
                AccessoryWidgetBackground()
                Circle()
                    .stroke(entry.statusColor.opacity(0.25), lineWidth: 3.5)
                Circle()
                    .trim(from: 0, to: CGFloat(min(max(entry.npiScore, 0), 100)) / 100.0)
                    .stroke(entry.statusColor, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: -1) {
                    Image(systemName: entry.statusDotIcon)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(entry.statusColor)
                    Text("\(entry.npiScore)")
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .minimumScaleFactor(0.7)
                    Text("NPI")
                        .font(.system(size: 7, weight: .bold))
                        .opacity(0.65)
                }
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryInline:
            // Lock Screen Text Line
            ViewThatFits {
                Label("\(entry.conciseDecisionHeader) • Road \(entry.roadTempF)° (\(entry.dogName))", systemImage: entry.statusDotIcon)
                Label("\(entry.conciseDecisionHeader) • Road \(entry.roadTempF)°", systemImage: entry.statusDotIcon)
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .accessoryRectangular:
            // Lock Screen Rectangular Box (Unmistakable Decision + Road/Air Temp + Actionable Next Step)
            ZStack(alignment: .leading) {
                AccessoryWidgetBackground()
                VStack(alignment: .leading, spacing: 2) {
                    // 1. Dominant Unmistakable Decision Header
                    HStack(spacing: 4) {
                        Image(systemName: entry.statusDotIcon)
                            .font(.system(size: 10, weight: .bold))
                            .widgetAccentable()
                        Text(entry.conciseDecisionHeader)
                            .font(.system(size: 11, weight: .black))
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                    }
                    
                    // 2. Differentiated Road and Air Temperatures
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("Road \(entry.roadTempF)°F")
                            .font(.system(size: 15, weight: .black, design: .rounded))
                            .widgetAccentable()
                        Text("Air \(entry.airTempF)°")
                            .font(.system(size: 11, weight: .semibold))
                            .opacity(0.8)
                    }
                    
                    // 3. Next Action / Personalization
                    Text("\(entry.actionableTime) • \(entry.dogName)")
                        .font(.system(size: 9, weight: .medium))
                        .opacity(0.75)
                        .lineLimit(1)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(URL(string: "northpaw://")!)

        case .systemSmall:
            // Home Screen Small Card (Decision + Hero Number)
            VStack(alignment: .leading, spacing: 4) {
                // 1. Dominant Status Decision
                HStack(spacing: 4) {
                    Circle()
                        .fill(entry.statusColor)
                        .frame(width: 8, height: 8)
                    Text(entry.conciseDecisionHeader)
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(entry.statusColor)
                        .lineLimit(1)
                }
                
                Text(entry.dogName)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)

                Spacer()

                // 2. Hero Pavement Number
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(entry.roadTempF)°F")
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .foregroundColor(.primary)
                    Text("PAVEMENT (\(entry.surfaceType.uppercased()))")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.secondary)
                        .tracking(0.5)
                }

                Spacer()

                // 3. Actionable Context
                HStack {
                    Text(entry.actionableTime)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                    Text("NPI \(entry.npiScore)")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(entry.statusColor.opacity(0.15))
                        .foregroundColor(entry.statusColor)
                        .cornerRadius(4)
                }
            }
            .padding(14)
            .containerBackground(for: .widget) {
                Color(uiColor: .systemBackground)
            }
            .widgetURL(URL(string: "northpaw://")!)

        default:
            // Home Screen Medium Card (Full App Distilled into a Glance)
            HStack(spacing: 16) {
                // Left Column: Decision Dominance + Actionable Time
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(entry.statusColor)
                            .frame(width: 10, height: 10)
                        Text(entry.conciseDecisionHeader)
                            .font(.system(size: 15, weight: .black))
                            .foregroundColor(entry.statusColor)
                            .lineLimit(1)
                    }

                    Text(entry.dogName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.secondary)

                    Spacer()

                    // Actionable Time Banner
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 10))
                            .foregroundColor(entry.statusColor)
                        Text(entry.actionableTime)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.primary.opacity(0.04))
                    .cornerRadius(6)
                }

                Spacer()

                // Right Column: Hero Pavement Number + Air & Index
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(entry.roadTempF)°F")
                        .font(.system(size: 38, weight: .black, design: .rounded))
                        .foregroundColor(.primary)

                    Text("PAVEMENT")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.secondary)
                        .tracking(1)

                    Spacer()

                    Text("Air \(entry.airTempF)°F • \(entry.surfaceType)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)

                    HStack(spacing: 4) {
                        Text("NorthPaw Index")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                        Text("\(entry.npiScore)")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(entry.statusColor.opacity(0.15))
                            .foregroundColor(entry.statusColor)
                            .cornerRadius(4)
                    }
                    .padding(.top, 2)
                }
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
