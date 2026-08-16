const fs = require('node:fs');
const path = require('node:path');

class PurchaseStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.records = [];
    this.load();
  }

  load() {
    try {
      const value = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.records = Array.isArray(value.records) ? value.records : [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  list() {
    return [...this.records];
  }

  findBySignature(signature) {
    return this.records.find(record => record.signature === signature) || null;
  }

  add(record) {
    const existingSignature = this.findBySignature(record.signature);
    if (existingSignature) return existingSignature;

    this.records.push(record);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify({ version: 1, records: this.records }, null, 2));
    fs.renameSync(temporaryPath, this.filePath);
    return record;
  }
}

module.exports = { PurchaseStore };
