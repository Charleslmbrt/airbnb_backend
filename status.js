exports.success = function (result) {
  return {
    status: "success",
    result: result,
  };
};

exports.err = function (message) {
  return {
    status: "error",
    result: message,
  };
};
