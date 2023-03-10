require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Ninja = require('./models/ninja');
const Notes = require('./notes');

const JWT_SECRET = 'Sktchie';




mongoose.set('strictQuery', false);
const Note = require("./notes");
const app = express();


// app.use((req, res, next)=>{  
//     res.setHeader("Access-Control-Allow-Origin", "*");  
//     res.setHeader(  
//         "Access-Control-Allow-Headers",  
//         "Origin, X-Requested-With, Content-Type, Accept");  
//     res.setHeader("Access-Control-Allow-Methods",  
//     "GET, POST, PATCH, DELETE, OPTIONS");  
//     next();  
// });  



app.use(session({
    secret: 'Sktchie',
    resave: false,
    saveUninitialized: true,
    // store: sessionStore,
    cookie: {
        sameSite: true,
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        sameSite: 'none'
    },
}));

app.set('trust proxy', 1)

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NodeJS API Project',
            version: '1.0.0'
        },
        servers: [
            {
                url: 'http://localhost:4000/'
            },
            {
                url: 'http://54.146.74.146:4000/'
            }
        ]
    },
    apis: ['./index.js', './routes/api.js', './routes/routes.js']
}

const swaggerSpec = swaggerJSDoc(options)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json())

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*")
    next()
})


mongoose.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`).then(function () {

    /**
 * @swagger
 *  components:
 *      schemas:
 *          Login:
 *              type: object
 *              properties:
 *                  email:
 *                      type: string
 *                  password:
 *                      type: string
 *                  
 *                 
 */








    /**
    *  @swagger
    * /:
    *  get:
    *      summary: This API for Home page
    *      description: This API for Home page
    *      responses:
    *            200:
    *                description: To test GET method
    */

    app.get("/", function (req, res) {
        res.send("Home");
    });

/**
    *  @swagger
    * /anonuser:
    *  get:
    *      summary: This API for Home page and creation of anonymous user
    *      description: This API for Home page and creation of anonymous user
    *      responses:
    *            200:
    *                description: To test GET method
    */
   
    app.get("/anonuser", function (req, res) {
        
            const ninja = new Ninja({
                name: "anonymous",
                email: "abc"+Math.random()+"@abc.com"
            })
            ninja.save().then(function (ninja) {
                const token = jwt.sign({ userId: ninja._id }, JWT_SECRET);
                ninja.token = token;
                ninja.save();
                res.send({message: "Anonymous User Created", token: token})

            }).catch(err => {
                return res.send({err: err, msg : err.message})
            });
        
            
    });













    /**
 *  @swagger
 * /login:
 *  post:
 *      summary: This API for logging in
 *      description: This API for logging in
 *      requestBody:
 *          required: true
 *          content: 
 *              application/json:
 *                  schema:
 *                       $ref: '#components/schemas/Login'
 *      responses:
 *            200:
 *                description: Login Successful
 *                
 */

    app.use(cookieParser());

    app.post("/login", async function (req, res) {
        const { email, password } = req.body;
        const user = await Ninja.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        // Compare the password with the stored hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).send('Invalid email or password');
        }

        // Generate a JWT and send it as a response
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });

        user.token = token;
        user.save();

        res.json({ token: token, message: "Login success" });

    });

    /**
     *  @swagger
     * /logout:
     *  get:
     *      summary: This API for logout
     *      description: This API for logout
     *      parameters:
     *          - in: path
     *            name: token
     *            required: true
     *            description: Token required
     *            schema:
     *              type: string
     *      responses:
     *            200:
     *                description: User Deleted
     */
    app.get('/logout', (req, res) => {

        const reqToken = req.headers.token;

        console.log(reqToken)
        if (!reqToken) {
            res.send('Login First');
        }
        else {
            const tokenData = jwt.verify(reqToken, "Sktchie")

            Ninja.findById(tokenData.userId)
                .then(user => {
                    user.token = ""
                    user.save()

                    res.status(200).send('Logout successful');
                })
                .catch(err => { return res.send(err) })
            // Send a success response
        }



    });



    app.use('/api', require("./routes/api"));


    const noteRouter = require("./routes/routes");
    app.use("/notes", noteRouter);
});
mongoose.Promise = global.Promise



app.use(function (err, req, res, next) {
    res.status(422).send({ error: err.message });
});


app.listen(process.env.port || 4000, function () {
    console.log('starting');
});