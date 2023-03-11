import {ExtendableError} from "ts-error";

export class ExtendedError extends ExtendableError {
  constructor(message) {
    super(message);
  }

  errorMessage() {
      try {
        throw new ExtendableError("Error");
      } catch (e) {
        console.log("Something went wrong", e)
      }
  }
}