class Database {
  constructor(obj = {}) {
    this.db = obj.db || "SAMIM";
    this.version = obj.version || 1;
    this.table = obj.table || 'Table1';
  }
  
  openDatabase () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.db,this.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.table)) {
          db.createObjectStore(this.table, {keyPath: 'uuid', autoIncrement: true});
        }
      }
      request.onsuccess = (event) => {
        resolve(event.target.result);
      }
      request.onerror = (event) => {
        reject(event.target.error);
      }
    })
  }
  verify(uuid) {
    const request = indexedDB.open(this.db,this.version);
    const transaction = request.transaction(this.table,'readonly');
    const store = transaction.objectStore(this.table);
    const result = store.get(uuid);
    result.onsuccess = (ev) => {
      const exist = ev.target.result;
      return exists!==undefined?true:false;
    }
    result.onerror = () => {
      return false;
    }
  }
  
  addData (data) {
    return new Promise((resolve, reject) => {
      this.openDatabase()
      .then((db)=>{
        const transaction = db.transaction(this.table,'readwrite');
        const store = transaction.objectStore(this.table);
        data = {
          ...data,
          create_at: new Date().toLocaleString(),
          update_at: new Date().toLocaleString()
        }
        const request = store.add(data);
        request.onsuccess = (ev) => {
          resolve ({status: 'ok',message: 'Data added successfully'});
        }
        request.onerror = (ev) => {
          reject ({status: 'error',message: ev.target.error.message});
        }
      })
    })
  }
  
  getData (uuid) {
    return new Promise((resolve, reject) => {
      this.openDatabase()
      .then((db)=>{
        const transaction = db.transaction(this.table,'readonly');
        const store = transaction.objectStore(this.table);
        const result = store.get(uuid);
        result.onsuccess = (event)=> {
          const data = event.target.result;
          resolve(data!==undefined?data:false);
        }
        result.onerror = (event)=>{
          reject({"status": 'error',message: event.target.error.message});
        }
      })
    })
  }
  
  getAllData () {
    return new Promise((resolve, reject) => {
      this.openDatabase()
      .then((db)=>{
        const transaction = db.transaction(this.table,'readonly');
        const store =  transaction.objectStore(this.table);
        const request = store.getAll();
        request.onsuccess = (ev) => {
          const all_data = ev.target.result;
          resolve(all_data.length > 0?all_data:false);
        }
        request.onerror = (ev) => {
          reject({status: 'error',message: ev.target.error.message});
        }
      })
    })
  }
  
updateData(uuid, data) {
  return new Promise((resolve, reject) => {
    this.openDatabase()
      .then((db) => {
        const transaction = db.transaction(this.table, 'readwrite');
        const store = transaction.objectStore(this.table);
        
        // First get the existing data to preserve create_at
        const getRequest = store.get(uuid);
        getRequest.onsuccess = (getEvent) => {
          const existingData = getEvent.target.result;
          if (!existingData) {
            reject({ status: 'error', message: 'Record not found' });
            return;
          }
          
          const updatedData = {
            ...existingData, // Keep all existing properties
            ...data, // Apply updates
            uuid: uuid,
            update_at: new Date().toLocaleString()
          };
          
          const putRequest = store.put(updatedData);
          putRequest.onsuccess = (putEvent) => {
            resolve({ status: 'ok', message: 'Data updated successfully.' });
          };
          putRequest.onerror = (putEvent) => {
            reject({ status: 'error', message: putEvent.target.error.message });
          };
        };
        
        getRequest.onerror = (getEvent) => {
          reject({ status: 'error', message: getEvent.target.error.message });
        };
      });
  });
}
  
  deleteData (uuid) {
    return new Promise((resolve, reject) => {
      this.openDatabase()
      .then((db)=>{
        const transaction = db.transaction(this.table,'readwrite');
        const store = transaction.objectStore(this.table);
        const request = store.delete(uuid);
        request.onsuccess = () => {
          resolve({status:'ok',message:'Data deleted successfully'});
        }
        request.onerror = (ev) => {
          reject({status:'error',message:ev.target.error.message});
        }
      })
    })
  }
  
}
