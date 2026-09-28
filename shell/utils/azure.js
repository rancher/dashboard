const AZURE_ERROR_MSG_REGEX = /^.*Message=\"(.*)\"$/;
const AZURE_ERROR_JSON_REGEX = /^.*Response body: ({.*})/;
const AZURE_ERROR_JSON_REGEX_MULTILINE = /({[\s\S]*"error":[\s\S]*})/;

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
    const jsonMatchMultiline = err.match(AZURE_ERROR_JSON_REGEX_MULTILINE);

    if (jsonMatchMultiline?.length === 2) {
      try {
        const errorObj = JSON.parse(jsonMatchMultiline[1]);

        if (errorObj?.error?.message) {
          return errorObj.error.message;
        }
      } catch (e) {}
    }
  }

  // Can't parse error
  return false;
};
