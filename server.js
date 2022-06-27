import express, {json} from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

import joi from 'joi';

const server = express();
server.use(cors());
server.use(json());


const mongoClient = new MongoClient(process.env.MONGO_URI);

server.get('/participants', async (req, res)=>{
    
    try {
		await mongoClient.connect();
		const db = mongoClient.db("bate-papo-UOL")
		const participantsColection = db.collection("participants");
		const participantsList = await participantsColection.find().toArray();
				
		res.status(200).send(participantsList);
		mongoClient.close()
	 } catch (error) {
	    res.status(500).send(error)
		mongoClient.close()
	 }
})

server.listen(5000, ()=>{
    console.log('O servidor está rodando na porta 5000')
})