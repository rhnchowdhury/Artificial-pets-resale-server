const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ajoxj5t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const petCollection = client.db('ArtificialPets').collection('petsList');
        const allPetCollection = client.db('ArtificialPets').collection('allPets');
        const bookingCollection = client.db('ArtificialPets').collection('booking');

        // pets list create
        app.get('/pets', async (req, res) => {
            const query = {};
            const options = await petCollection.find(query).toArray();
            res.send(options);
        });

        // category data created
        app.get('/allPets/:id', async (req, res) => {
            const phoneId = req.params.id;
            const query = { cate_id: phoneId };
            const result = await allPetCollection.find(query).toArray();
            res.send(result);
        });

        // booking add
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        });

        //get booking data using email
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        });

    }
    finally {

    }
}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('AI Pets running')
});
app.listen(port, () => console.log(`AI port running on ${port}`));


