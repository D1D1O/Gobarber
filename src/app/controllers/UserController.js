import * as Yup from 'yup';
import User from "../models/User";

class UserController {
  async store(req,res){

    const shema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    if (!(await shema.isValid(req.body))){
      return res.status(400).json({error : 'Validation fails'});
    }
  
    const userExists = await User.findOne({ where: {email: req.body.email } });

    if(userExists){
      return res.status(400).json({error: 'User already exists.'});
    }
  

    const {id ,name, email , provider } = await User.create(req.body);
    return res.json({id, name, email, provider });
  }

  async update(req,res){
    //console.log(req.userID);
    const shema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
          .min(6)
          .when('oldPassword',(oldPassword, field) =>
            oldPassword ? field.required() : field
          ),
      confirmPassword: Yup.string()
          .when('password',(password,fiel) =>
            password ? fiel.required().oneOf([Yup.ref(password)]): field
          ),
    });
    if (!(await shema.isValid(req.body))){
      return res.status(400).json({error : 'Validation fails'});
    }

    const { email, oldPassword } = req.body;

    

    const user = await User.findByPk(req.userID);
    //console.log(user);
    //verifica se nao esta trocando para um email ja cadastrado
    if (email !== user.email){
      const userExists = await User.findOne({ where: { email } });

      if(userExists){
        return res.status(400).json({error: 'User already exists.'});
      }
    }
    //verifica se passou a senha correta.
    if(oldPassword && !(await user.checkPassword(oldPassword))){
      return res.status(401).json({ error : 'Password does not match' });
    }

    const {id ,name , provider } = await user.update(req.body);
    return res.json({id, name, email, provider });

  }

}
export default new UserController;