/**
	WRITTEN BY JASPER DE MOOR (github.com/demoorjasper)
**/

const config = require("../config.json");
const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config['API_KEY']);

const sendGridMail = (mail) => {
    const msg = {
      to: mail.headers.get("to").value[0].address,
      from: mail.headers.get("from").value[0].address,
      subject: mail.headers.get("subject"),
      text: mail.text,
      html: mail.textAsHtml,
    };
    sgMail.send(msg);
	console.log(`Mail sent to ${msg.to}`);
}

const options = {
    banner: 'node.js smtp-sendgrid-gateway',
    secure: false,
    authOptional: true,
    authMethods: ['PLAIN', 'LOGIN', 'XOAUTH2'],
    onAuth: (auth, session, callback) => {
        // allow anything - just give user id 1
        callback(null, {user: 1});
    },
    onConnect : (session, callback) => {
        console.log(`${session.remoteAddress} connected`);
        if (session.remoteAddress !== '127.0.0.1') {
            return callback(new Error("Outside connections not allowed"));
        }
        return callback(); // Accept the connection
    },
    onData: (stream, session, callback) => {
        simpleParser(stream).then(mail => {
            sendGridMail(mail);
            callback();
        }).catch(err => {
            console.log(err);
        });
    }
};

const server = new SMTPServer(options);

server.listen(config.port);
console.log(`SMTP Server started on port: ${config.port}`)