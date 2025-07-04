// models/registration.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
    _id: string;
    userId: string;
    contest: {
        name: string;
        platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
        url: string;
        startTime: string;
        endTime: string;
    };
    createdAt: string;
    updatedAt: string;
}

const RegistrationSchema = new Schema<IRegistration>({
    userId: { type: String, required: true },
    contest: {
        name: { type: String, required: true },
        platform: {
            type: String,
            enum: ['codeforces', 'codechef', 'leetcode', 'geeksforgeeks'],
            required: true
        },
        url: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
    }
}, { timestamps: true });

export default mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);