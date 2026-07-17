const axios = require('axios');
axios.put('https://pharmyx.etryx.in/api/v1/pharmacies/me/profile', { name: "Aarogya Medicos" }, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTRhNDdjYmYwYWJhYzUwN2ViMGZhNGEiLCJwaGFybWFjeUlkIjoiNmE0YTQ3Y2JmMGFiYWM1MDdlYjBmYTRhIiwicGhvbmUiOiI3OTkwODc4NjY5IiwidXNlclR5cGUiOiJwaGFybWFjeSIsImlhdCI6MTc4Mzg2MzE2NCwiZXhwIjoxNzg2NDU1MTY0fQ.7Wqw9BtI1lflpmxRrzriwopfn7BFK4q2y4VLuqoQV4g'
  }
}).then(res => console.log("SUCCESS")).catch(err => console.log("ERROR", err.response ? err.response.data : err.message));
