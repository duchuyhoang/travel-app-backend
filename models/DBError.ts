export type DatabaseError = {
  message: string;
  field: string;
};

export class DBError extends Error {
  private errorList: Array<DatabaseError>;
  constructor(message: string, errors: Array<DatabaseError>) {
    super(message);
    this.errorList = errors;
  }
  public getErrorList() {
    return this.errorList;
  }
}
