const successResponse = (
  res,
  data,
  messageOrStatusCode = 200,
  statusCode = 200
) => {
  let message = null;
  let finalStatusCode = statusCode;

  if (typeof messageOrStatusCode === "string") {
    message = messageOrStatusCode;
  } else if (typeof messageOrStatusCode === "number") {
    finalStatusCode = messageOrStatusCode;
  }

  res.status(finalStatusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (
  res,
  message,
  statusCode = 500,
  code = "general_error"
) => {
  res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
