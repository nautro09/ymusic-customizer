import AppKit
import Foundation
import UniformTypeIdentifiers

final class InstallerWindow: NSObject, NSApplicationDelegate, NSWindowDelegate {
    private let install: MusicInstall
    private var source = MusicInstall.findSource()
    private var busy = false
    private var window: NSWindow!
    private let sourceText = NSTextField(wrappingLabelWithString: "")
    private let statusText = NSTextField(wrappingLabelWithString: "")
    private let detailText = NSTextField(wrappingLabelWithString: "")
    private let spinner = NSProgressIndicator()
    private lazy var selectButton = NSButton(title: "Выбрать…", target: self, action: #selector(choose))
    private lazy var installButton = NSButton(title: "Установить", target: self, action: #selector(setup))
    private lazy var launchButton = NSButton(title: "Открыть Музыку", target: self, action: #selector(launch))
    private lazy var removeButton = NSButton(title: "Удалить копию…", target: self, action: #selector(remove))
    private lazy var restoreButton = NSButton(title: "Вернуть предыдущую", target: self, action: #selector(restore))

    init(install: MusicInstall) {
        self.install = install
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let mainMenu = NSMenu()
        let item = NSMenuItem()
        item.submenu = NSMenu(title: "YMusic Customizer")
        item.submenu?.addItem(withTitle: "Завершить YMusic Customizer", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        mainMenu.addItem(item)
        NSApp.mainMenu = mainMenu

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 560, height: 400),
                          styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
        window.title = "YMusic Customizer"
        window.delegate = self
        window.center()

        let title = NSTextField(labelWithString: "YMusic Customizer")
        title.font = .systemFont(ofSize: 28, weight: .bold)
        let subtitle = NSTextField(wrappingLabelWithString: "Темы и настройки плеера для Яндекс Музыки на macOS.")
        subtitle.font = .systemFont(ofSize: 14)
        subtitle.textColor = .secondaryLabelColor
        let tips = NSTextField(wrappingLabelWithString: "В копии понадобится отдельный вход в Яндекс. Редактор открывается кнопкой Customizer над профилем или сочетанием ⌘⇧Y.")
        tips.textColor = .secondaryLabelColor
        tips.font = .systemFont(ofSize: 12)

        sourceText.font = .systemFont(ofSize: 13)
        statusText.font = .systemFont(ofSize: 13, weight: .semibold)
        detailText.font = .systemFont(ofSize: 12)
        detailText.textColor = .secondaryLabelColor
        detailText.isSelectable = true
        spinner.style = .spinning
        spinner.controlSize = .small
        spinner.isDisplayedWhenStopped = false
        spinner.widthAnchor.constraint(equalToConstant: 16).isActive = true
        spinner.heightAnchor.constraint(equalToConstant: 16).isActive = true

        let selection = NSStackView(views: [sourceText, selectButton])
        selection.spacing = 12
        sourceText.setContentHuggingPriority(.defaultLow, for: .horizontal)
        selectButton.setContentCompressionResistancePriority(.required, for: .horizontal)
        let tools = NSStackView(views: [restoreButton, removeButton, NSView(), installButton, launchButton])
        tools.spacing = 8
        let progress = NSStackView(views: [spinner, detailText])
        progress.alignment = .top
        progress.spacing = 8

        let stack = NSStackView(views: [title, subtitle, selection, statusText, tools, progress, tips])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 10
        stack.setCustomSpacing(24, after: subtitle)
        stack.setCustomSpacing(18, after: selection)
        stack.setCustomSpacing(17, after: tools)
        stack.setCustomSpacing(19, after: progress)
        stack.translatesAutoresizingMaskIntoConstraints = false
        let content = window.contentView!
        content.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -24),
            stack.topAnchor.constraint(equalTo: content.topAnchor, constant: 26),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: content.bottomAnchor, constant: -20),
            selection.widthAnchor.constraint(equalTo: stack.widthAnchor),
            tools.widthAnchor.constraint(equalTo: stack.widthAnchor),
            progress.widthAnchor.constraint(equalTo: stack.widthAnchor),
            tips.widthAnchor.constraint(equalTo: stack.widthAnchor)
        ])

        refresh()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        busy ? .terminateCancel : .terminateNow
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool { !busy }

    private func refresh() {
        let installed = install.version
        let host = MusicInstall.sourceVersion(source)
        sourceText.stringValue = host.map { "Источник · Яндекс Музыка \($0)\n\(source.path)" }
            ?? "Найдите установленное приложение «Яндекс Музыка» через «Выбрать…»."
        statusText.stringValue = installed.map { "Установлено · \($0)" } ?? "Копия с Customizer пока не установлена"
        selectButton.isEnabled = !busy
        installButton.isEnabled = !busy && host != nil
        installButton.title = installed == nil ? "Установить" : "Обновить"
        launchButton.isEnabled = !busy && installed != nil
        removeButton.isEnabled = !busy && installed != nil
        restoreButton.isEnabled = !busy && install.previousVersion != nil
        installButton.keyEquivalent = installed == nil ? "\r" : ""
        launchButton.keyEquivalent = installed == nil ? "" : "\r"
        if busy { spinner.startAnimation(nil) } else { spinner.stopAnimation(nil) }
    }

    @objc private func choose() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.applicationBundle]
        panel.directoryURL = source.deletingLastPathComponent()
        panel.prompt = "Выбрать"
        panel.beginSheetModal(for: window) { result in
            guard result == .OK, let url = panel.url else { return }
            guard MusicInstall.sourceVersion(url) != nil else {
                self.showError(CustomizerError("Выберите официальный файл «Яндекс Музыка.app»."))
                return
            }
            self.source = url
            self.detailText.stringValue = ""
            self.refresh()
        }
    }

