export type ValidateError = {
  path: string;
  type: string;
  errors: Array<string>;
  params: {
    path: string;
  };
  inner: Array<ValidateError>;
  name: string;
  message: string;
  value: any;
};

export class ValidationError extends Error {
  private errorList: Array<ValidateError>;
  constructor(message: string, errors: Array<ValidateError>) {
    super(message);
    this.errorList = errors;
  }
  public getErrorList() {
    return this.errorList.map((error) => {
      const { value, params, ...rest } = error;
      return rest;
    });
  }
}
