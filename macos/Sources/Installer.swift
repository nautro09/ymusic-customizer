import AppKit
import Darwin
import Foundation

struct CustomizerError: LocalizedError {
    let errorDescription: String?
    init(_ message: String) { errorDescription = message }
}

struct MusicInstall {
    static let officialID = "ru.yandex.desktop.music"
    static let customID = "local.ymusic.customizer.music"
    static let name = "Яндекс Музыка с Customizer"
    static let release = "0.6.0-mac.1"
    static let suggestedSource = URL(fileURLWithPath: "/Applications/Яндекс Музыка.app", isDirectory: true)

    let directory: URL
    let assets: URL
    private let fm = FileManager.default

    var application: URL { directory.appendingPathComponent(Self.name + ".app", isDirectory: true) }
    var version: String? { managedVersion(application) }
    var previousVersion: String? { managedVersion(previous) }
    private var state: URL { directory.appendingPathComponent(".ymusic-customizer", isDirectory: true) }
    private var previous: URL { state.appendingPathComponent("Previous", isDirectory: true) }

    static func findSource() -> URL {
        let personal = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Applications/Яндекс Музыка.app", isDirectory: true)
        if let found = [suggestedSource, personal].first(where: { sourceVersion($0) != nil }) { return found }
        return NSWorkspace.shared.urlForApplication(withBundleIdentifier: officialID) ?? suggestedSource
    }

    static func sourceVersion(_ url: URL) -> String? {
        guard let info = try? info(at: url), info["CFBundleIdentifier"] as? String == officialID else { return nil }
        return info["CFBundleShortVersionString"] as? String
    }

    func install(from source: URL) throws -> String {
        try withLock {
            try requireClosed()
            var info = try Self.info(at: source)
            guard info["CFBundleIdentifier"] as? String == Self.officialID,
                  let hostVersion = info["CFBundleShortVersionString"] as? String else {
                throw CustomizerError("Выберите официальный файл «Яндекс Музыка.app».")
            }
            let overwrite = try existingManagedApp(at: application)
            let keepPrevious = try existingManagedApp(at: previous)

            let staging = state.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try fm.createDirectory(at: staging, withIntermediateDirectories: false, attributes: [.posixPermissions: 0o700])
            var cleanStage = true
            defer { if cleanStage { try? fm.removeItem(at: staging) } }
            let stagedApp = staging.appendingPathComponent(application.lastPathComponent, isDirectory: true)
            try fm.copyItem(at: source.resolvingSymlinksInPath(), to: stagedApp)
            try checkLinks(in: stagedApp)

            let contents = stagedApp.appendingPathComponent("Contents", isDirectory: true)
            let frameworks = contents.appendingPathComponent("Frameworks", isDirectory: true)
            let resources = contents.appendingPathComponent("Resources", isDirectory: true)
            let electronInfo = frameworks.appendingPathComponent("Electron Framework.framework/Resources/Info.plist")
            guard let electron = try Self.plist(electronInfo)["CFBundleVersion"] as? String,
                  let major = electron.split(separator: ".").first.flatMap({ Int($0) }), major >= 35 else {
                throw CustomizerError("Для этого загрузчика нужна Яндекс Музыка на Electron 35 или новее.")
            }

            let asarFile = resources.appendingPathComponent("app.asar")
            let asar = try Asar(asarFile)
            var integrity = info["ElectronAsarIntegrity"] as? [String: Any] ?? [:]
            if let expected = integrity["Resources/app.asar"] as? [String: String],
               expected["algorithm"] != "SHA256" || expected["hash"] != asar.headerHash {
                throw CustomizerError("Заголовок app.asar отличается от указанного в Info.plist.")
            }
            let packageData = try asar.read("package.json")
            guard var package = try JSONSerialization.jsonObject(with: packageData) as? [String: Any],
                  let entry = package["main"] as? String, ["./index.js", "index.js"].contains(entry),
                  package["name"] as? String == "YandexMusic" else {
                throw CustomizerError("Структура этой версии Яндекс Музыки пока не поддерживается.")
            }
            let hostMain = try asar.read("index.js")
            let hostPreload = try asar.read("preload.js")
            guard hostMain.range(of: Data("music-application".utf8)) != nil,
                  hostPreload.range(of: Data("musicDesktop".utf8)) != nil else {
                throw CustomizerError("В клиенте изменился интерфейс загрузки мода.")
            }

            package["main"] = "./ymc-bootstrap.cjs"
            let preloadTemplate = try String(contentsOf: assets.appendingPathComponent("preload.cjs"), encoding: .utf8)
            let renderer = try String(contentsOf: assets.appendingPathComponent("ymusic-customizer.js"), encoding: .utf8)
            let patchedAsar = staging.appendingPathComponent("patched.asar")
            let hash = try asar.write(to: patchedAsar, replacing: [
                ("package.json", try JSONSerialization.data(withJSONObject: package)),
                ("ymc-bootstrap.cjs", try Data(contentsOf: assets.appendingPathComponent("bootstrap.cjs"))),
                ("ymc-discord.cjs", try Data(contentsOf: assets.appendingPathComponent("discord.cjs"))),
                ("ymc-discord-activity.cjs", try Data(contentsOf: assets.appendingPathComponent("discord-activity.cjs"))),
                ("ymc-update.cjs", try Data(contentsOf: assets.appendingPathComponent("update.cjs"))),
                ("ymc-preload.cjs", Data(preloadTemplate.replacingOccurrences(of: "/* YMC_RENDERER */", with: renderer).utf8))
            ])
            try fm.removeItem(at: asarFile)
            try fm.moveItem(at: patchedAsar, to: asarFile)

            integrity["Resources/app.asar"] = ["algorithm": "SHA256", "hash": hash]
            info["ElectronAsarIntegrity"] = integrity
            info["CFBundleIdentifier"] = Self.customID
            // Electron uses CFBundleName to locate the packaged Helper executables.
            info["CFBundleDisplayName"] = Self.name
            info["LSHasLocalizedDisplayName"] = false
            info["YMusicCustomizerVersion"] = Self.release
            info.removeValue(forKey: "CFBundleURLTypes")
            let newPlist = try PropertyListSerialization.data(fromPropertyList: info, format: .xml, options: 0)
            try newPlist.write(to: contents.appendingPathComponent("Info.plist"), options: .atomic)

            try sign(app: stagedApp, frameworks: frameworks)
            try requireClosed()
            if overwrite {
                try exchange(stagedApp, application)
                do {
                    if keepPrevious { try exchange(stagedApp, previous) }
                    else { try fm.moveItem(at: stagedApp, to: previous) }
                } catch {
                    cleanStage = false
                    return "Готово · Яндекс Музыка \(hostVersion). Прежняя копия сохранена в \(stagedApp.path)."
                }
            } else {
                try fm.moveItem(at: stagedApp, to: application)
            }
            return "Готово · Яндекс Музыка \(hostVersion) · Customizer \(Self.release)"
        }
    }

