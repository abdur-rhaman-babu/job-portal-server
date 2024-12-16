require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6avkk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // job related apis
    const jobsCollection = client.db("job_portal").collection("jobs");
    const applicationCollection = client.db('job_portal').collection('job_applications')

    // Auth related APIs
    app.post('/jwt', async (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'})
      res.cookie('token', token,{
        httpOnly: true,
        secure: false,
      })
      .send({success: true})  
    })
    
    // get data from server for display
    app.post('/jobs', async (req, res)=>{
        const newJob = req.body;
        const result = await jobsCollection.insertOne(newJob)
        res.send(result)
    })

    app.get('/jobs', async (req, res)=>{
      const email = req.query.email;
      let query = {};
      if(email){
        query = {hr_email: email}
      }
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/jobs/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    app.get('/job-applications/jobs/:job_id', async (req, res)=>{
        const id = req.params.job_id;
        const query = {job_id: id}
        const result = await applicationCollection.find(query).toArray()
        res.send(result)
    })

    app.post('/job-applications', async (req, res)=>{
        const application = req.body;
        const result = await applicationCollection.insertOne(application)
        res.send(result)
    })

    app.patch('/job-applications/:id', async (req, res)=>{
        const id = req.params.id;
        const data = req.body;
        const filter = {_id: new ObjectId(id)}
        const updatedDoc = {
          $set:{
            status: data.status
          }
        }
        const result = await applicationCollection.updateOne(filter, updatedDoc)
        res.send(result)
    })

    // get data to spacific email
    app.get('/job-application', async (req, res)=>{
      const email = req.query.email;
      const query = {application_email: email}
      console.log('kuk kuk',req.cookies)
      const result = await applicationCollection.find(query).toArray()

      // get data to another collection fokira way
      for(const application of result){
        // console.log(application.job_id)
        const query1 = {_id: new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query1)
        if(job){
          application.title = job.title;
          application.company = job.company
        }
      }
      res.send(result)
    })
   
  } finally {
   
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This server is job portal server");
});

app.listen(port, () => {
  console.log(`Job server running on: ${port}`);
});
