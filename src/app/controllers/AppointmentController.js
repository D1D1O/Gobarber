import Appointment from "../models/Appointment";
import User from "../models/User";
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import File from "../models/File";

class AppointmentController{
  async index(req,res){
    const appointments = await Appointment.findAll({
      where:{ user_id: req.userID , canceled_at: null},
      order:['date'],
      attributes:['id','date'],
      include:[
        {
          model: User,
          as: 'provider',
          attributes: ['id','name'],
          include:[
            {
              model: File,
              as: 'avatar',
              attributes:['id','path','url'],
            },
          ],
        },
      ],
    });  
    return res.json(appointments);
  } 



  async store(req,res){
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ error: 'Validation fails'});
    }
    
    const { provider_id, date } = req.body;

    const isProvaider = await User.findOne({
      where:{
        id: provider_id,provider: true
      },
    })

    if(!isProvaider){
      return res.status(400).json({ error: 'You can only appointments with providers'});
    }

    const hourStart = startOfHour(parseISO(date));
    console.log(hourStart);
    if(isBefore(hourStart, new Date())){
      return res.status(400).json({ error: 'Past dates are not permitted'});
    } 

    /*
    * Check date availability
    */
   const checkAvailability = await Appointment.findOne({
     where: {
      provider_id,
      canceled_at: null,
      date: hourStart
     }
   });

   if (checkAvailability){
    return res.status(400).json({ error: 'Appoint data is not available'});
   }

    const appointment = await Appointment.create({
      user_id: req.userID,
      provider_id,
      date: hourStart,
    });

    return res.json(appointment);

  }
}
export default new AppointmentController();