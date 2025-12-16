const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500, code = 'general_error') => {
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
