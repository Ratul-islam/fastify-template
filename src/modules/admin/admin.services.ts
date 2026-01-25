import mongoose from "mongoose";
import { Admin, AdminDoc } from "./admin.model";
import bcrypt from "bcrypt"
import { AppError } from "../../utils/AppError";

type Query = {
  id?: string;
  email?: string;
  refreshToken?: string;
}

export const getAdmin=async (query: Query): Promise<AdminDoc | null> =>{
  if (query.id) {
    if (!mongoose.Types.ObjectId.isValid(query.id)) return null
    return Admin.findById(query.id).exec()
  }
  const mongoQuery: any = {}
  if (query.email) mongoQuery.email = query.email;
  if (query.refreshToken) mongoQuery.refreshToken = query.refreshToken

  if (Object.keys(mongoQuery).length === 0) {
    throw new Error('Provide at least one search field')
  }

  return Admin.findOne(mongoQuery).select("+password").exec()
}
export type CreateAdminInput={
  name: string;
  email: string;
  password: string;
}


export const createAdmin = async (
  input: CreateAdminInput
): Promise<AdminDoc> => {
  const existing = await Admin.findOne({ email: input.email }).exec();
  if (existing) {
    throw new AppError("Admin with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const admin = new Admin({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  await admin.save();
  return admin;
};