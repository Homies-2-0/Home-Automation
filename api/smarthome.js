const { smarthome } = require('actions-on-google');
const admin = require('firebase-admin');

// Parse the service account JSON contained in Vercel Environment Variables
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://home-automation-15835-default-rtdb.asia-southeast1.firebasedatabase.app" // Your exact Database URL
  });
}

const app = smarthome();

// 1. SYNC: Tells Google what devices exist in your home
app.onSync((body) => {
  return {
    requestId: body.requestId,
    payload: {
      agentUserId: 'USER_ID', // Can leave hardcoded for a single user
      devices: [
        {
          id: '0',
          type: 'action.devices.types.LIGHT',
          traits: ['action.devices.traits.OnOff'],
          name: { name: 'Living Room' },
          willReportState: false,
        },
        {
          id: '1',
          type: 'action.devices.types.LIGHT',
          traits: ['action.devices.traits.OnOff'],
          name: { name: 'Bedroom' },
          willReportState: false,
        },
        {
          id: '2',
          type: 'action.devices.types.LIGHT',
          traits: ['action.devices.traits.OnOff'],
          name: { name: 'Kitchen' },
          willReportState: false,
        }
      ]
    }
  };
});

// 2. QUERY: Tells Google if the lights are currently on or off
app.onQuery(async (body) => {
  const dbRef = admin.database().ref('home/devices');
  const snapshot = await dbRef.once('value');
  const devices = snapshot.val() || {};

  const payload = { devices: {} };
  
  body.inputs[0].payload.devices.forEach((device) => {
    const dbIndex = parseInt(device.id) + 1; 
    const devData = devices[dbIndex];
    if (devData) {
      payload.devices[device.id] = {
        on: devData.state === 'on',
        online: true,
      };
    }
  });

  return { requestId: body.requestId, payload: payload };
});

// 3. EXECUTE: When you say "Hey Google, turn on Living Room"
app.onExecute(async (body) => {
  const { commands } = body.inputs[0].payload;
  const payload = { commands: [] };

  for (const command of commands) {
    for (const device of command.devices) {
      for (const execution of command.execution) {
        if (execution.command === 'action.devices.commands.OnOff') {
          const dbIndex = parseInt(device.id) + 1;
          const newState = execution.params.on ? 'on' : 'off';
          
          await admin.database().ref(`home/devices/${dbIndex}`).update({ state: newState });

          payload.commands.push({
            ids: [device.id],
            status: 'SUCCESS',
            states: {
              on: execution.params.on,
              online: true,
            },
          });
        }
      }
    }
  }

  return { requestId: body.requestId, payload: payload };
});

// Export it as a Vercel Serverless Function
module.exports = app;
