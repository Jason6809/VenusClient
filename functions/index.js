const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.sendMessage = functions.https.onCall((data, context) => {
  var registrationToken = data.fcmToken;

  var message = {
    notification: {
      title: data.title,
      body: data.body,
    },
    data: {
      title: data.title,
      body: data.body,
    },
    token: registrationToken,
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  admin
    .messaging()
    .send(message)
    .then(response => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
      return response;
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
});
