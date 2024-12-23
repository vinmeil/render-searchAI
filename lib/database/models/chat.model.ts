import { Schema, model, models } from "mongoose";

const ChatSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userChats: {
    type: [String],
    required: true,
  },
  responses: {
    type: [[Object]],
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Order = models.Chat || model("Chat", ChatSchema);

export default Order;
