import path from 'path';
import express from 'express';
// import app from 'express'; /* when i switch import express no longer has a () behind it */
const app = express();
import index from './routes/index';
import { Request, Response} from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GoogleStrategy } = require('./passport');
import passport from 'passport';
import session from 'express-session';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { addUser } from './db/db';
import { Twilio } from 'twilio';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import usersOutfit from '../client/src/components/models/UsersOutfits';
const httpServer = createServer();


dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});


const io = new Server(httpServer, {
  // ...
});

////////////////HELPERS////////////////////



const port = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new Twilio(accountSid, authToken);
// import client from 'twilio';
// client(accountSid, authToken);
// import MessagingResponse = require('twilio');
// import { twiml } from 'twilio';
// twiml.MessagingResponse;


dotenv.config();
////////////////HELPERS////////////////////

import { addItem, getAllItems, deleteItem } from './helpers/Item';

import { getAllWhiteboardPosts, savePost, addFavOutfit, getFavOutfit} from './helpers/WhiteBoardPost';
import { saveOutfit, getAllOutfits, deleteOutfit, getUserOutfits } from './helpers/Outfit';

import Find from './api/findastore';

////////////////HELPERS////////////////////

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env'), });


const dist = path.resolve(__dirname, '..', 'client', 'dist');

app.use(index);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(dist));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors());
app.use('/api/search', Find);
/*******************DATABASE ROUTES ************************************/
app.get('/outfit/:user', (req: Request, res: Response): Promise<usersOutfit> => {
  return getUserOutfits(req.cookies.thesis)
    .then((data): any => res.json(data))
    .catch((err) => console.warn(err));
});
app.get('/outfit', (req: Request, res: Response): Promise<any> => {
  return getAllOutfits()
    .then((data) => res.json(data))
    .catch((err) => console.warn(err));
});
app.post('/outfit', (req: Request, res: any): Promise<unknown> => {
  return saveOutfit(req.body, req.cookies.thesis)
    .then((data) => console.log('Outfit created', data))
    .catch((err) => console.warn(err));
});

app.get('/items', (req: Request, res: Response) => {
  return getAllItems()
    .then((data) => res.json(data))
    .catch((err) => console.warn(err));
});

app.get('/whiteboardpost', (req: Request, res: Response): Promise<any> => {
  return getAllWhiteboardPosts()
    .then((data) => res.json(data))
    .catch((err) => console.warn(err));
});

app.post('/items', (req: Request, res: Response): Promise<any> => {
  return addItem(req.body)
    .then((data) => res.json(data))
    .catch((err) => console.warn('HERE ERROR', err));

});

app.post('/whiteboardpost', (req: Request, res: Response): Promise<any> => {
  return savePost(req.body)
    .then((data) => console.log('Success!', data))
    .catch((err) => console.error(err));
});

app.delete('/items/:id', (req: Request, res: Response): Promise<any> => {
  return deleteItem(req.params)
    .then((data) => res.json(data))
    .catch((err) => console.warn(err));
});

app.delete('/outfit/:id', (req: express.Request, res: express.Response): Promise<any> => {
  console.log('LINE 124', req.params);
  return deleteOutfit(req.params)
    .then((data) => res.json(data))
    .catch((err) => console.warn(err));
});
/************************************* */

import CalendarItem from './routes/calender';
import Weather from './api/weather';
import Location from './api/geolocation';
import WhiteboardPost from './routes/whiteboardposts';

app.use('/calendar', CalendarItem);
app.use('/api/weather', Weather);
app.use('/api/location', Location);
app.use('/whiteboardpost', WhiteboardPost);
/////////GOOGLE AUTH ///////////
app.use(
  session({
    secret: process.env.clientSecret,
    saveUninitialized: false,
    resave: true,
  }),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }), (req: any, res: Response) => {

    const { displayName } = req.user;
    // setting cookie key to thesis and saving the username
    res.cookie('thesis', displayName);
    return addUser(displayName)
      .then(() => res.redirect('/'))
      .catch((err) => console.log('error adding user to db', err));
  });

app.get('/isloggedin', (req: Request, res: Response) => {
  // check to see if the cookie key is thesis
  if (req.cookies.thesis) {
    res.json(true);
  } else {
    res.json(false);
  }
});

app.delete('/logout', (req: Request, res: Response) => {
  // delete the cookie key thesis when logging out
  res.clearCookie('thesis');
  res.json(false);
});
///////////GOOGLE AUTH ^^^^^^///////////

/////////Twilio//////////
// app.post('/sms', (req, res) => {
//   const { body } = req.body;
//   console.log('text?>', body);
//   client.messages.create({
//     body: body,
//     from: '+15042852518',
//     to: '+15047235163'
//   })
//     .then((message: any) => console.log('message sid', message.sid))
//     .catch((err: any) => console.warn('twilio error', err));
// });
/////////Twilio//////////


io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', (): void => {
    console.log('user disconnected');
  });
  socket.on('message', ({name, message}) => {
    console.log('message:', message, 'user', name);
    io.emit('message', {name, message});
  });
});






app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});

