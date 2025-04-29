import { App } from "obsidian";
import { AbstractPropertySuggest } from "./AbstractPropertySuggest";

export interface PropertyInfo {
    /**
     * Usage count of property.
     */
    count: number;

    /**
     * Name of property.
     */
    name: string;

    /**
     * Type of property.
     */
    type: string;
}
export class PropertyKeySuggest extends AbstractPropertySuggest {
    private properties: string[];

    constructor(inputEl: HTMLInputElement, app: App) { // Убрано private, т.к. он есть в базовом классе
        super(inputEl, app); // Вызываем конструктор базового класса

        // this is an undocumented function...
        // https://github.com/Fevol/obsidian-typings/blob/14d1b3f7fc0f6d167a9721a0f60a14ba4815fee8/src/obsidian/augmentations/MetadataCache.d.ts#L239
        // @ts-ignore
        const propertyInfos = this.app.metadataCache.getAllPropertyInfos() as Record<string, PropertyInfo>;

        this.properties = Object
            .values(propertyInfos)
            .map(prop => prop.name); // Получаем только имена свойств
    }

    // Реализация абстрактного метода
    getContent(): string[] {
        return this.properties;
    }
}
