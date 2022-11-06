declare global {
  type Maybe<T> = null | T;
  type StringDictionary = {
    [key: string]: any;
  };
}
export {};