    func restore() throws -> String {
        try withLock {
            try requireClosed()
            guard try existingManagedApp(at: previous) else { throw CustomizerError("Предыдущей копии пока нет.") }
            if try existingManagedApp(at: application) { try exchange(previous, application) }
            else { try fm.moveItem(at: previous, to: application) }
            return "Предыдущая версия восстановлена."
        }
    }

    func remove() throws -> String {
        try withLock {
            try requireClosed()
            if try existingManagedApp(at: application) { try fm.trashItem(at: application, resultingItemURL: nil) }
            return "Копия убрана. Профиль и темы сохранены."
        }
    }

    private func managedVersion(_ url: URL) -> String? {
        guard let info = try? Self.info(at: url), info["CFBundleIdentifier"] as? String == Self.customID,
              let release = info["YMusicCustomizerVersion"] as? String,
              let music = info["CFBundleShortVersionString"] as? String else { return nil }
        return "\(music) · Customizer \(release)"
    }

    private func existingManagedApp(at url: URL) throws -> Bool {
        if (try? url.resourceValues(forKeys: [.isSymbolicLinkKey]).isSymbolicLink) == true ||
            (try? fm.destinationOfSymbolicLink(atPath: url.path)) != nil {
            throw CustomizerError("По пути \(url.path) находится ссылка. Выберите другой путь или переместите ссылку.")
        }
        guard fm.fileExists(atPath: url.path) else { return false }
        guard managedVersion(url) != nil else {
            throw CustomizerError("По пути \(url.path) уже находится другой файл.")
        }
        return true
    }

