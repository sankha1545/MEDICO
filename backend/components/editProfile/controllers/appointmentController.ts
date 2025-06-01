import { Request, Response } from 'express';
import Appointment from '../models/Appointment';

export const getAppointment = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const data = await Appointment.findOne({ userId });
  res.json(data || {});
};

export const saveAppointment = async (req: Request, res: Response) => {
  const { name, phone, email, address } = req.body;
  const userId = req.user.id;

  let record = await Appointment.findOne({ userId });
  if (record) {
    record.name = name;
    record.phone = phone;
    record.email = email;
    record.address = address;
    await record.save();
  } else {
    record = await Appointment.create({ userId, name, phone, email, address });
  }

  res.status(200).json(record);
};
