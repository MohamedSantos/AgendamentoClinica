let appointment = require('../models/Appointment')
let mongoose = require('mongoose')
let appointmentFactory = require('../factories/AppointmentFactory')
let nodemailer = require('nodemailer')

const Appo = mongoose.model('Appointment',appointment)

class AppointmentService{

    async Create(name,email,cpf,description,date,time){
        let newAppo = new Appo({
            name,
            email,
            cpf,
            description,
            date,
            time,
            finished: false,
            notified: false
        })
        try{
            await newAppo.save()
            return true
        }catch(err){
            console.log(err);
            return false
        }
    }

    async GetAll(showFinished){
        if(showFinished){
            return await Appo.find()
        }else{
            let appos = await Appo.find({'finished': false})
            let appointments = [];

            appos.forEach(appointment =>{

                if(appointment.date != undefined){
                    appointments.push(appointmentFactory.Build(appointment))
                }
            })

            return appointments
        }
    }

    async GetById(id){
        try{
            let event = Appo.findOne({'_id':id})
            return event
        }catch(err){
            console.log(err)
        }
    }

    async Finish(id){
        try{
            await Appo.findByIdAndUpdate(id,{finished:true})
            return true
        }catch(err){
            console.log(err)
            return false
        }
    }

    async Search(query){
        try{
            let appos = await Appo.find().or([{email: query},{cpf: query}])
            return appos
        }catch(err){
            console.log(err)
            return []
        }
    }

    async SendNotification(){
        let appos = await this.GetAll(false)
        let transporter = nodemailer.createTransport({
            host: 'smtp.mailtrap.io',
            port: 25,
            auth: {
                user: '7c1a0f98504952',
                pass: 'a4b42c8a5710bf'
            },
            tls: {
                rejectUnauthorized: false
            }
        })
        appos.forEach(async app =>{
            let date = app.start.getTime();
            let hour = 1000 * 60 * 60;
            let gap = date-Date.now();
            let appHour = app.start.getHours();
            let appMinute = app.start.getMinutes();
            let appDay = app.start.getDate();
            let appMonth = app.start.getMonth() + 1;
            let hours = (appHour < 10) ? '0' + appHour : appHour;
            let minute = (appMinute < 10) ? '0' + appMinute : appMinute;
            let day = (appDay < 10) ? '0' + appDay : appDay;
            let month = (appMonth < 10) ? '0'+ appMonth : appMonth;

            if(gap <= hour){
                if(!app.notified){
                    await Appo.findByIdAndUpdate(app.id,{notified:true})
                    transporter.sendMail({
                        from: 'Mohamed <mohamed@gmail.com>',
                        to: app.email,
                        subject: 'Sua consulta vai acontecer em breve',
                        //text: 'Sua consulta está agendada para ' + app.start.getHours() + ":" + app.start.getMinutes()
                        text: `Sua consulta está agendada para o dia ${day}/${month}/${app.start.getFullYear()} às 
                        ${hours}:${minute}`
                    }).then(()=>{

                    }).catch(err =>{
                        console.log(err)
                    })
                }
            }
        })
    }

}

module.exports = new AppointmentService();