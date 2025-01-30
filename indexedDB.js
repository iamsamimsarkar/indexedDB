class Database {
  constructor(databaseName, version, storeName, indexField = "uuid", isUnique = true) {
    this.databaseName = databaseName || "Database by Samim";
    this.version = version || 1;
    this.storeName = storeName || "Table1";
    this.indexField = indexField; // Index Field (যেমন: name, email, phone)
    this.isUnique = isUnique; // Index Unique হবে কিনা
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.objectStoreNames.contains(this.storeName)
          ? event.target.transaction.objectStore(this.storeName)
          : db.createObjectStore(this.storeName, { keyPath: "uuid" });

        // যদি indexField ইতিমধ্যে না থাকে, তাহলে নতুন index তৈরি করা হবে
        if (!store.indexNames.contains(this.indexField)) {
          store.createIndex(this.indexField, this.indexField, { unique: this.isUnique });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.errorCode);
    });
  }

  addData(data) {
    return this.openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);

        if (!data.uuid) data.uuid = crypto.randomUUID();

        const request = store.add(data);
        request.onsuccess = () => resolve({ status: "ok", message: "Data added successfully" });
        request.onerror = (event) => reject({ status: "error", message: event.target.error.message });
      });
    });
  }

  getAllData(value) {
    return this.openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index(this.indexField);
        const request = index.getAll(value); // যদি একই নামের একাধিক ডাটা থাকে, সব আনবে

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error.message);
      });
    });
  }
  getData(value) {
    return this.openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index(this.indexField);
        const request = index.get(value); // যদি একই নামের একাধিক ডাটা থাকে, সব আনবে

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error.message);
      });
    });
  }
  updateData(value, updatedData) {
    return this.openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index(this.indexField);
        const request = index.openCursor(IDBKeyRange.only(value)); // name দিয়ে সার্চ

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const updatedRecord = { ...cursor.value, ...updatedData };
            cursor.update(updatedRecord);
            resolve({ status: "ok", message: "Data updated successfully" });
          } else {
            reject({ status: "error", message: "No matching data found" });
          }
        };

        request.onerror = (event) => reject(event.target.error.message);
      });
    });
  }

  deleteData(value) {
    return this.openDatabase().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index(this.indexField);
        const request = index.openCursor(IDBKeyRange.only(value));

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            resolve({ status: "ok", message: "Data deleted successfully" });
          } else {
            reject({ status: "error", message: "No matching data found" });
          }
        };

        request.onerror = (event) => reject(event.target.error.message);
      });
    });
  }
}
