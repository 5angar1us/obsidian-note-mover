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
    cssCls = "nm-error-details",
    preCls = "nm-error-pre"
  ) {
    this.detailsEl = container.createEl("details", { cls: cssCls });
    // initially hide
    this.detailsEl.style.display = "none";
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
