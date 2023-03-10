const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ajoxj5t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt function verify
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
};

async function run() {
    try {
        const petCollection = client.db('ArtificialPets').collection('petsList');
        const allPetCollection = client.db('ArtificialPets').collection('allPets');
        const bookingCollection = client.db('ArtificialPets').collection('booking');
        const userCollection = client.db('ArtificialPets').collection('users');
        const addCollection = client.db('ArtificialPets').collection('addProducts');

        // make sure we use verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        };

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
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { userEmail: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        });

        // get booking data by ID for payment options
        // app.get('/booking/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const pay = await bookingCollection.findOne(query);
        //     res.send(pay);
        // })

        // sign up user data create
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result)
        });

        // get users
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        // create admin
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // admin check
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        // seller check
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const seller = await userCollection.findOne(query);
            res.send({ isSeller: seller?.role === true });
        });

        // buyer check
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const buyer = await userCollection.findOne(query);
            res.send({ isBuyer: buyer?.role === false });
        });

        // category pets name for add products page
        app.get('/petsName', async (req, res) => {
            const query = {};
            const options = await petCollection.find(query).project({ name: 1 }).toArray();
            res.send(options);
        });

        // create addProducts
        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await addCollection.insertOne(products);
            res.send(result)
        });

        // get addProducts
        app.get('/products', verifyJWT, async (req, res) => {
            const query = {};
            const products = await addCollection.find(query).toArray();
            res.send(products);
        });

        // delete addProducts
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await addCollection.deleteOne(filter);
            res.send(result);
        });

        // payment create
        // app.post("/create-payment-intent", async (req, res) => {
        //     const orders = req.body;
        //     const price = orders.petsPrice;
        //     const amount = price * 100;

        //     const paymentIntent = await stripe.paymentIntents.create({
        //         currency: 'usd',
        //         amount: amount,
        //         "payment_method_types": [
        //             "card"
        //         ]
        //     });
        //     res.send({
        //         clientSecret: paymentIntent.client_secret,
        //     })
        // });

        // jwt token create
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.insertOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
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


