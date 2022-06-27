import express, {json} from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

import joi from 'joi';
import dayjs from 'dayjs';

const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

//ajustar isso do then 
mongoClient.connect().then(() => {
	db = mongoClient.db("bate-papo-UOL");
});

const nameSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message').required(),
    from: joi.string().required()
});


//Rota Partipantes
server.get('/participants', async (req, res)=>{
    
    try {
		const participantsColection = db.collection("participants");
		const participantsList = await participantsColection.find().toArray();
				
		res.status(200).send(participantsList);
	 } catch (error) {
	    res.status(500).send(error)
	 }
})

server.post('/participants', async (req, res)=>{
    
    const {name} = req.body;

    const validation = nameSchema.validate({name}, { abortEarly: false });

    if (validation.error) {
      console.log(validation.error.details);
      const messages = validation.error.details.map(item => item.message);
      res.status(422).send(messages);
    }

    try {
		const participantsColection = db.collection("participants");

        const repeatedName = await participantsColection.findOne({name: name})

        if(repeatedName){
            res.status(409).send('Esse usuário já está cadastrado')
            return
        }
        
		await participantsColection.insertOne({
            name,
            lastStatus: Date.now()
        })

        const messagesColection = db.collection("messages");
		await messagesColection.insertOne({
            from: name, 
            to: 'Todos', 
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs().format('HH:mm:ss')
        })
		res.status(201).send();
	 } catch (error) {
	    res.status(500).send(error)
	 }
})
// Rota Mensagens

server.get('/messages', async (req, res)=>{

    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    
    try {
        const messagesColection = db.collection("messages");
		let messagesList = await messagesColection.find({ $or: [ { to:"Todos" }, {from: user}, {to: user} ] }).toArray();

        if(limit){
            console.log('existe limite', limit);
            messagesList = messagesList.slice(limit * -1)
        }
				
		res.status(200).send(messagesList);
	 } catch (error) {
	    res.status(500).send(error)
	 }
})

server.post('/messages', async (req, res)=>{
    
    const {to, text, type} = req.body;
    const user = req.headers.user;

    const validation = messageSchema.validate({to, text, type, from: user}, { abortEarly: false });

    if (validation.error) {
      console.log(validation.error.details);
      const messages = validation.error.details.map(item => item.message);
      res.status(422).send(messages);
    }

    try {	
        const messagesColection = db.collection("messages");
		await messagesColection.insertOne({
            from: user,
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        })
		res.status(201).send();
	} catch (error) {
	    res.status(500).send(error)
	}
})

// Rota Status
server.post('/status', async (req, res)=>{
    
    const user = req.headers.user;
    
    const participantsColection = db.collection("participants");
	const participantsList = await participantsColection.find().toArray();
    const participants = participantsList.map(item => item.name)
    const isLogged = participants.filter(name => name === user)

    if(isLogged.length === 0){
        console.log('tá off')
        res.status(404).send();
        return
    }
    
    res.send(participants)
    try {	
	} catch (error) {
	    res.status(500).send(error)
	}
})


server.listen(5001, ()=>{
    console.log('O servidor está rodando na porta 5001')
})