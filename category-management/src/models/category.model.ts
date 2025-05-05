import mongoose, { Document, Schema } from 'mongoose';

export enum CategoryStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

export interface ICategory extends Document {
    name: string;
    parent: mongoose.Types.ObjectId | null;
    status: CategoryStatus;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'categories',
            default: null,
            index: true
        },
        status: {
            type: String,
            enum: Object.values(CategoryStatus),
            default: CategoryStatus.ACTIVE
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Create compound index for optimized queries
CategorySchema.index({ parent: 1, name: 1 }, { unique: true });
CategorySchema.index({ status: 1 });

export const Category = mongoose.model<ICategory>('categories', CategorySchema);