import express, { Router } from 'express';
import bodyParser from 'body-parser';
import { Manager, Auth } from '@/app/controllers';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from '@/config/swagger.json';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/manager', Manager);
app.use('/auth', Auth);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

console.log(`Servidor rodando no link http://localhost:${port}`);
app.listen(port);
