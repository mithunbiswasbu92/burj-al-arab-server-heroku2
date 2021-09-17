const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()

const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4svir.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
 
const app = express()
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./configs/burj-al-arab-41761-firebase-adminsdk-a2pur-674752e11b.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const { MongoClient } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab3").collection("bookings3");

    app.post('/addBookings', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.acknowledged == true)
                console.log(result)
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email; 
                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else(
                        res.status(401).send('Un-authorize Access')
                    )
                })
                .catch((error) => {
                    res.status(401).send('Un-authorize Access')
                });
        }
        else(
            res.status(401).send('Un-authorize Access')
        )
    })
}); 

app.get('/', (req, res) => {
    res.send('Burj-al-arab server site done/working')
})

app.listen(port)