export class StatusIcon {
  private el: HTMLElement;

  /**
   * @param container — where to insert the icon
   * @param cssCls — CSS class for styling (default is "nm-filter-status")
   * @param initialIcon — initial text-icon (default is "⏳")
   */
  constructor(
    container: HTMLElement,
    cssCls = "nm-filter-status",
    initialIcon = "⏳"
  ) {
    this.el = container.createEl("span", {
      cls: cssCls,
      text: initialIcon,
    });
  }

  /**
   * Changes the icon and tooltip
   * @param icon — text symbol (✅ ❌ ⚠️ ⏳ etc.)
   * @param tooltip — what to show on hover
   */
  public set(icon: string, tooltip = ""): void {
    this.el.setText(icon);
    this.el.setAttr("title", tooltip);
  }

}
