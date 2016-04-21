'use strict';

module.exports = {
  REQUESTS_DELAY: 0,
  REQUESTS_DELAY_SYSTEM: 0,
  baseURL: (process.env.BASEURL || 'http://educo.riten.io'),
  db: 'mongodb://localhost:27017/' + (process.env.DB || 'educo'),
  server: {
    host: 'localhost',
    port: process.env.PORT || 8111
  },
  secret: 'educosecret',
  settings: {
  	perPage: 10,
  	email: {
  		service: 'Gmail'
  	}
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};