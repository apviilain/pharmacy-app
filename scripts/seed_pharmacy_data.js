const fs = require('fs');
const path = require('path');

// Setup environment variables
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.SEED_AUTH_TOKEN || '';
const PHARMACY_ID = process.env.PHARMACY_ID || '64f100000000000000000001'; // Default dummy ID
const NUM_RECORDS = 10;

// Read postman collection
const collectionPath = path.join(__dirname, '../Pharmacy APIs.postman_collection.json');
const collectionRaw = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionRaw);

// Find API by exact name
function findApiByName(item, name) {
  if (item.name === name && item.request) {
    return item;
  }
  if (item.item) {
    for (let subItem of item.item) {
      let found = findApiByName(subItem, name);
      if (found) return found;
    }
  }
  return null;
}

const APIS_TO_SEED = [
  { name: 'Create Medicine', dependency: 'none' },
  { name: 'Create Or Link Customer', dependency: 'none' },
  { name: 'Upsert Inventory Items', dependency: 'medicine' },
  { name: 'Add Or Update Cart Item', dependency: 'medicine' },
  { name: 'Create Pharmacy Order', dependency: 'customer_and_medicine' },
  { name: 'Create Subscriptions', dependency: 'customer_and_medicine' }
];

// Helper to mutate body for uniqueness
function mutatePayload(bodyRaw, index, dependencies) {
  let payloadStr = bodyRaw;
  
  // Replace variables
  payloadStr = payloadStr.replace(/{{pharmacyId}}/g, PHARMACY_ID);
  
  if (dependencies.medicineId) {
    payloadStr = payloadStr.replace(/{{medicineId}}/g, dependencies.medicineId);
    payloadStr = payloadStr.replace(/{{medicineId2}}/g, dependencies.medicineId2 || dependencies.medicineId);
  }
  
  if (dependencies.userId) {
    payloadStr = payloadStr.replace(/{{userId}}/g, dependencies.userId);
  }

  let payload = JSON.parse(payloadStr);

  // Deep mutate string fields to ensure uniqueness
  function mutateObject(obj) {
    for (const key in obj) {
      const skipMutation = ['id', 'medicineId', 'userId', 'pharmacyId', 'dosageForm', 'category', 'strength', 'manufacturer', 'paymentMode', 'deliveryMode', 'deliveryAddress', 'subscriptionFrequency', 'subscriptionReminderChannel', 'reason', 'rackLocation', 'cancellationReason', 'integration', 'orderType', 'paymentOption', 'paymentSource', 'status'];
      if (typeof obj[key] === 'string' && !skipMutation.includes(key) && !key.toLowerCase().includes('date') && !key.toLowerCase().includes('time')) {
         if (key === 'phone' || key === 'contactNo') {
           // generate a random 10 digit phone
           obj[key] = Math.floor(1000000000 + Math.random() * 9000000000).toString();
         } else if (key === 'email') {
           obj[key] = `test${index}_${Date.now()}@example.com`;
         } else if (key === 'batchNumber') {
           obj[key] = `BATCH-${index}-${Date.now()}`;
         } else {
           obj[key] = `${obj[key]} - ${index}`;
         }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        mutateObject(obj[key]);
      }
    }
  }

  mutateObject(payload);
  return payload;
}

// Summary Tracker
const summary = {
  totalModules: APIS_TO_SEED.length,
  apisExecuted: 0,
  recordsInserted: {},
  failedApis: [],
  createdIds: {
    medicines: [],
    customers: []
  }
};

async function executeRequest(url, method, payload) {
  const finalUrl = url.replace(/{{baseUrl}}/g, BASE_URL);
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  try {
    const res = await fetch(finalUrl, {
      method: method,
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    
    return data;
  } catch (err) {
    throw err;
  }
}

async function runSeeder() {
  console.log('--- Starting Pharmacy Data Seeder ---');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided' : 'Missing (Requests might fail)'}`);
  
  for (const apiConfig of APIS_TO_SEED) {
    console.log(`\nProcessing Module: ${apiConfig.name}`);
    summary.recordsInserted[apiConfig.name] = 0;
    
    const apiItem = findApiByName(collection, apiConfig.name);
    if (!apiItem || !apiItem.request) {
      console.log(`[SKIPPED] Could not find API for ${apiConfig.name} in collection.`);
      summary.failedApis.push({ name: apiConfig.name, reason: 'Not found in collection' });
      continue;
    }

    const url = typeof apiItem.request.url === 'string' ? apiItem.request.url : apiItem.request.url.raw;
    const method = apiItem.request.method;
    const bodyRaw = apiItem.request.body ? apiItem.request.body.raw : '{}';
    
    for (let i = 1; i <= NUM_RECORDS; i++) {
      summary.apisExecuted++;
      try {
        let deps = {};
        
        if (apiConfig.dependency === 'medicine' || apiConfig.dependency === 'customer_and_medicine') {
          if (summary.createdIds.medicines.length === 0) {
             throw new Error('Dependency missing: No Medicine IDs available');
          }
          deps.medicineId = summary.createdIds.medicines[(i - 1) % summary.createdIds.medicines.length];
          if (summary.createdIds.medicines.length > 1) {
             deps.medicineId2 = summary.createdIds.medicines[(i) % summary.createdIds.medicines.length];
          }
        }
        
        if (apiConfig.dependency === 'customer_and_medicine') {
          if (summary.createdIds.customers.length === 0) {
             throw new Error('Dependency missing: No Customer IDs available');
          }
          deps.userId = summary.createdIds.customers[(i - 1) % summary.createdIds.customers.length];
        }

        const payload = mutatePayload(bodyRaw, i, deps);
        
        const responseData = await executeRequest(url, method, payload);
        
        // Save IDs if it's a parent entity
        let createdId = responseData?.id || responseData?._id || responseData?.data?.id || responseData?.data?._id;
        
        if (createdId) {
           if (apiConfig.name === 'Create Medicine') summary.createdIds.medicines.push(createdId);
           if (apiConfig.name === 'Create Or Link Customer') summary.createdIds.customers.push(createdId);
        }
        
        summary.recordsInserted[apiConfig.name]++;
        process.stdout.write('.');
      } catch (err) {
        console.log(`\n[FAILED] ${apiConfig.name} - Record ${i}: ${err.message}`);
        // Only log one failure per module to summary to avoid clutter
        if (!summary.failedApis.find(f => f.name === apiConfig.name)) {
           summary.failedApis.push({ name: apiConfig.name, reason: err.message });
        }
      }
    }
  }

  // Print Summary
  console.log('\n\n================ SEED SUMMARY ================');
  console.log(`Total Modules Processed: ${summary.totalModules}`);
  console.log(`Total APIs Executed: ${summary.apisExecuted}`);
  console.log('\nRecords Inserted per Module:');
  for (const [module, count] of Object.entries(summary.recordsInserted)) {
    console.log(`  - ${module}: ${count}`);
  }
  
  if (summary.failedApis.length > 0) {
    console.log('\nFailed APIs:');
    summary.failedApis.forEach(fail => {
      console.log(`  - ${fail.name}: ${fail.reason}`);
    });
  }

  console.log('\nCreated IDs (first 5 per module):');
  console.log(`  - Medicines: ${summary.createdIds.medicines.slice(0, 5).join(', ') || 'None'}`);
  console.log(`  - Customers: ${summary.createdIds.customers.slice(0, 5).join(', ') || 'None'}`);
  console.log('==============================================\n');
}

runSeeder();
