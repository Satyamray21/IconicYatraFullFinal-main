import "dotenv/config";
import connectDB from "./src/DB/index.js"
import { app } from "./app.js"


app.get('/', (req, res) => {
    res.send('Welcome to the Iconic Yatra API!');
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 9000, () => {
            console.log(`server is running  on ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("Server failed", err);
    })