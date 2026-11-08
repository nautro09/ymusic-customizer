import CryptoKit
import Foundation

struct Asar {
    private let data: Data
    private let payloadStart: Int
    private let header: [String: Any]
    let headerHash: String

    init(_ url: URL) throws {
        let data = try Data(contentsOf: url, options: .mappedIfSafe)
        let invalid = CustomizerError("Не удалось прочитать app.asar этой версии Яндекс Музыки.")
        guard data.count >= 16, Self.word(data, 0) == 4 else { throw invalid }
        let headerSize = Self.word(data, 4)
        let jsonSize = Self.word(data, 12)
        guard headerSize >= 8, headerSize <= data.count - 8,
              Self.word(data, 8) == headerSize - 4,
              jsonSize <= headerSize - 8, (jsonSize + 3) / 4 * 4 == headerSize - 8 else {
            throw invalid
        }
        let json = data.subdata(in: 16..<(16 + jsonSize))
        guard let header = try JSONSerialization.jsonObject(with: json) as? [String: Any],
              header["files"] is [String: Any] else { throw invalid }
        self.data = data
        self.payloadStart = 8 + headerSize
        self.header = header
        self.headerHash = Self.hash(json)
    }

    func read(_ name: String) throws -> Data {
        let files = header["files"] as? [String: Any]
        let count = data.count - payloadStart
        guard let entry = files?[name] as? [String: Any], let size = entry["size"] as? Int,
              let offset = (entry["offset"] as? String).flatMap(Int.init),
              size >= 0, offset >= 0, offset <= count, size <= count - offset else {
            throw CustomizerError("В app.asar отсутствует ожидаемый файл \(name).")
        }
        let contents = data.subdata(in: (payloadStart + offset)..<(payloadStart + offset + size))
        if let integrity = entry["integrity"] as? [String: Any],
           integrity["hash"] as? String != Self.hash(contents) {
            throw CustomizerError("Контрольная сумма \(name) в app.asar не совпала.")
        }
        return contents
    }

    func write(to url: URL, replacing: [(String, Data)]) throws -> String {
        var header = self.header
        var files = header["files"] as? [String: Any] ?? [:]
        var offset = data.count - payloadStart
        for (name, contents) in replacing {
            let blockSize = 4 * 1024 * 1024
            let hash = Self.hash(contents)
            let blocks = stride(from: 0, to: contents.count, by: blockSize).map { start in
                Self.hash(contents[start..<min(start + blockSize, contents.count)])
            }
            files[name] = [
                "size": contents.count, "offset": String(offset),
                "integrity": ["algorithm": "SHA256", "hash": hash, "blockSize": blockSize,
                              "blocks": blocks.isEmpty ? [hash] : blocks]
            ]
            offset += contents.count
        }
        header["files"] = files
        let json = try JSONSerialization.data(withJSONObject: header, options: [.sortedKeys])
        let padded = (json.count + 3) / 4 * 4
        var prefix = Data()
        for value in [4, 8 + padded, 4 + padded, json.count] {
            var word = UInt32(value).littleEndian
            withUnsafeBytes(of: &word) { prefix.append(contentsOf: $0) }
        }
        prefix.append(json)
        prefix.append(Data(count: padded - json.count))
        try prefix.write(to: url)
        let file = try FileHandle(forWritingTo: url)
        defer { try? file.close() }
        try file.seekToEnd()
        let chunkSize = 8 * 1024 * 1024
        for start in stride(from: payloadStart, to: data.count, by: chunkSize) {
            try file.write(contentsOf: data[start..<min(start + chunkSize, data.count)])
        }
        for (_, contents) in replacing { try file.write(contentsOf: contents) }
        try file.synchronize()
        return Self.hash(json)
    }

    private static func word(_ data: Data, _ offset: Int) -> Int {
        data.withUnsafeBytes { Int($0.loadUnaligned(fromByteOffset: offset, as: UInt32.self).littleEndian) }
    }

    private static func hash(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}
