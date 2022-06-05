import { isArray } from '@shell/utils/array';

export function epinioExceptionToErrorsArray(err: any): any {
  if (err?.errors?.length === 1) {
    return epinioExceptionToErrorsArray(err?.errors[0]);
  }

  if ( err?.response?.data ) {
    const body = err.response.data;

    if ( body && body.message ) {
      return [body.message];
    } else {
      return [err];
    }
  } else if (err.status && err.title) {
    const title = err.title;
    const detail = err.detail ? ` - ${ err.detail }` : '';

    return [`${ title }${ detail }`];
  } else if ( isArray(err) ) {
    return err;
  } else {
    return [err];
  }
}
