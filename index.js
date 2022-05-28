const admin = require("firebase-admin");
const express = require('express')
const app = express()

var serviceAccount = require("./tinbk-48003-firebase-adminsdk-jjo22-7021491d5b.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json())

app.post('/notifications', (req,res) => {
  admin.firestore().collection('Users').doc(req.body.buyerId).get()
  .then(buyerSnapshot => {
    admin.firestore().collection('Users').doc(req.body.book.seller).get()
    .then(sellerSnapshot => {
        handleRegisterToBuy(buyerSnapshot.data(),sellerSnapshot.data(),req.body.book)
    })
  })

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = dd + '/' + mm + '/' + yyyy;
  document.write(today);
  
  admin.firestore().collection('Notifications').doc(req.body.buyerId)
    .set({
      kind: 'buyer',
      type: 'processing',
      bookId: req.body.bookName,
      partner: req.body.book.seller
    }).then(() => {
      console.log('Notification added');
    })
})

async function handleRegisterToBuy(buyerInfo, sellerInfo, book) {
  await admin.messaging().sendToDevice(
    sellerInfo.tokens,
    {
      data: {
        buyer: JSON.stringify(buyerInfo),
        seller: JSON.stringify(sellerInfo),
        book: JSON.stringify(book)
      }
    },
    {
      priority: 'high',
    }
  ).then(() => {
    console.log('Message sent')
  })
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('server running')
})