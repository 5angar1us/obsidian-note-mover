import { debounce } from "obsidian";
import { ErrorDetailsValidationComponent } from "./ErrorDetailsValidationComponent";
import { IconValidationComponent } from "./IconValidationComponent";

export class ValidationComposer {
    constructor(
        private iconComponent: IconValidationComponent,
        private errorComponent: ErrorDetailsValidationComponent
    ) {}

    public wrapValidate(fn: () => Promise<void>, wait = 400): () => void {
        return debounce(async () => {
            this.iconComponent.setPending();
            this.errorComponent.setPending();
            
            try {
                await fn();
                this.iconComponent.setOk();
                this.errorComponent.setOk();
            } catch (e: any) {
                const firstLine = (e.message || String(e)).split("\n")[0];
                this.iconComponent.setError(firstLine);
                this.errorComponent.setError(firstLine, String(e));
            }
        }, wait);
    }
}