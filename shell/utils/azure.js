const AZURE_ERROR_MSG_REGEX = /^.*Message=\"(.*)\"$/;
const AZURE_ERROR_JSON_REGEX = /^.*Response body: ({.*})/;

export const parseAzureError = (err) => {
  // Try and parse the response from Azure a couple of ways
  const msgMatch = err.match(AZURE_ERROR_MSG_REGEX);

  if (msgMatch?.length === 2) {
    return msgMatch[1];
  } else {
    const jsonMatch = err.match(AZURE_ERROR_JSON_REGEX);

    if (jsonMatch?.length === 2) {
      try {
        const errorObj = JSON.parse(jsonMatch[1]);

        return errorObj.error_description;
      } catch (e) {}
    }
  }

  // Can't parse error
  return false;
};
