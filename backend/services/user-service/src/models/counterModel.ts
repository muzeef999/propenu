import mongoose from "mongoose";

export interface ICounter extends mongoose.Document {
  key: string;
  seq: number;
}

const CounterSchema = new mongoose.Schema<ICounter>({
  key: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;
