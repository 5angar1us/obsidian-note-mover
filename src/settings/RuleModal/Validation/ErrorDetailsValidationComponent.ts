import { debounce } from "obsidian";
import { ErrorDetails } from "./ErrorDetails";

export class ErrorDetailsValidationComponent {
  private details: ErrorDetails;

  /**
   * @param container — where to render the components 
   */
  constructor(container: HTMLElement) {
    this.details = new ErrorDetails(container);
  }

  public setPending(msg = ""): void {
    this.details.hide();
  }

  public setOk(msg = ""): void {
    this.details.hide();
  }

  public setWarning(msg = ""): void {
    this.details.hide();
  }

  public setError(msg: string, detailsText = ""): void {
    this.details.show(detailsText || msg);
  }
}
