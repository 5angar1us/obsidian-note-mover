import { nmError__Details, nmError__Pre } from "src/cssConsts";

export class ErrorDetails {
  private detailsEl: HTMLDetailsElement;
  private preEl: HTMLElement;

  /**
   * @param container — where to insert <details>
   * @param summaryText — text in <summary>
   * @param cssCls — CSS class for <details>
   * @param preCls — CSS class for <pre>
   */
  constructor(
    container: HTMLElement,
    summaryText = "Show error details",
    cssCls = nmError__Details,
    preCls = nmError__Pre
  ) {
    this.detailsEl = container.createEl("details", { cls: cssCls });
    this.detailsEl.style.display = "none"; // initially hide

    this.detailsEl.createEl("summary", { text: summaryText });
    this.preEl = this.detailsEl.createEl("pre", {
      cls: preCls,
      text: "",
    });
  }

  public show(details: string): void {
    this.preEl.setText(details);
    this.detailsEl.style.display = "";
    this.detailsEl.open = true;
  }

  public hide(): void {
    this.preEl.setText("");
    this.detailsEl.open = false;
    this.detailsEl.style.display = "none";
  }
}
