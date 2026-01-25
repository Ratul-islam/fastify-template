import { Types } from "mongoose";
import { RefreshToken } from "./refreshToken.model";

export const createRefreshToken=async(adminId:Types.ObjectId, tokenHash:string, expiresAt:Date, createdByIp:string)=>{
    await RefreshToken.create({
          adminId,
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp
        });
}

export const findRefreshToken=async (refreshHash: string)=>{
    return RefreshToken.findOne({tokenHash: refreshHash}).exec() 
}

export const revokeAllToken=async (adminId:Types.ObjectId, ip : string)=>{
     await RefreshToken.updateMany(
        { userId: adminId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedByIp: ip } }
      );
    
}