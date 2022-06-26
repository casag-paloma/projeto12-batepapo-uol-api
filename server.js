import express from 'express';
import cors from 'cors'

const server = express();

server.use(cors());

server.get('/', (req, res)=>{
    console.log('aqui');
    res.send('Hello World');
})

server.listen(5000, ()=>{
    console.log('O servidor está rodando na porta 5000')
})