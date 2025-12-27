const SupportTicket = require("../../models/SupportTicket");
const Deployment = require("../../models/Deployment");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * @desc Create a new support ticket
 * @route POST /api/support
 * @access Private
 */
exports.createTicket = async (req, res) => {
  try {
    const { category, description, botId } = req.body;

    if (!category || !description) {
      return errorResponse(res, "Category and description are required", 400);
    }

    // Capture metadata
    const user = req.user;

    // Rate limiting: check for submissions in the last 5 minutes
    const recentTicket = await SupportTicket.findOne({
      user: user._id,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentTicket) {
      return errorResponse(
        res,
        "Slow down! You can only submit one report every 5 minutes.",
        429
      );
    }

    // Duplicate check: check if same user reported same description in last 24h
    const duplicateTicket = await SupportTicket.findOne({
      user: user._id,
      description,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (duplicateTicket) {
      return errorResponse(
        res,
        "You've already submitted this report recently. Please wait for an update.",
        400
      );
    }

    let botState = null;

    if (botId) {
      const bot = await Deployment.findById(botId);
      if (bot) {
        botState = bot.status;
      }
    }

    const ticketData = {
      user: user._id,
      bot: botId || null,
      category,
      description,
      metadata: {
        userEmail: user.email,
        userName: user.fullName,
        botState: botState,
      },
    };

    const ticket = await SupportTicket.create(ticketData);

    return successResponse(
      res,
      ticket,
      "Support ticket submitted successfully"
    );
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc Get all support tickets (Admin only)
 * @route GET /api/admin/bugs
 * @access Private/Admin
 */
exports.getTickets = async (req, res) => {
  try {
    const { status, category, sort = "-createdAt" } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate("user", "fullName email")
      .populate("bot", "botName status")
      .sort(sort);

    return successResponse(res, tickets);
  } catch (error) {
    console.error("Get Tickets Error:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc Update ticket status (Admin only)
 * @route PUT /api/admin/bugs/:id
 * @access Private/Admin
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "fullName email");

    if (!ticket) {
      return errorResponse(res, "Ticket not found", 404);
    }

    return successResponse(res, ticket, `Ticket status updated to ${status}`);
  } catch (error) {
    console.error("Update Ticket Error:", error);
    return errorResponse(res, error.message, 500);
  }
};
