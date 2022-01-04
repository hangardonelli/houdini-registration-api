/*
SCRIPT REGISTRO Para el CPPS de Matu
Hecho con ♥ por Lau - Enero de 2022

-Importante: -Es necesario hacer el proxy gateway con el web server que se esté usando (sea nginx, apache, IIS, etc)
             -En el archivo 'config.json' se encuentra toda la configuración necesaria para que el bot funcione
*/
const config = require('./config.json');
const postgres = require('./src/postgres/postgres.js');
const bcrypt = require('./src/crypto/bcrypt.js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

const urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(express.json());
process.on('uncaughtException', (ex) => {console.log("[ERROR]", ex)});

 

app.get('/', (req, res) => {
    try{
        res.send({
            status: 'API LISTEN',
            message: null
        });
    }
    catch(ex_db){
        res.send({
            status: 'ERROR',
            message: JSON.stringify(ex_db)
        });
    }
} );
const sendApiStatus = (res, value) =>{
    res.send(value);
}
app.post(config.rutas.registro, urlencodedParser , async (req, res) => {
    //Obtenemos los datos del request enviado desde el cliente
    console.log(req.body);
    const {nombre, password, confirm_password, email, color} = req.body;
    
    let mensajes = [];
    let location = null;
    
    
    try{
        location = 'data_validation';
         //Verificamos que todos los datos hayan sido mandados por el cliente
        if(nombre == null || nombre == undefined) mensajes.push({name:'UNDEFINED_NAME', error: true});
        if(password == null || password == undefined) mensajes.push({name:'UNDEFINED_PASSWORD', error: true});
        if(confirm_password == null || confirm_password == undefined) mensajes.push({name:'UNDEFINED_CONFIRM_PASSWORD', error: true});
        if(email == null || email == undefined) mensajes.push({name:'UNDEFINED_EMAIL', error: true});
        if(color == null || color == undefined) mensajes.push({name:'UNDEFINED_COLOR', error: true});

        location = 'name_validation';
        if(nombre.length > config.longitudes.nickname.max) mensajes.push({name:'NAME_MAX', error: true});
        if(nombre.length < config.longitudes.nickname.min) mensajes.push({name:'NAME_MIN', error: true});
        
        location = 'password_validation';
        if(password.length > config.longitudes.password.max) mensajes.push({name:'PASSWORD_MAX', error: true});
        if(password.length < config.longitudes.password.min) mensajes.push({name:'PASSWORD_MIN', error: true});
        
        if(mensajes.length > 0){
            res.send({
                success: false,
                messages: "Hubo errores durante la validación",
                exception: JSON.stringify(ex),
                author: location
            });
        }

        location = 'confirm_password_validation';
        if(config.requiereConfirmacionPassword && confirm_password != password) mensajes.push({name:'PASSWORD_DONT_MATCH', error: true});

        location = "email_validation";
        if(config.mail.soloPermitidos && config.mail.permitidos.length > 0){
            if(!config.mail.permitidos.some(p => email.includes(p))){
                mensajes.push({name:'MAIL_IN_BLACKLIST', error: true});
            
                throw "La dirección de correo electrónico elegida no es aceptada";
            }
        }
        

        let hashed_password = null;
        try{
         
            location = 'password_hashing';
            hashed_password = await bcrypt.generateHash(password);

        }
        catch(exBcrypt){
            console.log(exBcrypt);
            mensajes.push({name:'HASH_ERROR', error: true});
            throw exBcrypt;
        }



       location = "penguin_insert";
       try{
        postgres.query("INSERT INTO penguin (\"username\", \"nickname\", \"approval_en\", \"approval_es\", \"active\", \"password\", \"email\", \"color\") VALUES ($1, $2, $3, $4, $5, $6, $7, $8);",
            [nombre.toLowerCase(), nombre, config.aprobaciones.en, config.aprobaciones.es, !config.requiereActivacion, hashed_password, email, color ]);
       }
       catch(ex){
        mensajes.push({name:'PENGUIN_INSERT_ERROR', error: true});
        throw ex;
       }
       res.send({
        success: true
    });
    }
    catch(ex){
        res.send({
            success: false,
            messages: mensajes,
            exception: JSON.stringify(ex),
            author: location
        });
    }
    
    


});
app.post('/registra')
app.listen(config.port, () => {
    console.log("Escuchando!");
});
