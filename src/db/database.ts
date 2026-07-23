import dns from "dns";
import { MongoClient, ServerApiVersion } from "mongodb";

// El resolver DNS del sistema puede rechazar consultas SRV en Windows; usamos DNS públicos.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const clientDB = new MongoClient(process.env.MONGO_URI || '', {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const database = clientDB.db(process.env.MONGO_DB_NAME);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await clientDB.connect();
    // Send a ping to confirm a successful connection
    await clientDB.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    // Ensures that the client will close when you finish/error
    console.error(error);
    await clientDB.close();
  }
}

export { run, clientDB, database };