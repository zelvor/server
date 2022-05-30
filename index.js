const admin = require("firebase-admin");
const express = require('express')
const app = express()

var serviceAccount = require("./tinbk-48003-firebase-adminsdk-jjo22-7021491d5b.json");

var today = new Date()

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json())

app.post('/buyer-notifications', (req,res) => {
  admin.firestore().collection('Users').doc(req.body.sender).get()
  .then(senderSnapshot => {
    admin.firestore().collection('Users').doc(req.body.receiver).get()
    .then(receiverSnapshot => {
      admin.firestore().collection('Books').doc(req.body.book).get()
        .then(bookSnapshot => {
          sendMessage(
            senderSnapshot.data(),
            receiverSnapshot.data(),
            bookSnapshot.data(),
            'seller',
            req.body.type,
            req.body.price  
          )
        })
      })
    })
})

app.post('/seller-notifications', (req,res) => {
  // if(req.body.type == 'accepted') {
  //   handleAccept(req.body.sender, req.body.receiver, req.body.book)
  // }
  console.log(req.body)
})

async function sendMessage(sender, receiver, book, kind, type, price) {
  await admin.messaging().sendToDevice(
    receiver.tokens,
    {
      data: {
        sender: JSON.stringify(sender),
        receiver: JSON.stringify(receiver),
        book: JSON.stringify(book),
        kind: JSON.stringify(kind),
        type: JSON.stringify(type),
        price: JSON.stringify(price)
      }
    },
    {
      priority: 'high',
    }
  ).then(() => {
    console.log('Message sent')
  })
}

// async function handleAccept(seller, buyer, book) {
//   await admin.firestore().collection('Notifications').doc(seller).get()
//     .then(sellerNotiSnapshot => {
//       var notifications = sellerNotiSnapshot.data().notifications
//       for(let i = 0; i < notifications.length; i++) {
//         if(notifications[i].bookId == book) {
//           notifications.pop(notifications[i])
//         }
//       }
//       notifications.push({
//         bookId: book,
//         date: String(today.getDate()).padStart(2, '0') + '/' 
//             + String(today.getMonth() + 1).padStart(2, '0') + '/' 
//             + today.getFullYear(),
//         kind: 'seller',
//         type: 'accepted',
//         partner: buyer
//       })
//       await admin.firestore().collection('Notifications').doc(seller).update({
//         notifications: notifications
//       })
//     })

//   await admin.firestore().collection('Notifications').doc(seller).get()
//     .then(buyerNotiSnapshot => {
//       var notifications = buyerNotiSnapshot.data().notifications
//       for(let i = 0; i < notifications.length; i++) {
//         if(notifications[i].bookId == book) {
//           notifications.pop(notifications[i])
//         }
//       }
//       notifications.push({
//         bookId: book,
//         date: String(today.getDate()).padStart(2, '0') + '/' 
//             + String(today.getMonth() + 1).padStart(2, '0') + '/' 
//             + today.getFullYear(),
//         kind: 'buyer',
//         type: 'accepted',
//         partner: seller
//       })
//       await admin.firestore().collection('Notifications').doc(buyer).update({
//         notifications: notifications
//       })
//     })
// }

async function handleReject(seller, buyer, book) {
  await admin.collection('Notifications').doc(seller)
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('server running')
})