    private func requireClosed() throws {
        let target = application.resolvingSymlinksInPath().standardizedFileURL.path
        let targetIsRunning = NSRunningApplication.runningApplications(withBundleIdentifier: Self.customID).contains {
            guard let bundle = $0.bundleURL else { return true }
            return bundle.resolvingSymlinksInPath().standardizedFileURL.path == target
        }
        guard !targetIsRunning else {
            throw CustomizerError("Закройте «\(Self.name)» через ⌘Q и повторите действие.")
        }
    }

    private func withLock<T>(_ action: () throws -> T) throws -> T {
        if (try? fm.destinationOfSymbolicLink(atPath: state.path)) != nil {
            throw CustomizerError("Папка установщика \(state.path) является ссылкой.")
        }
        try fm.createDirectory(at: state, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
        let lock = Darwin.open(state.appendingPathComponent("install.lock").path, O_CREAT | O_RDWR | O_NOFOLLOW, 0o600)
        guard lock >= 0 else { throw CustomizerError("Не удалось открыть блокировку установщика.") }
        defer { close(lock) }
        guard flock(lock, LOCK_EX | LOCK_NB) == 0 else {
            throw CustomizerError("Другой установщик уже меняет эту копию. Попробуйте ещё раз после его завершения.")
        }
        return try action()
    }

    private func checkLinks(in bundle: URL) throws {
        let keys: Set<URLResourceKey> = [.isSymbolicLinkKey]
        var listingError: Error?
        let listing = fm.enumerator(at: bundle, includingPropertiesForKeys: Array(keys), options: []) { _, error in
            listingError = error
            return false
        }
        let prefix = bundle.resolvingSymlinksInPath().path + "/"
        while let item = listing?.nextObject() as? URL {
            if try item.resourceValues(forKeys: keys).isSymbolicLink == true,
               !item.resolvingSymlinksInPath().path.hasPrefix(prefix) {
                throw CustomizerError("В приложении есть ссылка за пределы его папки: \(item.lastPathComponent).")
            }
        }
        if let listingError { throw listingError }
    }

    private func exchange(_ a: URL, _ b: URL) throws {
        guard renameatx_np(AT_FDCWD, a.path, AT_FDCWD, b.path, UInt32(RENAME_SWAP)) == 0 else {
            throw CustomizerError("Не удалось атомарно заменить копию. \(String(cString: strerror(errno)))")
        }
    }

    private func sign(app: URL, frameworks: URL) throws {
        let children = try fm.contentsOfDirectory(at: frameworks, includingPropertiesForKeys: nil)
        for framework in children where framework.pathExtension == "framework" {
            let version = framework.appendingPathComponent("Versions/Current").resolvingSymlinksInPath()
            for folder in ["Libraries", "Helpers"] {
                let nested = version.appendingPathComponent(folder, isDirectory: true)
                if fm.fileExists(atPath: nested.path) {
                    for binary in try fm.contentsOfDirectory(at: nested, includingPropertiesForKeys: [.isRegularFileKey])
                        where fm.isExecutableFile(atPath: binary.path) || binary.pathExtension == "dylib" {
                        if try binary.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true { try sign(binary) }
                    }
                }
            }
            let shipIt = version.appendingPathComponent("Resources/ShipIt")
            if fm.isExecutableFile(atPath: shipIt.path) { try sign(shipIt) }
            try sign(version)
        }
        for helper in children where helper.pathExtension == "app" { try sign(helper) }
        try sign(app)
        try codesign(["--verify", "--deep", "--strict", app.path])
    }

    private func sign(_ url: URL) throws {
        try codesign(["--force", "--sign", "-", "--timestamp=none", "--preserve-metadata=entitlements,flags", url.path])
    }

    private func codesign(_ arguments: [String]) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/codesign")
        process.arguments = arguments
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        try process.run()
        let output = pipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else {
            let details = String(decoding: output, as: UTF8.self).trimmingCharacters(in: .whitespacesAndNewlines)
            throw CustomizerError("Не удалось подписать или проверить копию.\n\(details)")
        }
    }

    private static func info(at url: URL) throws -> [String: Any] {
        try plist(url.appendingPathComponent("Contents/Info.plist"))
    }

    private static func plist(_ url: URL) throws -> [String: Any] {
        let data = try Data(contentsOf: url)
        guard let values = try PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any] else {
            throw CustomizerError("Не удалось прочитать \(url.lastPathComponent).")
        }
        return values
    }
}
