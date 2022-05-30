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
  admin.firestore().collection('Users').doc(req.body.buyerId).get()
  .then(buyerSnapshot => {
    admin.firestore().collection('Users').doc(req.body.book.seller).get()
    .then(sellerSnapshot => {
        handleRegisterToBuy(buyerSnapshot.data(),sellerSnapshot.data(),req.body.book,req.body.price)
      })
    })
})

app.post('/seller-notifications', (req,res) => {
  console.log(req.body)
})

async function handleRegisterToBuy(buyerInfo, sellerInfo, book, price) {
  await admin.messaging().sendToDevice(
    sellerInfo.tokens,
    {
      data: {
        buyer: JSON.stringify(buyerInfo),
        seller: JSON.stringify(sellerInfo),
        book: JSON.stringify(book),
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

async function handleUpdateBuyerNotification() {
  
}

async function handleUpdateSellerNotification() {
  
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('server running')
})