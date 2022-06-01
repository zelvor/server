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
  // admin.firestore().collection('Users').doc(req.body.sender).get()
  // .then(senderSnapshot => {
  //   admin.firestore().collection('Users').doc(req.body.receiver).get()
  //   .then(receiverSnapshot => {
  //     admin.firestore().collection('Books').doc(req.body.book).get()
  //       .then(bookSnapshot => {
  //         sendMessage(
  //           senderSnapshot.data(),
  //           receiverSnapshot.data(),
  //           bookSnapshot.data(),
  //           'seller',
  //           req.body.type,
  //           req.body.price  
  //         )
  //       })
  //     })
  //   })
  console.log('Buyer notification:', req.body)

  if (req.body.type == 'register') {
    handleRegisterToBuy(
      req.body.receiver,
      req.body.receiverName,
      req.body.sender,
      req.body.senderName,
      req.body.book, 
      req.body.bookName, 
      req.body.price)
  }
  else handleCancelRegister(
    req.body.receiver,
    req.body.receiverName,
    req.body.sender,
    req.body.senderName,
    req.body.book, 
    req.body.bookName, 
    req.body.price)
  
})

app.post('/seller-notifications', (req,res) => {
  console.log('Seller notification:', req.body)
  if(req.body.type == 'accepted') {
    handleAccept(
      req.body.sender, 
      req.body.senderName,
      req.body.receiver, 
      req.body.receiverName,
      req.body.book, 
      req.body.bookName,
      req.body.price)
  }
  else handleReject(
    req.body.sender, 
    req.body.senderName,
    req.body.receiver, 
    req.body.receiverName,
    req.body.book, 
    req.body.bookName,
    req.body.price)
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

async function handleRegisterToBuy(seller, sellerName, buyer,buyerName, book, bookName, price) {
  await admin.firestore().collection('Notifications').doc(buyer).get().then(docSnapshot =>{
    let notifications = docSnapshot.data().notifications
    notifications.push({
      kind: 'buyer',
      type: 'processing',
      price: price,
      bookId: book,
      bookName: bookName,
      partner: seller,
      partnerName: sellerName,
      date: String(today.getDate()).padStart(2, '0') + '/' 
          + String(today.getMonth() + 1).padStart(2, '0') + '/' 
          + today.getFullYear()
    })
    admin.firestore().collection('Notifications').doc(buyer).update({
      notifications: notifications
    }).then(() => {
      console.log('Buyer-notification added');
    })
  })

  await admin.firestore().collection('Notifications').doc(seller).get().then(docSnapshot =>{
    let notifications = docSnapshot.data().notifications
    notifications.push({
      kind: 'seller',
      type: 'processing',
      price: price,
      bookId: book,
      bookName: bookName,
      partner: buyer,
      partnerName: buyerName,
      date: String(today.getDate()).padStart(2, '0') + '/' 
          + String(today.getMonth() + 1).padStart(2, '0') + '/' 
          + today.getFullYear()
    })
    admin.firestore().collection('Notifications').doc(seller).update({
      notifications: notifications
    }).then(() => {
      console.log('Seller-notification added');
    })
  })

  await admin.firestore().collection('Books').doc(book).get().then(docSnapshot =>{
    let orderList = docSnapshot.data().orderList
    console.log('orderList:', orderList)
    orderList.push(buyer)
    admin.firestore().collection('Books').doc(book).update({
      orderList: orderList
    }).then(() => {
      console.log('Order list updated')
    })
  })
}

async function handleCancelRegister(seller, sellerName, buyer,buyerName, book, bookName, price) {
  await admin.firestore().collection('Notifications').doc(buyer).get().then(docSnapshot =>{
    let notifications = docSnapshot.data().notifications.filter(notification => {
      return !(notification.bookId == book 
        && notification.partner == seller 
        && notification.type == 'processing')
    })

    admin.firestore().collection('Notifications').doc(buyer).update({
      notifications: notifications
    }).then(() => {
      console.log('Buyer-notification added');
    })
  })

  await admin.firestore().collection('Notifications').doc(seller).get().then(docSnapshot =>{
    let notifications = docSnapshot.data().notifications.filter(notification => {
      return !(notification.bookId == book 
        && notification.partner == buyer 
        && notification.type == 'processing')
    })
    
    admin.firestore().collection('Notifications').doc(seller).update({
      notifications: notifications
    }).then(() => {
      console.log('Seller-notification added');
    })
  })

  await admin.firestore().collection('Books').doc(book).get().then(docSnapshot =>{
    let orderList = docSnapshot.data().orderList
    orderList.pop(buyer)
    admin.firestore().collection('Books').doc(book).update({
      orderList: orderList
    }).then(() => {
      console.log('Order list updated')
    })
  })
}

const isEqualsJson = (obj1,obj2) => {
  keys1 = Object.keys(obj1);
  keys2 = Object.keys(obj2);

  //return true when the two json has same length and all the properties has same value key by key
  return keys1.length === keys2.length && Object.keys(obj1).every(key=>obj1[key]==obj2[key]);
}

async function handleAccept(seller, sellerName, buyer, buyerName, book, bookName, price) {
  await admin.firestore().collection('Notifications').doc(seller).get()
    .then(sellerNotiSnapshot => {
      let notifications = sellerNotiSnapshot.data().notifications
      let newNotifications = notifications.filter((notification) => {
        if (notification.bookId == book && notification.type == 'processing') {
          if (notification.partner != buyer) {
            admin.firestore().collection('Notifications').doc(notification.partner).get()
              .then(docSnapshot => {
                console.log('Djt me ppl')
                let newPartnerNotifications = docSnapshot.data().notifications.filter(notification => {
                  let obj1 = notification
                  let obj2 = {
                    bookId: notification.bookId,
                    bookName: bookName,
                    date: notification.date,
                    kind: 'buyer',
                    partner: seller,
                    partnerName: sellerName,
                    price: notification.price,
                    type: 'processing'
                  }
                  return !isEqualsJson(obj1,obj2)
                })
                newPartnerNotifications.push({
                  bookId: notification.bookId,
                  bookName: bookName,
                  date: String(today.getDate()).padStart(2, '0') + '/' 
                      + String(today.getMonth() + 1).padStart(2, '0') + '/' 
                      + today.getFullYear(),
                  kind: 'buyer',
                  partner: seller,
                  partnerName: sellerName,
                  price: notification.price,
                  type: 'rejected'
                })
                admin.firestore().collection('Notifications').doc(notification.partner).update({
                  notifications: newPartnerNotifications
                })
              })
          }
          return false
        }
        return true
      })
      newNotifications.push({
        bookId: book,
        bookName: bookName,
        date: String(today.getDate()).padStart(2, '0') + '/' 
            + String(today.getMonth() + 1).padStart(2, '0') + '/' 
            + today.getFullYear(),
        kind: 'seller',
        type: 'accepted',
        partner: buyer,
        partnerName: buyerName,
        price: price
      })
      admin.firestore().collection('Notifications').doc(seller).update({
        notifications: newNotifications
      }).then(() => {
        console.log('Seller notifications updated')
      })
    })

  await admin.firestore().collection('Notifications').doc(buyer).get()
    .then(buyerNotiSnapshot => {
      let notifications = buyerNotiSnapshot.data().notifications
      let newNotifications = notifications.filter((notification) => {
        return !(notification.bookId == book && notification.type == 'processing')
      })
      newNotifications.push({
        bookId: book,
        bookName: bookName,
        date: String(today.getDate()).padStart(2, '0') + '/' 
            + String(today.getMonth() + 1).padStart(2, '0') + '/' 
            + today.getFullYear(),
        kind: 'buyer',
        type: 'accepted',
        partner: seller,
        partnerName: sellerName,
        price: price
      })
      admin.firestore().collection('Notifications').doc(buyer).update({
        notifications: newNotifications
      }).then(() => {
        console.log('Buyer notifications updated')
      })
    })

  await admin.firestore().collection('Books').doc(book).update({
    quantity: 0
  }).then(() => {
    console.log('Quantity list updated')
  })
  
}

async function handleReject(seller, sellerName, buyer,buyerName, book, bookName, price) {
  await admin.firestore().collection('Notifications').doc(seller).get()
    .then(sellerNotiSnapshot => {
      let notifications = sellerNotiSnapshot.data().notifications
      let newNotifications = notifications.filter((notification) => {
        return !(notification.bookId == book 
          && notification.partner == buyer
          && notification.type == 'processing')
      })
      newNotifications.push({
        bookId: book,
        bookName: bookName,
        date: String(today.getDate()).padStart(2, '0') + '/' 
            + String(today.getMonth() + 1).padStart(2, '0') + '/' 
            + today.getFullYear(),
        kind: 'seller',
        type: 'rejected',
        partner: buyer,
        partnerName: buyerName,
        price: price
      })
      admin.firestore().collection('Notifications').doc(seller).update({
        notifications: newNotifications
      }).then(() => {
        console.log('Seller notifications updated')
      })
    })

  await admin.firestore().collection('Notifications').doc(buyer).get()
    .then(buyerNotiSnapshot => {
      let notifications = buyerNotiSnapshot.data().notifications
      let newNotifications = notifications.filter((notification) => {
        return !(notification.bookId == book 
          && notification.partner == seller
          && notification.type == 'processing')
      })
      newNotifications.push({
        bookId: book,
        bookName: bookName,
        date: String(today.getDate()).padStart(2, '0') + '/' 
            + String(today.getMonth() + 1).padStart(2, '0') + '/' 
            + today.getFullYear(),
        kind: 'buyer',
        type: 'rejected',
        partner: seller,
        partnerName: sellerName,
        price: price
      })
      admin.firestore().collection('Notifications').doc(buyer).update({
        notifications: newNotifications
      }).then(() => {
        console.log('Buyer notifications updated')
      })
    })
}

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('server running')
})