    @objc private func setup() {
        let source = self.source
        let install = self.install
        perform("Копирую Яндекс Музыку и подписываю приложение…") { try install.install(from: source) }
    }

    @objc private func restore() {
        let install = self.install
        perform("Восстанавливаю предыдущую копию…") { try install.restore() }
    }

    @objc private func remove() {
        let alert = NSAlert()
        alert.messageText = "Переместить копию в Корзину?"
        alert.informativeText = "Профиль и темы сохранятся."
        alert.addButton(withTitle: "Переместить в Корзину")
        alert.addButton(withTitle: "Отмена")
        let install = self.install
        alert.beginSheetModal(for: window) { response in
            if response == .alertFirstButtonReturn {
                self.perform("Перемещаю копию в Корзину…") { try install.remove() }
            }
        }
    }

    @objc private func launch() {
        NSWorkspace.shared.openApplication(at: install.application, configuration: NSWorkspace.OpenConfiguration()) { _, error in
            if let error { DispatchQueue.main.async { self.showError(error) } }
        }
    }

    private func perform(_ progress: String, action: @escaping () throws -> String) {
        busy = true
        detailText.stringValue = progress
        refresh()
        DispatchQueue.global(qos: .userInitiated).async {
            let result = Result(catching: action)
            DispatchQueue.main.async {
                self.busy = false
                self.refresh()
                switch result {
                case .success(let message): self.detailText.stringValue = message
                case .failure(let error):
                    self.detailText.stringValue = "Действие прервано."
                    self.showError(error)
                }
            }
        }
    }

    private func showError(_ error: Error) {
        let alert = NSAlert()
        alert.alertStyle = .warning
        alert.messageText = "Не удалось выполнить действие"
        alert.informativeText = error.localizedDescription
        alert.beginSheetModal(for: window)
    }
}

let defaultDirectory = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Applications", isDirectory: true)
let assets = Bundle.main.resourceURL!
let arguments = Array(CommandLine.arguments.dropFirst()).filter { !$0.hasPrefix("-psn_") }
if let operation = arguments.first {
    do {
        let sourceArgument = operation == "--install" ? arguments.dropFirst().first : nil
        let directoryArgument = arguments.dropFirst(operation == "--install" ? 2 : 1).first
        let install = MusicInstall(directory: directoryArgument.map { URL(fileURLWithPath: $0, isDirectory: true) } ?? defaultDirectory,
                                   assets: assets)
        switch operation {
        case "--check-online-update", "--online-update":
            guard arguments.count == 2 else { throw CustomizerError("Укажите установленную копию Customizer.") }
            let bundle = URL(fileURLWithPath: arguments[1], isDirectory: true).standardizedFileURL
            let update = MusicInstall(directory: bundle.deletingLastPathComponent(), assets: assets)
            let source = MusicInstall.findSource()
            guard bundle.path == update.application.path, update.version != nil,
                  let installed = Bundle(url: bundle)?.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
                  MusicInstall.sourceVersion(source) == installed else {
                throw CustomizerError("Официальный клиент и копия Customizer должны быть одной версии Яндекс Музыки. Используйте установщик для перехода на новую версию клиента.")
            }
            if operation == "--online-update" { print(try update.install(from: source)) }
        case "--install":
            print(try install.install(from: sourceArgument.map { URL(fileURLWithPath: $0, isDirectory: true) } ?? MusicInstall.findSource()))
        case "--status":
            print(install.version ?? "Копия пока не установлена.")
            if let previous = install.previousVersion { print("Предыдущая версия · \(previous)") }
        case "--restore": print(try install.restore())
        case "--remove": print(try install.remove())
        default:
            print("YMusicCustomizer --install [источник.app] [папка] | --status [папка] | --restore [папка] | --remove [папка]")
            exit(operation == "--help" ? 0 : 2)
        }
    } catch {
        FileHandle.standardError.write(Data((error.localizedDescription + "\n").utf8))
        exit(1)
    }
} else {
    let app = NSApplication.shared
    app.setActivationPolicy(.regular)
    let delegate = InstallerWindow(install: MusicInstall(directory: defaultDirectory, assets: assets))
    app.delegate = delegate
    withExtendedLifetime(delegate) { app.run() }
}
