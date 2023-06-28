import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import mailConfig from '@/config/mail';

const transport = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  auth: mailConfig.auth,
});

transport.verify(function (error, success) {
  if (error) {
    console.log('Deu ruim' + error);
  } else {
    console.log('Deu bom');
  }
});

transport.use(
  'compile',
  hbs({
    viewEngine: {
      extName: '.hbs',
      partialsDir: './src/resources/mail',
      layoutsDir: './src/resources/mail',
      defaultLayout: null,
    },
    viewPath: path.resolve('./src/resources/mail'),
    extName: '.html',
  }),
);

export default transport;
