const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
      default: null,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Deployment",
        "Credits & Billing",
        "Bot Runtime",
        "UI / Dashboard",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
    metadata: {
      userEmail: String,
      userName: String,
      botState: String,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);
