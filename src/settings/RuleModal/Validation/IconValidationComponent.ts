import { debounce } from "obsidian";
import { StatusIcon } from "./StatusIcon";

export class IconValidationComponent {
    private icon: StatusIcon;

    /**
     * @param container — where to render the components
     */
    constructor(container: HTMLElement) {
        this.icon = new StatusIcon(container);
    }

    public setPending(msg = ""): void {
        this.icon.set("⏳", msg);
    }

    public setOk(msg = ""): void {
        this.icon.set("✅", msg);
    }

    public setWarning(msg = ""): void {
        this.icon.set("⚠️", msg);
    }

    public setError(msg: string, detailsText = ""): void {
        this.icon.set("❌", msg);
    }
}